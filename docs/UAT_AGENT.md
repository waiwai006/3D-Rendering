# UAT agent

Use this checklist after every deployment. The goal is to catch visible regressions before we call a release healthy.

## Automated smoke check

Run both:

- `npm run uat:smoke -- -Url http://127.0.0.1:3000/`
- `npm run uat:smoke -- -Url https://waiwai006.github.io/3D-Rendering/`

What it checks:

- the page responds over HTTP
- the app title is present
- no obvious runtime error text is rendered
- a DOM snapshot is captured for review

## Manual UAT flow

Always verify this flow locally before push, then repeat it on the deployed GitHub Pages build:

1. Open the app.
2. Switch to dark mode.
3. Open Explore in 3D and confirm the Decor style dropdown is readable.
4. Search a real example property such as Taikoo Shing / 太古城.
5. Select a public fallback floor plan.
6. Confirm the crop tool loads the plan instead of staying on `Loading floor plan...`.
7. Change Decor style and confirm the scene changes beyond color:
   - wall or panel treatment
   - floor pattern/material
   - lighting fixture style
   - kitchen accent such as island, shelving, or concealed pantry treatment when a kitchen room exists
8. Place the styled starter set and confirm furniture/electronics appear.
9. Remove one door or window from the Door/Windows list and confirm the 3D view updates.

## Release rule

Do not call a deployment healthy until:

- local smoke check passes
- live smoke check passes
- the manual flow above passes once on the deployed site
