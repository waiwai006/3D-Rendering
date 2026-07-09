# MVP test plan

## Critical path

- Create a project, edit property fields, change a room, open the 3D view, save, refresh, and reopen it.
- Search for a real estate example, review candidate match strength, and confirm only after tower/block/floor/unit cues are checked visually.
- Confirm that the sample includes living/dining, two bedrooms, kitchen, bathroom, walls, doors, windows, and labels.
- In Review layout, remove at least one false opening and add back one missing opening before continuing to 3D.
- Change room geometry in layout data and confirm the scene changes without renderer edits.
- Verify source/confidence labels survive save and reload and that an estimate is never shown as official.
- Exercise orbit, zoom, room focus, and reset without camera traps or severe console errors.

## Validation and recovery

- Reject zero, negative, non-numeric, and extreme dimensions.
- Handle malformed polygons, duplicate IDs, missing wall references, and openings wider than their wall.
- Recover visibly from corrupt browser storage, invalid JSON, unavailable WebGL, and an empty layout.
- Check HK-specific geometry: narrow corridors, shared walls, bay windows, balconies, utility platforms, and non-rectangular rooms.

## Accessibility and responsiveness

- Complete the primary flow with a keyboard and visible focus.
- Ensure status is never conveyed by colour alone and text contrast remains readable.
- Smoke-test desktop, tablet, and mobile layouts; verify the viewer remains usable around 1280px desktop width.
- Respect reduced-motion preferences and keep instructions available near the viewer.

## Prototype honesty

- Property search has no false loading/results state while it is unimplemented.
- Photo collection says automatic reconstruction is unavailable; it never claims images were analyzed.
- The planning-only disclaimer and provenance remain visible in review and viewer states.
