# CLAUDE.md — Realistic Three.js Model: "3 BHK House (500 Yards) — Modern · Spacious · Green"

This file is the single source of truth for building a realistic, dimensionally accurate, real-time 3D model of the house shown on the reference board (`reference/Modern_Two-Storey_House_Plan_Board.png`). Read the whole file before writing code. When anything here conflicts with your own assumptions, this file wins. When this file is silent, match the reference renders.

---

## 0. Ground rules for Claude Code

1. **Dimensions come from this file, not from measuring pixels.** The board is an AI-style presentation render. Its plans are *not drawn to scale* and the views disagree in small ways. Section 3 resolves every conflict into one buildable layout; build exactly that.
2. **Everything is data-driven.** All rooms, walls, openings, levels and materials live in `src/config/*.js`. Builders read config; no magic numbers inside builder code.
3. **Author in feet, render in metres.** Config values are in feet (matches the board labels). Convert once with `ft(v) = v * 0.3048`. `1 three.js unit = 1 metre`. Real-world scale is required for correct lighting, shadows, camera FOV and textures.
4. **Realism over gimmicks:** PBR materials, real-scale textures with world-space UVs, HDRI environment, ACES tone mapping, soft shadows, ambient occlusion, gentle bloom on light fixtures, bevelled edges, dense varied planting.
5. **Performance target:** 60 fps on a mid-range laptop GPU at 1080p in the default dusk scene. Under 300 draw calls, ≤ 4 shadow-casting lights. Use instancing and geometry merging.
6. After each milestone (Section 12), take screenshots from the camera presets (Section 10) and compare them against the reference views. Fix discrepancies before moving on.
7. Keep a `CREDITS.md` listing every external asset (textures, HDRI, models) with source URL and licence. Only use CC0 / CC-BY assets.

---

## 1. Tech stack and project structure

- **Vite** + vanilla JS (ES modules). No framework needed.
- **three** (latest stable release; pin the exact version in `package.json`). Use addons from `three/addons/...`: `OrbitControls`, `GLTFLoader`, `DRACOLoader`, `RGBELoader` (or `HDRLoader` in newer releases), `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `SMAAPass`, `OutputPass`, `RoundedBoxGeometry`, `BufferGeometryUtils`.
- **Ambient occlusion:** `n8ao` (preferred) or three's `GTAOPass` / `SAOPass`.
- **lil-gui** for debug toggles.

```
/
├── CLAUDE.md
├── CREDITS.md
├── index.html
├── package.json
├── reference/Modern_Two-Storey_House_Plan_Board.png
├── public/
│   ├── hdri/            # dusk HDRI (.hdr, 2k for env, optional 4k backdrop)
│   ├── textures/        # PBR sets: albedo / normal / roughness / ao (jpg/ktx2)
│   └── models/          # glTF: car, plants, furniture, sanitaryware (Draco)
└── src/
    ├── main.js                 # bootstrap renderer, scene, loop
    ├── config/
    │   ├── units.js            # ft(), inch(), toWorld()
    │   ├── site.js             # plot, setbacks, boundary, gates, landscape
    │   ├── levels.js           # all heights (Section 2.3)
    │   ├── groundFloor.js      # rooms, walls, openings (Section 3)
    │   ├── firstFloor.js       # rooms, walls, openings (Section 4)
    │   ├── elevation.js        # cladding, louvres, fascias, canopies (Section 5)
    │   ├── materials.js        # PBR definitions (Section 6)
    │   ├── lights.js           # every fixture (Section 7)
    │   └── cameras.js          # presets (Section 10)
    ├── builders/
    │   ├── walls.js            # wall + opening cutter
    │   ├── slabs.js            # floors, roofs, canopies, fascias, parapets
    │   ├── openings.js         # windows, doors, sliding systems, frames, sills
    │   ├── stairs.js           # dog-leg stair + railing
    │   ├── facade.js           # stone cladding, wood louvres, frame boxes
    │   ├── pergola.js
    │   ├── site.js             # ground, lawn, driveway, path, boundary walls, gates
    │   ├── landscape.js        # instanced plants, flowers, trees, grass
    │   ├── interiors.js        # furniture visible through glass
    │   ├── car.js
    │   └── lighting.js
    ├── render/
    │   ├── environment.js      # HDRI, sky, fog, time-of-day presets
    │   └── postfx.js
    ├── ui/
    │   └── controls.js         # camera preset buttons, toggles
    └── utils/
        ├── uv.js               # world-space box UVs
        └── merge.js
```

---

## 2. Coordinate system, site and levels

### 2.1 Axes and orientation

- The north arrow on the board points **up** on both plans. The house **front faces south** (bottom of the plans = street side).
- three.js: **+X = east**, **+Y = up**, **+Z = south (toward the street / front-view camera)**, **−Z = north (rear)**.
- **Plot coordinates (feet):** origin at the plot's **north-west corner**. `X` runs east 0 → 72, `Z` runs south 0 → 62.5.
- **House-local coordinates (feet):** origin at the house's north-west *outer* wall corner. All room and wall tables below are house-local.
- `plotX = 18 + x`, `plotZ = 5 + z` (house sits 18′ from the west boundary, 5′ from the rear boundary).
- World conversion (centre the plot at the origin):

```js
// src/config/units.js
export const FT = 0.3048;
export const ft = (v) => v * FT;
export const inch = (v) => (v / 12) * FT;
export const PLOT = { w: 72, d: 62.5 };          // feet
export const HOUSE_ORIGIN = { X: 18, Z: 5 };      // feet, in plot coords
export const toWorld = (x, y, z) => ({            // house-local feet -> metres
  x: ft(HOUSE_ORIGIN.X + x - PLOT.w / 2),
  y: ft(y),
  z: ft(HOUSE_ORIGIN.Z + z - PLOT.d / 2),
});
```

### 2.2 Plot

- **500 sq. yards = 4,500 sq. ft** (board says "approx. 4,500"; it is exact: 1 sq yd = 9 sq ft).
- Plot: **72′ wide (E–W frontage) × 62.5′ deep (N–S)** = 4,500 sq ft. This matches the wider-than-deep proportion of the ground-floor plan drawing.
- Setbacks to the main wall line: west 18′, rear (north) 5′, east 7.75′; front garden and driveway fill the south.

### 2.3 Levels (feet above finished ground; `y = 0` is the lawn)

| Element | y (ft) | Notes |
|---|---|---|
| Natural ground / lawn | 0.00 | |
| Driveway & car porch floor | 0.25 | pavers, 1:20 ramp at gate |
| Plinth top = GF finished floor (GF FFL) | 1.50 | 3 risers of 6″ at porch, 2 at back door |
| Door & window heads (GF) | GF FFL + 7.0 | standard lintel |
| Living sliding glass head (GF) | GF FFL + 8.5 | |
| Main door head (GF) | GF FFL + 8.0 | |
| GF ceiling | 11.58 | slab 5″ thick |
| GF roof slab top = FF FFL = terrace level | 12.00 | floor-to-floor 10.5′ |
| Terrace railing / parapet top | 15.50 | 3.5′ above FF FFL |
| FF ceiling | 22.08 | |
| FF roof slab top | 22.50 | |
| FF roof parapet top | 23.50 | 1′ parapet behind the thin roof canopy |
| Stair-tower top | 23.50 | flush with FF parapet |

Walls: **external 9″ (0.75′)**, **internal 4.5″ (0.375′)**. Slabs 5″ (0.417′) structural; visible edge bands are thicker (Section 5).

---

## 3. Ground floor (authoritative layout)

### 3.1 Schematic (north up, not to scale)

```
 x=0                                                                  x=46.25
 +----------------+--------+--------+---------+-------------------------+  z=0
 |                |  T1    |  T2    |  REAR   |                         |
 |   BEDROOM 1    | 6'x8'  | 6'x8'  |  LOBBY  |    KITCHEN  12'x10'     |
 |   14' x 12'    +--d-----+--d-----+ (back   |                         |
 |                |   toilet lobby  |  door)  d=========================+  z=11.1
 +------d---------+                 |         |                         |
 | display |                                  d     BEDROOM 2           |
 | alcove  |      LIVING ZONE     DINING ZONE |     12' x 14'           |
 +----+    |       16' x 15'       10' x 12'  |                         |
 | T3 |    |                                  |                         |
 |6x7 d    |                    +---STAIR-----+-------------------------+  z=25.9
 +====[ 4-panel sliding glass ]=DOOR| TOWER |   CAR PARKING 10' x 16'    z=29.25
           PORCH (covered)    | dog-leg |   (covered canopy, column SE)
                              +---------+                                 z=38.5
```

### 3.2 Rooms — interior clear rectangles (house-local feet)

| Room | x from–to | z from–to | Clear size | Board label |
|---|---|---|---|---|
| Bedroom 1 | 0.75 – 14.75 | 0.75 – 12.75 | 14 × 12 | 12′ × 14′ |
| Toilet T1 | 15.125 – 21.125 | 0.75 – 8.75 | 6 × 8 | 6′ × 8′ |
| Toilet T2 | 21.5 – 27.5 | 0.75 – 8.75 | 6 × 8 | 6′ × 8′ |
| Toilet lobby (open to hall) | 15.125 – 27.5 | 9.125 – 12.75 | 12.4 × 3.6 | — |
| Rear lobby (back door, open to dining) | 27.875 – 33.125 | 0.75 – 12.75 | 5.25 × 12 | — (implied by Back View door) |
| Kitchen | 33.5 – 45.5 | 0.75 – 10.75 | 12 × 10 | 10′ × 12′ |
| Bedroom 2 | 33.5 – 45.5 | 11.125 – 25.125 | 12 × 14 | 12′ × 14′ |
| Living zone (open hall) | 7.125 – 23.125 | 13.125 – 28.5 | 16 × 15.4 | 16′ × 15′ |
| Living display alcove | 0.75 – 6.75 | 13.125 – 21.125 | 6 × 8 | (built-in unit in plan) |
| Dining zone (open hall) | 23.125 – 33.125 | 13.125 – 25.125 | 10 × 12 | 10′ × 12′ |
| Foyer (part of hall) | 20.0 – 25.25 | 25.125 – 28.5 | — | — |
| Toilet T3 | 0.75 – 6.75 | 21.5 – 28.5 | 6 × 7 | 6′ × 7′ |
| Stair core (interior) | 26.0 – 32.75 | 25.5 – 37.75 | 6.75 × 12.25 | "UP" |
| Porch (outdoor, covered) | 14.0 – 25.25 | 29.25 – 35.25 | 11.25 × 6 | Porch |
| Car parking bay | 34.25 – 44.25 | 25.875 – 41.875 | 10 × 16 | 10′ × 16′ |

Living, dining, foyer, toilet lobby and rear lobby are **one continuous open hall** (no walls between them), exactly as the plan shows.

### 3.3 Walls (rectangles in plan, house-local feet; height GF FFL → 12.0)

External, 0.75′:

| Wall | x | z |
|---|---|---|
| North | 0 – 46.25 | 0 – 0.75 |
| West | 0 – 0.75 | 0 – 29.25 |
| South (hall) | 0 – 25.25 | 28.5 – 29.25 |
| East | 45.5 – 46.25 | 0 – 25.875 |
| Bedroom 2 south | 33.5 – 46.25 | 25.125 – 25.875 |
| Stair tower west | 25.25 – 26.0 | 25.5 – 38.5 |
| Stair tower east | 32.75 – 33.5 | 25.125 – 38.5 |
| Stair tower south | 25.25 – 33.5 | 37.75 – 38.5 |

Internal, 0.375′:

| Wall | x | z |
|---|---|---|
| Bedroom 1 east | 14.75 – 15.125 | 0.75 – 13.125 |
| Bedroom 1 south | 0.75 – 14.75 | 12.75 – 13.125 |
| T1 / T2 | 21.125 – 21.5 | 0.75 – 8.75 |
| T2 east | 27.5 – 27.875 | 0.75 – 8.75 |
| Toilets south | 15.125 – 27.875 | 8.75 – 9.125 |
| Rear lobby / kitchen / Bedroom 2 west | 33.125 – 33.5 | 0.75 – 25.125 |
| Kitchen south = Bedroom 2 north | 33.5 – 45.5 | 10.75 – 11.125 |
| T3 north | 0.75 – 7.125 | 21.125 – 21.5 |
| T3 east | 6.75 – 7.125 | 21.125 – 28.5 |

The stair core's north side (z 25.125–25.5) is open to the dining zone; the first flight starts there.

### 3.4 Openings (heights relative to GF FFL)

| Id | Wall | Position along wall (ft) | W × H | Sill | Type |
|---|---|---|---|---|---|
| D-main | South (hall) | x 21.0 – 24.5 | 3.5 × 8.0 | 0 | Solid teak, flush with vertical grooves, black pull handle 4′ |
| G-living | South (hall) | x 8.0 – 19.5 | 11.5 × 8.5 | 0 | 4-panel sliding glass, slim black aluminium frames |
| W-living-w | West | z 14.5 – 18.5 | 4 × 4 | 3 | 2-panel sliding window |
| D-br1 | Bedroom 1 south | x 10.75 – 13.75 | 3 × 7 | 0 | Laminate flush door, wood finish |
| W-br1-w | West | z 4.25 – 9.25 | 5 × 4 | 3 | 3-panel window |
| W-br1-n | North | x 5.25 – 9.25 | 4 × 4 | 3 | 2-panel window |
| D-t1 | Toilets south | x 16.5 – 19.0 | 2.5 × 7 | 0 | WPC door |
| V-t1 | North | x 17.0 – 19.0 | 2 × 1.5 | 6 | Frosted top-hung ventilator |
| D-t2 | Toilets south | x 23.0 – 25.5 | 2.5 × 7 | 0 | WPC door |
| V-t2 | North | x 23.5 – 25.5 | 2 × 1.5 | 6 | Frosted ventilator |
| D-back | North | x 29.0 – 32.0 | 3 × 7 | 0 | Wood door with narrow glass light; wall sconce each side (Back View) |
| D-kit | Rear lobby / kitchen | z 3.5 – 6.5 | 3 × 7 | 0 | Door into kitchen |
| W-kit-n | North | x 37.5 – 41.5 | 4 × 3.5 | 3.5 | Above counter |
| W-kit-e | East | z 3.25 – 7.25 | 4 × 3.5 | 3.5 | Above counter |
| D-br2 | Kitchen/BR2 west wall | z 15.0 – 18.0 | 3 × 7 | 0 | From dining |
| W-br2-e | East | z 16.0 – 21.0 | 5 × 4 | 3 | 3-panel window |
| W-br2-slot | East | z 12.5 – 14.0 | 1.5 × 5 | 2 | Tall slot window (Right Side View) |
| D-t3 | T3 east | z 23.0 – 25.5 | 2.5 × 7 | 0 | WPC door |
| V-t3 | West | z 24.0 – 26.0 | 2 × 1.5 | 6 | Frosted ventilator |
| W-stair | Stair tower south | x 26.75 – 28.75 | 2 × 16 | 3 | Tall glazed slot spanning both floors, behind wood louvres |

Windows: black powder-coated aluminium, 2.5″ frame face, glass set 4″ back from the outer wall face (visible reveal), 2″ granite sill projecting 1.5″ with drip groove.

### 3.5 Stair (dog-leg, GF FFL → FF FFL, rise 10.5′)

- 18 risers × 7″. Flights side by side inside the core (x 26.0–32.75): flight 1 on the west half (x 26.0–29.2), flight 2 on the east half (x 29.55–32.75), 4″ gap between.
- **Flight 1:** 11 risers / 10 treads × 11″, starts at z 25.5 running **south** to z 34.67.
- **Mid landing:** z 34.67 – 37.75, full core width, at GF FFL + 6.42′.
- **Flight 2:** 7 risers / 6 treads × 11″, runs **north** from z 34.67 to z 29.17.
- **FF arrival lobby slab:** full core width, z 25.5 – 29.17, at FF FFL. Headroom over flight 1 beneath it is about 7′ (acceptable).
- Treads: 1.5″ wood-finish (teak) on concrete; risers white. Railing: 3′ frameless glass balustrade with a 2″ round teak handrail. FF lobby edge gets the same railing.

### 3.6 Porch and car porch

- **Porch:** pale grey honed granite at GF FFL, x 14–25.25, z 29.25–35.25. 3 risers (6″ / 12″ treads) along its south edge for x 19–25. Ceiling = underside of the terrace slab, warm teak-plank soffit with 3 recessed downlights.
- **Car parking:** grey cobble pavers at y 0.25. A black SUV parked **nose-in (north)** with tail-lights facing the street, centred x 39.25, z 34.0.
- **Car canopy:** flat RCC canopy, top at y 12.0, x 33.5 – 47.25, z 25.875 – 42.5, visible edge 1.0′ thick (soffit at y 11.0), teak-plank soffit with 4 downlights. No parapet on it. Supported by the stair tower / bedroom 2 wall and **one slim charcoal steel column 9″ × 9″** at its south-east corner (centre x 46.5, z 41.75).

---

## 4. First floor ("reduced size")

### 4.1 Schematic (north up)

```
 x=0        x=11.6                       x=27.1      x=33.5            x=46.25
 +----------+----------------------------+---------------------------------+ z=0
 |  roof (parapet, planters)             |                                  |
 |          +----------------------------+                                  |
 |  PERGOLA |                            |    GF roof (service, parapet)    |
 |  DECK    |       BEDROOM 3            +--------+                         |
 |  (wood   d        14' x 16'           | TOILET |                         |
 |  slats   |                            d 6'x8'  |                         |
 |  above)  |                            |        |                         |
 |          +===[ 8' sliding door ]==+---+--------+-------------------------+
 |                                   | STAIR TOWER|  car canopy roof below
 |   OPEN TERRACE (seating & plants) d  "DN"      |
 |                                   |            |
 +======= glass railing =============+------------+  z=35.25 / tower to 38.5
```

### 4.2 Rooms (interior, house-local feet; heights relative to FF FFL = 12.0)

| Room | x | z | Size | Board label |
|---|---|---|---|---|
| Bedroom 3 | 12.375 – 26.375 | 9.125 – 25.125 | 14 × 16 | 14′ × 16′ |
| Toilet (attached) | 26.75 – 32.75 | 17.125 – 25.125 | 6 × 8 | 6′ × 8′ |
| Stair core + FF lobby | 26.0 – 32.75 | 25.5 – 37.75 | — | "DN" |
| Open terrace (front) | 0 – 25.25 | 25.875 – 35.25 | — | Open Terrace (with seating & plants) |
| Pergola deck (west) | 0 – 11.625 | 9.125 – 25.875 | — | wooden slats in plan |

### 4.3 Walls (height FF FFL → 22.5)

External 0.75′: Bedroom west x 11.625–12.375, z 8.375–25.875 · Bedroom north x 11.625–27.125, z 8.375–9.125 · Bedroom east (north part) x 26.375–27.125, z 9.125–16.375 · Toilet north x 26.375–33.5, z 16.375–17.125 · Toilet + tower east x 32.75–33.5, z 16.375–38.5 · Bedroom south x 11.625–25.25, z 25.125–25.875 · Tower west x 25.25–26.0, z 25.125–38.5 · Tower south x 25.25–33.5, z 37.75–38.5.

Internal 0.375′: Bedroom/toilet x 26.375–26.75, z 17.125–25.125 · Toilet south / lobby north x 26.0–32.75, z 25.125–25.5.

### 4.4 Openings (relative to FF FFL)

| Id | Wall | Position | W × H | Sill | Type |
|---|---|---|---|---|---|
| G-br3-s | Bedroom south | x 15.375 – 23.375 | 8 × 8 | 0 | 3-panel full-height sliding door, black frames, inside a white projecting frame box (Section 5) |
| G-br3-w | Bedroom west | z 13.0 – 19.0 | 6 × 7.5 | 0 | 2-panel sliding door to the pergola deck |
| W-br3-n | Bedroom north | x 17.375 – 21.375 | 4 × 4 | 3 | Window |
| W-br3-e | Bedroom east (north part) | z 10.5 – 12.0 | 1.5 × 5.5 | 2 | Slot window |
| D-t4 | Bedroom/toilet | z 21.0 – 23.5 | 2.5 × 7 | 0 | WPC door |
| V-t4 | Toilet east | z 19.0 – 21.0 | 2 × 1.5 | 6 | Frosted ventilator |
| D-terr | Tower west | z 26.0 – 29.0 | 3 × 7 | 0 | Glazed door, stair lobby → terrace |

### 4.5 Terrace edges

- **Glass balustrade** (12 mm clear toughened glass, 3.5′ high, slim charcoal top cap rail 1.5″ × 2″, side-fixed to the slab edge): along the south edge z 35.25 for x 0 – 25.25, and along the west edge x 0 for z 9.125 – 35.25.
- **Solid parapet** (3′ above FF FFL, 6″ thick, cream plaster, 2″ coping with bevel): around all remaining GF-roof edges (north strip, the roof over the kitchen/bedroom 2, the east edge). Not on the car canopy.
- Terrace floor: light warm-grey matte stone tiles 2′ × 2′ with 3 mm joints. Planter boxes 1.5′ wide × 1.5′ high along the parapet and inside the railing line with shrubs and flowers (the plan shows greenery around the whole terrace perimeter).

### 4.6 Pergola (over the west deck and west part of the front terrace)

- Footprint x 0.75 – 10.75, z 12.0 – 34.75. Top of slats at FF FFL + 9.0′.
- 6 charcoal steel posts 4″ × 4″ at x ∈ {0.75, 10.75} × z ∈ {12.0, 23.4, 34.75}.
- 2 main beams 4″ × 8″ (charcoal) running N–S along x 0.75 and x 10.75; 3 cross beams E–W at the post lines.
- Teak slats 2″ wide × 6″ deep, **running N–S**, at 6″ centres (≈ 20 slats), sitting on the cross beams. Warm LED strip hidden on the inside face of both main beams.
- Floor beneath: same terrace tile, plus an outdoor rug.

---

## 5. Elevation and façade details (match the renders)

### 5.1 Front (south) elevation — reference "Front View"

Ground floor, west → east:
1. **Living room:** the 4-panel sliding glass wall (G-living) set inside a **beige stacked ledgestone cladding** field covering the whole south face of the hall wall x 0 – 20.0 (cladding 1.5″ proud of plaster). Two up-down wall sconces on the stone piers either side of the glass at FF FFL − 4.5′ (y 7.5).
2. **Main door** (D-main) in plaster, under the porch, with a 3″ teak architrave and a black up-down sconce each side.
3. **Stair tower** projecting forward to z 38.5: its south face is **stone cladding** on x 28.75 – 33.5 for the full height y 0 – 23.5; the strip x 25.25 – 28.75 is the tall glazed slot (W-stair) screened by **vertical teak louvres** (2″ × 4″ fins at 4″ centres, 2″ in front of the glass), full height.
4. **Car porch** with the canopy and slim corner column, teak soffit glowing with downlights.

Horizontal elements:
- **GF roof edge band:** a continuous **cream fascia band 1.5′ deep** (y 10.75 – 12.25) running across the terrace/porch slab edge (south, x 0 – 25.25) and returning along the west edge. It projects 1.0′ beyond the slab edge. Rounded edge, 1″ radius. Glass balustrade fixes to its top/inside.
- **Car canopy edge:** 1.0′ cream band, flush, slightly lower than the GF band reads in the render; keep its top at 12.0.

First floor, west → east:
1. **Pergola** with lounge furniture under it (L-sofa, plants), glass balustrade in front.
2. **Bedroom 3 south wall** in cream plaster with the 8′ sliding door. Around the door, a **white projecting frame box**: 8″ thick, projecting 1.0′, wrapping the opening on top and both sides (inner size = the opening).
3. **Vertical teak louvres** on the bedroom south wall x 23.75 – 25.25, full storey height.
4. Stair tower stone face continues up (right-hand stone pier in the render).
- **FF roof canopy:** the FF roof slab projects **2.5′ south** of the bedroom wall and **1.5′ west**, visible edge 0.75′ thin (y 21.75 – 22.5) in cream; underside clad in teak planks with 3 downlights over the sliding door.

### 5.2 Right side (east) elevation — "Right Side View"
- Mostly cream plaster with a tall dark **vertical recessed stripe** (2″ deep, 1′ wide, charcoal) on the bedroom 2 east wall at z 22.5.
- Narrow tall windows (W-br2-slot, W-kit-e, W-br2-e) glowing warm.
- Above the car canopy at FF level, the stair tower **east face carries vertical teak louvres** on z 29 – 38.5, full FF height.
- Up-down wall sconces every ~8′ along the east wall at y 8.0.

### 5.3 Left side (west) elevation — "Left Side View"
- Pergola and glass balustrade visible at the front of the FF.
- A **vertical teak slat panel** on the bedroom 3 west wall beside G-br3-w (z 19.5 – 23.0, full storey height).
- Small windows on the GF west wall (W-br1-w, W-living-w, V-t3) and up-down sconces between them.

### 5.4 Rear (north) elevation — "Back View"
- Simple, plain cream plaster, minimal detailing.
- GF: back door (D-back) with 2 steps and a sconce each side; windows W-br1-n, W-kit-n; ventilators V-t1, V-t2.
- FF: bedroom 3 block set back from the GF edge, one window (W-br3-n), plain parapet.
- Solid GF parapet visible along the roof edge.

### 5.5 Generic façade realism
- **Plinth band:** 1.5′ high (y 0 – 1.5) charcoal-grey textured plaster, recessed 1″ from the wall face, on all elevations.
- Parapet copings: 2″ thick, 1″ overhang each side, bevelled.
- Thin shadow gaps (½″ dark recess) where cladding meets plaster.
- Subtle stains: very light darkening under copings and sills (AO + a grime mask on the plaster material at 5–10 % strength). No heavy weathering; the house is new.

---

## 6. Materials (PBR, `MeshStandardMaterial` / `MeshPhysicalMaterial`)

All textured surfaces use **world-space box UVs** (`utils/uv.js`), so 1 UV unit = 1 metre and scale stays consistent across walls of any size. Source CC0 sets from Poly Haven or ambientCG. Search terms are given; choose sets that match the colours below.

| Key | Use | Base colour (approx.) | Roughness / Metalness | Texture & tiling |
|---|---|---|---|---|
| `plaster` | exterior walls, parapets, bands | `#ECE3D4` warm cream | 0.92 / 0 | "painted plaster" / "stucco" normal + roughness, 2 m tile, normal 0.3 |
| `plasterInterior` | interior walls & ceilings | `#F3EEE6` | 0.9 / 0 | flat, no normal |
| `plinth` | plinth band | `#4A4744` | 0.95 / 0 | rough plaster |
| `stone` | ledgestone cladding | `#C8B396` → `#9C8468` mix | 0.85 / 0 | "ledge stone" / "stacked stone wall", 1 m tile, strong normal + AO, displacement off |
| `teak` | louvres, soffits, door, pergola slats, gate panel, handrails | `#8A5A33` | 0.55 / 0 | "wood planks" / "teak", 1 m tile, grain along length |
| `charcoalMetal` | window frames, column, rail caps, pergola steel, gate slats | `#232323` | 0.45 / 0.6 | none |
| `glass` | windows, sliding doors | tint `#DDE6EA` | `MeshPhysicalMaterial` transmission 1, roughness 0.04, ior 1.5, thickness 0.01 | env reflections essential |
| `glassBalustrade` | railings | tint `#CFE3E0` (green edge) | transmission 0.95, roughness 0.05 | |
| `frosted` | toilet ventilators | `#F0F0F0` | transmission 0.6, roughness 0.6 | |
| `floorTileGF` | GF interior floor | `#E6D9C4` | 0.35 / 0 | 2′ × 4′ vitrified tiles, 2 mm joints |
| `terraceTile` | FF terrace | `#BDB6AC` | 0.8 / 0 | 2′ × 2′ stone tiles |
| `granite` | porch, steps, sills | `#B9B2A8` | 0.5 / 0 | "granite" fine speckle |
| `pavers` | driveway, car porch | `#7E7A75` grey | 0.9 / 0 | "cobblestone" / "paving stones", 1 m tile, strong AO |
| `steppingStone` | front path | `#A9A49D` | 0.85 / 0 | concrete, bevelled 1″ |
| `grass` | lawn base | `#4F7A2A` | 0.95 / 0 | "grass" albedo, 2 m tile, plus instanced blades on top |
| `soil` | flower beds | `#3B2A1E` | 1.0 / 0 | mulch/soil |
| `gateSlat` | gates | `#1E1E1E` | 0.5 / 0.5 | |

Rules:
- Colour textures in sRGB (`texture.colorSpace = SRGBColorSpace`); normal/roughness/AO linear.
- `anisotropy = renderer.capabilities.getMaxAnisotropy()` on all ground and wall textures.
- Use the HDRI as `scene.environment`; set `envMapIntensity` ≈ 0.4–0.6 for exteriors in the dusk preset so emissive fixtures dominate.
- Emissive fixtures: `emissive #FFB46B` (≈ 2700 K) with `emissiveIntensity` 2–6 so they bloom.

---

## 7. Lighting (default: dusk / blue hour — the look of every render on the board)

### 7.1 Global
- **Sky/backdrop:** dusk HDRI with pink-orange clouds near the horizon and violet-blue zenith (search "sunset", "dusk", "evening clouds" on Poly Haven). Use the 2k version for `scene.environment` (via PMREM), the 4k or a matching gradient sky dome for `scene.background`.
- **Sun (DirectionalLight):** colour `#FF9E6B`, intensity ~0.8, from the **west-north-west at ~5° elevation**, casting the one large soft shadow (shadow map 4096, `normalBias` tuned, shadow camera fitted tightly to the plot).
- **HemisphereLight:** sky `#7A86C2`, ground `#3B2F26`, intensity ~0.35.
- **Fog:** `FogExp2` `#B79AA3`, density ~0.012 (helps background trees/buildings recede).

### 7.2 Fixtures (all warm 2700 K `#FFB46B` unless noted)

| Fixture | Locations | Implementation |
|---|---|---|
| Up-down wall sconces (black cylinder 3″ × 10″) | flanking main door; living stone piers; east wall every ~8′; west wall between windows; back door (2); terrace bedroom wall (2) | Emissive mesh + **light-splash decal** (additive radial-gradient planes up and down the wall). Real `SpotLight`s only on the 4 front-most sconces. |
| Recessed downlights (3″ disc) | car canopy soffit (4), porch soffit (3), FF roof canopy soffit (3) | Emissive discs + 1 `SpotLight` per soffit group (no shadows) + floor light-pool decal |
| Pillar lights (small box light on gate pillar faces) | all front-boundary pillars | Emissive + small `PointLight` (distance 3 m) on the 2 gate pillars only |
| Garden bollards (2.5′ black, louvred top) | both sides of the stepping-stone path, ~6′ apart | Emissive + ground decal |
| Spike uplights | under palms, the front-left tree, hedges | Emissive + cone decal on foliage; 1 `SpotLight` on the big tree |
| Pergola LED strip | inside both pergola main beams | Emissive strip + `RectAreaLight` (1) |
| Boundary wall lights (small square) | inside face of side & front walls every 8′ | Emissive + decal |
| Interior lighting | living, dining, bedroom 3, bedroom 2, kitchen | 1 `PointLight`/`RectAreaLight` per visible room + emissive ceiling lights; living gets a pendant and a floor lamp |
| Car tail-lights | SUV | Emissive red `#FF2A1A`, intensity 3 |

Shadow-casting budget: sun + max 3 others (living interior, porch/door spot, big-tree uplight).

### 7.3 Time-of-day presets (lil-gui)
- **Dusk** (default, matches board), **Day** (sun 45°, white `#FFF4E5`, fixtures off, HDRI daylight), **Night** (sun off, moon `#9DB4FF` at 0.15, fixtures at full).

---

## 8. Interiors (visible through glass; keep them simple but believable)

Use low/medium-poly glTF furniture (CC0/CC-BY) or clean procedural boxes with bevels. Layout follows the board's plan furniture.

- **Living:** beige L-shaped sofa against the alcove/T3 side facing east, wooden coffee table, rug, TV unit on the dining-side wall, built-in teak display unit with plants in the west alcove, framed artwork on the north wall (visible through the glass), floor lamp, ceiling pendant.
- **Dining:** 6-seater rectangular wood table, long axis N–S, 6 upholstered chairs, pendant above.
- **Kitchen:** L-shaped counter along the north and east walls (2′ deep, 2.83′ high, quartz top), hob, sink under W-kit-n, tall fridge at the south-west, upper cabinets.
- **Bedroom 1:** queen bed with headboard on the west wall, side tables, wardrobe along the east wall, dresser/study unit along the south wall.
- **Bedroom 2:** queen bed with headboard on the north wall, wardrobe on the west wall.
- **Bedroom 3:** king bed centred on the north wall, wardrobe along the west wall (south of G-br3-w), console and armchair near the sliding door.
- **Toilets:** wall-hung WC, basin with mirror, glass shower partition. Doors closed by default.
- **Terrace:** under the pergola a beige L-shaped outdoor sofa with cushions and a low teak coffee table; in the open terrace a round bistro table with 2 chairs and a 3-seater outdoor sofa with side table (as in the FF plan); large potted areca palms at the railing corners; planters along every edge.

Add a `Interiors` toggle in the GUI. Optionally offer a **cutaway mode** that hides the FF and GF roof so the plan layout can be checked from above.

---

## 9. Site and landscape

### 9.1 Boundary (plot coordinates, feet)
- Side and rear walls: 9″ thick, 5′ high, cream plaster, 2″ coping, plinth band.
- **Front boundary (Z = 62.5), west → east:**

| Element | X from–to | Height | Finish |
|---|---|---|---|
| Pillar P1 (corner) | 0 – 1.5 | 5.0 | plaster + cap, pillar light |
| Low wall | 1.5 – 22.5 | 3.5 | plaster; a pillar at 11.0 – 12.5 |
| Pillar P2 | 22.5 – 24.0 | 5.0 | as P1 |
| Fixed screen | 24.0 – 38.75 | 5.0 | black horizontal slats 4″ deep, 1″ gaps, on a 1′ plinth |
| **Pedestrian gate** | 38.75 – 42.75 | 5.0 | **teak horizontal planks** in a black frame (aligned with the main door) |
| Pillar P3 | 42.75 – 44.25 | 5.5 | as P1 |
| Fixed screen | 44.25 – 49.75 | 5.0 | black slats (reads continuous with the car gate) |
| Pillar P4 | 49.75 – 51.25 | 5.5 | as P1 |
| **Car gate** (sliding) | 51.25 – 63.25 | 5.0 | black horizontal slats, frame 2″ |
| Pillar P5 | 63.25 – 64.75 | 5.5 | as P1 |
| Low wall + corner pillar | 64.75 – 72 | 3.5 | pillar at 70.5 – 72 |

Pillars 1.5′ × 1.5′ with a 2″ projecting cap.

### 9.2 Hardscape
- **Driveway:** grey cobble pavers from the car gate to the car porch, X 51.25 – 63.25, Z 47.5 – 62.5, continuing under the canopy over the parking bay. 4″ granite edging.
- **Stepping-stone path:** from the pedestrian gate to the porch steps, centred X 40.75. Concrete slabs **3′ wide (E–W) × 1.5′ deep**, 6″ grass gaps, ≈ 9 slabs, set 1″ above the lawn.
- **Rear utility strip:** 5′ wide, plain concrete, between the house and the rear wall.

### 9.3 Softscape (the board says "Landscaped Garden (with flowers & greenery)" front & side; the renders are lush)
- **Lawn:** front garden between the west boundary and the driveway, and the west side garden. Base grass texture plus **instanced grass blades** (≈ 150–300k blades total via `InstancedMesh` or a shader-based grass patch, colour variation ±10 %, slight wind sway in the vertex shader).
- **Flower beds** (soil + mulch, 3′ deep): inside the whole front boundary, along both side walls (2.5′), around the house plinth (2′), around the porch and either side of the path. Mix: red & magenta bougainvillea/roses, pink and white periwinkle, yellow/orange marigolds, white jasmine, with dark-green shrubs (boxwood/ixora) behind.
- **Palms:** areca palms in tall charcoal planters flanking the porch steps (2), at the terrace railing corners (2), and in the bed by the living glass (2).
- **Trees:** one large broadleaf tree (frangipani/neem-like, ~22′) in the front-left corner (plot X ≈ 6, Z ≈ 55) with an uplight; 2 medium trees in the west side garden; dense background trees outside the plot to frame the silhouette as in the renders.
- **Hedge:** 2.5′ clipped hedge along the inside of the east boundary.
- Use 4–6 distinct plant glTF models, scattered by a seeded random function (`utils/random.js`) with random scale (0.8–1.25) and rotation, all as `InstancedMesh`. Foliage uses alpha-tested leaf cards with `alphaTest 0.5`, double-sided, and a slight translucency (warm back-lighting looks great at dusk).

### 9.4 Context
- A paved street in front (Z > 62.5) with a footpath; a couple of simple neighbouring houses (cream boxes with lit windows) to the west and behind, like the building at the left edge of the Front View; distant tree silhouettes.

---

## 10. Cameras and controls

Positions and targets in **plot feet** (`X`, `Y`, `Z`); convert with `ft()` after subtracting the plot centre (36, 31.25).

| Preset | Position (X, Y, Z) | Target (X, Y, Z) | FOV | Matches |
|---|---|---|---|---|
| `front` | 34, 7, 108 | 41, 11, 32 | 40 | Front View |
| `right` | 112, 9, 74 | 44, 12, 28 | 40 | Right Side View |
| `left` | −42, 9, 74 | 30, 12, 28 | 40 | Left Side View |
| `back` | 30, 7, −40 | 38, 11, 14 | 40 | Back View |
| `terrace` | 42.5, 17.5, 39.5 | 22, 15, 29 | 50 | First Floor Terrace (Open) |
| `planGF` / `planFF` | orthographic, straight down | plot centre | — | the two plans (with cutaway mode) |

- `OrbitControls` with damping, `minDistance` 3 m, `maxPolarAngle` slightly under 90° (no going under the ground), target clamped to the plot.
- UI: preset buttons that tween the camera (≈ 1.2 s ease-in-out), plus toggles for time of day, interiors, cutaway, plants, post-processing, stats.

---

## 11. Rendering pipeline

```js
renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;   // try AgX too; pick whichever matches the board
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
```

Post-processing chain: `RenderPass` → **AO** (N8AO, radius ~1 m, intensity ~2, half-res) → **UnrealBloomPass** (strength ~0.45, radius ~0.6, threshold ~0.9, so only fixtures and bright glass bloom) → `OutputPass` → `SMAAPass`.

Performance rules:
- Merge static geometry per material with `BufferGeometryUtils.mergeGeometries` (walls, slabs, copings, louvres, slats).
- Instance everything repeated: louvres, slats, tiles if modelled, plants, bollards, sconces, pavers if modelled.
- Use KTX2/Basis or compressed JPG textures; max 2k per texture.
- Freeze static matrices (`matrixAutoUpdate = false`).
- Provide a "Quality" GUI switch: High (AO, full grass, 4k shadows) / Medium / Low.

---

## 12. Build order (milestones) and acceptance checks

1. **Skeleton:** Vite app, renderer, OrbitControls, units, ground plane, plot outline, camera presets. ✔ The plot measures 21.95 m × 19.05 m in world units.
2. **Massing:** all GF and FF walls from config (no openings yet), slabs, stair tower, car canopy, parapets. ✔ Top-down ortho matches the schematics in 3.1 and 4.1; overall height 23.5′ (7.16 m).
3. **Openings:** wall builder cuts openings by splitting walls into segments (preferred over CSG); add frames, glass, sills, doors, sliding systems. ✔ Every row in 3.4 and 4.4 exists at the right position and height.
4. **Stair:** dog-leg exactly as 3.5 with railing. ✔ 18 risers; a 1.75 m capsule can walk up without hitting the FF lobby slab.
5. **Façade:** stone cladding, louvres, fascia bands, frame box, plinth, roof canopy soffits, pergola. ✔ `front` preset silhouette overlays the Front View: pergola left, framed sliding door centre, louvres + stone pier right, car canopy far right.
6. **Materials:** all PBR sets with world UVs. ✔ No stretched or mismatched texture scale anywhere.
7. **Site:** boundary, gates, pillars, driveway, path, lawn, beds. ✔ Gate sequence matches Section 9.1; path aligns with the main door.
8. **Lighting & environment:** HDRI, sun, fixtures, decals, dusk preset. ✔ Warm interior glow and wall washes match the board's mood.
9. **Landscape & context:** plants, trees, grass, neighbours. ✔ The garden reads as dense and flowering, as in the renders.
10. **Interiors, car, terrace furniture.**
11. **Post-processing, quality tiers, performance pass.** ✔ ≥ 60 fps on Medium at 1080p; draw calls < 300.
12. **Final comparison:** screenshot all 5 view presets side by side with the board crops; list any remaining deviations in `NOTES.md`.

---

## 13. Known inconsistencies on the board and how this spec resolves them

1. **Plans are not to scale.** Labelled room sizes are used; pixel proportions are ignored.
2. **Plot shape is not stated.** 72′ × 62.5′ was chosen to give exactly 4,500 sq ft and match the plan's proportions.
3. **Kitchen 10′ × 12′** is oriented 12′ E–W × 10′ N–S, so the kitchen lines up with bedroom 2 below it, as drawn.
4. **Living room 16′ × 15′** is the main living zone; the SW toilet (6′ × 7′) and the built-in display alcove sit beside it on the west, as drawn.
5. **Stair:** the plan sketches a single straight flight, which cannot rise 10.5′ in the space shown. A dog-leg stair in a forward-projecting tower is used; it also explains the tall stone pier in the Front View.
6. **First-floor plan puts the stair at the far east edge.** Here the FF stair sits directly above the GF stair (it must), and the GF roof continues east of it as a service roof over the kitchen and bedroom 2. This matches the Front View, where nothing is built above the car porch.
7. **Rear lobby added** so the back door seen in the Back View has a logical route from the hall.
8. **Board summary says "3 bedrooms (2 on Ground + 1 on First)"** and the toilet count is 3 on GF + 1 on FF. Both are preserved.
9. Small differences between the two side renders (both show pergola-like elements) are resolved by placing the pergola on the west/front only, with louvre panels on the east tower face providing the warm wood accent seen in the Right Side View.

If any of these resolutions turn out to look wrong against the renders, change the config values, not the builders, and record the change here.

---

## 14. Coding conventions

- ES modules, small pure builder functions: `buildWalls(config, materials) → THREE.Group`.
- No hard-coded numbers in builders; every dimension comes from `src/config`.
- Name every mesh/group meaningfully (`GF_Wall_North`, `FF_Glass_BR3_S`) so the scene graph is inspectable.
- Dispose geometries/materials/textures on hot reload.
- Seeded randomness only (reproducible landscaping).
- Comment any deliberate deviation from this file with `// SPEC-DEVIATION:` and log it in `NOTES.md`.
