import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Buckets, hv } from '../utils/merge.js';

// Black SUV parked nose-in (north), tail-lights facing the street (CLAUDE.md §3.6). Metres, local frame:
// +Z = rear of the car (south), +Y up.
export function buildCar(mats, cfg) {
  const b = new Buckets();
  const L = 4.75, W = 1.92;
  const add = (key, geo, x, y, z, rx = 0) => {
    if (rx) geo.rotateX(rx);
    geo.translate(x, y, z);
    b.add(key, geo);
  };
  // lower body + cabin
  add('carPaint', new RoundedBoxGeometry(W, 0.78, L, 4, 0.12), 0, 0.72, 0);
  add('carPaint', new RoundedBoxGeometry(W - 0.12, 0.2, L - 0.5, 3, 0.08), 0, 1.16, -0.05);
  // greenhouse: tinted glass block with pillars
  const cabin = new RoundedBoxGeometry(W - 0.22, 0.56, 2.7, 4, 0.12);
  add('carGlass', cabin, 0, 1.52, 0.2);
  add('carPaint', new RoundedBoxGeometry(W - 0.18, 0.08, 2.65, 3, 0.04), 0, 1.82, 0.2); // roof
  for (const s of [-1, 1]) add('carPaint', new THREE.BoxGeometry(0.06, 0.56, 0.14), s * (W / 2 - 0.12), 1.52, 1.5); // D-pillars
  for (const s of [-1, 1]) add('charcoalMetal', new THREE.BoxGeometry(0.05, 0.05, 2.2), s * 0.62, 1.88, 0.2); // roof rails
  // rear face details
  add('carGlass', new THREE.BoxGeometry(W - 0.5, 0.42, 0.04), 0, 1.5, 1.57);
  add('tailLight', new THREE.BoxGeometry(W - 0.1, 0.06, 0.04), 0, 1.06, L / 2 + 0.005);
  for (const s of [-1, 1]) add('tailLight', new THREE.BoxGeometry(0.34, 0.12, 0.05), s * (W / 2 - 0.22), 1.02, L / 2 + 0.005);
  add('plate', new THREE.BoxGeometry(0.52, 0.12, 0.02), 0, 0.78, L / 2 + 0.01);
  add('chrome', new THREE.BoxGeometry(0.22, 0.05, 0.02), 0, 0.95, L / 2 + 0.015);
  add('tyre', new THREE.BoxGeometry(W - 0.1, 0.18, 0.08), 0, 0.42, L / 2 - 0.02); // bumper skirt
  // front
  add('carGlass', new THREE.BoxGeometry(W - 0.25, 0.48, 0.04), 0, 1.45, -1.18, -0.45);
  add('chrome', new THREE.BoxGeometry(W - 0.5, 0.22, 0.03), 0, 0.88, -L / 2 - 0.005);
  add('lampSoft', new THREE.BoxGeometry(0.4, 0.08, 0.03), -0.66, 1.0, -L / 2 - 0.005);
  add('lampSoft', new THREE.BoxGeometry(0.4, 0.08, 0.03), 0.66, 1.0, -L / 2 - 0.005);
  // wheels
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tyre = new THREE.CylinderGeometry(0.38, 0.38, 0.27, 28);
      tyre.rotateZ(Math.PI / 2);
      tyre.translate(sx * (W / 2 - 0.1), 0.38, sz * 1.45);
      b.add('tyre', tyre);
      const rim = new THREE.CylinderGeometry(0.25, 0.25, 0.02, 20);
      rim.rotateZ(Math.PI / 2);
      rim.translate(sx * (W / 2 + 0.035), 0.38, sz * 1.45);
      b.add('rim', rim);
      // wheel arch trims
      const arch = new THREE.TorusGeometry(0.43, 0.04, 6, 18, Math.PI);
      arch.rotateY(Math.PI / 2);
      arch.translate(sx * (W / 2 + 0.005), 0.42, sz * 1.45);
      b.add('tyre', arch);
    }
  }
  const car = b.build(mats, 'Car_SUV');
  const p = hv(cfg.cx, 0.25, cfg.cz);
  car.position.copy(p);
  // nose north = local -Z faces world -Z (north); no rotation needed
  car.traverse((o) => {
    if (o.isMesh) {
      o.matrixAutoUpdate = true;
    }
  });
  return car;
}
