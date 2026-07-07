# FlatForm

## Account login and cloud saving

The app supports Auth0 Universal Login and stores each signed-in user's latest project in a private, user-scoped Netlify Blobs record. Copy `.env.example` to `.env.local` and provide credentials from an Auth0 **Regular Web Application**.

Configure these Auth0 application URLs:

- Allowed callback URL: `http://localhost:3000/auth/callback`
- Allowed logout URL: `http://localhost:3000`
- Production callback URL: `https://hkpropertydesign.netlify.app/auth/callback`
- Production logout URL: `https://hkpropertydesign.netlify.app`

Set the same five environment variables in Netlify, changing `APP_BASE_URL` to `https://hkpropertydesign.netlify.app`. Until all variables are present, browser-local saving remains available and the sign-in control explains that Auth0 setup is required.

FlatForm is a working MVP for reconstructing and exploring a compact Hong Kong flat. It combines a guided project form, an honest provenance/confidence layer, a small manual room editor, browser-local save/load, and a data-driven React Three Fiber viewer.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Useful checks:

```bash
npm test
npm run typecheck
npm run build
```

## Implemented in this prototype

- Three clear starting paths: property details/public-source lookup, floor-plan upload, or manual drawing.
- Automatic estate-name matching against Centaline's public estate index, including extracted floor-plan candidate images.
- Candidate scoring, source attribution, visual review, and an explicit confirmation dialog before a plan can enter the tracing/3D workflow.
- Zoom controls in candidate review before confirmation.
- English, Traditional Chinese and Simplified Chinese interface modes; Chinese searches query both Centaline Chinese estate indexes.
- Crop selection on an uploaded/confirmed plan with low-confidence wall-line extraction into editable 3D geometry.
- Optional estate, address, tower, block, floor, and flat/unit fields for precise matching.
- Saleable-area entry and display in either square feet or square metres.
- Floor-plan image upload with an overlay for manual tracing; PDFs are accepted for reference.
- Drag-to-draw room rectangles on a measured grid, with undo, clear, and generated 3D walls.
- A representative 524 sq ft two-bedroom sample with living/dining, kitchen, bathroom, doors, and windows.
- Room selection, renaming, and type changes; sample dimensions remain visible but locked to preserve wall integrity.
- Layout-driven 3D floors, walls, wall openings, labels, orbit/zoom, and room focus.
- Persistent provenance and confidence labels plus a planning-only warning.
- Browser-local save, restore, safe corrupt-data fallback, and sample reset.
- Versioned TypeScript layout contract, validation helper, unit tests, product spec, architecture, and test plan.

## Prototype boundaries

Automated SRPE document extraction, PDF page rendering, and automatic photo reconstruction are not implemented. The live provider currently searches Centaline's public estate sitemap and floor-plan metadata; SRPE and BRAVO remain authoritative/manual verification routes, and other agency adapters can be added behind the same API. The UI does not claim a verified match until the user confirms the candidate. Dimensions are approximations and must not be used for construction, structural decisions, purchasing, or statutory submissions.

Crop-to-3D uses local image thresholding and line detection. It cannot identify structural walls, true scale, doors, windows, room semantics or hidden geometry reliably. Every generated crop remains a low-confidence manual approximation requiring correction.

## Project map

```text
app/                         Next.js shell and visual system
components/workspace/        Guided project, editor, trust, and save flow
components/viewer/           React Three Fiber scene and controls
data/sample-layout.ts        Mock Hong Kong flat
lib/layout-schema.ts         Layout types, labels, and validation
tests/                       Layout validation tests
docs/product-spec.md         MVP scope, acceptance criteria, roadmap
docs/architecture.md         Technical design and future service boundaries
docs/test-plan.md            QA and readiness checklist
```

## Layout coordinate system

All dimensions use metres. Layout `x/y` coordinates map to Three.js `x/z`; Three.js `y` is vertical elevation. Rooms in the current editable prototype are rectangles described by width, length, and an origin. Walls are canonical line segments, and doors/windows reference a wall with a relative position. The next schema iteration should move rooms to floor polygons so L-shaped and other irregular spaces can be edited directly; the architecture document describes that migration.

The viewer reads `PropertyLayout` and has no dependency on the sample project ID. Swapping in another valid layout changes the rendered scene without changing viewer code.

## Source and copyright posture

Future search should rank statutory SRPE sales brochures and current developer documents above secondary agency plans, while verifying development, phase, tower, floor, unit, and document edition. Older-building records may require the user-mediated, paid Buildings Department BRAVO/BIC route and may not reflect later alterations.

Store source links, publisher, access date, hashes, and rights notes. Do not publicly re-host drawings by default: plans and photos remain copyright protected even when visible online. User photographs should be private by default in production, with deletion controls, restricted access, retention rules, and EXIF/location handling.

## Roadmap

1. Add polygon/wall tracing, undo, more geometry validation, and full opening editing.
2. Add floor-plan image/PDF overlay with manual scale calibration.
3. Add opt-in official-source adapters with citation and rights records.
4. Add guided capture and asynchronous, user-confirmed photo reconstruction.
5. Add furniture, materials, lighting, renovation options, and export.

See [the product specification](docs/product-spec.md) for the full scope and acceptance criteria.
