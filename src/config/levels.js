// All heights in feet above the lawn (CLAUDE.md §2.3).
export const LV = {
  ground: 0,
  drive: 0.25,
  gf: 1.5, // plinth top = GF finished floor
  gfCeil: 11.58,
  ff: 12.0, // GF roof slab top = FF FFL = terrace
  ffRail: 15.5,
  ffCeil: 22.08,
  ffRoof: 22.5,
  roofParapet: 23.5,
  towerTop: 23.5,
  slab: 0.417,
  floorFinish: 0.05, // tile + screed thickness modelled on top of the plinth
};

export const WALL = { ext: 0.75, int: 0.375 };

export const STAIR = {
  risers: 18,
  rise: 7 / 12,
  going: 11 / 12,
  flight1: { x: [26.0, 29.2], zStart: 25.5, treads: 10 }, // runs south
  landing: { x: [26.0, 32.75], z: [34.67, 37.75] },
  flight2: { x: [29.55, 32.75], zStart: 34.67, treads: 6 }, // runs north
  lobby: { x: [26.0, 32.75], z: [25.875, 29.17] },
  treadCap: 1.5 / 12,
  rail: { h: 3.0, handrailR: 1 / 12 },
};
