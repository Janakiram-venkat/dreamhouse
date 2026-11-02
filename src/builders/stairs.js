import * as THREE from 'three';
import { boxH, placed, hv } from '../utils/merge.js';
import { LV, STAIR } from '../config/levels.js';
import { IN, ft } from '../config/units.js';

// Dog-leg stair, GF FFL -> FF FFL (CLAUDE.md §3.5). 18 risers x 7".
export function buildStairs(b) {
  const S = STAIR;
  const cap = S.treadCap;
  const nose = 1 * IN;
  const tread = (x, z, top) => {
    b.add('white', boxH(x, [LV.gf - 0.05, top - cap], z)); // concrete body, white risers
    b.add('teak', boxH(x, [top - cap, top], z, { rounded: 0.004 }));
  };
  // flight 1 runs south
  const f1 = S.flight1;
  for (let i = 0; i < f1.treads; i++) {
    const z0 = f1.zStart + i * S.going;
    tread(f1.x, [z0 - (i ? nose : 0), z0 + S.going], LV.gf + (i + 1) * S.rise);
  }
  // mid landing at riser 11
  const yL = LV.gf + (f1.treads + 1) * S.rise;
  tread(S.landing.x, [S.landing.z[0] - nose, S.landing.z[1]], yL);
  // flight 2 runs north
  const f2 = S.flight2;
  for (let j = 0; j < f2.treads; j++) {
    const z1 = f2.zStart - j * S.going;
    tread(f2.x, [z1 - S.going, z1 + (j ? nose : 0)], yL + (j + 1) * S.rise);
  }
  // fill the 4" gap between flights with a white spine wall
  b.add('white', boxH([f1.x[1], f2.x[0]], [LV.gf, yL], [f1.zStart + 2 * S.going, S.landing.z[0]]));

  // frameless glass balustrade + round teak handrail along the inner edges and the FF lobby edge
  const glass = (x, y, z) => b.add('glassBalustrade', boxH(x, y, z));
  const H = S.rail.h;
  // inner edge of flight 2 (stair well side), stepped panels following the pitch
  for (let j = 0; j < f2.treads; j++) {
    const z1 = f2.zStart - j * S.going;
    const yb = yL + (j + 1) * S.rise;
    glass([f2.x[0] + 0.5 * IN, f2.x[0] + IN], [yb, yb + H - 0.2], [z1 - S.going, z1]);
  }
  // FF lobby edge over flight 1
  const lobbyEdge = S.lobby.z[1];
  glass([f1.x[0], f1.x[1]], [LV.ff, LV.ff + H], [lobbyEdge - 0.3 * IN, lobbyEdge + 0.3 * IN]);
  // handrails as inclined teak cylinders
  const rail = (p0, p1) => {
    const a = hv(...p0), c = hv(...p1);
    const len = a.distanceTo(c);
    const g = new THREE.CylinderGeometry(ft(S.rail.handrailR), ft(S.rail.handrailR), len, 10);
    const m = new THREE.Matrix4();
    const dir = c.clone().sub(a).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    m.compose(a.clone().add(c).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    b.add('teak', placed(g, m));
  };
  rail([f2.x[0] + 0.75 * IN, yL + S.rise + H - 0.1, f2.zStart], [f2.x[0] + 0.75 * IN, LV.ff + H - 0.1, f2.zStart - f2.treads * S.going]);
  rail([f1.x[0], LV.ff + H + 0.05, lobbyEdge], [f1.x[1], LV.ff + H + 0.05, lobbyEdge]);
  // wall handrail along flight 1 (west wall)
  rail([f1.x[0] + 2.5 * IN, LV.gf + S.rise + 2.9, f1.zStart], [f1.x[0] + 2.5 * IN, yL + 2.9, f1.zStart + f1.treads * S.going]);
}
