// Ground floor — CLAUDE.md §3. House-local feet; heights absolute (y above lawn).
import { LV } from './levels.js';

const Y = [LV.gf, LV.gfCeil];
const YT = [LV.gf, LV.ffCeil]; // stair tower walls run both storeys

// out: which side of the wall faces the exterior ('+x' | '-x' | '+z' | '-z' | null for internal)
export const rooms = [
  { id: 'Bedroom1', x: [0.75, 14.75], z: [0.75, 12.75], light: true },
  { id: 'T1', x: [15.125, 21.125], z: [0.75, 8.75], wet: true },
  { id: 'T2', x: [21.5, 27.5], z: [0.75, 8.75], wet: true },
  { id: 'ToiletLobby', x: [15.125, 27.5], z: [9.125, 12.75] },
  { id: 'RearLobby', x: [27.875, 33.125], z: [0.75, 12.75] },
  { id: 'Kitchen', x: [33.5, 45.5], z: [0.75, 10.75], light: true },
  { id: 'Bedroom2', x: [33.5, 45.5], z: [11.125, 25.125], light: true },
  { id: 'Living', x: [7.125, 23.125], z: [13.125, 28.5], light: true },
  { id: 'Alcove', x: [0.75, 6.75], z: [13.125, 21.125] },
  { id: 'Dining', x: [23.125, 33.125], z: [13.125, 25.125], light: true },
  { id: 'T3', x: [0.75, 6.75], z: [21.5, 28.5], wet: true },
  { id: 'StairCore', x: [26.0, 32.75], z: [25.5, 37.75] },
];

export const walls = [
  // external 0.75'
  { id: 'North', x: [0, 46.25], z: [0, 0.75], y: Y, out: '-z', ext: true },
  { id: 'West', x: [0, 0.75], z: [0.75, 29.25], y: Y, out: '-x', ext: true },
  { id: 'SouthHall', x: [0.75, 25.25], z: [28.5, 29.25], y: Y, out: '+z', ext: true },
  { id: 'East', x: [45.5, 46.25], z: [0.75, 25.875], y: Y, out: '+x', ext: true },
  { id: 'Bedroom2South', x: [33.5, 45.5], z: [25.125, 25.875], y: Y, out: '+z', ext: true },
  // stair tower: full height, shared with the first floor
  { id: 'TowerWest', x: [25.25, 26.0], z: [25.5, 37.75], y: YT, out: '-x', ext: true },
  { id: 'TowerEast', x: [32.75, 33.5], z: [25.125, 37.75], y: YT, out: '+x', ext: true },
  { id: 'TowerSouth', x: [25.25, 33.5], z: [37.75, 38.5], y: YT, out: '+z', ext: true },
  // internal 0.375'
  { id: 'Bedroom1East', x: [14.75, 15.125], z: [0.75, 13.125], y: Y },
  { id: 'Bedroom1South', x: [0.75, 14.75], z: [12.75, 13.125], y: Y },
  { id: 'T1T2', x: [21.125, 21.5], z: [0.75, 8.75], y: Y },
  { id: 'T2East', x: [27.5, 27.875], z: [0.75, 8.75], y: Y },
  { id: 'ToiletsSouth', x: [15.125, 27.875], z: [8.75, 9.125], y: Y },
  { id: 'KitchenWest', x: [33.125, 33.5], z: [0.75, 25.125], y: Y },
  { id: 'KitchenSouth', x: [33.5, 45.5], z: [10.75, 11.125], y: Y },
  { id: 'T3North', x: [0.75, 7.125], z: [21.125, 21.5], y: Y },
  { id: 'T3East', x: [6.75, 7.125], z: [21.5, 28.5], y: Y },
];

// at: [from, to] along the wall's long axis; sill/h relative to the floor the wall sits on (GF FFL).
// panels: glazing divisions. type drives the opening builder.
export const openings = [
  { id: 'D-main', wall: 'SouthHall', at: [21.0, 24.5], h: 8.0, sill: 0, type: 'doorMain' },
  { id: 'G-living', wall: 'SouthHall', at: [8.0, 19.5], h: 8.5, sill: 0, type: 'slider', panels: 4 },
  { id: 'W-living-w', wall: 'West', at: [14.5, 18.5], h: 4, sill: 3, type: 'window', panels: 2 },
  { id: 'D-br1', wall: 'Bedroom1South', at: [10.75, 13.75], h: 7, sill: 0, type: 'door' },
  { id: 'W-br1-w', wall: 'West', at: [4.25, 9.25], h: 4, sill: 3, type: 'window', panels: 3 },
  { id: 'W-br1-n', wall: 'North', at: [5.25, 9.25], h: 4, sill: 3, type: 'window', panels: 2 },
  { id: 'D-t1', wall: 'ToiletsSouth', at: [16.5, 19.0], h: 7, sill: 0, type: 'doorWpc' },
  { id: 'V-t1', wall: 'North', at: [17.0, 19.0], h: 1.5, sill: 6, type: 'vent' },
  { id: 'D-t2', wall: 'ToiletsSouth', at: [23.0, 25.5], h: 7, sill: 0, type: 'doorWpc' },
  { id: 'V-t2', wall: 'North', at: [23.5, 25.5], h: 1.5, sill: 6, type: 'vent' },
  { id: 'D-back', wall: 'North', at: [29.0, 32.0], h: 7, sill: 0, type: 'doorBack' },
  { id: 'D-kit', wall: 'KitchenWest', at: [3.5, 6.5], h: 7, sill: 0, type: 'door' },
  { id: 'W-kit-n', wall: 'North', at: [37.5, 41.5], h: 3.5, sill: 3.5, type: 'window', panels: 2 },
  { id: 'W-kit-e', wall: 'East', at: [3.25, 7.25], h: 3.5, sill: 3.5, type: 'window', panels: 2 },
  { id: 'D-br2', wall: 'KitchenWest', at: [15.0, 18.0], h: 7, sill: 0, type: 'door' },
  { id: 'W-br2-e', wall: 'East', at: [16.0, 21.0], h: 4, sill: 3, type: 'window', panels: 3 },
  { id: 'W-br2-slot', wall: 'East', at: [12.5, 14.0], h: 5, sill: 2, type: 'window', panels: 1 },
  { id: 'D-t3', wall: 'T3East', at: [23.0, 25.5], h: 7, sill: 0, type: 'doorWpc' },
  { id: 'V-t3', wall: 'West', at: [24.0, 26.0], h: 1.5, sill: 6, type: 'vent' },
  { id: 'W-stair', wall: 'TowerSouth', at: [26.75, 28.75], h: 16, sill: 3, type: 'window', panels: 1, transoms: 3 },
];

// Plinth blocks under the house (y 0 -> GF FFL), recessed 1" from the wall face (§5.5)
export const plinth = [
  { x: [0, 46.25], z: [0, 25.875] },
  { x: [0, 25.25], z: [25.875, 29.25] },
  { x: [25.25, 33.5], z: [25.875, 38.5] },
];

// §3.6
export const porch = {
  floor: { x: [14.0, 25.25], z: [29.25, 35.25] },
  steps: { x: [19.0, 25.0], z0: 35.25, risers: 3, rise: 0.5, tread: 1.0 },
  soffitLights: [[16.5, 32.25], [19.5, 32.25], [22.75, 32.25]],
};

export const backSteps = { x: [28.5, 32.5], z0: 0, risers: 2, rise: 0.75, tread: 1.0 };

export const carPorch = {
  bay: { x: [34.25, 44.25], z: [25.875, 41.875] },
  canopy: { x: [33.5, 47.25], z: [25.875, 42.5], top: 12.0, bottom: 11.0 },
  column: { cx: 46.5, cz: 41.75, size: 0.75 },
  soffitLights: [[37.0, 30.0], [43.5, 30.0], [37.0, 38.5], [43.5, 38.5]],
  car: { cx: 39.25, cz: 34.0, heading: 'north' },
};
