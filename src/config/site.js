// Site, boundary and landscape — CLAUDE.md §9. PLOT coordinates (feet, origin NW corner).
export const site = {
  boundary: {
    t: 0.75,
    sideH: 5.0,
    // side & rear walls
    walls: [
      { id: 'BoundaryWest', X: [0, 0.75], Z: [0, 61.75], h: 5 },
      { id: 'BoundaryEast', X: [71.25, 72], Z: [0, 61.75], h: 5 },
      { id: 'BoundaryRear', X: [0.75, 71.25], Z: [0, 0.75], h: 5 },
    ],
    // front boundary at Z 61.75..62.5, west -> east (§9.1)
    front: [
      { type: 'pillar', X: [0, 1.5], h: 5.0 },
      { type: 'wall', X: [1.5, 11.0], h: 3.5 },
      { type: 'pillar', X: [11.0, 12.5], h: 5.0 },
      { type: 'wall', X: [12.5, 22.5], h: 3.5 },
      { type: 'pillar', X: [22.5, 24.0], h: 5.0 },
      { type: 'screen', X: [24.0, 38.75], h: 5.0 },
      { type: 'pedGate', X: [38.75, 42.75], h: 5.0 },
      { type: 'pillar', X: [42.75, 44.25], h: 5.5, light: true },
      { type: 'screen', X: [44.25, 49.75], h: 5.0 },
      { type: 'pillar', X: [49.75, 51.25], h: 5.5 },
      { type: 'carGate', X: [51.25, 63.25], h: 5.0 },
      { type: 'pillar', X: [63.25, 64.75], h: 5.5, light: true },
      { type: 'wall', X: [64.75, 70.5], h: 3.5 },
      { type: 'pillar', X: [70.5, 72], h: 5.0 },
    ],
    frontZ: [61.75, 62.5],
    pillarCap: 2 / 12,
    slat: { depth: 4 / 12, gap: 1 / 12, plinth: 1.0 },
  },
  driveway: [
    { X: [51.25, 63.25], Z: [47.5, 62.5] },
    { X: [51.5, 65.25], Z: [30.875, 47.5] }, // under the car canopy
  ],
  edging: 4 / 12,
  path: { cx: 40.75, w: 3.0, d: 1.5, gap: 0.5, Z: [42.4, 61.6], lift: 1 / 12 },
  rearStrip: { X: [0.75, 71.25], Z: [0.75, 5.0] },
  // planting beds (soil + mulch) — PLOT coords
  beds: [
    { id: 'frontW', X: [0.75, 38.5], Z: [59.0, 61.75], mix: 'flowers' },
    { id: 'frontE', X: [43.0, 51.0], Z: [59.0, 61.75], mix: 'flowers' },
    { id: 'west', X: [0.75, 3.25], Z: [5.0, 59.0], mix: 'flowers' },
    { id: 'east', X: [65.5, 71.25], Z: [5.0, 61.75], mix: 'hedge' },
    { id: 'houseW', X: [15.75, 18.0], Z: [5.0, 34.25], mix: 'shrubs' },
    { id: 'living', X: [18.0, 31.5], Z: [34.25, 36.5], mix: 'flowers' },
    { id: 'pathW', X: [37.0, 38.75], Z: [43.0, 58.5], mix: 'flowers' },
    { id: 'pathE', X: [42.75, 44.5], Z: [43.0, 58.5], mix: 'flowers' },
    { id: 'porchW', X: [32.0, 36.6], Z: [40.25, 42.75], mix: 'flowers' },
    { id: 'driveW', X: [48.75, 51.0], Z: [44.0, 59.0], mix: 'flowers' },
  ],
  lawn: { X: [0.75, 51.0], Z: [5.0, 61.75] }, // grass everywhere here that is not house/bed/path
  palms: [
    { X: 35.9, Z: 41.6, pot: true }, // flanking porch steps
    { X: 44.1, Z: 41.6, pot: true },
    { X: 19.5, Z: 35.4 }, // bed by the living glass
    { X: 30.3, Z: 35.4 },
  ],
  trees: [
    { X: 6, Z: 55, h: 22, big: true },
    { X: 7, Z: 18, h: 16 },
    { X: 8, Z: 36, h: 14 },
  ],
  bollards: { X: [38.2, 43.3], Z: [44.5, 50.5, 56.5], h: 2.5 },
  wallLights: { spacing: 8 },
  street: { footpath: [62.5, 69.0], road: [69.0, 100.0] },
};
