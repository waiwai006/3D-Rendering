# HK Property Design product specification

## Product outcome

HK Property Design is a browser prototype for recreating a Hong Kong flat as a reviewable, navigable 3D layout. The current product prioritizes transparent provenance, manual correction, and reliable 3D navigation. It is a planning aid, not a source of construction measurements.

## Implemented MVP scope

- Create a project with optional estate, building, block, unit, address, and saleable area.
- Start from property lookup, an uploaded plan, or a measured manual drawing; a representative two-bedroom sample remains available as a demo.
- Review a versioned, data-driven layout containing rooms, walls, doors, windows, provenance, and confidence.
- Explore the layout in 3D with orbit controls, room focus, and a reset view.
- Save projects in the current browser and reopen them later.
- Display persistent source and confidence labels. User confirmation never converts an estimate into an official source.
- Collect optional estate, tower/block, floor and flat/unit details, link to official public sources, and fall back honestly to upload or manual drawing when no exact plan is available.

## Explicit non-goals

The prototype does not perform live property search, automatic PDF tracing, photo-based reconstruction, structural analysis, exact measurement, collaboration, CAD/BIM export, or decoration rendering. These are later phases.

## Primary flow

1. Start a project and enter known property details.
2. Choose the sample/manual path and review its provenance warning.
3. Edit room names, types, and approximate dimensions.
4. Review validation and uncertainty information.
5. Generate and navigate the 3D view.
6. Save and reopen the project in the same browser.

## User stories and acceptance criteria

### Create and resume a project

As a resident or designer, I can record the property identity and reopen my work.

- Required project fields are clearly marked; HK addresses support English and Traditional Chinese.
- Saving and reloading preserves layout, provenance, confidence, and user edits.
- Missing or corrupt browser data fails safely with a recovery message.

### Review trust and uncertainty

As a user, I can tell whether a plan is official, secondary, estimated, manual, or user-confirmed.

- Provenance and planning disclaimer remain visible in edit and viewer states.
- Unknown data is never labelled official.
- Invalid or uncertain geometry cannot silently receive an official badge.

### Correct the layout

As a user, I can correct room information before relying on the model.

- Room changes immediately affect the scene through the layout document, not sample-specific rendering logic.
- Non-finite, zero, or negative dimensions are rejected with an actionable message.
- Openings reference valid walls and remain within wall bounds.

### Explore the flat

As a user, I can understand room relationships in a simple 3D view.

- The sample renders a living/dining room, two bedrooms, kitchen, bathroom, doors, windows, and room labels.
- Orbit, zoom, room focus, and reset controls work with clear instructions.
- The viewer provides a useful fallback when WebGL or layout data is unavailable.

## Source strategy

Candidate plans should be ranked and matched by development, phase, tower, floor, and unit:

1. Statutory sales brochures in the Sales of First-hand Residential Properties Electronic Platform (SRPE).
2. Current developer/vendor documents, with edition and unit identity checked.
3. Other official records, including user-obtained Buildings Department records where applicable.
4. Estate agency plans, clearly marked secondary and cross-checked.
5. User-uploaded plans or photos.
6. Manual correction and confirmation, which improves usability but is not proof of official origin.

Store links, publisher, access date, document identity, and rights notes. Do not re-host source drawings by default. Online drawings and photographs remain copyright protected; access alone is not reuse permission.

## Photo reconstruction principles

Ten photos are capture guidance, not an accuracy guarantee. A later workflow should check image quality and overlap, classify rooms and openings, estimate planes and adjacency, optimize a 2D polygon graph, score every inferred entity, and ask the user to confirm connections and at least one measured scale. Hidden walls, exact thickness, structural status, and metric dimensions cannot be trusted from ordinary photos alone.

## Roadmap

- Phase 0: versioned schema, sample layout, validation, and data-driven viewer.
- Phase 1: project wizard, local persistence, correction UI, trust labels, and tests.
- Phase 2: floor-plan image/PDF overlay with manual scale and tracing.
- Phase 3: opt-in source adapters, citation/rights ledger, and review workflow.
- Phase 4: guided capture and asynchronous, user-assisted photo reconstruction.
- Phase 5: furniture, materials, lighting, renovation options, and export.

## MVP readiness gate

The core create, edit, view, save, and reload path must complete without data loss or severe console errors. The sample must remain interactive on a typical laptop, target at least 30 FPS, preserve provenance through save/load, and never imply that unimplemented search or AI processing took place.
