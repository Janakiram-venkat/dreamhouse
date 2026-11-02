import { boxP } from '../utils/merge.js';
import { site } from '../config/site.js';
import { PLOT, IN } from '../config/units.js';
import { rng } from '../utils/random.js';

// Ground, hardscape, boundary, gates, street and neighbouring context (CLAUDE.md §9).
export function buildSite(b) {
  const S = site;
  // lawn base across the plot, wide grass/earth surround beyond
  b.add('grass', boxP([0, PLOT.w], [-0.3, 0], [0, PLOT.d]));
  b.add('grass', boxP([-160, 0], [-0.3, -0.02], [-120, PLOT.d]));
  b.add('grass', boxP([PLOT.w, 230], [-0.3, -0.02], [-120, PLOT.d]));
  b.add('grass', boxP([0, PLOT.w], [-0.3, -0.02], [-120, 0]));

  // rear utility strip
  b.add('concrete', boxP(S.rearStrip.X, [0, 0.12], S.rearStrip.Z));
  // driveway pavers with 4" granite edging
  for (const d of S.driveway) b.add('pavers', boxP(d.X, [0, 0.25], d.Z));
  const e = S.edging;
  b.add('granite', boxP([51.25 - e, 51.25], [0, 0.3], [47.5, 61.75]));
  b.add('granite', boxP([63.25, 63.25 + e], [0, 0.3], [47.5, 61.75]));

  // flower beds: soil + mulch, a touch above the lawn, with a slim stone edge
  for (const bed of S.beds) {
    b.add('soil', boxP(bed.X, [0, 0.12], bed.Z));
  }

  // stepping-stone path: 3' x 1.5' slabs, 6" gaps, 1" above the lawn
  const P = S.path;
  for (let z = P.Z[0]; z + P.d <= P.Z[1] + 0.01; z += P.d + P.gap) {
    b.add('steppingStone', boxP([P.cx - P.w / 2, P.cx + P.w / 2], [0, P.lift + 0.06], [z, z + P.d], { rounded: 0.02 }));
  }

  // boundary: side & rear walls (9" x 5', plaster, coping, plinth band)
  const cope = 2 * IN, ov = 1 * IN;
  const wallWithCoping = (X, Z, h) => {
    b.add('plinth', boxP([X[0] + IN, X[1] - IN], [0, 1.0], [Z[0] + IN, Z[1] - IN]));
    b.add('plaster', boxP(X, [1.0, h - cope], Z));
    b.add('plaster', boxP([X[0] - ov, X[1] + ov], [h - cope, h], [Z[0] - ov, Z[1] + ov], { rounded: 0.008 }));
  };
  for (const w of S.boundary.walls) wallWithCoping(w.X, w.Z, w.h);

  // front boundary sequence (§9.1)
  const FZ = S.boundary.frontZ;
  const slat = S.boundary.slat;
  for (const el of S.boundary.front) {
    const X = el.X;
    switch (el.type) {
      case 'pillar': {
        b.add('plinth', boxP([X[0] + IN, X[1] - IN], [0, 1.0], [FZ[0] - 0.375 + IN, FZ[1] - IN]));
        b.add('plaster', boxP(X, [1.0, el.h - S.boundary.pillarCap], [FZ[0] - 0.375, FZ[1]]));
        b.add('plaster', boxP([X[0] - 2 * IN, X[1] + 2 * IN], [el.h - S.boundary.pillarCap, el.h], [FZ[0] - 0.375 - 2 * IN, FZ[1] + 2 * IN], { rounded: 0.01 }));
        break;
      }
      case 'wall':
        wallWithCoping(X, FZ, el.h);
        break;
      case 'screen': {
        b.add('plaster', boxP(X, [0, slat.plinth], FZ));
        const zc = (FZ[0] + FZ[1]) / 2;
        for (let y = slat.plinth + slat.gap; y + slat.depth <= el.h + 0.01; y += slat.depth + slat.gap) {
          b.add('gateSlat', boxP(X, [y, y + slat.depth], [zc - 0.06, zc + 0.06]));
        }
        b.add('gateSlat', boxP([X[0], X[0] + 2 * IN], [slat.plinth, el.h], [zc - 0.08, zc + 0.08]));
        b.add('gateSlat', boxP([X[1] - 2 * IN, X[1]], [slat.plinth, el.h], [zc - 0.08, zc + 0.08]));
        break;
      }
      case 'pedGate':
      case 'carGate': {
        const zc = (FZ[0] + FZ[1]) / 2;
        const fr = 2 * IN;
        const y0 = 0.2;
        // black frame
        b.add('gateSlat', boxP([X[0], X[1]], [y0, y0 + fr], [zc - 0.1, zc + 0.1]));
        b.add('gateSlat', boxP([X[0], X[1]], [el.h - fr, el.h], [zc - 0.1, zc + 0.1]));
        b.add('gateSlat', boxP([X[0], X[0] + fr], [y0, el.h], [zc - 0.1, zc + 0.1]));
        b.add('gateSlat', boxP([X[1] - fr, X[1]], [y0, el.h], [zc - 0.1, zc + 0.1]));
        const key = el.type === 'pedGate' ? 'teak' : 'gateSlat';
        const sd = el.type === 'pedGate' ? 5 * IN : slat.depth;
        const gap = el.type === 'pedGate' ? 0.6 * IN : slat.gap;
        for (let y = y0 + fr + gap; y + sd <= el.h - fr + 0.01; y += sd + gap) {
          b.add(key, boxP([X[0] + fr, X[1] - fr], [y, y + sd], [zc - 0.06, zc + 0.06]));
        }
        if (el.type === 'carGate') {
          // a mid stile + sliding track
          const mid = (X[0] + X[1]) / 2;
          b.add('gateSlat', boxP([mid - fr / 2, mid + fr / 2], [y0, el.h], [zc - 0.1, zc + 0.1]));
          b.add('charcoalMetal', boxP([X[0] - 6, X[1]], [0, 0.08], [zc - 0.08, zc + 0.08]));
        } else {
          b.add('charcoalMetal', boxP([X[1] - 0.6, X[1] - 0.5], [2.5, 4.0], [zc + 0.12, zc + 0.18]));
        }
        break;
      }
    }
  }

  // street: footpath + kerb + road
  const [f0, f1] = S.street.footpath;
  b.add('concrete', boxP([-160, 230], [0, 0.4], [f0, f1]));
  b.add('granite', boxP([-160, 230], [-0.1, 0.45], [f1 - 0.5, f1]));
  b.add('asphalt', boxP([-160, 230], [-0.2, -0.05], [f1, S.street.road[1]]));
  b.add('concrete', boxP([-160, 230], [0, 0.4], [S.street.road[1], S.street.road[1] + 6]));
  b.add('grass', boxP([-160, 230], [-0.3, 0.3], [S.street.road[1] + 6, 220]));
}

// Simple neighbouring houses: cream boxes with warm-lit windows (§9.4)
export function buildNeighbours(b) {
  const r = rng(77);
  const houses = [
    { X: [-36, -8], Z: [-12, 26], h: 21 },
    { X: [-72, -44], Z: [-10, 34], h: 24 },
    { X: [4, 34], Z: [-92, -56], h: 22 },
    { X: [40, 70], Z: [-96, -58], h: 19 },
    { X: [86, 116], Z: [-12, 24], h: 23 },
    { X: [-30, 0], Z: [118, 150], h: 22 },
    { X: [12, 46], Z: [120, 152], h: 25 },
    { X: [56, 88], Z: [118, 150], h: 21 },
  ];
  for (const H of houses) {
    b.add('neighbour', boxP(H.X, [0, H.h], H.Z));
    b.add('neighbour', boxP([H.X[0] - 0.4, H.X[1] + 0.4], [H.h, H.h + 1], [H.Z[0] - 0.4, H.Z[1] + 0.4]));
    // lit windows on all four faces, two storeys
    const faces = [
      { axis: 'z', at: H.Z[1], span: H.X, out: 1 },
      { axis: 'z', at: H.Z[0], span: H.X, out: -1 },
      { axis: 'x', at: H.X[0], span: H.Z, out: -1 },
      { axis: 'x', at: H.X[1], span: H.Z, out: 1 },
    ];
    for (const f of faces) {
      for (const lvl of [3.5, 14]) {
        for (let u = f.span[0] + 3; u < f.span[1] - 5; u += 7 + r() * 3) {
          if (r() < 0.35) continue;
          const key = r() < 0.6 ? 'neighbourWindow' : 'darkRecess';
          const d = [f.at - 0.05, f.at + 0.05];
          const w = [u, u + 3.5];
          const y = [lvl, lvl + 4];
          if (f.axis === 'z') b.add(key, boxP(w, y, d));
          else b.add(key, boxP(d, y, w));
        }
      }
    }
  }
}
