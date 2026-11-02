import { boxH } from '../utils/merge.js';

// Wall-local frame helpers: u = along the long axis, v = up, w = across (thickness).
export function wallFrame(wall) {
  const axis = wall.x[1] - wall.x[0] >= wall.z[1] - wall.z[0] ? 'x' : 'z';
  const along = axis === 'x' ? wall.x : wall.z;
  const across = axis === 'x' ? wall.z : wall.x;
  let outerW = null, inward = 0;
  if (wall.out) {
    const plus = wall.out[0] === '+';
    outerW = plus ? across[1] : across[0];
    inward = plus ? -1 : 1;
  }
  // box in wall-local coords -> house-local box geometry
  const box = (u, v, w, opts) => (axis === 'x' ? boxH(u, v, w, opts) : boxH(w, v, u, opts));
  return { axis, along, across, outerW, inward, box };
}

/**
 * Splits each wall into solid segments around its openings (no CSG).
 * Returns resolved openings with wall-local geometry for the openings builder.
 */
export function buildWalls(walls, openings, buckets) {
  const byId = Object.fromEntries(walls.map((w) => [w.id, w]));
  const resolved = [];
  const perWall = new Map();
  for (const o of openings) {
    const wall = byId[o.wall];
    if (!wall) continue;
    const base = o.base ?? wall.y[0];
    const y0 = base + o.sill;
    const r = { ...o, wallDef: wall, frame: wallFrame(wall), u: o.at, v: [y0, y0 + o.h] };
    resolved.push(r);
    if (!perWall.has(wall.id)) perWall.set(wall.id, []);
    perWall.get(wall.id).push(r);
  }

  for (const wall of walls) {
    const f = wallFrame(wall);
    const mat = wall.ext ? 'plaster' : 'plasterInterior';
    const ops = (perWall.get(wall.id) || []).slice().sort((a, b) => a.u[0] - b.u[0]);
    const [Y0, Y1] = wall.y;
    let s = f.along[0];
    const seg = (u, v) => {
      if (u[1] - u[0] > 1e-4 && v[1] - v[0] > 1e-4) buckets.add(mat, f.box(u, v, f.across));
    };
    for (const o of ops) {
      seg([s, o.u[0]], [Y0, Y1]);
      seg(o.u, [Y0, o.v[0]]);
      seg(o.u, [o.v[1], Y1]);
      s = Math.max(s, o.u[1]);
    }
    seg([s, f.along[1]], [Y0, Y1]);
  }
  return resolved;
}
