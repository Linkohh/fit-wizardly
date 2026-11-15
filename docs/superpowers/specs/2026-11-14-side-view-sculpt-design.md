# Side-view sculpt: design

Date: 2026-11-14 · Branch: `feat/side-view-sculpt` · Status: awaiting approval

## Intent

The muscle selector in the wizard's target-muscle step works well from the front and back. The side view does not: the anatomy underneath is hard to read. Lincoln wants the side view refined so the underlying anatomy is clearer and more visible, with a "sculpt" control that offers both **muscle definition** and **layer depth**.

## Current state (what the analysis found)

All in `src/features/mcl/`.

| Problem | Evidence |
|---|---|
| Side muscles sit outside the body | Outline torso spans x 62–118; side muscle paths span x 42–92 (`data/muscles.ts`, `svg/BodyOutline.tsx:124`) |
| Outline is incoherent | Face points right, "chest" line is on the left, leg is 20 units wide against 50-unit-wide muscles |
| Arm and torso merge | Biceps, triceps, lats, obliques, serratus share one band at 0.25 opacity with no edges (`svg/MusclePath.tsx:97`) |
| No depth order | Draw order sorts only by disabled / hovered / selected / highlighted (`svg/MuscleCanvas.tsx:60`) |
| Thin coverage | 19 side paths vs 35 front, 32 back. No pecs, abs, traps, erectors, forearms |
| Hidden on phones | `showSideView={!isMobile}` (`components/wizard/anatomy/AnatomyPanel.tsx:74`) |
| One-sided selection | Only `-left` muscles have side paths, so a side click targets the left side only |

Hover, click, long-press, selection and the info panel are shared with front/back and need no change.

## Goals

1. Every side muscle sits inside a believable right-facing silhouette and is individually readable at rest.
2. A **Sculpt slider** takes the figure from soft silhouette to fully defined muscle.
3. A **Layer control** switches between surface muscles and the deep muscles beneath them.
4. Side view is usable on mobile.

## Non-goals

- Redrawing front or back artwork. They only gain the Sculpt slider (same rendering code).
- New muscles in the data set. Deep layer v1 uses muscles already in `muscles.ts`, so no new names, exercises, relationships or translations.
- 3D, rotation, or a continuous turntable.
- Changing what a selection means to the plan generator (`mclIds` → wizard store mapping is untouched).

## Anti-goals

- A slider layered on the current shapes. It would make the misalignment more obvious.
- Any setting of either control that makes a selected muscle harder to see. Selected and hovered states always render at full strength.
- Regressing the hover highlight and click details Lincoln already likes.

## Approaches

**A. Definition slider only.** One set of shapes; slider drives opacity, edges and shading. Cheapest, but no depth.

**B. Depth slider only.** Peel surface to deep. Most educational, but leaves the resting view as muddy as today.

**C. Both, as two controls (chosen).** A continuous Sculpt slider for definition plus a two-step Layer control (Surface / Deep) with a crossfade. Lincoln asked for both.

*Why two controls and not one long slider (Claude's call):* definition is continuous, depth is a switch between two sets of clickable shapes. Folding them into one track means part of the slider silently changes what a click selects. Two controls keep each one predictable.

## Design

### 1. Foundation (side artwork)

- Replace `SideOutline` with a single closed, right-facing silhouette in the existing 200×440 viewBox, 8-head proportions matching front/back landmarks (shoulder y≈75, waist y≈200, knee y≈335).
- Re-author the 19 existing side paths to fit inside it. All curves; no straight-edged polygons (current serratus is one).
- Add side paths for: pectoralis major, rectus abdominis, upper trapezius, erector spinae, forearm flexors, forearm extensors, semitendinosus. Target ≈ 26 side muscles.

### 2. Depth order

- Add `sideOrder?: number` to `Muscle` (far limb → torso → near leg → near arm). `MuscleCanvas` sorts by it first, then by the existing state rules, so hovered/selected still rise to the top within reason.

### 3. Sculpt slider (definition)

- Value 0–100, default 60. Applies to all three views.
- Drives, for unselected muscles only: fill opacity (≈0.12 → 0.6), separation edge opacity (0 → 0.8), per-muscle shading gradient strength (0 → 1). Outline opacity moves the opposite way so the silhouette leads at 0 and recedes at 100.
- Uses the existing shadcn slider (`components/ui/slider.tsx`), placed under the view switcher. Keyboard operable, labelled, value announced.
- Fibre-direction lines are optional polish at the top of the range, side view only. Builder's call whether they make v1.

### 4. Layer control (depth)

- Add `layer?: 'surface' | 'deep'` to `Muscle` (default `surface`).
- Deep in v1, from existing data: rhomboids, infraspinatus, teres major, erector spinae, brachialis, soleus, gluteus medius. Where these lack a side path, add one.
- Two-step segmented control, shown in **side view only** in v1. On "Deep", surface muscles fade to ghosts (≈0.08, not clickable) and deep muscles become the interactive set. Front/back keep rendering every muscle as today (Claude's call, to avoid changing views that already work).
- A muscle selected on one layer stays visibly selected when the other layer is showing.

### 5. Selection from the side

- A side-view click selects the left and right muscle together; unpaired muscles select singly. The accessible name drops "left". (Claude's call — Lincoln has not confirmed.)

### 6. State and mobile

- Sculpt value and layer live in `MuscleSelector` state, persisted to localStorage under one key. Not `anatomyStore`, which is the older front/back-only store.
- Remove the `!isMobile` gate in `AnatomyPanel` once phases 1–2 pass review on a phone-width viewport.
- Both controls respect `reduceMotion` (instant change, no crossfade).

## Order of work

1. Outline + re-fit existing paths + bounds test
2. Depth order
3. New side paths
4. Sculpt slider
5. Layer control + deep paths
6. Paired selection, mobile enable, polish

Phases 1–3 land value on their own and can ship before 4–5.

## Testing

- Unit: every side path's bounding box lies inside the outline's (guards the original bug).
- Unit: sort order honours `sideOrder` then state.
- Component: slider and layer control are keyboard operable; selected muscles keep full opacity at slider 0; ghosted surface muscles are not focusable on "Deep".
- Existing `MusclePath`, `MuscleSelector.ios`, `header-mode` and `AnatomyPanel` tests stay green.
- Visual check at `/mcl` in light and dark, desktop and 375px. Requires `npm install` first: `@capacitor/app` is in `package.json` but missing from `node_modules`.

## Left to the builder

- Exact path coordinates and gradient recipe.
- Whether fibre lines make v1.
- Whether the control labels go through i18n (the view switcher's labels are currently hardcoded English; follow whichever convention is settled for that component).
