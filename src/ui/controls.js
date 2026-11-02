import * as THREE from 'three';
import GUI from 'lil-gui';
import { cameraPresets } from '../config/cameras.js';
import { ft, PLOT } from '../config/units.js';

const P = (a) => new THREE.Vector3(ft(a[0] - PLOT.w / 2), ft(a[1]), ft(a[2] - PLOT.d / 2));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Camera preset buttons with a 1.2 s ease-in-out tween, plus lil-gui toggles (CLAUDE.md §10).
export function createControls(app) {
  const { persp, ortho, orbit, orbitPlan } = app;
  let tween = null;
  let active = 'persp';

  const useCamera = (kind) => {
    active = kind;
    orbit.enabled = kind === 'persp';
    orbitPlan.enabled = kind === 'ortho';
    app.setActiveCamera(kind === 'persp' ? persp : ortho);
  };

  function goto(name, instant = false) {
    const p = cameraPresets[name];
    document.querySelectorAll('.presets button').forEach((b) => b.classList.toggle('on', b.dataset.p === name));
    if (p.ortho) {
      app.setCutaway(p.cutaway);
      useCamera('ortho');
      return;
    }
    app.setCutaway(app.params.cutaway);
    useCamera('persp');
    const to = { pos: P(p.pos), target: P(p.target), fov: p.fov };
    if (instant) {
      persp.position.copy(to.pos);
      orbit.target.copy(to.target);
      persp.fov = to.fov;
      persp.updateProjectionMatrix();
      return;
    }
    tween = { t0: performance.now(), from: { pos: persp.position.clone(), target: orbit.target.clone(), fov: persp.fov }, to };
  }

  function update(now) {
    if (!tween) return;
    const k = Math.min(1, (now - tween.t0) / 1200);
    const e = ease(k);
    persp.position.lerpVectors(tween.from.pos, tween.to.pos, e);
    orbit.target.lerpVectors(tween.from.target, tween.to.target, e);
    persp.fov = THREE.MathUtils.lerp(tween.from.fov, tween.to.fov, e);
    persp.updateProjectionMatrix();
    if (k >= 1) tween = null;
  }
  orbit.addEventListener('start', () => (tween = null));

  // preset bar
  const bar = document.querySelector('.presets');
  for (const [key, p] of Object.entries(cameraPresets)) {
    const b = document.createElement('button');
    b.textContent = p.label;
    b.dataset.p = key;
    b.onclick = () => goto(key);
    bar.appendChild(b);
  }

  // lil-gui
  const params = app.params;
  const gui = new GUI({ title: 'Scene' });
  gui.add(params, 'time', ['dusk', 'day', 'night']).name('Time of day').onChange((v) => app.setTime(v));
  gui.add(params, 'interiors').name('Interiors').onChange((v) => (app.groups.interiors.visible = v));
  gui.add(params, 'plants').name('Plants & trees').onChange((v) => (app.groups.landscape.visible = v));
  gui.add(params, 'cutaway', { Off: 'none', 'Hide FF roof': 'roof', 'Ground floor only': 'gf' }).name('Cutaway').onChange((v) => active === 'persp' && app.setCutaway(v));
  gui.add(params, 'postfx').name('Post-processing').onChange((v) => (app.post.enabled = v));
  gui.add(params, 'ao').name('Ambient occlusion').onChange((v) => app.post.setAO(v));
  gui.add(params, 'bloom', 0, 1.5, 0.01).name('Bloom').onChange((v) => (app.post.bloom.strength = v));
  gui.add(params, 'exposure', 0.3, 2, 0.01).name('Exposure').onChange((v) => (app.renderer.toneMappingExposure = v)).listen();
  gui.add(params, 'hdriRotation', -180, 180, 1).name('Sky rotation°').onChange(() => app.setTime(params.time));
  gui.add(params, 'quality', ['high', 'medium', 'low']).name('Quality (reloads)').onChange((v) => {
    const u = new URL(location.href);
    u.searchParams.set('q', v);
    location.href = u.toString();
  });
  gui.add(params, 'stats').name('Stats').onChange((v) => (app.stats.dom.style.display = v ? '' : 'none'));
  if (innerWidth < 700) gui.close();

  // keyboard: 1..7 presets
  const keys = Object.keys(cameraPresets);
  addEventListener('keydown', (e) => {
    const i = Number(e.key) - 1;
    if (i >= 0 && i < keys.length) goto(keys[i]);
  });

  return { goto, update, gui };
}
