import { IN } from '../config/units.js';

const FACE = 2.5 * IN; // frame face width
const DEPTH = 3 * IN; // frame depth
const INSET = 4 * IN; // glass/frame set back from the outer face
const GLASS = 0.25 * IN;

// Builds frames, glass, sills and doors for resolved openings (see walls.js).
export function buildOpenings(resolved, buckets) {
  for (const o of resolved) {
    const f = o.frame;
    const [a, b] = o.u;
    const [y0, y1] = o.v;
    const t = f.across[1] - f.across[0];
    // w position measured inward from the outer face (internal walls: from the wall centre)
    const outer = f.outerW ?? (f.across[0] + f.across[1]) / 2;
    const dir = f.inward || 1;
    const W = (d0, d1) => {
      const p = outer + dir * d0, q = outer + dir * d1;
      return [Math.min(p, q), Math.max(p, q)];
    };
    const B = (key, u, v, w, opts) => buckets.add(key, f.box(u, v, w, opts));

    const frameRect = (u, v, w, face = FACE, key = 'charcoalMetal') => {
      B(key, [u[0], u[1]], [v[0], v[0] + face], w);
      B(key, [u[0], u[1]], [v[1] - face, v[1]], w);
      B(key, [u[0], u[0] + face], [v[0] + face, v[1] - face], w);
      B(key, [u[1] - face, u[1]], [v[0] + face, v[1] - face], w);
    };
    const glassPane = (u, v, wMid, key = 'glass') => B(key, u, v, [wMid - GLASS / 2, wMid + GLASS / 2]);

    const sill = () => {
      if (f.outerW == null) return;
      B('granite', [a - 2 * IN, b + 2 * IN], [y0 - 2 * IN, y0], W(-1.5 * IN, INSET + DEPTH), { rounded: 0.004 });
    };

    switch (o.type) {
      case 'window':
      case 'vent': {
        const wf = f.outerW == null ? [-DEPTH / 2, DEPTH / 2] : [INSET, INSET + DEPTH];
        const w = W(wf[0], wf[1]);
        frameRect([a, b], [y0, y1], w);
        const n = o.panels ?? 1;
        const pw = (b - a) / n;
        for (let i = 1; i < n; i++) B('charcoalMetal', [a + i * pw - FACE / 2, a + i * pw + FACE / 2], [y0 + FACE, y1 - FACE], w);
        if (o.transoms) {
          const ph = (y1 - y0) / o.transoms;
          for (let i = 1; i < o.transoms; i++) B('charcoalMetal', [a + FACE, b - FACE], [y0 + i * ph - FACE / 2, y0 + i * ph + FACE / 2], w);
        }
        glassPane([a + FACE, b - FACE], [y0 + FACE, y1 - FACE], (w[0] + w[1]) / 2, o.type === 'vent' ? 'frosted' : 'glass');
        sill();
        break;
      }
      case 'slider':
      case 'doorGlazed': {
        // outer frame + n panels on two staggered tracks
        const n = o.panels ?? 1;
        const wo = W(INSET, INSET + DEPTH * 1.6);
        frameRect([a, b], [y0, y1], wo, 1.5 * IN);
        const pw = (b - a - 3 * IN) / n;
        for (let i = 0; i < n; i++) {
          const track = i % 2 === 0 ? 0 : 1;
          const w = W(INSET + 0.1 * IN + track * DEPTH * 0.8, INSET + DEPTH * 0.75 + track * DEPTH * 0.8);
          const u0 = a + 1.5 * IN + i * pw - (track ? 0.6 * IN : 0);
          const u1 = u0 + pw + 1.2 * IN;
          const v = [y0 + 1.5 * IN, y1 - 1.5 * IN];
          frameRect([u0, u1], v, w, 1.6 * IN);
          glassPane([u0 + 1.6 * IN, u1 - 1.6 * IN], [v[0] + 1.6 * IN, v[1] - 1.6 * IN], (w[0] + w[1]) / 2);
          // slim vertical pull
          if (o.type === 'doorGlazed') B('charcoalMetal', [u1 - 5 * IN, u1 - 4 * IN], [y0 + 3, y0 + 4], [w[0] - 1.5 * IN, w[0]]);
        }
        // threshold
        if (f.outerW != null) B('granite', [a, b], [y0 - 0.05, y0 + 0.01], W(-1 * IN, t));
        break;
      }
      case 'doorMain': {
        const w = W(INSET, INSET + 2 * IN);
        B('teak', [a + 3 * IN, b - 3 * IN], [y0, y1 - 3 * IN], w);
        // vertical grooves (dark recesses) on the outer face
        const gw = 0.35 * IN;
        for (let u = a + 3 * IN + 0.5; u < b - 3 * IN - 0.2; u += 0.5) B('darkRecess', [u - gw / 2, u + gw / 2], [y0 + 0.05, y1 - 3 * IN - 0.05], W(INSET - 0.05 * IN, INSET + 0.2 * IN));
        // teak architrave, 3" on the outer face
        const wa = W(-0.75 * IN, INSET);
        B('teak', [a, a + 3 * IN], [y0, y1], wa);
        B('teak', [b - 3 * IN, b], [y0, y1], wa);
        B('teak', [a + 3 * IN, b - 3 * IN], [y1 - 3 * IN, y1], wa);
        // 4' black pull handle on stand-offs
        const hu = b - 3 * IN - 0.45;
        B('charcoalMetal', [hu - 0.6 * IN, hu + 0.6 * IN], [y0 + 2.0, y0 + 6.0], W(INSET - 2.4 * IN, INSET - 1.2 * IN));
        for (const yy of [y0 + 2.4, y0 + 5.6]) B('charcoalMetal', [hu - 0.3 * IN, hu + 0.3 * IN], [yy - 0.3 * IN, yy + 0.3 * IN], W(INSET - 1.2 * IN, INSET));
        B('granite', [a, b], [y0 - 0.05, y0 + 0.01], W(-1 * IN, t));
        break;
      }
      case 'doorBack': {
        const w = W(INSET, INSET + 2 * IN);
        const lightU = [a + 0.45, a + 0.75];
        B('teak', [a + 2 * IN, lightU[0]], [y0, y1 - 2 * IN], w);
        B('teak', [lightU[1], b - 2 * IN], [y0, y1 - 2 * IN], w);
        B('teak', lightU, [y0, y0 + 1.0], w);
        B('teak', lightU, [y1 - 1.0 - 2 * IN, y1 - 2 * IN], w);
        glassPane(lightU, [y0 + 1.0, y1 - 1.0 - 2 * IN], (w[0] + w[1]) / 2, 'frosted');
        frameRect([a, b], [y0 - 0.01, y1], W(INSET - 0.5 * IN, INSET + 2.5 * IN), 2 * IN, 'teak');
        B('charcoalMetal', [b - 0.55, b - 0.5], [y0 + 3, y0 + 4], W(INSET - 1.5 * IN, INSET));
        break;
      }
      case 'door':
      case 'doorWpc': {
        const key = o.type === 'door' ? 'woodLight' : 'wpcDoor';
        const mid = (f.across[0] + f.across[1]) / 2;
        const wd = [mid - 0.75 * IN, mid + 0.75 * IN];
        const P = (u, v, w) => buckets.add(key, f.box(u, v, w));
        P([a + 1.5 * IN, b - 1.5 * IN], [y0, y1 - 1.5 * IN], wd);
        // frame/architrave both sides
        const wf = [f.across[0] - 0.5 * IN, f.across[1] + 0.5 * IN];
        P([a - 2 * IN, a + 1.5 * IN], [y0, y1 + 2 * IN], wf);
        P([b - 1.5 * IN, b + 2 * IN], [y0, y1 + 2 * IN], wf);
        P([a - 2 * IN, b + 2 * IN], [y1 - 1.5 * IN, y1 + 2 * IN], wf);
        // lever handle both sides
        for (const s of [-1, 1]) B('chrome', [b - 0.55, b - 0.3], [y0 + 3.4, y0 + 3.48], [mid + s * 0.75 * IN, mid + s * 2.2 * IN].sort((p, q) => p - q));
        break;
      }
    }
  }
}
