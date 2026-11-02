import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import { ft, PLOT } from './config/units.js';
import { LV } from './config/levels.js';
import * as GF from './config/groundFloor.js';
import * as FF from './config/firstFloor.js';
import { Buckets } from './utils/merge.js';
import { createMaterials } from './render/materials.js';
import { createEnvironment } from './render/environment.js';
import { createPostFX } from './render/postfx.js';
import { buildWalls } from './builders/walls.js';
import { buildOpenings } from './builders/openings.js';
import { buildGroundSlabs, buildTerraceSlabs, buildFirstSlabs, buildRoofSlabs } from './builders/slabs.js';
import { buildStairs } from './builders/stairs.js';
import { buildFacade, buildPergola } from './builders/facade.js';
import { buildSite, buildNeighbours } from './builders/site.js';
import { buildLandscape } from './builders/landscape.js';
import { buildInteriors } from './builders/interiors.js';
import { buildCar } from './builders/car.js';
import { buildLighting } from './builders/lighting.js';
import { createControls } from './ui/controls.js';

const QUALITY = {
  high: { grass: 260000, plantDensity: 1.0, shadowMap: 4096, ao: true, aoHalfRes: false, aoQuality: 'Medium', realSconces: true, extraShadows: true, pixelRatio: 2, bloomThreshold: 2.6 },
  medium: { grass: 150000, plantDensity: 0.85, shadowMap: 2048, ao: true, aoHalfRes: true, aoQuality: 'Low', realSconces: true, extraShadows: false, pixelRatio: 1.5, bloomThreshold: 2.6 },
  low: { grass: 50000, plantDensity: 0.6, shadowMap: 1024, ao: false, aoHalfRes: true, aoQuality: 'Performance', realSconces: false, extraShadows: false, pixelRatio: 1, bloomThreshold: 2.6 },
};
const url = new URL(location.href);
// default tier: High on a discrete / high-end GPU, Medium otherwise; ?q=high|medium|low overrides
function autoQuality() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    return /nvidia|geforce|rtx|radeon rx|radeon pro|apple m\d (pro|max|ultra)/i.test(name) ? 'high' : 'medium';
  } catch {
    return 'medium';
  }
}
const qName = QUALITY[url.searchParams.get('q')] ? url.searchParams.get('q') : autoQuality();
const quality = QUALITY[qName];

// ---------------------------------------------------------------- renderer (CLAUDE.md §11)
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: url.searchParams.has('capture') });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.pixelRatio));
renderer.setSize(innerWidth, innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const persp = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 600);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
ortho.position.set(0, 60, 0);
ortho.up.set(0, 0, -1);
ortho.lookAt(0, 0, 0);
let camera = persp;

const orbit = new OrbitControls(persp, renderer.domElement);
orbit.enableDamping = true;
orbit.minDistance = 3;
orbit.maxDistance = 120;
orbit.maxPolarAngle = Math.PI * 0.495;
const orbitPlan = new OrbitControls(ortho, renderer.domElement);
orbitPlan.enableRotate = false;
orbitPlan.screenSpacePanning = true;
orbitPlan.enabled = false;

// clamp the orbit target to the plot
const half = { x: ft(PLOT.w / 2) + 4, z: ft(PLOT.d / 2) + 6 };
orbit.addEventListener('change', () => {
  orbit.target.x = THREE.MathUtils.clamp(orbit.target.x, -half.x, half.x);
  orbit.target.z = THREE.MathUtils.clamp(orbit.target.z, -half.z, half.z);
  orbit.target.y = THREE.MathUtils.clamp(orbit.target.y, 0, ft(LV.roofParapet));
});

function fitOrtho() {
  const a = innerWidth / innerHeight;
  const h = ft(PLOT.d) * 0.62;
  ortho.left = -h * a;
  ortho.right = h * a;
  ortho.top = h;
  ortho.bottom = -h;
  ortho.updateProjectionMatrix();
}
fitOrtho();

// ---------------------------------------------------------------- loading
const loadEl = document.getElementById('loading');
const barEl = document.getElementById('bar');
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => (barEl.style.width = `${(100 * done) / total}%`);

const mats = createMaterials(renderer, manager);
const env = await createEnvironment(renderer, scene, manager);
env.sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);

// ---------------------------------------------------------------- build the model
const groups = {};
function group(name, build, opts) {
  const b = new Buckets();
  build(b);
  const g = b.build(mats, name, opts);
  scene.add(g);
  groups[name] = g;
  return g;
}

// openings are cut into whichever wall list owns the wall (D-terr sits in the full-height GF tower wall)
const gfIds = new Set(GF.walls.map((w) => w.id));
const ffOnGF = FF.openings.filter((o) => gfIds.has(o.wall));
group('GroundFloor', (b) => {
  const open = buildWalls(GF.walls, [...GF.openings, ...ffOnGF], b);
  buildOpenings(open, b);
  buildGroundSlabs(b);
  buildStairs(b);
});
group('FirstFloor', (b) => {
  const open = buildWalls(FF.walls, FF.openings.filter((o) => !gfIds.has(o.wall)), b);
  buildOpenings(open, b);
  buildFirstSlabs(b);
});
group('Terrace', (b) => buildTerraceSlabs(b));
group('Roof', (b) => buildRoofSlabs(b));
group('Facade', (b) => {
  buildFacade(b);
  buildPergola(b, FF.pergola);
});
group('Site', (b) => buildSite(b));
group('Neighbours', (b) => buildNeighbours(b), { cast: false });
groups.interiors = group('Interiors', (b) => buildInteriors(b), { cast: false });

const car = buildCar(mats, GF.carPorch.car);
scene.add(car);

const landscape = buildLandscape(mats, quality);
scene.add(landscape.group);
groups.landscape = landscape.group;

const fixtures = buildLighting(mats, quality);
scene.add(fixtures.group);

// ---------------------------------------------------------------- post + UI
const post = createPostFX(renderer, scene, camera, quality);
const stats = new Stats();
stats.dom.style.display = 'none';
document.body.appendChild(stats.dom);

const params = {
  time: url.searchParams.get('t') ?? 'dusk',
  interiors: true,
  plants: true,
  cutaway: 'none',
  postfx: true,
  ao: quality.ao,
  bloom: 0.45,
  exposure: 0.9,
  hdriRotation: 0,
  quality: qName,
  stats: false,
};

const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const app = {
  renderer, scene, persp, ortho, orbit, orbitPlan, groups, post, stats, params,
  setActiveCamera(c) {
    camera = c;
    post.setCamera(c);
    scene.fog = c.isOrthographicCamera ? null : fog; // fog would wash out the top-down plan
  },
  setCutaway(mode) {
    const side = mode === 'none' ? THREE.FrontSide : THREE.DoubleSide;
    for (const m of mats.pocheList) {
      if (m.side !== side) {
        m.side = side;
        // pull cut walls in front of the floor finish they stand on, so the poché reads in plan
        m.polygonOffset = mode !== 'none';
        m.polygonOffsetFactor = -1;
        m.polygonOffsetUnits = -8;
        m.needsUpdate = true;
      }
    }
    // a horizontal section plane: 'gf' cuts 5' above GF FFL, 'roof' cuts 5' above FF FFL
    if (mode === 'none') renderer.clippingPlanes = [];
    else {
      clipPlane.constant = ft(mode === 'gf' ? LV.gf + 5 : LV.ff + 5);
      renderer.clippingPlanes = [clipPlane];
    }
  },
  async setTime(t) {
    env.state.rotationOffset = THREE.MathUtils.degToRad(params.hdriRotation);
    await env.apply(t, fixtures);
    params.exposure = renderer.toneMappingExposure;
  },
};
await app.setTime(params.time);
const fog = scene.fog;
// debug switches: ?post=0 ?ao=0 ?bloom=0
if (url.searchParams.get('post') === '0') post.enabled = params.postfx = false;
if (url.searchParams.get('ao') === '0') post.setAO((params.ao = false));
if (url.searchParams.get('bloom') === '0') post.bloom.strength = params.bloom = 0;
const ui = createControls(app);
ui.goto(url.searchParams.get('view') ?? 'front', true);

// ---------------------------------------------------------------- loop
addEventListener('resize', () => {
  persp.aspect = innerWidth / innerHeight;
  persp.updateProjectionMatrix();
  fitOrtho();
  renderer.setSize(innerWidth, innerHeight);
  post.setSize(innerWidth, innerHeight);
});

renderer.info.autoReset = false; // count draw calls across all passes of a frame
const timer = new THREE.Timer();
timer.connect(document);
renderer.setAnimationLoop(() => {
  renderer.info.reset();
  timer.update();
  const t = timer.getElapsed();
  ui.update(performance.now());
  (camera === persp ? orbit : orbitPlan).update();
  landscape.update(t);
  post.render(camera);
  stats.update();
});

loadEl.classList.add('done');
window.__app = app; // handy for debugging in the console
window.__info = () => ({ ...renderer.info.render, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures });
