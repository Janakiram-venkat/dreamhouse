import { boxH } from '../utils/merge.js';
import { LV } from '../config/levels.js';
import { IN } from '../config/units.js';
import * as GF from '../config/groundFloor.js';
import * as FF from '../config/firstFloor.js';
import { elevation } from '../config/elevation.js';

const COPE = elevation.coping;

// Parapet/coping helper: a solid strip with a bevelled 2" coping overhanging 1" each side.
export function parapet(buckets, x, z, y0, y1, key = 'plaster') {
  buckets.add(key, boxH(x, [y0, y1], z));
  const o = COPE.overhang;
  buckets.add(key, boxH([x[0] - o, x[1] + o], [y1, y1 + COPE.t], [z[0] - o, z[1] + o], { rounded: 0.008 }));
}

// Ground-floor plinth, floors, porch, steps.
export function buildGroundSlabs(b) {
  const r = elevation.plinth.recess;
  for (const p of GF.plinth) b.add('plinth', boxH([p.x[0] + r, p.x[1] - r], [0, LV.gf - LV.floorFinish], [p.z[0] + r, p.z[1] - r]));
  // GF finished floor (vitrified tile) over the interior footprint
  const fl = [LV.gf - LV.floorFinish, LV.gf];
  b.add('floorTileGF', boxH([0.75, 45.5], fl, [0.75, 25.125]));
  b.add('floorTileGF', boxH([0.75, 25.25], fl, [25.125, 28.5]));
  b.add('floorTileGF', boxH([26.0, 32.75], fl, [25.125, 37.75]));

  // porch: plinth body + honed granite top overhanging 1"
  const P = GF.porch.floor;
  b.add('plinth', boxH([P.x[0] + r, P.x[1] - r], [0, LV.gf - 0.08], [P.z[0], P.z[1] - r]));
  b.add('granite', boxH([P.x[0], P.x[1]], [LV.gf - 0.08, LV.gf], [P.z[0], P.z[1] + IN], { rounded: 0.006 }));
  // 3 risers of 6" / 12" treads along the porch south edge
  const s = GF.porch.steps;
  for (let i = 1; i < s.risers; i++) {
    const top = LV.gf - i * s.rise;
    b.add('granite', boxH(s.x, [0, top], [s.z0, s.z0 + i * s.tread + IN], { rounded: 0.006 }));
  }
  // back door steps (2 risers)
  const k = GF.backSteps;
  b.add('granite', boxH(k.x, [0, LV.gf - LV.floorFinish], [-1.5, 0], { rounded: 0.006 }));
  b.add('granite', boxH([k.x[0] - 0.5, k.x[1] + 0.5], [0, LV.gf / 2], [-2.5, -1.5], { rounded: 0.006 }));

  // car canopy slab + teak soffit + slim steel column
  const C = GF.carPorch.canopy;
  b.add('plaster', boxH(C.x, [C.bottom, C.top], C.z, { rounded: 0.02 }));
  b.add('teakPlanks', boxH([C.x[0] + 0.1, C.x[1] - 0.1], [C.bottom - 0.04, C.bottom], [C.z[0] + 0.1, C.z[1] - 0.1]));
  const col = GF.carPorch.column;
  b.add('charcoalMetal', boxH([col.cx - col.size / 2, col.cx + col.size / 2], [LV.drive, C.bottom], [col.cz - col.size / 2, col.cz + col.size / 2]));
}

// GF roof slab = terrace (FF FFL), fascia bands, parapets, terrace finish.
export function buildTerraceSlabs(b) {
  const y = [LV.gfCeil, LV.ff];
  b.add('plaster', boxH([0, 46.25], y, [0, 25.875]));
  b.add('plaster', boxH([0, 25.25], y, [25.875, 35.25]));
  // warm teak soffit under the front cantilever (porch + living overhang)
  b.add('teakPlanks', boxH([0.05, 25.2], [LV.gfCeil - 0.05, LV.gfCeil], [29.25, 35.2]));
  // FF stair lobby slab
  b.add('plaster', boxH([26.0, 32.75], y, [25.875, 29.17]));

  // cream fascia band, rounded edge
  for (const band of elevation.bands) b.add('plaster', boxH(band.x, band.y, band.z, { rounded: IN }));

  // terrace finish (2'x2' stone tiles)
  const tf = [LV.ff, LV.ff + 0.04];
  for (const t of FF.terrace.floor) b.add('terraceTile', boxH(t.x, tf, t.z));

  // solid parapets with coping
  const T = FF.terrace;
  for (const p of T.parapets) parapet(b, p.x, p.z, LV.ff, LV.ff + T.parapetH);
}

// First-floor interior floors, FF roof slab, canopy, parapets, tower roof.
export function buildFirstSlabs(b) {
  const fl = [LV.ff, LV.ff + 0.05];
  for (const r of FF.rooms) {
    if (r.id === 'FFLobby') continue;
    b.add('floorTileGF', boxH(r.x, fl, r.z));
  }
  b.add('floorTileGF', boxH([26.0, 32.75], fl, [25.5, 29.17]));
}

export function buildRoofSlabs(b) {
  const R = FF.roof;
  const y = [LV.ffCeil, LV.ffRoof];
  for (const s of R.slabs) b.add('plaster', boxH(s.x, y, s.z));
  b.add('plaster', boxH(R.tower.x, y, R.tower.z));

  // thin canopy overhangs: 2.5' south, 1.5' west; visible edge 0.75'
  const e = R.canopy.edge;
  b.add('plaster', boxH([R.canopy.x[0], 25.25], e, [25.875, R.canopy.z[1]], { rounded: 0.015 }));
  b.add('plaster', boxH([R.canopy.x[0], 11.625], e, [R.canopy.z[0], 25.875], { rounded: 0.015 }));
  b.add('teakPlanks', boxH([R.canopy.x[0] + 0.08, 25.25], [e[0] - 0.04, e[0]], [25.875, R.canopy.z[1] - 0.08]));
  b.add('teakPlanks', boxH([R.canopy.x[0] + 0.08, 11.625], [e[0] - 0.04, e[0]], [R.canopy.z[0] + 0.08, 25.875]));

  // roof parapets (1' high) around the bedroom block, toilet and stair tower
  const p0 = LV.ffRoof, p1 = LV.roofParapet;
  const t = R.parapet.t;
  // the parapet sits on the wall line, behind the thin canopy edge
  const strips = [
    { x: [11.625, 27.125], z: [8.375, 8.375 + t] },
    { x: [11.625, 11.625 + t], z: [8.375 + t, 25.875] },
    { x: [11.625 + t, 25.25], z: [25.875 - t, 25.875] },
    { x: [26.625, 27.125], z: [8.375 + t, 16.375] },
    { x: [27.125, 33.5], z: [16.375, 16.375 + t] },
    { x: [33.0, 33.5], z: [16.375 + t, 38.5] },
    { x: [25.25, 33.0], z: [38.0, 38.5] },
    { x: [25.25, 25.25 + t], z: [25.875, 38.0] },
  ];
  for (const s of strips) parapet(b, s.x, s.z, p0, p1 - COPE.t);
}
