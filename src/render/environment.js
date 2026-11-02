import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const BASE = import.meta.env.BASE_URL;

// Direction (azimuth in three's equirect convention) of the brightest texel = the sun in the HDRI.
function findSunAzimuth(tex) {
  const { data, width, height } = tex.image;
  let best = -1, bi = 0;
  for (let j = 0; j < height / 2; j++) {
    for (let i = 0; i < width; i++) {
      const k = (j * width + i) * 4;
      const l = data[k] * 0.2126 + data[k + 1] * 0.7152 + data[k + 2] * 0.0722;
      if (l > best) { best = l; bi = i; }
    }
  }
  const u = (bi + 0.5) / width;
  return (u - 0.5) * Math.PI * 2; // phi = atan2(z, x)
}

// Time-of-day presets (CLAUDE.md §7.1, §7.3). Sun azimuths are directions TOWARDS the sun.
const PRESETS = {
  dusk: {
    hdr: 'dusk', sunAz: Math.atan2(-0.383, -0.924), sunEl: 5, sunColor: '#FF9E6B', sunI: 0.8,
    hemi: ['#7A86C2', '#3B2F26', 0.35], env: 0.8, bg: 0.42, fixtures: 1, fog: ['#B79AA3', 0.012], exposure: 0.9,
  },
  day: {
    hdr: 'day', sunAz: Math.atan2(0.55, -0.83), sunEl: 45, sunColor: '#FFF4E5', sunI: 3.0,
    hemi: ['#BFD4FF', '#5A4A3A', 0.4], env: 1.0, bg: 0.9, fixtures: 0, fog: ['#C9D6E4', 0.006], exposure: 0.85,
  },
  night: {
    hdr: 'dusk', sunAz: Math.atan2(0.3, 0.9), sunEl: 35, sunColor: '#9DB4FF', sunI: 0.15,
    hemi: ['#2A3350', '#0E0C0A', 0.12], env: 0.06, bg: 0.05, fixtures: 1.25, fog: ['#141826', 0.014], exposure: 1.1,
  },
};

export async function createEnvironment(renderer, scene, manager) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const loader = new HDRLoader(manager).setDataType(THREE.FloatType);
  const half = new HDRLoader(manager).setDataType(THREE.HalfFloatType);

  const [dusk2k, dusk4k] = await Promise.all([
    loader.loadAsync(`${BASE}hdri/dusk_2k.hdr`),
    half.loadAsync(`${BASE}hdri/dusk_4k.hdr`),
  ]);
  const hdr = {
    dusk: { env: pmrem.fromEquirectangular(dusk2k).texture, bg: dusk4k, az: findSunAzimuth(dusk2k) },
  };
  dusk4k.mapping = THREE.EquirectangularReflectionMapping;
  dusk2k.dispose();

  const loadDay = async () => {
    if (hdr.day) return hdr.day;
    const t = await loader.loadAsync(`${BASE}hdri/day_2k.hdr`);
    t.mapping = THREE.EquirectangularReflectionMapping;
    hdr.day = { env: pmrem.fromEquirectangular(t).texture, bg: t, az: findSunAzimuth(t) };
    return hdr.day;
  };

  // sun + sky fill
  const sun = new THREE.DirectionalLight('#FF9E6B', 0.8);
  sun.castShadow = true;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  const sc = sun.shadow.camera;
  sc.left = -19; sc.right = 19; sc.top = 19; sc.bottom = -19; sc.near = 1; sc.far = 120;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#7A86C2', '#3B2F26', 0.35);
  scene.add(hemi);
  const fog = new THREE.FogExp2('#B79AA3', 0.012);
  scene.fog = fog;

  const state = { rotationOffset: 0, preset: 'dusk' };

  async function apply(name, fixtures) {
    const p = PRESETS[name];
    state.preset = name;
    const h = p.hdr === 'day' ? await loadDay() : hdr.dusk;
    scene.environment = h.env;
    scene.background = h.bg;
    // rotate the HDRI so its sun sits where our DirectionalLight comes from
    const rot = h.az - p.sunAz + state.rotationOffset;
    scene.environmentRotation.set(0, rot, 0);
    scene.backgroundRotation.set(0, rot, 0);
    scene.environmentIntensity = p.env;
    scene.backgroundIntensity = p.bg;
    const el = THREE.MathUtils.degToRad(p.sunEl);
    const dir = new THREE.Vector3(Math.cos(p.sunAz) * Math.cos(el), Math.sin(el), Math.sin(p.sunAz) * Math.cos(el));
    sun.position.copy(dir.multiplyScalar(60));
    sun.target.position.set(0, 0, 0);
    sun.color.set(p.sunColor);
    sun.intensity = p.sunI;
    hemi.color.set(p.hemi[0]);
    hemi.groundColor.set(p.hemi[1]);
    hemi.intensity = p.hemi[2];
    fog.color.set(p.fog[0]);
    fog.density = p.fog[1];
    renderer.toneMappingExposure = p.exposure;
    fixtures?.setLevel(p.fixtures);
  }

  return { sun, hemi, apply, state, presets: Object.keys(PRESETS) };
}
