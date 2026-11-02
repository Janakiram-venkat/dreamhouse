import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ft, toWorld, plotToWorld } from '../config/units.js';
import { applyWorldBoxUV } from './uv.js';

const KEEP = ['position', 'normal', 'uv'];

function normalize(geo) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (!KEEP.includes(name)) g.deleteAttribute(name);
  g.morphAttributes = {};
  return g;
}

// Collects static geometry per material key and merges each set into one mesh (CLAUDE.md §11).
export class Buckets {
  constructor() {
    this.map = new Map();
  }
  add(key, geo) {
    if (!this.map.has(key)) this.map.set(key, []);
    this.map.get(key).push(normalize(geo));
    return this;
  }
  build(materials, name, { cast = true, receive = true } = {}) {
    const group = new THREE.Group();
    group.name = name;
    for (const [key, geos] of this.map) {
      if (!geos.length) continue;
      const mat = materials[key];
      if (!mat) throw new Error(`Unknown material "${key}" in ${name}`);
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      mesh.name = `${name}_${key}`;
      mesh.castShadow = cast && !mat.transparent;
      if (mat.transparent) mesh.renderOrder = 1;
      mesh.receiveShadow = receive;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
    }
    return group;
  }
}

// Axis-aligned box from house-local feet ranges -> world-space geometry with world UVs.
export function boxH(x, y, z, { rounded = 0 } = {}) {
  const a = toWorld(x[0], y[0], z[0]);
  const b = toWorld(x[1], y[1], z[1]);
  return boxWorld(a, b, rounded);
}

export function boxP(X, Y, Z, { rounded = 0 } = {}) {
  const a = plotToWorld(X[0], Y[0], Z[0]);
  const b = plotToWorld(X[1], Y[1], Z[1]);
  return boxWorld(a, b, rounded);
}

export function boxWorld(a, b, rounded = 0) {
  const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y), d = Math.abs(b.z - a.z);
  const r = Math.min(rounded, w / 2.01, h / 2.01, d / 2.01);
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return applyWorldBoxUV(g);
}

// Generic: take a local geometry, apply a matrix, re-project UVs into world space.
export function placed(geo, matrix, worldUV = true) {
  geo.applyMatrix4(matrix);
  return worldUV ? applyWorldBoxUV(geo) : geo;
}

export const v3 = (o) => new THREE.Vector3(o.x, o.y, o.z);
export const hv = (x, y, z) => v3(toWorld(x, y, z));
export const pv = (X, Y, Z) => v3(plotToWorld(X, Y, Z));
export { ft };
