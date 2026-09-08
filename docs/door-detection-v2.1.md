# Door detection correction — v2.1

The previous Taikoo shortcut returned five doors on an inaccurate wall map. Its
whole-page hash depended on whitespace, so cropping could bypass it entirely.
The generic detector also excluded edge hinges, required both radial lines, and
used hinge coordinates as opening midpoints.

The reviewed Taikoo map now has seven openings. Reference opening midpoints in
the bundled 700 × 700 source are (366.5,105), (270.5,235), (226,318),
(327,386.5), (367,438.5), (327,483.5), and (367,483.5). The bathroom and lower
bedroom doors belong on vertical walls. Fingerprinting uses the colored plan's
bounds and internal dark structure, retaining source-to-model alignment after
margin cropping or resizing. Partial or structurally different images must use
the general detector. This is a verified sample mapping, not a learned detector.

General detection now considers edge hinges, accepts a single drawn leaf,
estimates opening midpoint and width, and penalizes attachment to walls with
the wrong orientation. Its accuracy on arbitrary plans is still heuristic.
The whole-flat camera now fits the selected room's extent.

Validation: 18 automated tests passed, including independently annotated door
position checks on original, cropped, and resized source images. Type checking
and production build passed (existing Auth0 build warnings remain). Local
browser UAT: uploaded the bundled clean plan, cropped the complete unit,
generated the estimate, verified seven door entries in Review, marked review
complete, and opened the rendered model in Explore. All seven openings persisted.

Existing saved layouts are not silently replaced. Regenerate from the source
image to use the new detection, preserving edited/saved work as separate plans.
