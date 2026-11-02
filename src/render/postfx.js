import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

// RenderPass -> N8AO -> UnrealBloom -> Output -> SMAA (CLAUDE.md §11)
export function createPostFX(renderer, scene, camera, quality) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 0 });
  const composer = new EffectComposer(renderer, rt);

  const render = new RenderPass(scene, camera);
  const ao = new N8AOPass(scene, camera, size.x, size.y);
  ao.configuration.aoRadius = 1.0;
  ao.configuration.distanceFalloff = 1.0;
  ao.configuration.intensity = 2.0;
  ao.configuration.halfRes = quality.aoHalfRes;
  ao.configuration.gammaCorrection = false;
  ao.configuration.screenSpaceRadius = false;
  ao.setQualityMode(quality.aoQuality);

  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.45, 0.6, quality.bloomThreshold);
  const output = new OutputPass();
  const smaa = new SMAAPass(size.x, size.y);

  composer.addPass(render);
  composer.addPass(ao);
  composer.addPass(bloom);
  composer.addPass(output);
  composer.addPass(smaa);

  const api = {
    composer,
    ao,
    bloom,
    enabled: true,
    setAO(on) {
      ao.enabled = on;
      render.enabled = !on;
    },
    setCamera(cam) {
      render.camera = cam;
      ao.camera = cam;
    },
    setSize(w, h) {
      composer.setSize(w, h);
    },
    render(cam) {
      if (api.enabled) composer.render();
      else renderer.render(scene, cam);
    },
  };
  api.setAO(quality.ao);
  return api;
}
