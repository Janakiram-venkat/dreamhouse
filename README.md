# 3 BHK House (500 Yards) — realistic Three.js model

Real-time model of the house on `reference/Modern_Two-Storey_House_Plan_Board.png`, built from `CLAUDE.md`.

```bash
npm install
npm run dev        # http://localhost:5173
```

- Views: buttons at the bottom or keys **1–7** (Front, Right, Left, Back, Terrace, Plan GF, Plan FF).
- Panel (top right): time of day (dusk / day / night), interiors, plants, cutaway, AO, bloom, exposure, quality.
- URL options: `?view=terrace`, `?t=night`, `?q=high|medium|low`.

All dimensions live in `src/config/*.js` (feet); builders in `src/builders/` contain no dimensions of their own.
See `NOTES.md` for deviations from the spec and `CREDITS.md` for asset licences.
