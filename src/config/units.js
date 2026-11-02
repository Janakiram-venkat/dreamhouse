// Author in feet, render in metres (CLAUDE.md §0.3, §2.1).
export const FT = 0.3048;
export const ft = (v) => v * FT;
export const inch = (v) => (v / 12) * FT;
export const IN = 1 / 12; // one inch, in feet (for config arithmetic)

export const PLOT = { w: 72, d: 62.5 }; // feet
export const HOUSE_ORIGIN = { X: 18, Z: 5 }; // feet, in plot coords

// house-local feet -> world metres
export const toWorld = (x, y, z) => ({
  x: ft(HOUSE_ORIGIN.X + x - PLOT.w / 2),
  y: ft(y),
  z: ft(HOUSE_ORIGIN.Z + z - PLOT.d / 2),
});

// plot feet -> world metres
export const plotToWorld = (X, Y, Z) => ({
  x: ft(X - PLOT.w / 2),
  y: ft(Y),
  z: ft(Z - PLOT.d / 2),
});

// house-local feet -> plot feet
export const houseToPlot = (x, z) => ({ X: HOUSE_ORIGIN.X + x, Z: HOUSE_ORIGIN.Z + z });
