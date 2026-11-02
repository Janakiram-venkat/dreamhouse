// Façade detailing — CLAUDE.md §5. House-local feet.
import { LV } from './levels.js';
import { IN } from './units.js';

export const elevation = {
  // stacked ledgestone fields: box ranges (face sits proud of the plaster)
  stone: [
    // hall south face x 0..20, around the living slider (opening x 8..19.5, head GF+8.5)
    { x: [-0.125, 8.0], y: [LV.gf, 10.75], z: [29.25, 29.375] },
    { x: [19.5, 20.0], y: [LV.gf, 10.75], z: [29.25, 29.375] },
    { x: [8.0, 19.5], y: [LV.gf + 8.5, 10.75], z: [29.25, 29.375] },
    // stair tower south pier, full height
    { x: [28.75, 33.625], y: [0, LV.towerTop], z: [38.5, 38.625] },
    // its east return
    { x: [33.5, 33.625], y: [0, LV.towerTop], z: [36.0, 38.5] },
  ],
  // ½" shadow gaps where cladding meets plaster (dark recess strips)
  shadowGaps: [
    { x: [20.0, 20.04], y: [LV.gf, 10.75], z: [29.25, 29.36] },
    { x: [28.71, 28.75], y: [0, LV.towerTop], z: [38.5, 38.61] },
  ],
  // vertical teak louvres: fins 2"x4" at 4" centres
  louvres: [
    // stair slot screen, full height, 2" in front of the glass
    { along: 'x', from: 25.3, to: 28.75, plane: 38.5 + 2 * IN, y: [0.5, LV.towerTop], fin: [2 * IN, 4 * IN], pitch: 4 * IN },
    // bedroom 3 south wall, next to the frame box (SPEC-DEVIATION: starts at 24.25 to clear the frame box)
    { along: 'x', from: 24.25, to: 25.25, plane: 25.875, y: [LV.ff, LV.ffRoof], fin: [2 * IN, 4 * IN], pitch: 4 * IN },
    // tower east face above the car canopy, z 29..38.5
    { along: 'z', from: 29.0, to: 38.5, plane: 33.5, y: [LV.ff, LV.towerTop], fin: [2 * IN, 4 * IN], pitch: 4 * IN },
    // bedroom 3 west wall slat panel beside G-br3-w (§5.3)
    { along: 'z', from: 19.5, to: 23.0, plane: 11.625, y: [LV.ff, LV.ffCeil], fin: [2 * IN, 3 * IN], pitch: 4 * IN, side: -1 },
  ],
  // cream fascia band at the GF roof edge (§5.1)
  bands: [
    { x: [-1.0, 25.25], y: [10.75, 12.25], z: [35.25, 36.25] }, // south edge, projects 1'
    { x: [-1.0, 0], y: [10.75, 12.25], z: [0, 35.25] }, // west return
  ],
  // white projecting frame box around G-br3-s: 8" thick, projects 1'
  frameBox: { opening: { x: [15.375, 23.375], y: [LV.ff, LV.ff + 8] }, t: 8 * IN, proj: 1.0, wallFace: 25.875 },
  // charcoal recessed stripe on the bedroom 2 east wall (§5.2)
  stripe: { z: [22.0, 23.0], y: [LV.gf, LV.gfCeil], x: 46.25, depth: 2 * IN },
  plinth: { h: LV.gf, recess: 1 * IN },
  coping: { t: 2 * IN, overhang: 1 * IN },
};
