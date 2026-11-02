import { boxH } from '../utils/merge.js';
import { elevation } from '../config/elevation.js';
import { LV } from '../config/levels.js';
import { IN } from '../config/units.js';
import * as FF from '../config/firstFloor.js';

// Stone cladding, louvres, frame box, stripe and glass balustrades (CLAUDE.md §5, §4.5).
export function buildFacade(b) {
  for (const s of elevation.stone) b.add('stone', boxH(s.x, s.y, s.z));
  for (const g of elevation.shadowGaps) b.add('darkRecess', boxH(g.x, g.y, g.z));

  for (const L of elevation.louvres) {
    const side = L.side ?? 1;
    const [fw, fd] = L.fin;
    const across = side > 0 ? [L.plane, L.plane + fd] : [L.plane - fd, L.plane];
    const n = Math.floor((L.to - L.from - fw) / L.pitch) + 1;
    const start = L.from + (L.to - L.from - (n - 1) * L.pitch - fw) / 2;
    for (let i = 0; i < n; i++) {
      const u = [start + i * L.pitch, start + i * L.pitch + fw];
      if (L.along === 'x') b.add('teak', boxH(u, L.y, across, { rounded: 0.004 }));
      else b.add('teak', boxH(across, L.y, u, { rounded: 0.004 }));
    }
    // slim charcoal rails top & bottom carry the fins
    const railAcross = side > 0 ? [L.plane, L.plane + fd * 0.5] : [L.plane - fd * 0.5, L.plane];
    for (const yy of [[L.y[0], L.y[0] + 1.5 * IN], [L.y[1] - 1.5 * IN, L.y[1]]]) {
      if (L.along === 'x') b.add('charcoalMetal', boxH([L.from, L.to], yy, railAcross));
      else b.add('charcoalMetal', boxH(railAcross, yy, [L.from, L.to]));
    }
  }

  // white projecting frame box around the bedroom 3 slider
  const F = elevation.frameBox;
  const z = [F.wallFace, F.wallFace + F.proj];
  const [x0, x1] = F.opening.x;
  const [y0, y1] = F.opening.y;
  b.add('white', boxH([x0 - F.t, x1 + F.t], [y1, y1 + F.t], z, { rounded: 0.01 }));
  b.add('white', boxH([x0 - F.t, x0], [y0, y1], z, { rounded: 0.01 }));
  b.add('white', boxH([x1, x1 + F.t], [y0, y1], z, { rounded: 0.01 }));

  // charcoal vertical stripe on the bedroom 2 east wall
  const S = elevation.stripe;
  b.add('darkRecess', boxH([S.x - S.depth, S.x + 0.01], S.y, S.z));

  // frameless glass balustrades with a slim charcoal cap rail
  const yB = [12.25, LV.ffRail];
  const glassAt = (x, z) => b.add('glassBalustrade', boxH(x, [yB[0], yB[1] - 2 * IN], z));
  const capAt = (x, z) => b.add('charcoalMetal', boxH(x, [yB[1] - 2 * IN, yB[1]], z, { rounded: 0.006 }));
  const off = 0.6; // sits on the fascia band
  for (const r of FF.terrace.balustrade) {
    const horiz = r.from[1] === r.to[1];
    if (horiz) {
      const zc = r.from[1] + off;
      const zz = [zc - 0.25 * IN, zc + 0.25 * IN];
      const xs = [r.from[0] - off, r.to[0]];
      segments(xs, 4.0, (a, c) => glassAt([a + 0.02, c - 0.02], zz));
      capAt(xs, [zc - 0.75 * IN, zc + 0.75 * IN]);
    } else {
      const xc = r.from[0] - off;
      const xx = [xc - 0.25 * IN, xc + 0.25 * IN];
      const zs = [r.from[1], r.to[1] + off];
      segments(zs, 4.0, (a, c) => glassAt(xx, [a + 0.02, c - 0.02]));
      capAt([xc - 0.75 * IN, xc + 0.75 * IN], zs);
    }
  }
}

function segments([a, b], max, fn) {
  const n = Math.max(1, Math.ceil((b - a) / max));
  const len = (b - a) / n;
  for (let i = 0; i < n; i++) fn(a + i * len, a + (i + 1) * len);
}

export function buildPergola(b, cfg) {
  const { x, z, top, postsZ, post, beam, slat } = cfg;
  const beamY = [top - slat.d - beam.d, top - slat.d];
  for (const px of x) for (const pz of postsZ) b.add('charcoalMetal', boxH([px - post / 2, px + post / 2], [LV.ff, beamY[0]], [pz - post / 2, pz + post / 2]));
  for (const px of x) b.add('charcoalMetal', boxH([px - beam.w / 2, px + beam.w / 2], beamY, [z[0] - 0.5, z[1] + 0.5]));
  for (const pz of postsZ) b.add('charcoalMetal', boxH([x[0] - 0.5, x[1] + 0.5], beamY, [pz - beam.w / 2, pz + beam.w / 2]));
  const n = Math.round((x[1] - x[0]) / slat.pitch);
  for (let i = 0; i < n; i++) {
    const cx = x[0] + slat.pitch / 2 + i * slat.pitch;
    b.add('teak', boxH([cx - slat.w / 2, cx + slat.w / 2], [top - slat.d, top], [z[0] - 0.5, z[1] + 0.5], { rounded: 0.004 }));
  }
  // warm LED strips on the inside faces of the main beams
  b.add('ledStrip', boxH([x[0] + beam.w / 2, x[0] + beam.w / 2 + 0.04], [beamY[0] + 0.05, beamY[0] + 0.12], z));
  b.add('ledStrip', boxH([x[1] - beam.w / 2 - 0.04, x[1] - beam.w / 2], [beamY[0] + 0.05, beamY[0] + 0.12], z));
}
