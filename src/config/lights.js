// Fixtures — CLAUDE.md §7. House-local feet unless marked plot.
// Sconce: position on the wall face, `n` = outward normal. spot: real SpotLight (front-most only).
export const sconces = [
  // main door
  { x: 20.4, y: 9.0, z: 29.25, n: '+z', spot: true },
  { x: 25.0, y: 9.0, z: 29.25, n: '+z', spot: true },
  // living stone piers
  { x: 5.0, y: 7.5, z: 29.375, n: '+z', spot: true },
  { x: 19.75, y: 7.5, z: 29.375, n: '+z', spot: true },
  // east wall every ~8'
  { x: 46.25, y: 8.0, z: 2.0, n: '+x' },
  { x: 46.25, y: 8.0, z: 9.5, n: '+x' },
  { x: 46.25, y: 8.0, z: 15.0, n: '+x' },
  { x: 46.25, y: 8.0, z: 23.5, n: '+x' },
  // west wall between windows
  { x: 0, y: 8.0, z: 2.5, n: '-x' },
  { x: 0, y: 8.0, z: 11.5, n: '-x' },
  { x: 0, y: 8.0, z: 20.5, n: '-x' },
  { x: 0, y: 8.0, z: 27.5, n: '-x' },
  // back door
  { x: 28.3, y: 8.5, z: 0, n: '-z' },
  { x: 32.7, y: 8.5, z: 0, n: '-z' },
  // terrace
  { x: 13.4, y: 18.5, z: 25.875, n: '+z' },
  { x: 25.25, y: 18.5, z: 33.0, n: '-x' },
  // FF north/east walls (rear & right views)
  { x: 27.125, y: 18.5, z: 12.5, n: '+x' },
  { x: 33.5, y: 18.5, z: 20.0, n: '+x' },
  { x: 11.625, y: 18.5, z: 11.0, n: '-x' },
];

// Interior room lights (one PointLight per visible room). y absolute.
export const roomLights = [
  { id: 'Living', x: 15.0, y: 9.5, z: 22.0, intensity: 9, distance: 9 },
  { id: 'Dining', x: 28.0, y: 9.5, z: 19.0, intensity: 6, distance: 8 },
  { id: 'Bedroom2', x: 39.5, y: 9.5, z: 18.0, intensity: 5, distance: 8 },
  { id: 'Kitchen', x: 39.5, y: 9.5, z: 5.5, intensity: 5, distance: 7 },
  { id: 'Bedroom1', x: 7.5, y: 9.5, z: 6.5, intensity: 5, distance: 7 },
  { id: 'Bedroom3', x: 19.0, y: 20.0, z: 18.0, intensity: 8, distance: 9 },
  { id: 'Stair', x: 29.4, y: 17.0, z: 33.0, intensity: 3, distance: 7 },
];

export const WARM = '#FFB46B';
export const WARM_LIGHT = '#FFC48A';
