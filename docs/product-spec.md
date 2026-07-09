# HK Property Design product specification

## Product outcome

HK Property Design is a browser app for helping a Hong Kong property user self-design a reviewable 3D decoration layout from the best available floor-plan evidence. It prioritizes transparent source provenance, manual correction, editable openings and furniture, and a usable 3D planning workflow. It is a planning/design aid, not a source of construction measurements.

## Current implemented scope

- Create a project with estate, address, tower/block, floor and flat/unit details.
- Start from either property search, floor-plan upload, or manual drawing.
- Search public estate-agency sources and curated fallback plans, then ask the user to confirm the selected plan visually before 3D generation.
- Crop a selected plan and generate an editable estimated layout.
- Review and correct rooms, walls, doors, and windows before entering the 3D step.
- Explore the layout in 3D, place furniture and electronics, rotate them, move them, and remove them.
- Apply decor styles that influence materials, starter furnishing choices, and overall interior cues.
- Save multiple plans locally and support account-backed recovery when auth/server hosting is configured.
- Support English, Traditional Chinese, and Simplified Chinese.
- Show a visible site version badge so users can track the deployed build.

## Explicit non-goals

The product does not guarantee official source accuracy, automatic watermark-safe relicensing, photo-based reconstruction, structural analysis, exact measurement, construction drawings, CAD/BIM export, or multi-user collaboration. These remain later phases or out of scope.

## Primary flow

1. Enter the property details that are known.
2. Either search for a public plan, upload a plan, or draw one manually.
3. Confirm the chosen source image visually and crop the relevant area.
4. Review rooms, measurements, walls, doors, and windows.
5. Enter the 3D view and place styling, furniture, and electronics.
6. Save the floor plan locally or to the configured signed-in account.

## User stories and acceptance criteria

### Create and resume a project

As a resident or designer, I can record the property identity and reopen my work.

- Property identity can include estate, address, tower/block, floor, and flat/unit.
- Saving and reloading preserves layout, source reference, chosen plan, furnishing edits, and user corrections.
- Missing or corrupt browser data fails safely with a recovery message.

### Review trust and uncertainty

As a user, I can tell whether a plan is official, secondary, estimated, manual, or user-confirmed.

- The source remains visibly described as secondary, estimated, manual, or user-adjusted.
- User confirmation never silently upgrades a secondary source into an official source.
- Invalid or uncertain geometry cannot silently receive an official badge.

### Correct the layout

As a user, I can correct room information before relying on the model.

- Room changes immediately affect the scene through the layout document, not sample-specific rendering logic.
- Non-finite, zero, or negative dimensions are rejected with an actionable message.
- Openings reference valid walls and remain within wall bounds.
- The user can remove false-positive doors/windows and add missing ones before moving to 3D.

### Explore the flat

As a user, I can understand room relationships in a simple 3D view.

- The scene renders rooms, walls, doors, windows, platforms, furniture, and electronics from layout data.
- Orbit, zoom, room focus, move/rotate/remove controls, and drag interactions work with clear instructions.
- The viewer provides a useful fallback when WebGL or layout data is unavailable.

### Search and narrow the right plan

As a user, I can narrow public plan candidates with enough detail to reduce mismatches.

- Search ranking considers estate, tower, block, floor, and flat/unit when the source exposes them.
- Curated fallback plans distinguish unit plans from broader site/amenity references.
- Chinese and English estate names resolve to a shared canonical matching space.

## Source strategy

Candidate plans should be ranked and matched by development, phase, tower, block, floor, and unit:

1. Statutory sales brochures in the Sales of First-hand Residential Properties Electronic Platform (SRPE).
2. Current developer/vendor documents, with edition and unit identity checked.
3. Other official records, including user-obtained Buildings Department records where applicable.
4. Estate agency plans, clearly marked secondary and cross-checked.
5. User-uploaded plans or photos.
6. Manual correction and confirmation, which improves usability but is not proof of official origin.

Store links, publisher, access date, document identity, and rights notes. Do not re-host source drawings by default. Online drawings and photographs remain copyright protected; access alone is not reuse permission.

## Photo reconstruction principles

Ten photos are capture guidance, not an accuracy guarantee. A later workflow should check image quality and overlap, classify rooms and openings, estimate planes and adjacency, optimize a 2D polygon graph, score every inferred entity, and ask the user to confirm connections and at least one measured scale. Hidden walls, exact thickness, structural status, and metric dimensions cannot be trusted from ordinary photos alone.

## Forward roadmap

- Phase 1: strengthen unit-level source matching with broader estate/unit coverage.
- Phase 2: improve door/window/platform inference across more non-Taikoo samples.
- Phase 3: add richer style-aware furnishing packs and room-specific starter layouts.
- Phase 4: add more robust cloud save/history and share/export workflows.
- Phase 5: explore guided capture, richer material controls, and renovation options.

## Readiness gate

The core search/upload/draw, crop, review, 3D edit, save, and reload path must complete without data loss or severe console errors. Search must never overstate certainty, and the UI must clearly distinguish unit-level matches from broader estate/site references.
