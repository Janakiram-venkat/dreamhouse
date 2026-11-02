import * as THREE from 'three';
import { boxH, placed, hv } from '../utils/merge.js';
import { LV } from '../config/levels.js';
import { ft } from '../config/units.js';

// Furniture visible through the glass (CLAUDE.md §8). Simple bevelled boxes, house-local feet.
export function buildInteriors(b) {
  const R = 0.02; // bevel radius (m)
  const g = LV.gf, f = LV.ff + 0.05;
  const box = (key, x, y, z, r = R) => b.add(key, boxH(x, y, z, { rounded: r }));
  const cyl = (key, cx, y0, y1, cz, rad, seg = 20) => {
    const c = new THREE.CylinderGeometry(ft(rad), ft(rad), ft(y1 - y0), seg);
    const p = hv(cx, (y0 + y1) / 2, cz);
    b.add(key, placed(c, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  };

  // ---------- Living: L-sofa facing east, coffee table, rug, TV unit, display unit, art, lamp, pendant
  box('rug', [9.5, 17.5], [g, g + 0.04], [17.5, 25.5], 0.005);
  box('fabricBeige', [8.0, 10.8], [g, g + 1.4], [16.5, 26.5]); // seat run along the west
  box('fabricBeige', [8.0, 8.9], [g + 1.4, g + 2.8], [16.5, 26.5]); // back
  box('fabricBeige', [8.0, 13.5], [g, g + 1.4], [25.0, 27.4]); // return along the south
  box('fabricBeige', [8.0, 13.5], [g + 1.4, g + 2.8], [26.5, 27.4]);
  for (let z = 17.0; z < 25.0; z += 2.6) box('cushion', [8.95, 9.5], [g + 1.4, g + 2.6], [z, z + 2.0], 0.04);
  box('woodLight', [12.0, 15.5], [g + 0.9, g + 1.4], [19.5, 23.5]);
  box('woodDark', [12.2, 15.3], [g, g + 0.9], [19.7, 23.3]);
  box('woodDark', [21.6, 23.0], [g, g + 1.6], [16.0, 25.0]); // TV unit on the dining-side
  box('darkRecess', [22.7, 22.85], [g + 3.0, g + 6.0], [17.2, 23.8], 0.005); // TV
  // built-in teak display unit in the alcove
  box('teak', [0.75, 2.2], [g, g + 9.5], [13.4, 20.9], 0.005);
  for (let y = g + 1.5; y < g + 9; y += 1.6) box('woodLight', [2.2, 2.35], [y, y + 0.1], [13.4, 20.9], 0.005);
  // artwork on the north (bedroom 1) wall
  box('art', [10.5, 14.5], [g + 4.0, g + 7.0], [13.125, 13.25], 0.005);
  box('white', [10.35, 14.65], [g + 3.85, g + 7.15], [13.125, 13.2], 0.005);
  // floor lamp + pendant
  cyl('charcoalMetal', 10.0, g, g + 5.0, 25.8, 0.05, 8);
  cyl('lampSoft', 10.0, g + 5.0, g + 5.9, 25.8, 0.6);
  cyl('charcoalMetal', 14.0, g + 7.4, LV.gfCeil, 21.5, 0.02, 6);
  cyl('lampWarm', 14.0, g + 7.0, g + 7.4, 21.5, 0.9);

  // ---------- Dining: 6-seater, long axis N-S, pendant above
  box('woodDark', [26.5, 29.5], [g + 2.4, g + 2.55], [16.0, 22.5]);
  for (const [x, z] of [[26.8, 16.3], [29.2, 16.3], [26.8, 22.2], [29.2, 22.2]]) box('woodDark', [x - 0.15, x + 0.15], [g, g + 2.4], [z - 0.15, z + 0.15], 0.01);
  for (const z of [16.8, 19.25, 21.7]) {
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 24.9 : 29.9;
      box('fabricGrey', [x0, x0 + 1.5], [g + 1.4, g + 1.7], [z - 0.75, z + 0.75]);
      const bx = side < 0 ? [x0, x0 + 0.25] : [x0 + 1.25, x0 + 1.5];
      box('fabricGrey', bx, [g + 1.7, g + 3.3], [z - 0.75, z + 0.75]);
      box('woodDark', [x0 + 0.1, x0 + 1.4], [g, g + 1.4], [z - 0.65, z + 0.65], 0.01);
    }
  }
  cyl('charcoalMetal', 28.0, g + 6.8, LV.gfCeil, 19.25, 0.02, 6);
  box('lampWarm', [27.6, 28.4], [g + 6.6, g + 6.8], [17.0, 21.5], 0.02);

  // ---------- Kitchen: L-counter (north + east walls), uppers, fridge
  box('white', [33.6, 45.4], [g, g + 2.75], [0.85, 2.85], 0.01);
  box('white', [43.4, 45.4], [g, g + 2.75], [2.85, 9.5], 0.01);
  box('quartz', [33.5, 45.5], [g + 2.75, g + 2.83], [0.75, 2.95], 0.005);
  box('quartz', [43.3, 45.5], [g + 2.75, g + 2.83], [2.95, 9.6], 0.005);
  box('woodLight', [33.6, 37.3], [g + 5.0, g + 8.0], [0.85, 2.0], 0.01);
  box('woodLight', [41.7, 45.4], [g + 5.0, g + 8.0], [0.85, 2.0], 0.01);
  box('chrome', [34.0, 36.5], [g, g + 6.5], [8.0, 10.6], 0.03); // fridge (SW)
  box('charcoalMetal', [43.8, 45.2], [g + 2.83, g + 2.86], [5.0, 7.0], 0.005); // hob

  // ---------- Bedroom 1: queen bed (headboard west), side tables, wardrobe (east), study (south)
  bed(box, [1.0, 7.8], g, [3.9, 9.1], 'x');
  box('woodDark', [0.85, 1.05], [g, g + 4.0], [3.6, 9.4], 0.005);
  box('woodLight', [1.0, 2.6], [g, g + 1.8], [2.2, 3.6]);
  box('woodLight', [1.0, 2.6], [g, g + 1.8], [9.4, 10.8]);
  box('woodLight', [12.7, 14.7], [g, g + 7.5], [1.0, 9.5], 0.01);
  box('woodLight', [3.0, 9.0], [g + 2.4, g + 2.55], [11.0, 12.7], 0.01);

  // ---------- Bedroom 2: queen bed (headboard north), wardrobe (west)
  bed(box, [37.0, 42.2], g, [11.4, 18.2], 'z');
  box('woodDark', [36.7, 42.5], [g, g + 4.0], [11.2, 11.4], 0.005);
  box('woodLight', [33.5, 35.5], [g, g + 7.5], [19.0, 24.8], 0.01);

  // ---------- Bedroom 3 (FF): king bed centred on the north wall, wardrobe west, armchair + console
  bed(box, [16.5, 22.3], f, [9.3, 16.3], 'z');
  box('woodDark', [16.2, 22.6], [f, f + 4.5], [9.125, 9.35], 0.005);
  box('woodLight', [14.6, 16.2], [f, f + 1.8], [9.4, 10.9]);
  box('woodLight', [22.6, 24.2], [f, f + 1.8], [9.4, 10.9]);
  box('woodLight', [12.4, 14.4], [f, f + 7.5], [19.5, 24.9], 0.01);
  box('fabricBeige', [21.0, 23.4], [f, f + 1.4], [21.5, 23.8]);
  box('fabricBeige', [21.0, 23.4], [f + 1.4, f + 2.8], [21.5, 22.0]);
  box('woodDark', [15.2, 19.0], [f, f + 2.6], [23.6, 24.9]);
  cyl('lampSoft', 15.8, f + 2.6, f + 3.6, 24.25, 0.35);

  // ---------- Terrace furniture (§8)
  const t = LV.ff + 0.04;
  // under the pergola: beige L-shaped outdoor sofa + low teak table + rug
  box('rug', [2.0, 10.0], [t, t + 0.03], [19.5, 31.5], 0.005);
  box('teak', [1.4, 4.4], [t, t + 1.2], [17.5, 32.0]);
  box('cushion', [1.5, 4.3], [t + 1.2, t + 1.6], [17.6, 31.9], 0.05);
  box('cushion', [1.4, 2.2], [t + 1.6, t + 3.0], [17.6, 31.9], 0.06);
  box('teak', [1.4, 10.0], [t, t + 1.2], [30.4, 33.0]);
  box('cushion', [1.5, 9.9], [t + 1.2, t + 1.6], [30.5, 32.9], 0.05);
  box('cushion', [1.5, 9.9], [t + 1.6, t + 3.0], [32.2, 33.0], 0.06);
  box('teak', [5.0, 8.5], [t + 0.8, t + 1.1], [23.0, 27.5]);
  box('charcoalMetal', [5.2, 8.3], [t, t + 0.8], [23.2, 27.3]);
  // open terrace: round bistro table + 2 chairs, 3-seater sofa + side table
  cyl('charcoalMetal', 15.0, t, t + 2.4, 29.0, 0.1, 8);
  cyl('teak', 15.0, t + 2.4, t + 2.5, 29.0, 1.3, 28);
  for (const dz of [-2.0, 2.0]) {
    const cz = 29.0 + dz;
    box('teak', [14.2, 15.8], [t + 1.45, t + 1.6], [cz - 0.75, cz + 0.75], 0.01); // seat
    for (const lx of [14.3, 15.6]) for (const lz of [cz - 0.65, cz + 0.65]) box('charcoalMetal', [lx - 0.05, lx + 0.05], [t, t + 1.45], [lz - 0.05, lz + 0.05], 0.004);
    const back = dz < 0 ? [cz - 0.75, cz - 0.62] : [cz + 0.62, cz + 0.75];
    box('teak', [14.2, 15.8], [t + 2.2, t + 2.9], back, 0.01);
    for (const lx of [14.3, 15.6]) box('charcoalMetal', [lx - 0.04, lx + 0.04], [t + 1.6, t + 2.9], back, 0.004);
  }
  box('teak', [17.5, 24.0], [t, t + 1.2], [31.6, 34.2]);
  box('cushion', [17.6, 23.9], [t + 1.2, t + 1.6], [31.7, 34.1], 0.05);
  box('cushion', [17.6, 23.9], [t + 1.6, t + 3.0], [33.5, 34.2], 0.06);
  box('teak', [24.2, 25.0], [t, t + 1.6], [32.0, 33.2]);

  // ---------- toilets: wall-hung WC + basin hints (doors closed by default)
  for (const [cx, z, fl] of [[18.1, 1.1, g], [24.5, 1.1, g], [3.75, 27.9, g], [29.75, 24.6, f]]) {
    box('ceramic', [cx - 0.6, cx + 0.6], [fl + 1.0, fl + 1.4], [z, z + 1.8], 0.04);
  }
}

function bed(box, x, y, z, headAxis) {
  box('woodDark', x, [y, y + 1.0], z, 0.01);
  box('bedding', [x[0] + 0.05, x[1] - 0.05], [y + 1.0, y + 1.9], [z[0] + 0.05, z[1] - 0.05], 0.05);
  if (headAxis === 'x') {
    box('cushion', [x[0] + 0.3, x[0] + 1.7], [y + 1.9, y + 2.3], [z[0] + 0.4, (z[0] + z[1]) / 2 - 0.1], 0.05);
    box('cushion', [x[0] + 0.3, x[0] + 1.7], [y + 1.9, y + 2.3], [(z[0] + z[1]) / 2 + 0.1, z[1] - 0.4], 0.05);
    box('fabricGrey', [x[1] - 2.2, x[1] - 0.02], [y + 1.9, y + 1.98], [z[0], z[1]], 0.01);
  } else {
    box('cushion', [x[0] + 0.4, (x[0] + x[1]) / 2 - 0.1], [y + 1.9, y + 2.3], [z[0] + 0.3, z[0] + 1.7], 0.05);
    box('cushion', [(x[0] + x[1]) / 2 + 0.1, x[1] - 0.4], [y + 1.9, y + 2.3], [z[0] + 0.3, z[0] + 1.7], 0.05);
    box('fabricGrey', [x[0], x[1]], [y + 1.9, y + 1.98], [z[1] - 2.2, z[1] - 0.02], 0.01);
  }
}
