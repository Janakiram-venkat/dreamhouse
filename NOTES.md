# Notes — deviations from CLAUDE.md and open items

Each item below is also marked in code with `// SPEC-DEVIATION:` where it applies.

## Deviations

1. **Glass is thin transparent glass, not `transmission: 1`** (`config/materials.js`). three.js renders a
   transmission pre-pass that re-draws every opaque mesh; with it the dusk scene was ~650 draw calls and
   5.1 M triangles per frame. Transparent physical glass (opacity ≈ 0.2, env reflections) brought it to
   ~220 calls / 1.05 M triangles (Medium) with no visible loss through 6 mm panes.
2. **Bedroom 3 louvre strip starts at x 24.25** instead of 23.75 so it doesn't collide with the 8″ white
   frame box around the 8′ slider (frame box outer edge is at x 24.04).
3. **No glTF models.** Plants (6 shrub/flower species, areca palms, broadleaf trees, hedge), grass blades,
   furniture and the SUV are procedural (canvas-drawn alpha leaf cards, bevelled boxes) so the project needs
   no third-party model downloads. All foliage is `InstancedMesh`.
4. **Textures are Poly Haven JPGs (1k–2k), not KTX2.** Stone and plaster are re-graded in the shader
   (`grade` in `config/materials.js`) to hit the board's beige/cream colours.
5. **`buildPergola` lives in `builders/facade.js`** rather than a separate `pergola.js`.
6. **Soft shadows:** `PCFSoftShadowMap` was removed in three r18x; `PCFShadowMap` with `shadow.radius` is used.
   `THREE.Clock` is replaced by `THREE.Timer` (deprecated in r18x).
7. **Shadow budget:** sun + big-tree uplight only (High). The living-room point light doesn't cast
   shadows; a cube shadow costs 6 extra passes over the whole scene.
8. **Cutaway** uses a horizontal section plane (5′ above GF FFL / FF FFL) with charcoal poché on cut walls,
   rather than hiding groups, so the stair tower and full-height walls section correctly.
9. **Dusk HDRI** is Qwantani Dusk 2: sun just below the horizon, violet zenith, pink horizon glow. The HDRI is
   auto-rotated so its brightest point lines up with the WNW sun direction; tweak with *Sky rotation°*.

## Performance (measured)

Headless Chrome on the laptop's **Intel Arc iGPU**, 1600×900, dusk, `front` view:

| Quality | fps | draw calls | triangles |
|---|---|---|---|
| High | ~23 | 248 | 1.65 M |
| Medium | ~52–58 | 217–223 | 1.05 M |

The default tier is auto-picked: High on NVIDIA/AMD discrete GPUs, Medium otherwise (`?q=` overrides).
Not yet measured on the RTX 4060.

## Known gaps vs. the board

- The board's sky has saturated orange clouds; the CC0 dusk sky is softer pink/violet.
- Neighbouring houses are simple massing boxes with lit windows.
- Plants are stylised cards; a glTF plant pack would push close-up realism further.
