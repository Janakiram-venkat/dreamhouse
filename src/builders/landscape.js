import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { site } from '../config/site.js';
import * as GF from '../config/groundFloor.js';
import * as FF from '../config/firstFloor.js';
import { LV } from '../config/levels.js';
import { ft, plotToWorld, houseToPlot, HOUSE_ORIGIN } from '../config/units.js';
import { rng } from '../utils/random.js';
import { Buckets, boxH } from '../utils/merge.js';

// ---------------------------------------------------------------- textures
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

function finishTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Leaf cluster card: elliptical leaves radiating in a soft blob, optional flower heads.
function foliageTexture(seed, o) {
  const S = 512;
  const [c, g] = canvas(S, S);
  const r = rng(seed);
  const R = S * 0.47;
  const leaf = (x, y, ang, len, wid, col) => {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(0, -len / 2, wid / 2, len / 2, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    g.lineWidth = Math.max(1, wid * 0.08);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -len * 0.9);
    g.stroke();
    g.restore();
  };
  // leaves gather around a few sub-clusters -> irregular, gappy silhouette instead of a disc
  const centres = Array.from({ length: o.clusters ?? 7 }, () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.55;
    return [S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d * (o.squash ?? 1) + (o.bottomHeavy ? S * 0.03 : 0)];
  });
  const gauss = () => (r() + r() + r() - 1.5) / 1.5;
  for (let i = 0; i < o.leaves; i++) {
    const [cx, cy] = centres[i % centres.length];
    const x = cx + gauss() * R * 0.42;
    const y = cy + gauss() * R * 0.42 * (o.squash ?? 1);
    const d = Math.hypot(x - S / 2, y - S / 2);
    if (d > R) continue;
    const a = Math.atan2(y - S / 2, x - S / 2);
    const shade = d / R; // darker in the core
    const [h, s, l] = o.leafHSL;
    const col = hsl(h + r() * 14 - 7, s + r() * 10 - 5, l * (0.6 + 0.6 * shade) + r() * 8 - 4);
    leaf(x, y, a + Math.PI / 2 + (r() - 0.5) * 1.6, o.leafLen * (0.7 + r() * 0.6), o.leafWid * (0.7 + r() * 0.6), col);
  }
  if (o.flowers) {
    const F = o.flowers;
    for (let i = 0; i < F.count; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.pow(r(), 0.6) * R * 0.92;
      const x = S / 2 + Math.cos(a) * d;
      const y = S / 2 + Math.sin(a) * d * (o.squash ?? 1);
      const col = r.pick(F.colors);
      const rad = F.size * (0.7 + r() * 0.6);
      if (F.shape === 'pom') {
        for (let k = 0; k < 9; k++) {
          g.fillStyle = col;
          g.beginPath();
          g.arc(x + (r() - 0.5) * rad, y + (r() - 0.5) * rad, rad * 0.45, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = 'rgba(120,60,0,0.35)';
        g.beginPath();
        g.arc(x, y, rad * 0.25, 0, Math.PI * 2);
        g.fill();
      } else if (F.shape === 'bract') {
        for (let k = 0; k < 3; k++) {
          g.fillStyle = col;
          g.beginPath();
          const ax = x + Math.cos((k / 3) * Math.PI * 2) * rad * 0.35;
          const ay = y + Math.sin((k / 3) * Math.PI * 2) * rad * 0.35;
          g.ellipse(ax, ay, rad * 0.5, rad * 0.38, (k / 3) * Math.PI * 2, 0, Math.PI * 2);
          g.fill();
        }
      } else {
        // 5-petal flower
        for (let k = 0; k < 5; k++) {
          const pa = (k / 5) * Math.PI * 2 + a;
          g.fillStyle = col;
          g.beginPath();
          g.ellipse(x + Math.cos(pa) * rad * 0.5, y + Math.sin(pa) * rad * 0.5, rad * 0.45, rad * 0.3, pa, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = F.eye ?? '#f6d36b';
        g.beginPath();
        g.arc(x, y, rad * 0.18, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  return finishTex(c);
}

// Areca palm frond: central rachis with long narrow leaflets.
function frondTexture() {
  const W = 256, H = 1024;
  const [c, g] = canvas(W, H);
  const r = rng(5);
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const t = i / 70;
    const y = H * (0.04 + t * 0.94);
    const len = W * 0.48 * Math.sin(Math.PI * (0.15 + t * 0.85)) * (0.85 + r() * 0.2);
    for (const side of [-1, 1]) {
      const l = 30 + r() * 14;
      g.strokeStyle = hsl(88 + r() * 16, 45 + r() * 15, l);
      g.lineWidth = 5 + r() * 3;
      g.beginPath();
      g.moveTo(W / 2, y);
      g.quadraticCurveTo(W / 2 + side * len * 0.5, y - 40 * (1 - t * 0.5), W / 2 + side * len, y - 70 * (1 - t * 0.3) + r() * 20);
      g.stroke();
    }
  }
  g.strokeStyle = hsl(70, 35, 35);
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(W / 2, 0);
  g.lineTo(W / 2, H);
  g.stroke();
  return finishTex(c);
}

// ---------------------------------------------------------------- geometry
// Crossed quads with radial normals -> soft, volumetric looking bush card.
function bushGeometry(cards = 3, tops = 2) {
  const parts = [];
  for (let i = 0; i < cards; i++) {
    const p = new THREE.PlaneGeometry(1, 1);
    p.translate(0, 0.5, 0);
    p.rotateY((i / cards) * Math.PI);
    parts.push(p);
  }
  for (let i = 0; i < tops; i++) {
    const p = new THREE.PlaneGeometry(0.9, 0.9);
    p.rotateX(-Math.PI / 2 + 0.35);
    p.rotateY(i * 1.7);
    p.translate(0, 0.62, 0);
    parts.push(p);
  }
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  radialNormals(g, new THREE.Vector3(0, 0.3, 0), 0.5);
  return g;
}

function radialNormals(g, centre, upBias = 0.4) {
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).sub(centre);
    v.y += upBias;
    v.normalize();
    nor.setXYZ(i, v.x, v.y, v.z);
  }
}

// Curved, V-folded frond strip (length 1, width w), base at origin pointing +X.
function frondGeometry(len, width, droop) {
  const seg = 10;
  const g = new THREE.PlaneGeometry(width, len, 2, seg);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const t = (pos.getY(i) + len / 2) / len; // 0 base -> 1 tip
    const along = t * len;
    const y = Math.sin(t * 1.2) * len * 0.35 - droop * t * t * len;
    const fold = Math.abs(x) * 0.35; // V fold
    pos.setXYZ(i, along, y + fold, x);
  }
  g.computeVertexNormals();
  return g;
}

function arecaPalm(seed, height) {
  const r = rng(seed);
  const trunks = [];
  const fronds = [];
  const stems = 5 + Math.floor(r() * 3);
  for (let s = 0; s < stems; s++) {
    const h = height * (0.55 + r() * 0.45);
    const lean = new THREE.Vector3((r() - 0.5) * 0.5, 1, (r() - 0.5) * 0.5).normalize();
    const base = new THREE.Vector3((r() - 0.5) * 0.18, 0, (r() - 0.5) * 0.18);
    const cyl = new THREE.CylinderGeometry(0.022, 0.035, h, 7, 4);
    cyl.translate(0, h / 2, 0);
    cyl.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), lean));
    cyl.translate(base.x, base.y, base.z);
    trunks.push(cyl);
    const top = base.clone().addScaledVector(lean, h);
    const n = 6 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const len = height * (0.45 + r() * 0.2);
      const f = frondGeometry(len, len * 0.42, 0.55 + r() * 0.35);
      f.rotateZ(0.5 + r() * 0.5); // pitch up
      f.rotateY((i / n) * Math.PI * 2 + r() * 0.5);
      f.translate(top.x, top.y, top.z);
      fronds.push(f);
    }
  }
  return { trunk: mergeGeometries(trunks.map((g) => g.toNonIndexed())), fronds: mergeGeometries(fronds.map((g) => g.toNonIndexed())) };
}

function treeGeometry(seed, height, spread) {
  const r = rng(seed);
  const wood = [];
  const leaves = [];
  const trunkH = height * 0.42;
  const t = new THREE.CylinderGeometry(height * 0.018, height * 0.03, trunkH, 9, 3);
  t.translate(0, trunkH / 2, 0);
  wood.push(t);
  const crownC = new THREE.Vector3(0, height * 0.66, 0);
  const branches = 5 + Math.floor(r() * 3);
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + r() * 0.6;
    const dir = new THREE.Vector3(Math.cos(a) * 0.7, 0.75 + r() * 0.4, Math.sin(a) * 0.7).normalize();
    const len = height * (0.3 + r() * 0.15);
    const b = new THREE.CylinderGeometry(height * 0.006, height * 0.014, len, 6);
    b.translate(0, len / 2, 0);
    b.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
    b.translate(0, trunkH * 0.92, 0);
    wood.push(b);
  }
  // leaf cards filling an ellipsoid canopy
  const cards = 300;
  const rad = new THREE.Vector3(spread, height * 0.3, spread);
  for (let i = 0; i < cards; i++) {
    const u = r(), v = r();
    const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
    const k = Math.pow(r(), 0.35);
    const p = new THREE.Vector3(Math.sin(ph) * Math.cos(th) * rad.x * k, Math.cos(ph) * rad.y * k, Math.sin(ph) * Math.sin(th) * rad.z * k).add(crownC);
    const s = height * (0.075 + r() * 0.05);
    const q = new THREE.PlaneGeometry(s, s);
    q.rotateX(r() * Math.PI);
    q.rotateY(r() * Math.PI * 2);
    q.rotateZ((r() - 0.5) * 0.8);
    q.translate(p.x, p.y, p.z);
    leaves.push(q.toNonIndexed());
  }
  const lg = mergeGeometries(leaves);
  radialNormals(lg, crownC, 0.3 * height);
  return { wood: mergeGeometries(wood.map((g) => g.toNonIndexed())), leaves: lg };
}

// ---------------------------------------------------------------- placement helpers
const H2P = (r) => ({ X: [HOUSE_ORIGIN.X + r.x[0], HOUSE_ORIGIN.X + r.x[1]], Z: [HOUSE_ORIGIN.Z + r.z[0], HOUSE_ORIGIN.Z + r.z[1]] });
const inside = (X, Z, R, m = 0) => X > R.X[0] - m && X < R.X[1] + m && Z > R.Z[0] - m && Z < R.Z[1] + m;

function blockedForGrass() {
  const rects = [
    ...GF.plinth.map(H2P),
    H2P(GF.porch.floor),
    H2P({ x: GF.porch.steps.x, z: [GF.porch.steps.z0, GF.porch.steps.z0 + 2.2] }),
    H2P({ x: [27.5, 33.5], z: [-3, 0] }),
    ...site.driveway,
    site.rearStrip,
    ...site.beds,
    { X: [0, 72], Z: [61.5, 63] },
    { X: [0, 1], Z: [0, 62.5] },
    { X: [64.75, 72], Z: [0, 62.5] },
  ];
  const P = site.path;
  for (let z = P.Z[0]; z + P.d <= P.Z[1] + 0.01; z += P.d + P.gap) rects.push({ X: [P.cx - P.w / 2, P.cx + P.w / 2], Z: [z, z + P.d] });
  return rects;
}

// ---------------------------------------------------------------- build
export function buildLandscape(mats, quality) {
  const group = new THREE.Group();
  group.name = 'Landscape';
  const uniforms = { uTime: { value: 0 } };

  const foliageMat = (tex, opts = {}) => {
    const m = new THREE.MeshStandardMaterial({
      map: tex,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.75,
      metalness: 0,
      color: new THREE.Color(opts.tint ?? '#ffffff'),
    });
    // gentle translucency: lift the back-lit side a little so foliage glows warm at dusk
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.035;'
      );
    };
    return m;
  };

  const T = {
    boxwood: foliageTexture(11, { leaves: 2200, leafHSL: [100, 45, 26], leafLen: 22, leafWid: 11 }),
    shrub: foliageTexture(12, { leaves: 1100, leafHSL: [95, 50, 30], leafLen: 44, leafWid: 18 }),
    bougainvillea: foliageTexture(13, { leaves: 900, leafHSL: [100, 45, 28], leafLen: 34, leafWid: 18, flowers: { count: 260, size: 22, shape: 'bract', colors: ['#d4145a', '#e0287a', '#b5124b', '#ee3a6f', '#c2185b'] } }),
    roses: foliageTexture(14, { leaves: 900, leafHSL: [105, 48, 25], leafLen: 30, leafWid: 16, flowers: { count: 120, size: 26, shape: 'pom', colors: ['#c81d25', '#e03131', '#a4161a'] } }),
    periPink: foliageTexture(15, { leaves: 700, leafHSL: [110, 45, 27], leafLen: 30, leafWid: 14, squash: 0.8, flowers: { count: 140, size: 18, colors: ['#ff79b0', '#ff5fa2', '#f783ac'], eye: '#c2255c' } }),
    periWhite: foliageTexture(16, { leaves: 700, leafHSL: [110, 45, 27], leafLen: 30, leafWid: 14, squash: 0.8, flowers: { count: 150, size: 18, colors: ['#ffffff', '#f8f0f5'], eye: '#e64980' } }),
    marigold: foliageTexture(17, { leaves: 650, leafHSL: [95, 50, 30], leafLen: 20, leafWid: 9, flowers: { count: 70, size: 30, shape: 'pom', colors: ['#ffa400', '#ff8c00', '#ffc300', '#f77f00'] } }),
    ixora: foliageTexture(18, { leaves: 1000, leafHSL: [110, 50, 22], leafLen: 36, leafWid: 14, flowers: { count: 50, size: 34, shape: 'pom', colors: ['#e5383b', '#f25c54', '#d00000'] } }),
    jasmine: foliageTexture(19, { leaves: 1000, leafHSL: [110, 50, 26], leafLen: 26, leafWid: 12, flowers: { count: 180, size: 14, colors: ['#ffffff'], eye: '#fff3bf' } }),
    tree: foliageTexture(21, { leaves: 3200, clusters: 9, leafHSL: [98, 45, 27], leafLen: 22, leafWid: 10 }),
    treeFlower: foliageTexture(22, { leaves: 2600, clusters: 8, leafHSL: [92, 40, 24], leafLen: 30, leafWid: 12 }),
  };
  const M = Object.fromEntries(Object.entries(T).map(([k, t]) => [k, foliageMat(t)]));
  const frondMat = foliageMat(frondTexture());

  const bushGeo = bushGeometry(3, 2);
  const lowGeo = bushGeometry(3, 1);
  const instances = {}; // type -> [matrix]
  const r = rng(2024);
  const rot = () => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI * 2);
  const place = (type, X, Y, Z, s, sy = s) => {
    const p = plotToWorld(X, Y, Z);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.y, p.z), rot(), new THREE.Vector3(ft(s), ft(sy), ft(s)));
    (instances[type] ??= []).push(m);
  };

  const flowerTypes = ['bougainvillea', 'roses', 'periPink', 'periWhite', 'marigold', 'jasmine', 'periPink', 'marigold'];
  const shrubTypes = ['boxwood', 'ixora', 'shrub', 'bougainvillea'];
  const density = quality.plantDensity;
  for (const bed of site.beds) {
    const area = (bed.X[1] - bed.X[0]) * (bed.Z[1] - bed.Z[0]);
    if (bed.mix === 'hedge') {
      // clipped 2.5' hedge along the east boundary, cards on top for an irregular silhouette
      const hx = [bed.X[1] - 2.2, bed.X[1] - 0.1];
      for (let Z = bed.Z[0] + 0.6; Z < bed.Z[1] - 0.6; Z += 0.9) place('boxwood', (hx[0] + hx[1]) / 2 + (r() - 0.5) * 0.3, 0.05, Z, 2.6 + r() * 0.4, 2.7 + r() * 0.3);
      for (let i = 0; i < area * 0.6 * density; i++) {
        const X = bed.X[0] + 0.4 + r() * (hx[0] - bed.X[0] - 0.4);
        const Z = bed.Z[0] + r() * (bed.Z[1] - bed.Z[0]);
        if (inside(X, Z, { X: [64, 72], Z: [30, 48] }) && X < 66) continue;
        place(r.pick(flowerTypes), X, 0.08, Z, 0.9 + r() * 0.6);
      }
      continue;
    }
    const n = Math.round(area * (bed.mix === 'shrubs' ? 0.55 : 0.85) * density);
    for (let i = 0; i < n; i++) {
      const X = bed.X[0] + 0.3 + r() * (bed.X[1] - bed.X[0] - 0.6);
      const Z = bed.Z[0] + 0.3 + r() * (bed.Z[1] - bed.Z[0] - 0.6);
      const shrub = bed.mix === 'shrubs' ? r() < 0.75 : r() < 0.3;
      if (shrub) place(r.pick(shrubTypes), X, 0.08, Z, 1.4 + r() * 1.3);
      else place(r.pick(flowerTypes), X, 0.08, Z, 0.75 + r() * 0.65, 0.65 + r() * 0.6);
    }
  }
  // lawn-edge accents along the house front & driveway
  for (let i = 0; i < 40 * density; i++) place(r.pick(['marigold', 'periPink', 'periWhite']), 30 + r() * 20, 0.02, 57 + r() * 1.8, 0.7 + r() * 0.4);

  // terrace planters: cream boxes with soil + plants (§4.5)
  const planterBuckets = new Buckets();
  for (const p of FF.terrace.planters) {
    planterBuckets.add('plaster', boxH(p.x, [LV.ff, LV.ff + 1.5], p.z, { rounded: 0.01 }));
    planterBuckets.add('soil', boxH([p.x[0] + 0.15, p.x[1] - 0.15], [LV.ff + 1.5, LV.ff + 1.52], [p.z[0] + 0.15, p.z[1] - 0.15]));
    const len = Math.max(p.x[1] - p.x[0], p.z[1] - p.z[0]);
    const cnt = Math.round(len * 1.3 * density);
    for (let i = 0; i < cnt; i++) {
      const x = p.x[0] + 0.3 + r() * (p.x[1] - p.x[0] - 0.6);
      const z = p.z[0] + 0.3 + r() * (p.z[1] - p.z[0] - 0.6);
      const P = houseToPlot(x, z);
      place(r() < 0.45 ? r.pick(shrubTypes) : r.pick(flowerTypes), P.X, LV.ff + 1.5, P.Z, 1.1 + r() * 0.9);
    }
  }
  group.add(planterBuckets.build(mats, 'TerracePlanters'));

  for (const [type, list] of Object.entries(instances)) {
    const geo = ['marigold', 'periPink', 'periWhite'].includes(type) ? lowGeo : bushGeo;
    const im = new THREE.InstancedMesh(geo, M[type], list.length);
    list.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = true;
    im.receiveShadow = true;
    im.name = `Plants_${type}`;
    im.frustumCulled = false;
    group.add(im);
  }

  // -------------------------------------------------- palms (areca) + pots
  const palm = arecaPalm(31, ft(7.5));
  const palmSpots = [];
  for (const p of site.palms) palmSpots.push({ ...p, Y: p.pot ? 2.2 : 0.1, s: p.pot ? 1.0 : 1.25 });
  // terrace railing corners + a few along the railing (board shows several)
  for (const [x, z] of [[1.6, 33.6], [13.0, 27.0], [2.0, 10.8]]) {
    const P = houseToPlot(x, z);
    palmSpots.push({ X: P.X, Z: P.Z, Y: LV.ff + 2.0, s: 0.9, pot: true });
  }
  const potB = new Buckets();
  for (const p of palmSpots) {
    if (!p.pot) continue;
    const base = p.Y - 2.1;
    const pot = new THREE.CylinderGeometry(ft(0.95), ft(0.7), ft(2.1), 20);
    const w = plotToWorld(p.X, base + 1.05, p.Z);
    pot.translate(w.x, w.y, w.z);
    potB.add('potCharcoal', pot);
    const soil = new THREE.CylinderGeometry(ft(0.88), ft(0.88), ft(0.05), 20);
    const sw = plotToWorld(p.X, base + 2.0, p.Z);
    soil.translate(sw.x, sw.y, sw.z);
    potB.add('soil', soil);
  }
  group.add(potB.build(mats, 'Pots'));
  const palmFronds = new THREE.InstancedMesh(palm.fronds, frondMat, palmSpots.length);
  const palmTrunks = new THREE.InstancedMesh(palm.trunk, mats.palmTrunk, palmSpots.length);
  palmSpots.forEach((p, i) => {
    const w = plotToWorld(p.X, p.Y, p.Z);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(w.x, w.y, w.z), rot(), new THREE.Vector3(p.s, p.s, p.s));
    palmFronds.setMatrixAt(i, m);
    palmTrunks.setMatrixAt(i, m);
  });
  for (const im of [palmFronds, palmTrunks]) {
    im.castShadow = true;
    im.receiveShadow = true;
    im.frustumCulled = false;
  }
  palmFronds.name = 'Palms_Fronds';
  palmTrunks.name = 'Palms_Trunks';
  group.add(palmFronds, palmTrunks);

  // -------------------------------------------------- trees: site + background ring
  const treeA = treeGeometry(41, ft(22), ft(9));
  const treeB = treeGeometry(42, ft(16), ft(6.5));
  const siteTrees = site.trees.map((t) => ({ X: t.X, Z: t.Z, s: t.h / (t.big ? 22 : 16), geo: t.big ? 'A' : 'B' }));
  const bg = [];
  const rb = rng(99);
  // dense background trees outside the plot to frame the silhouette
  const ring = [
    { X: [-40, -2], Z: [-30, 32] },
    { X: [74, 115], Z: [-30, 30] },
    { X: [-30, 100], Z: [-75, -48] },
    { X: [-30, -4], Z: [-48, -6] },
    { X: [76, 100], Z: [-48, -6] },
    { X: [-120, -60], Z: [-80, 110] },
    { X: [125, 190], Z: [-80, 110] },
    { X: [-60, 140], Z: [-130, -70] },
    { X: [-60, 140], Z: [160, 200] },
  ];
  for (const R of ring) {
    const n = Math.round(((R.X[1] - R.X[0]) * (R.Z[1] - R.Z[0])) / 380);
    for (let i = 0; i < n; i++) {
      const X = R.X[0] + rb() * (R.X[1] - R.X[0]);
      const Z = R.Z[0] + rb() * (R.Z[1] - R.Z[0]);
      bg.push({ X, Z, s: 0.9 + rb() * 0.9, geo: rb() < 0.5 ? 'A' : 'B' });
    }
  }
  const all = [...siteTrees, ...bg];
  const leafMatA = M.treeFlower;
  const leafMatB = M.tree;
  for (const [key, geo, leafMat] of [['A', treeA, leafMatA], ['B', treeB, leafMatB]]) {
    const list = all.filter((t) => t.geo === key);
    const wood = new THREE.InstancedMesh(geo.wood, mats.trunk, list.length);
    const leaves = new THREE.InstancedMesh(geo.leaves, leafMat, list.length);
    list.forEach((t, i) => {
      const w = plotToWorld(t.X, 0, t.Z);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(w.x, w.y, w.z), rot(), new THREE.Vector3(t.s, t.s * (0.9 + rb() * 0.2), t.s));
      wood.setMatrixAt(i, m);
      leaves.setMatrixAt(i, m);
    });
    for (const im of [wood, leaves]) {
      im.castShadow = true;
      im.receiveShadow = true;
      im.frustumCulled = false;
    }
    wood.name = `Trees${key}_Wood`;
    leaves.name = `Trees${key}_Leaves`;
    group.add(wood, leaves);
  }

  // -------------------------------------------------- grass blades (instanced, wind in the vertex shader)
  if (quality.grass > 0) group.add(buildGrass(quality.grass, uniforms));

  return {
    group,
    update(t) {
      uniforms.uTime.value = t;
    },
  };
}

function buildGrass(count, uniforms) {
  const blocked = blockedForGrass();
  const L = site.lawn;
  const r = rng(7);
  const segs = 2;
  const blade = new THREE.BufferGeometry();
  const pos = [], hgt = [], nor = [];
  const w = 0.012;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ww = w * (1 - t * 0.85);
    pos.push(-ww / 2, t, 0, ww / 2, t, 0);
    hgt.push(t, t);
    nor.push(0, 1, 0, 0, 1, 0);
  }
  const idx = [];
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  blade.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  blade.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  blade.setAttribute('aH', new THREE.Float32BufferAttribute(hgt, 1));
  blade.setIndex(idx);

  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aH;\nuniform float uTime;\nvarying float vH;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vH = aH;
         vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
         float wv = sin(uTime * 1.6 + ip.x * 1.7 + ip.z * 1.3) * 0.5 + sin(uTime * 2.7 + ip.x * 3.1) * 0.25;
         transformed.x += wv * aH * aH * 0.35;
         transformed.z += wv * aH * aH * 0.18;`
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vH;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= mix(0.35, 1.15, vH);');
  };

  const im = new THREE.InstancedMesh(blade, mat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const c = new THREE.Color();
  let n = 0, guard = 0;
  while (n < count && guard++ < count * 4) {
    const X = L.X[0] + r() * (L.X[1] - L.X[0]);
    const Z = L.Z[0] + r() * (L.Z[1] - L.Z[0]);
    if (blocked.some((R) => inside(X, Z, R, 0.05))) continue;
    const p = plotToWorld(X, 0, Z);
    e.set((r() - 0.5) * 0.5, r() * Math.PI * 2, (r() - 0.5) * 0.5);
    q.setFromEuler(e);
    const h = 0.07 + r() * 0.08;
    const s = 0.8 + r() * 0.7;
    m.compose(new THREE.Vector3(p.x, -0.005, p.z), q, new THREE.Vector3(s, h, s));
    im.setMatrixAt(n, m);
    c.setHSL(0.25 + r() * 0.04, 0.55 + r() * 0.15, 0.2 + r() * 0.06);
    im.setColorAt(n, c);
    n++;
  }
  im.count = n;
  im.receiveShadow = true;
  im.castShadow = false;
  im.frustumCulled = false;
  im.name = 'GrassBlades';
  return im;
}
