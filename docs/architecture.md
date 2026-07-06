# Architecture

## System shape

The MVP is a single Next.js TypeScript application. UI and 3D code depend on a pure, versioned layout domain model:

```text
Project UI / editor
        |
        v
LayoutDocument -> validation + geometry derivation -> scene adapter -> React Three Fiber
        |
        v
ProjectRepository -> browser storage now; API + PostgreSQL later
```

Keeping the repository and scene adapter behind interfaces allows production storage and an asynchronous computer-vision service to be added without changing the editor or renderer.

## Coordinate system and layout contract

- All distances are metres.
- X runs left/right across the floor plan.
- Z runs forward/back across the floor plane.
- Y is elevation, with floors at Y = 0.
- Rooms use `polygon: Array<{x, z}>` so irregular spaces are representable.
- Walls use canonical start/end points plus height and thickness.
- Doors and windows reference a wall and use an offset along it; windows also include sill height.
- Each imported or inferred entity may carry provenance and confidence.
- `schemaVersion` enables future migrations.

The renderer consumes this contract and must not depend on sample room IDs. The room polygons create floors; wall segments create extruded walls; openings and labels are placed from wall-relative data.

## Future service boundaries

- Next.js route handlers expose projects, source candidates, uploads, and layouts.
- PostgreSQL/Prisma stores projects, layout versions, source metadata, confirmations, and audit events.
- Private object storage accepts signed direct uploads, with retention and deletion controls.
- A queued FastAPI worker performs permitted PDF/OCR/CV processing and returns candidate layout documents with per-entity confidence.
- The browser remains the confirmation surface; no inferred result becomes official through user confirmation.

## Property source adapters

`POST /api/property-search` is the source-aggregation boundary. The first live adapter resolves estate names through Centaline's public estate sitemap, fetches matched estate pages, extracts floor-plan image metadata, scores the estate and optional tower/block/floor/flat signals, and returns secondary-source candidates. The client requires visual confirmation before a candidate becomes a tracing reference. Provider failures are returned as warnings with upload/draw fallbacks; they never produce a fabricated match. SRPE, 28Hse, and Midland can be added as independent adapters when stable, permitted machine-readable search surfaces are available.

## Security, privacy, and rights

Production photos should be private by default, encrypted in transit and at rest, access-controlled, and governed by a visible retention policy. Strip or warn about EXIF location metadata. Require upload rights attestation and provide deletion/takedown paths. Cache source files only when terms permit; otherwise keep necessary metadata, hashes, and links.

## Validation boundaries

Validation should reject malformed polygons, non-finite or non-positive dimensions, duplicate IDs, orphan wall references, and openings outside wall bounds. Warnings cover overlaps, implausible areas, disconnected rooms, missing confidence, and unconfirmed assumptions. Blocking errors prevent confirmation; warnings require acknowledgement.
