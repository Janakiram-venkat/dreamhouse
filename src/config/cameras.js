// Camera presets — CLAUDE.md §10. PLOT feet (X, Y, Z).
export const cameraPresets = {
  front: { pos: [34, 7, 108], target: [41, 11, 32], fov: 40, label: 'Front' },
  right: { pos: [112, 9, 74], target: [44, 12, 28], fov: 40, label: 'Right' },
  left: { pos: [-42, 9, 74], target: [30, 12, 28], fov: 40, label: 'Left' },
  back: { pos: [30, 7, -40], target: [38, 11, 14], fov: 40, label: 'Back' },
  terrace: { pos: [42.5, 17.5, 39.5], target: [22, 15, 29], fov: 50, label: 'Terrace' },
  planGF: { ortho: true, cutaway: 'gf', label: 'Plan GF' },
  planFF: { ortho: true, cutaway: 'roof', label: 'Plan FF' },
};
