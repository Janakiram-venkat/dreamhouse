import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Buckets, placed, hv, pv, boxH, boxP } from '../utils/merge.js';
import { sconces, roomLights, WARM_LIGHT } from '../config/lights.js';
import * as GF from '../config/groundFloor.js';
import * as FF from '../config/firstFloor.js';
import { site } from '../config/site.js';
import { LV } from '../config/levels.js';
import { ft, IN } from '../config/units.js';
import { splashMaterial, poolMaterial } from '../render/materials.js';

const NORMALS = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
const Zp = new THREE.Vector3(0, 0, 1);

// Oriented plane on a wall: n = outward normal, anchored at p, extends up (dir=1) or down (dir=-1).
function wallSplash(p, n, w, h, dir) {
  const g = new THREE.PlaneGeometry(w, h);
  g.translate(0, -h / 2, 0); // bright end at y=0 (fixture), fading downwards
  if (dir > 0) g.rotateZ(Math.PI);
  const q = new THREE.Quaternion().setFromUnitVectors(Zp, n);
  const m = new THREE.Matrix4().compose(p.clone().addScaledVector(n, 0.006), q, new THREE.Vector3(1, 1, 1));
  return placed(g, m, false);
}

function floorPool(p, r) {
  const g = new THREE.PlaneGeometry(r * 2, r * 2);
  g.rotateX(-Math.PI / 2);
  g.translate(p.x, p.y + 0.004, p.z);
  return g;
}

export function buildLighting(mats, quality) {
  RectAreaLightUniformsLib.init();
  const group = new THREE.Group();
  group.name = 'Lighting';
  const fix = new Buckets(); // fixture bodies + emissive parts
  const deco = new Buckets(); // additive decals
  const lights = []; // real lights, with base intensity for time-of-day scaling
  const decalMats = { splash: splashMaterial(0.9), splashSoft: splashMaterial(0.5), pool: poolMaterial(0.8) };

  const addLight = (light, base, target) => {
    light.userData.base = base;
    light.intensity = base;
    group.add(light);
    if (target) {
      light.target.position.copy(target);
      group.add(light.target);
    }
    lights.push(light);
    return light;
  };

  // --- up-down wall sconces (black cylinder 3" x 10")
  for (const s of sconces) {
    const nArr = NORMALS[s.n];
    const n = new THREE.Vector3(...nArr);
    const off = 2.0 * IN + 1.5 * IN;
    const c = { x: s.x + nArr[0] * off, z: s.z + nArr[2] * off };
    const body = new THREE.CylinderGeometry(ft(1.5 * IN), ft(1.5 * IN), ft(10 * IN), 16);
    body.translate(hv(c.x, s.y, c.z).x, hv(c.x, s.y, c.z).y, hv(c.x, s.y, c.z).z);
    fix.add('charcoalMetal', body);
    // glowing lenses at both ends
    for (const sy of [-1, 1]) {
      const lens = new THREE.CylinderGeometry(ft(1.2 * IN), ft(1.2 * IN), ft(0.3 * IN), 16);
      const p = hv(c.x, s.y + sy * 5.05 * IN, c.z);
      lens.translate(p.x, p.y, p.z);
      fix.add('lampWarm', lens);
    }
    const wallP = hv(s.x, s.y, s.z);
    const top = wallP.clone(); top.y += ft(5 * IN);
    const bot = wallP.clone(); bot.y -= ft(5 * IN);
    deco.add('splash', wallSplash(top, n, 0.75, 1.5, 1));
    deco.add('splash', wallSplash(bot, n, 0.75, 1.6, -1));
    if (s.spot && quality.realSconces) {
      const pos = hv(c.x, s.y - 0.3, c.z);
      const tgt = hv(c.x + nArr[0] * 0.5, 0, c.z + nArr[2] * 0.5);
      addLight(new THREE.SpotLight(WARM_LIGHT, 1, 7, 0.75, 0.9, 2), 6, tgt).position.copy(pos);
    }
  }

  // --- recessed downlights: car canopy, porch soffit, FF roof canopy soffit
  const soffitGroups = [
    { pts: GF.carPorch.soffitLights, y: GF.carPorch.canopy.bottom - 0.04, floor: LV.drive, base: 40 },
    { pts: GF.porch.soffitLights, y: LV.gfCeil - 0.05, floor: LV.gf, base: 30 },
    { pts: FF.roof.soffitLights, y: FF.roof.canopy.edge[0] - 0.04, floor: LV.ff + 0.05, base: 25 },
  ];
  for (const g of soffitGroups) {
    let cx = 0, cz = 0;
    for (const [x, z] of g.pts) {
      const disc = new THREE.CylinderGeometry(ft(1.5 * IN), ft(1.5 * IN), ft(0.3 * IN), 20);
      const p = hv(x, g.y - 0.01, z);
      disc.translate(p.x, p.y, p.z);
      fix.add('lampWarm', disc);
      deco.add('pool', floorPool(hv(x, g.floor, z), 1.1));
      cx += x; cz += z;
    }
    cx /= g.pts.length; cz /= g.pts.length;
    addLight(new THREE.SpotLight(WARM_LIGHT, 1, 9, 1.0, 0.7, 2), g.base, hv(cx, g.floor, cz)).position.copy(hv(cx, g.y - 0.2, cz));
  }

  // --- pergola LED strip area light (pointing down)
  const P = FF.pergola;
  const rect = new THREE.RectAreaLight(WARM_LIGHT, 1, ft(P.x[1] - P.x[0]), ft(P.z[1] - P.z[0]));
  rect.position.copy(hv((P.x[0] + P.x[1]) / 2, P.top - 1.2, (P.z[0] + P.z[1]) / 2));
  rect.lookAt(hv((P.x[0] + P.x[1]) / 2, 0, (P.z[0] + P.z[1]) / 2));
  addLight(rect, 2.2);

  // --- front boundary pillar lights (+ two small point lights on the gate pillars)
  const fz = site.boundary.frontZ;
  for (const el of site.boundary.front) {
    if (el.type !== 'pillar') continue;
    const cx = (el.X[0] + el.X[1]) / 2;
    const y = el.h - 1.1;
    fix.add('lampSoft', boxP([cx - 0.25, cx + 0.25], [y - 0.2, y + 0.2], [fz[1], fz[1] + 0.06]));
    fix.add('lampSoft', boxP([cx - 0.25, cx + 0.25], [y - 0.2, y + 0.2], [fz[0] - 0.06, fz[0]]));
    deco.add('splashSoft', wallSplash(pv(cx, y - 0.2, fz[1]), new THREE.Vector3(0, 0, 1), 0.45, 1.0, -1));
    deco.add('splashSoft', wallSplash(pv(cx, y - 0.2, fz[0]), new THREE.Vector3(0, 0, -1), 0.45, 1.0, -1));
    if (el.light) addLight(new THREE.PointLight(WARM_LIGHT, 1, ft(10), 2), 2.5).position.copy(pv(cx, y, fz[1] + 1.2));
  }

  // --- boundary wall lights: inside faces every 8'
  const sp = site.wallLights.spacing;
  const wallLight = (X, Z, n, y) => {
    const half = 0.18;
    const a = pv(X, y, Z);
    const g = new THREE.BoxGeometry(ft(0.35), ft(0.35), ft(0.08));
    const q = new THREE.Quaternion().setFromUnitVectors(Zp, n);
    fix.add('lampSoft', placed(g, new THREE.Matrix4().compose(a.clone().addScaledVector(n, ft(0.04)), q, new THREE.Vector3(1, 1, 1)), false));
    deco.add('splashSoft', wallSplash(a.clone().setY(ft(y - half)), n, 0.5, 0.9, -1));
  };
  for (let Z = 8; Z < 58; Z += sp) {
    wallLight(0.75, Z, new THREE.Vector3(1, 0, 0), 3.6);
    wallLight(71.25, Z, new THREE.Vector3(-1, 0, 0), 3.6);
  }
  for (let X = 5; X < 22; X += sp) wallLight(X, 61.75, new THREE.Vector3(0, 0, -1), 2.6);

  // --- garden bollards (2.5', louvred top) along the path
  const B = site.bollards;
  for (const X of B.X) {
    for (const Z of B.Z) {
      const post = new THREE.CylinderGeometry(ft(2.5 * IN), ft(2.8 * IN), ft(B.h - 0.5), 14);
      const p = pv(X, (B.h - 0.5) / 2, Z);
      post.translate(p.x, p.y, p.z);
      fix.add('charcoalMetal', post);
      const head = new THREE.CylinderGeometry(ft(2.4 * IN), ft(2.4 * IN), ft(0.35), 14);
      const h = pv(X, B.h - 0.3, Z);
      head.translate(h.x, h.y, h.z);
      fix.add('lampWarm', head);
      const capG = new THREE.CylinderGeometry(ft(3 * IN), ft(3 * IN), ft(0.12), 14);
      const cp = pv(X, B.h - 0.06, Z);
      capG.translate(cp.x, cp.y, cp.z);
      fix.add('charcoalMetal', capG);
      deco.add('pool', floorPool(pv(X, 0.1, Z), 0.9));
    }
  }

  // --- spike uplights under palms and the big tree
  for (const p of site.palms) {
    const g = new THREE.CylinderGeometry(ft(1.2 * IN), ft(1.5 * IN), ft(0.3), 10);
    const at = pv(p.X + 0.9, p.pot ? 0.15 : 0.15, p.Z + 0.9);
    g.translate(at.x, at.y, at.z);
    fix.add('lampWarm', g);
  }
  const tree = site.trees.find((t) => t.big);
  if (tree) {
    const at = pv(tree.X + 2.5, 0.4, tree.Z + 1.5);
    const g = new THREE.CylinderGeometry(ft(1.5 * IN), ft(2 * IN), ft(0.4), 10);
    g.translate(at.x, at.y, at.z);
    fix.add('lampWarm', g);
    const spot = new THREE.SpotLight(WARM_LIGHT, 1, 14, 0.6, 0.6, 2);
    spot.castShadow = quality.extraShadows;
    spot.shadow.mapSize.set(1024, 1024);
    addLight(spot, 60, pv(tree.X, tree.h * 0.6, tree.Z)).position.copy(at);
  }

  // --- interior room lights (point lights + emissive ceiling panels)
  for (const r of roomLights) {
    const pl = new THREE.PointLight('#FFC08A', 1, ft(r.distance * 3.3), 2);
    pl.position.copy(hv(r.x, r.y, r.z));
    if (r.castShadow && quality.extraShadows) {
      pl.castShadow = true;
      pl.shadow.mapSize.set(512, 512);
      pl.shadow.bias = -0.002;
    }
    addLight(pl, r.intensity * 3);
    const ceil = r.y > LV.ff ? LV.ffCeil : LV.gfCeil;
    fix.add('interiorPanel', boxH([r.x - 0.9, r.x + 0.9], [ceil - 0.06, ceil - 0.005], [r.z - 0.9, r.z + 0.9]));
  }

  const fixtures = fix.build(mats, 'Fixtures', { cast: false });
  const decals = deco.build(decalMats, 'Decals', { cast: false, receive: false });
  decals.traverse((o) => { if (o.isMesh) o.renderOrder = 2; });
  group.add(fixtures, decals);

  return {
    group,
    lights,
    decalMats: Object.values(decalMats),
    setLevel(k) {
      for (const l of lights) l.intensity = l.userData.base * k;
      for (const m of this.decalMats) m.color.setScalar(m.userData.baseStrength * Math.min(k, 1.2));
      for (const m of mats.emissiveList) m.emissiveIntensity = m.userData.baseEmissive * Math.min(k, 1.2);
      decals.visible = k > 0.01;
    },
  };
}
