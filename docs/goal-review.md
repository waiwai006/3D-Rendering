# HK Property Design goal review

Last updated: 2026-07-09

## Original goal, in plain language

The product goal is to help a Hong Kong property user:

- find the right floor plan from public sources when possible
- fall back gracefully to upload or manual drawing when not possible
- confirm and correct the plan before trusting it
- generate a usable editable 3D layout
- explore, furnish, save, and reload their work

In short: let a Hong Kong property user self-design a 3D rendered decoration floor plan, even when the original public floor-plan source is incomplete or imperfect.

## What is already achieved

- Users can start from property search, upload, or manual drawing.
- English, Traditional Chinese, and Simplified Chinese are supported.
- Estate aliases exist for common Chinese and English names.
- Search can return public fallback candidates and supports confirmation before use.
- Users can crop a plan and generate an editable 3D estimate.
- Users can edit rooms, walls, doors, and windows.
- Users can explore the layout in 3D and place furniture/electronics.
- Users can save multiple plans locally and use account-backed save where configured.

## What is still below the target quality bar

### 1. Floor-plan matching quality

The app can find plausible candidates, but the experience is not yet reliable enough to claim that the "right plan" is usually found automatically. Estate-level matches still need stronger unit-level narrowing.

### 2. Opening inference quality

Door and window generation still needs user review. A tuned sample-specific fix exists for the clean Taikoo sample, but general opening detection remains weaker than the rest of the workflow.

### 3. Correction workflow polish

The editing tools exist, but the workflow needs to guide the user through correction more clearly after generation, especially for doors and windows.

## Improvement priorities

1. Improve plan matching quality and make match strength clearer to users.
2. Strengthen the post-generation correction workflow for doors/windows.
3. Improve general door/window detection beyond single known samples.
4. Continue polishing furniture, wall, and layout editing interactions.
5. Expand curated estate/unit mappings and source-specific matching rules.

## Changes started in this iteration

- Candidate cards now communicate match strength more clearly.
- Confirmation flow now highlights that match quality is still secondary and visual review is required.
- Review layout now includes a dedicated door/window review section so users can remove false positives and mark review complete before continuing to 3D.
- Source-specific matching now narrows more deliberately against tower/block/floor/flat wording instead of relying only on broad page-text overlap.
- Curated fallbacks now distinguish unit plans from broader site or amenity references.

## Current conclusion

HK Property Design now supports the intended self-design workflow end to end: search or upload a plan, crop/trace it, correct the layout, furnish it, explore it in 3D, and save the result. The remaining gap is not whether the workflow exists, but whether plan matching and opening detection are dependable enough across more Hong Kong properties to feel trustworthy by default.
