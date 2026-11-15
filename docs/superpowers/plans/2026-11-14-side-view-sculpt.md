# Side-View Sculpt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the muscle selector's side view anatomically readable, then add a Sculpt slider (muscle definition) and a Surface/Deep layer control.

**Architecture:** Side artwork is redrawn inside one closed silhouette and guarded by a geometry test. Rendering decisions move out of components into three pure modules (render order, sculpt style, paired ids) that `MuscleCanvas` / `MusclePath` consume. Two small UI controls feed a persisted preferences hook owned by `MuscleSelector`.

**Tech Stack:** React 19, TypeScript, Framer Motion, Tailwind, shadcn slider, Zod 4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-14-side-view-sculpt-design.md`

## Global Constraints

- All paths below are relative to `src/features/mcl/` unless they start with `src/` or `docs/`.
- ViewBox stays `0 0 200 440`. The side figure faces **right**.
- Before starting, read `docs/DESIGN_SYSTEM.md` and `docs/ENGINEERING.md` (project rule).
- No `any`. No edits under `src/components/ui/`. Motion uses `getTimedTransition` / `getSpringTransition` from `@/lib/motion/tokens`.
- Selected and hovered muscles always render at today's full strength, at every slider value and on either layer.
- Front and back views render every muscle exactly as today, apart from the Sculpt slider's effect on unselected muscles.
- No new entries in `data/muscles.ts`; only new `side` paths, `sideOrder` and `layer` on existing entries.
- Control labels are hardcoded English, matching `ui/ViewSwitcher.tsx`.
- Run one test file with `npx vitest run <path>`; full suite `npm run test:run`; lint `npm run lint`.
- **Spec reconciliation:** the spec lists erector spinae under both "add surface side paths" and "deep". It is **deep**. Side view ends with 22 surface + 7 deep muscles.

## Review Focus

1. **Corrupt or blocked localStorage** → selector still renders with slider 60 / Surface. (Task 5)
2. **Selection made in front view, then clicked in side view** (only `-left` selected) → click selects the pair; a second click clears both. (Task 7)
3. **`multiSelect={false}` with a paired side click** → selection becomes exactly that pair, not an accumulating list. (Task 7)
4. **Switching to front/back while layer is Deep** → nothing is ghosted or hidden. (Task 6)
5. **A disabled muscle whose partner is not disabled** → paired click skips the disabled id. (Task 7)

---

### Task 1: Restore local dev and extract render order

**Files:**
- Create: `lib/sortMuscles.ts`, `lib/sortMuscles.test.ts`
- Modify: `types/shared.ts`, `types/index.ts` (Muscle), `components/MuscleSelector/svg/MuscleCanvas.tsx:59-89`

**Interfaces:**
- Produces: `type MuscleLayer = 'surface' | 'deep'` (shared.ts); `Muscle.sideOrder?: number`; `Muscle.layer?: MuscleLayer`
- Produces: `sortMusclesForRender(muscles: Muscle[], view: ViewType, state: RenderState): Muscle[]` where `RenderState = { selected: ReadonlySet<string>; hovered: string | null; highlighted: ReadonlySet<string>; disabled: ReadonlySet<string> }`
- Produces: `SIDE_ORDER = { farLimb: 10, torso: 20, nearLeg: 30, nearArm: 40 } as const`

- [ ] **Step 1:** Run `npm install` at repo root. Then `npm run dev`, open `http://localhost:8080/mcl`. Expected: selector renders with no Vite import overlay.
- [ ] **Step 2: Write failing tests** in `lib/sortMuscles.test.ts`:

```ts
it('keeps today\'s order in front view: disabled < plain < highlighted < selected < hovered')
it('in side view orders by sideOrder before state', () => {
  // arm (sideOrder 40, plain) renders after torso (sideOrder 20, hovered)
  expect(ids(sortMusclesForRender([arm, torso], 'side', hovered('torso')))).toEqual(['torso', 'arm']);
});
it('treats missing sideOrder as SIDE_ORDER.torso');
it('ignores sideOrder in front and back views');
it('does not mutate its input');
```

- [ ] **Step 3:** Run `npx vitest run src/features/mcl/lib/sortMuscles.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 4:** Add the types; implement `sortMusclesForRender`; replace the inline sort in `MuscleCanvas` with it.
- [ ] **Step 5:** Run the new test file plus `npx vitest run src/features/mcl`. Expected: all PASS.
- [ ] **Step 6:** Commit `refactor(mcl): extract muscle render order with side depth support`.

### Task 2: Side silhouette and geometry guard

**Files:**
- Create: `components/MuscleSelector/svg/sideOutline.ts`, `lib/pathGeometry.ts`, `lib/pathGeometry.test.ts`, `data/sideAnatomy.test.ts`
- Modify: `components/MuscleSelector/svg/BodyOutline.tsx:123-160`

**Interfaces:**
- Produces: `SIDE_SILHOUETTE_PATH: string` — one closed path using only absolute `M`, `C`, `L`, `Z`.
- Produces: `type Point = { x: number; y: number }`; `getAnchorPoints(d: string): Point[]` (endpoints of each segment, not control points); `flattenPath(d: string, stepsPerCurve?: number): Point[]` (default 8); `isPointInPolygon(point: Point, polygon: Point[]): boolean`
- Produces (test helper, exported from `data/sideAnatomy.test.ts` is not needed elsewhere): the "inside" rule = at least 90% of a muscle's anchor points fall inside `flattenPath(SIDE_SILHOUETTE_PATH)`.

Silhouette landmarks (x at given y; figure faces right, arm hangs at the side and is **not** part of the silhouette's edge):

| Landmark | y | back x | front x |
|---|---|---|---|
| Head | 4–58 | 80 | 128 (nose ≈ 132 at y 34) |
| Neck | 66 | 92 | 112 |
| Chest / upper back | 110 | 70 | 130 |
| Waist | 200 | 80 | 122 |
| Glute peak / hip | 238 | 66 | 124 |
| Mid thigh | 285 | 76 | 124 |
| Knee | 335 | 86 | 116 |
| Calf peak | 372 | 78 | 112 |
| Ankle | 420 | 92 | 108 |
| Foot | 438 | heel 86 | toe 138 |

- [ ] **Step 1: Write failing tests.** `lib/pathGeometry.test.ts`:

```ts
expect(getAnchorPoints('M10,10 C20,0 30,0 40,10 L40,30 Z')).toEqual([{x:10,y:10},{x:40,y:10},{x:40,y:30}]);
expect(flattenPath('M0,0 L10,0 L10,10 Z')).toHaveLength(3);
expect(isPointInPolygon({x:5,y:5}, square)).toBe(true);
expect(isPointInPolygon({x:15,y:5}, square)).toBe(false);
```

`data/sideAnatomy.test.ts`:

```ts
it('silhouette is closed and spans the landmark box', () => {
  // ends with Z; flattened bbox within x 60..140, y 0..440; width at y=110 >= 50
});
it.each(getMusclesByView('side'))('$id sits inside the silhouette', (muscle) => {
  // >= 90% of getAnchorPoints(muscle.paths.side) inside flattenPath(SIDE_SILHOUETTE_PATH)
});
```

- [ ] **Step 2:** Run both files. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement `pathGeometry.ts`. Author `SIDE_SILHOUETTE_PATH` from the landmark table. Rewrite `SideOutline` to render that path plus interior detail lines (jaw, ear hint), keeping the `body-outline` class and `strokeWidth="1.5"`.
- [ ] **Step 4:** Run. Expected: geometry tests PASS; the silhouette test PASSES; most `it.each` muscle cases **FAIL** (this is the original bug, now measured). Leave them failing for Task 3.
- [ ] **Step 5:** Visual check at `/mcl` → Side, light and dark. Expected: one coherent right-facing figure.
- [ ] **Step 6:** Commit `feat(mcl): single closed side silhouette and geometry helpers` (note in the body that the per-muscle cases fail until Task 3).

### Task 3: Re-fit and extend side muscle paths

**Files:**
- Modify: `data/muscles.ts` (the `side:` path, `views`, `sideOrder`, `layer` of the entries named below)
- Test: `data/sideAnatomy.test.ts`

**Interfaces:**
- Consumes: `SIDE_ORDER`, `MuscleLayer`, the inside rule from Task 2.
- Produces: side coverage and layer assignment below, relied on by Tasks 6–7.

Assignments (ids without a suffix are unpaired; paired ids are the `-left` entry):

| `sideOrder` | Surface | Deep (`layer: 'deep'`) |
|---|---|---|
| torso 20 | sternocleidomastoid, trapezius-upper *(new)*, pectoralis-major *(new)*, serratus-anterior, rectus-abdominis *(new)*, external-oblique, latissimus-dorsi, gluteus-maximus | rhomboid *(new)*, infraspinatus *(new)*, teres-major *(new)*, erector-spinae *(new)*, gluteus-medius |
| nearLeg 30 | rectus-femoris, vastus-lateralis, biceps-femoris, semitendinosus *(new)*, gastrocnemius, tibialis-anterior | soleus |
| nearArm 40 | anterior-deltoid, lateral-deltoid, posterior-deltoid, biceps, triceps, brachioradialis, forearm-flexors *(new)*, forearm-extensors *(new)* | brachialis |

Also set `layer: 'deep'` on the `-right` partners of every deep muscle (no side path needed). Remove `'side'` from `serratus-anterior-right`'s `views` if it has no side path.

Arm landmarks: shoulder centre (100, 86); upper arm x 88–112 to elbow y 195; forearm x 92–110 to wrist y 262. Front-of-body muscles take the higher x; back-of-body the lower x. All shapes use curves — no straight-edged polygons.

- [ ] **Step 1: Add failing tests** to `data/sideAnatomy.test.ts`:

```ts
it('has 22 surface and 7 deep side muscles');
it('every side muscle declares a sideOrder from SIDE_ORDER');
it('no side path is made only of M/L/Z commands');
it('deep layer is exactly the 13 ids: rhomboid, infraspinatus, teres-major, brachialis, soleus, gluteus-medius (left+right) and erector-spinae');
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Author the paths, working one `sideOrder` band at a time with `/mcl` open. Within a band, neighbouring muscles may touch but should not overlap by more than a thin margin.
- [ ] **Step 4:** Run `npx vitest run src/features/mcl/data`. Expected: all PASS, including every Task 2 `it.each` case.
- [ ] **Step 5:** Visual check: hover each side muscle; the highlighted shape matches its name and the arm reads as in front of the torso.
- [ ] **Step 6:** Commit `feat(mcl): redraw and extend side-view muscles`.

**Phases 1–3 of the spec are shippable here.**

### Task 4: Sculpt style and rendering

**Files:**
- Create: `lib/sculpt.ts`, `lib/sculpt.test.ts`
- Modify: `components/MuscleSelector/svg/MusclePath.tsx`, `svg/MusclePath.test.tsx`, `svg/MuscleCanvas.tsx`, `svg/BodyOutline.tsx`

**Interfaces:**
- Produces: `SCULPT_DEFAULT = 60`; `interface SculptStyle { fillOpacity: number; edgeOpacity: number; shadingOpacity: number; outlineOpacity: number }`; `getSculptStyle(level: number): SculptStyle` — clamps to 0–100, linear: fill 0.12→0.60, edge 0→0.80, shading 0→1, outline 0.90→0.35.
- Produces: `MusclePath` prop `sculpt: SculptStyle`; `MuscleCanvas` prop `sculptLevel?: number` (default `SCULPT_DEFAULT`); `BodyOutline` prop `opacity?: number`.

- [ ] **Step 1: Failing tests.** `lib/sculpt.test.ts`: values at 0, 60, 100 (`toBeCloseTo`); `getSculptStyle(-5)` equals level 0; `getSculptStyle(250)` equals level 100. `MusclePath.test.tsx`:

```ts
it('unselected muscle uses sculpt.fillOpacity as its target opacity');
it('selected muscle stays at opacity 1 when sculpt.fillOpacity is 0.12');
it('draws a separation edge with strokeOpacity = sculpt.edgeOpacity when not selected or hovered');
it('renders a non-interactive shading overlay (aria-hidden, pointer-events none) only when shadingOpacity > 0');
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `sculpt.ts`. In `MusclePath`, replace the resting `0.25 / 0.2` opacity with `sculpt.fillOpacity`; resting stroke becomes `currentColor`, width 0.6, `strokeOpacity = sculpt.edgeOpacity` (wrap muscles in `<g className="muscles text-background">`); add the overlay path filled with a new shared `<linearGradient id="muscle-shade">` in `MuscleCanvas` defs. `MuscleCanvas` computes the style once with `useMemo` and passes `outlineOpacity` to `BodyOutline`.
- [ ] **Step 4:** Run `npx vitest run src/features/mcl`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(mcl): sculpt-level rendering for muscle definition`.

### Task 5: Preferences hook and controls

**Files:**
- Create: `hooks/useSculptPrefs.ts`, `hooks/useSculptPrefs.test.ts`, `components/MuscleSelector/ui/SculptSlider.tsx`, `ui/LayerToggle.tsx`, `ui/SculptControls.test.tsx`
- Modify: `components/MuscleSelector/MuscleSelector.tsx` (near the `ViewSwitcher` at ~246 and the `MuscleCanvas` at ~354)

**Interfaces:**
- Produces: `useSculptPrefs(): { sculptLevel: number; setSculptLevel: (level: number) => void; layer: MuscleLayer; setLayer: (layer: MuscleLayer) => void }` — storage key `fitwizard.mcl.sculpt.v1`, value `{ sculptLevel, layer }` validated with a Zod schema.
- Produces: `<SculptSlider value onChange />` (wraps `@/components/ui/slider`, `aria-label="Muscle definition"`, min 0, max 100, step 5); `<LayerToggle value onChange />` (radiogroup `aria-label="Muscle layer"`, options "Surface" / "Deep").

- [ ] **Step 1: Failing tests.**

```ts
// useSculptPrefs.test.ts
it('defaults to { sculptLevel: 60, layer: "surface" }');
it('persists changes and restores them on remount');
it('falls back to defaults when stored JSON is malformed');            // Review Focus 1
it('falls back to defaults when stored values fail the schema (sculptLevel: 900)');
it('still works when localStorage.setItem throws');                    // Review Focus 1
// SculptControls.test.tsx
it('slider exposes role slider with aria-valuenow and responds to ArrowRight');
it('layer toggle exposes two radios and calls onChange("deep")');
it('MuscleSelector shows the slider in every view and the layer toggle only in side view');
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the hook and both controls. In `MuscleSelector`, call `useSculptPrefs`, render `SculptSlider` beside the view switcher (in both `headerControlsMode` values) and `LayerToggle` when `currentView === 'side'`; pass `sculptLevel` to `MuscleCanvas`.
- [ ] **Step 4:** Run `npx vitest run src/features/mcl`. Expected: PASS, including the existing `header-mode` and `ios` tests.
- [ ] **Step 5:** Commit `feat(mcl): sculpt slider and layer toggle with saved preferences`.

### Task 6: Layer depth rendering

**Files:**
- Create: `lib/layerVisibility.ts`, `lib/layerVisibility.test.ts`
- Modify: `svg/MuscleCanvas.tsx`, `svg/MusclePath.tsx`, `svg/MusclePath.test.tsx`, `MuscleSelector.tsx`

**Interfaces:**
- Consumes: `MuscleLayer`, `Muscle.layer`, `layer` from `useSculptPrefs`.
- Produces: `type LayerRole = 'active' | 'ghost' | 'hidden'`; `getLayerRole(muscle: Muscle, view: ViewType, layer: MuscleLayer): LayerRole`; `MuscleCanvas` prop `layer?: MuscleLayer` (default `'surface'`); `MusclePath` prop `isGhost?: boolean`.

Rules: front/back → always `active`. Side + Surface → surface `active`, deep `hidden`. Side + Deep → deep `active`, surface `ghost`.

- [ ] **Step 1: Failing tests.**

```ts
// layerVisibility.test.ts — one case per rule above, plus:
it('returns active for every muscle in front and back when layer is deep');   // Review Focus 4
// MusclePath.test.tsx
it('ghost: opacity 0.08, tabIndex -1, aria-hidden, click does not call onClick');
it('selected ghost: opacity 0.45 with its selection stroke, still not clickable');
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. `MuscleCanvas` drops `hidden` muscles, passes `isGhost`, and renders ghosts before active muscles. The layer change crossfades with `getTimedTransition('base', reduceMotion)`.
- [ ] **Step 4:** Run `npx vitest run src/features/mcl`. Expected: PASS.
- [ ] **Step 5:** Visual check: Side → Deep shows the 7 deep muscles over a ghosted surface; Front and Back are unchanged with Deep still set.
- [ ] **Step 6:** Commit `feat(mcl): surface and deep muscle layers in side view`.

### Task 7: Paired selection, mobile, close-out

**Files:**
- Create: `lib/pairedMuscles.ts`, `lib/pairedMuscles.test.ts`, `components/MuscleSelector/MuscleSelector.side.test.tsx`
- Modify: `MuscleSelector.tsx:149-156` (`handleMuscleClick`), `svg/MusclePath.tsx` (aria-label), `src/components/wizard/anatomy/AnatomyPanel.tsx:74`, `src/components/wizard/anatomy/AnatomyPanel.test.tsx`, `docs/SESSION_LOG.md`

**Interfaces:**
- Produces: `getPairedIds(id: string): string[]` — `x-left` or `x-right` → `['x-left','x-right']` when both exist in `muscles`, otherwise `[id]`.
- Produces: `getSideLabel(name: string): string` — strips a trailing ` (Left)` / ` (Right)`.
- Produces: `MusclePath` prop `label?: string` overriding `muscle.name` in the aria-label.

Side-click rule: `ids = getPairedIds(id)` minus disabled ids. If every id in `ids` is selected → remove them; otherwise → add them. Apply with one `setSelection` call (single undo step). With `multiSelect === false`, the new selection is exactly `ids`.

- [ ] **Step 1: Failing tests.**

```ts
// pairedMuscles.test.ts
expect(getPairedIds('biceps-left')).toEqual(['biceps-left', 'biceps-right']);
expect(getPairedIds('erector-spinae')).toEqual(['erector-spinae']);
expect(getSideLabel('Biceps Brachii (Left)')).toBe('Biceps Brachii');
// MuscleSelector.side.test.tsx
it('side click selects both sides in one onSelectionChange call');
it('side click on a half-selected pair selects both; next click clears both');   // Review Focus 2
it('multiSelect=false: side click replaces the selection with the pair');        // Review Focus 3
it('skips a disabled partner');                                                  // Review Focus 5
it('front-view click still toggles a single id');
it('side-view muscle is announced without "(Left)"');
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Change `AnatomyPanel` to `showSideView` (always on) and update its test.
- [ ] **Step 4:** Run `npm run test:run` and `npm run lint`. Expected: PASS, no new warnings.
- [ ] **Step 5:** Visual check in the wizard's target-muscle step at 375px and desktop, light and dark, with reduced motion on and off: side tab present on mobile, both controls reachable by keyboard, hover highlight and click details behave as before.
- [ ] **Step 6:** Add a `docs/SESSION_LOG.md` entry; commit `feat(mcl): paired side selection and side view on mobile`.
