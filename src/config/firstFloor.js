// First floor — CLAUDE.md §4. House-local feet; heights absolute.
import { LV } from './levels.js';

const Y = [LV.ff, LV.ffCeil];

export const rooms = [
  { id: 'Bedroom3', x: [12.375, 26.375], z: [9.125, 25.125], light: true },
  { id: 'T4', x: [26.75, 32.75], z: [17.125, 25.125], wet: true },
  { id: 'FFLobby', x: [26.0, 32.75], z: [25.5, 37.75] },
];

export const walls = [
  { id: 'BR3West', x: [11.625, 12.375], z: [8.375, 25.875], y: Y, out: '-x', ext: true },
  { id: 'BR3North', x: [12.375, 27.125], z: [8.375, 9.125], y: Y, out: '-z', ext: true },
  { id: 'BR3EastN', x: [26.375, 27.125], z: [9.125, 16.375], y: Y, out: '+x', ext: true },
  { id: 'T4North', x: [26.375, 33.5], z: [16.375, 17.125], y: Y, out: '-z', ext: true },
  { id: 'T4East', x: [32.75, 33.5], z: [17.125, 25.125], y: Y, out: '+x', ext: true },
  { id: 'BR3South', x: [12.375, 25.25], z: [25.125, 25.875], y: Y, out: '+z', ext: true },
  // tower west wall above the GF part (the GF tower wall starts at z 25.5)
  { id: 'TowerWestFF', x: [25.25, 26.0], z: [25.125, 25.5], y: Y, out: '-x', ext: true },
  // internal
  { id: 'BR3T4', x: [26.375, 26.75], z: [17.125, 25.125], y: Y },
  { id: 'T4South', x: [26.0, 32.75], z: [25.125, 25.5], y: Y },
];

// sill/h relative to FF FFL. Openings may target GF tower walls (spanning both storeys) via base.
export const openings = [
  { id: 'G-br3-s', wall: 'BR3South', at: [15.375, 23.375], h: 8, sill: 0, type: 'slider', panels: 3 },
  { id: 'G-br3-w', wall: 'BR3West', at: [13.0, 19.0], h: 7.5, sill: 0, type: 'slider', panels: 2 },
  { id: 'W-br3-n', wall: 'BR3North', at: [17.375, 21.375], h: 4, sill: 3, type: 'window', panels: 2 },
  { id: 'W-br3-e', wall: 'BR3EastN', at: [10.5, 12.0], h: 5.5, sill: 2, type: 'window', panels: 1 },
  { id: 'D-t4', wall: 'BR3T4', at: [21.0, 23.5], h: 7, sill: 0, type: 'doorWpc' },
  { id: 'V-t4', wall: 'T4East', at: [19.0, 21.0], h: 1.5, sill: 6, type: 'vent' },
  { id: 'D-terr', wall: 'TowerWest', at: [26.0, 29.0], h: 7, sill: 0, type: 'doorGlazed', base: LV.ff },
];

// §4.5 terrace edges
export const terrace = {
  floor: [
    { x: [0, 25.25], z: [25.875, 35.25] }, // open terrace
    { x: [0, 11.625], z: [9.125, 25.875] }, // pergola deck
    { x: [0, 11.625], z: [0, 9.125] }, // north-west roof strip
    { x: [11.625, 46.25], z: [0, 8.375] }, // north strip behind bedroom 3
    { x: [27.125, 46.25], z: [8.375, 16.375] },
    { x: [33.5, 46.25], z: [16.375, 25.875] }, // service roof over bedroom 2
  ],
  balustrade: [
    { from: [0, 35.25], to: [25.25, 35.25] }, // south
    { from: [0, 9.125], to: [0, 35.25] }, // west
  ],
  parapets: [
    { x: [0, 46.25], z: [0, 0.5] }, // north
    { x: [0, 0.5], z: [0.5, 9.125] }, // west (north part)
    { x: [45.75, 46.25], z: [0.5, 25.875] }, // east
  ],
  parapetH: 3.0,
  parapetT: 0.5,
  planters: [
    // along the inside of the railing and the parapets (x, z ranges; 1.5' wide x 1.5' high)
    { x: [11.0, 24.5], z: [33.5, 35.0] },
    { x: [0.4, 1.9], z: [9.5, 13.5] },
    { x: [0.6, 11.0], z: [0.6, 2.1] },
    { x: [12.5, 25.0], z: [0.6, 2.1] },
    { x: [34.0, 45.6], z: [24.2, 25.7] },
    { x: [44.1, 45.6], z: [9.0, 24.0] },
  ],
};

// §4.6
export const pergola = {
  x: [0.75, 10.75],
  z: [12.0, 34.75],
  top: LV.ff + 9.0,
  postsZ: [12.0, 23.4, 34.75],
  post: 4 / 12,
  beam: { w: 4 / 12, d: 8 / 12 },
  slat: { w: 2 / 12, d: 6 / 12, pitch: 6 / 12 },
};

// FF roof (§5.1): slab over bedroom 3 block + toilet + tower; canopy overhang south & west
export const roof = {
  slabs: [
    { x: [11.625, 27.125], z: [8.375, 25.875] },
    { x: [26.375, 33.5], z: [16.375, 25.875] },
  ],
  tower: { x: [25.25, 33.5], z: [25.125, 38.5] },
  canopy: { x: [10.125, 27.125], z: [8.375, 28.375], edge: [21.75, 22.5] },
  soffitLights: [[16.5, 27.2], [19.375, 27.2], [22.25, 27.2]],
  parapet: { h: 1.0, t: 0.5 },
};
