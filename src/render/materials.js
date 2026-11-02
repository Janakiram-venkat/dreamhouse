import * as THREE from 'three';
import { materialDefs, textureSets, EMISSIVE_WARM } from '../config/materials.js';

const BASE = import.meta.env.BASE_URL;

export function createMaterials(renderer, manager) {
  const loader = new THREE.TextureLoader(manager);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = {};
  for (const [set, maps] of Object.entries(textureSets)) {
    tex[set] = {};
    for (const m of maps) {
      const t = loader.load(`${BASE}textures/${set}/${m}.jpg`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = aniso;
      t.colorSpace = m === 'diff' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex[set][m] = t;
    }
  }

  const mats = {};
  const poche = [];
  for (const [key, d] of Object.entries(materialDefs)) {
    const params = {
      color: new THREE.Color(d.color),
      roughness: d.roughness ?? 0.8,
      metalness: d.metalness ?? 0,
    };
    if (d.tex) {
      const set = tex[d.tex];
      const rep = 1 / d.tile;
      const use = (t) => {
        const c = t.clone();
        c.repeat.set(rep, rep);
        c.needsUpdate = true;
        return c;
      };
      if (set.diff) params.map = use(set.diff);
      if (set.nor) {
        params.normalMap = use(set.nor);
        params.normalScale = new THREE.Vector2(d.normalScale ?? 1, d.normalScale ?? 1);
      }
      if (set.rough) params.roughnessMap = use(set.rough);
      if (set.ao) {
        params.aoMap = use(set.ao);
        params.aoMapIntensity = d.aoIntensity ?? 1;
      }
    }
    let mat;
    if (d.physical) {
      mat = new THREE.MeshPhysicalMaterial({
        ...params,
        transmission: d.transmission ?? 0,
        ior: d.ior ?? 1.5,
        thickness: d.thickness ?? 0,
        clearcoat: d.clearcoat ?? 0,
        clearcoatRoughness: d.clearcoatRoughness ?? 0,
      });
      if (d.opacity != null) {
        mat.transparent = true;
        mat.opacity = d.opacity;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
      }
    } else if (d.sheen) {
      mat = new THREE.MeshPhysicalMaterial({ ...params, sheen: d.sheen, sheenColor: new THREE.Color(d.color) });
    } else {
      mat = new THREE.MeshStandardMaterial(params);
    }
    patchMaterial(mat, { grade: d.grade, poche: d.poche, envScale: d.envScale });
    if (d.poche) poche.push(mat);
    mat.name = key;
    mat.userData.baseEnv = d.envMapIntensity ?? 1;
    mats[key] = mat;
  }

  // Emissive fixture materials (§6 rules). Kept in a list so time-of-day can dim them.
  const emissive = [];
  const glow = (key, color, intensity, base = '#222') => {
    const m = new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.4 });
    m.name = key;
    m.userData.baseEmissive = intensity;
    emissive.push(m);
    mats[key] = m;
  };
  glow('lampWarm', EMISSIVE_WARM, 8, '#fff3e0');
  glow('lampSoft', EMISSIVE_WARM, 2.2, '#fff3e0');
  glow('ledStrip', EMISSIVE_WARM, 8, '#fff3e0');
  glow('tailLight', '#FF2A1A', 3, '#400');
  glow('interiorPanel', '#FFD3A0', 1.6, '#fff');
  glow('neighbourWindow', '#FFC07A', 1.4, '#332');
  mats.emissiveList = emissive;
  mats.pocheList = poche;
  return mats;
}

// Shader patches:
//  grade — re-grade a photo texture (saturation / contrast / gain) so a CC0 set matches the board's
//          colour (e.g. brown stacked stone -> beige ledgestone, mottled plaster -> even cream).
//  poche — back faces render as a flat charcoal fill, so walls cut by the section plane read solid.
function patchMaterial(mat, { grade, poche, envScale }) {
  if (!grade && !poche && envScale == null) return;
  const g = { sat: 1, gain: 1, contrast: 1, ...grade };
  mat.onBeforeCompile = (sh) => {
    if (grade) {
      // contrast pivots around the material tint, so flattening a mottled texture keeps its colour
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         { vec3 pivot = diffuse * 0.6;
           vec3 c = pivot + (diffuseColor.rgb - pivot) * ${g.contrast.toFixed(3)};
           float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
           diffuseColor.rgb = max(mix(vec3(l), c, ${g.sat.toFixed(3)}), 0.0) * ${g.gain.toFixed(3)}; }`
      );
    }
    if (envScale != null) {
      // IBL has no occlusion: damp sky reflections on things that sit under a roof (the car)
      const k = envScale.toFixed(3);
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <lights_fragment_maps>',
        `#include <lights_fragment_maps>
         radiance *= ${k}; iblIrradiance *= ${k};
         #ifdef USE_CLEARCOAT
           clearcoatRadiance *= ${k};
         #endif`
      );
    }
    if (poche) {
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n if (!gl_FrontFacing) gl_FragColor = vec4(0.13, 0.12, 0.11, 1.0);'
      );
    }
  };
  mat.customProgramCacheKey = () => `patch_${g.sat}_${g.gain}_${g.contrast}_${!!grade}_${!!poche}_${envScale}`;
}

// Additive light-splash decal material shared by all wall washes.
let splashTex = null;
function makeSplashTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 128; x++) {
      const v = y / 255; // 0 at fixture -> 1 far end
      const u = (x - 63.5) / 63.5;
      const spread = 0.18 + 0.82 * Math.pow(v, 0.6); // beam widens with distance
      const across = Math.max(0, 1 - Math.pow(Math.abs(u) / spread, 2));
      const along = Math.pow(1 - v, 1.6) * Math.min(1, v * 14);
      const a = across * along;
      const i = (y * 128 + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 196;
      img.data[i + 2] = 140;
      img.data[i + 3] = Math.round(255 * a);
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function splashMaterial(strength = 1) {
  splashTex ??= makeSplashTexture();
  const m = new THREE.MeshBasicMaterial({
    map: splashTex,
    color: new THREE.Color(1, 1, 1).multiplyScalar(strength),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: true,
    fog: false,
  });
  m.userData.baseStrength = strength;
  return m;
}

let poolTex = null;
export function poolMaterial(strength = 1) {
  if (!poolTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,200,150,1)');
    grd.addColorStop(0.4, 'rgba(255,190,130,0.45)');
    grd.addColorStop(1, 'rgba(255,180,120,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    poolTex = new THREE.CanvasTexture(c);
    poolTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.MeshBasicMaterial({
    map: poolTex,
    color: new THREE.Color(1, 1, 1).multiplyScalar(strength),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    fog: false,
  });
  m.userData.baseStrength = strength;
  return m;
}
