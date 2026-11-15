# Anatomy Taxonomy, Regions and Deep Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Search by nickname and pick by body region in the muscle selector, both through one engine and one highlight path, and add Surface / Deep layers to the front and back views.

**Architecture:** The taxonomy tree and regions live as JSON in `src/features/mcl/data/taxonomy/`, validated with Zod at load. A dependency-free engine (`lib/anatomyEngine.ts`) turns a query or a region into one result shape that carries app muscle ids. The selector keeps one piece of state (`anatomyFocus`) fed by both the search box and the region chips, and passes it to the canvas as `focus` highlights.

**Tech Stack:** React 19, TypeScript, Zod 4, Vitest + Testing Library, Tailwind. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-15-anatomy-taxonomy-and-deep-layers-design.md`

**Branch:** `feat/anatomy-taxonomy-deep-layers`, created from `feat/side-view-sculpt`.

## Global Constraints

- No `any`. No changes under `src/components/ui/`. Never stage `ios/App/App/config 4.xml`.
- `lib/anatomyEngine.ts` imports only the taxonomy data module, `data/muscles.ts` and types. No React, no DOM, no third-party package.
- Search and region selection must call the same function to produce highlights (`toFocusHighlights`). No second code path.
- A taxonomy node's `muscleIds` hold app ids without the side suffix (`biceps`, not `biceps-left`). Every entry must exist in `data/muscles.ts` as `id`, `id-left` or `id-right`.
- New muscle paths: viewBox `0 0 200 440`, absolute `M`/`C`/`L`/`Z` only, at least one `C`, closed with `Z`.
- Existing muscle ids, front/back surface paths and `MCL_TO_LEGACY_MAP` entries do not change.
- Labels are hardcoded English, matching the rest of the selector.
- Before each commit: `npm run test:run`, `npx eslint` on touched folders, and `npx tsc -p tsconfig.app.json --noEmit --types node,vite/client,vitest/globals,@testing-library/jest-dom` (the plain `npm run typecheck` is unreliable on this machine).

## Review Focus

1. Query of 0 or 1 characters, or only spaces: no results, no highlight, no error. (Task 2)
2. Mixed case and punctuation ("TRAPS", "bi's", " Calf "): same result as the clean form. (Task 2)
3. Typo tolerance must not join short unrelated words: "abs" must not return Arms; "lat" must not return "lateral head" above Latissimus Dorsi. (Task 2)
4. Every match is on another view, or is deep while on Surface: the selector switches view / layer; nothing is silently invisible. (Task 3)
5. A back deep muscle selected before this change (for example `rhomboid-left` in a saved wizard) still shows on Surface as a selected ghost and still counts in the selection. (Task 5)

---

### Task 1: Taxonomy data and validation

**Files:**
- Create: `src/features/mcl/data/taxonomy/muscle-taxonomy.json`, `src/features/mcl/data/taxonomy/regions.json`
- Create: `src/features/mcl/data/taxonomy/index.ts`
- Test: `src/features/mcl/data/taxonomy/taxonomy.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface TaxonomyNode { id: string; name: string; parent: string | null; aliases: string[]; region: string; muscleIds: string[]; selectable: boolean }
  export const taxonomyNodes: readonly TaxonomyNode[]
  export const regions: Readonly<Record<string, string[]>>
  export const REGION_CHIPS: readonly { id: string; label: string }[]  // neck, shoulders, chest, back, arms, core, hips, legs
  ```

- [ ] **Step 1: Write the failing tests** in `taxonomy.test.ts`:
  - every `parent` is `null` or an existing node id; walking parents from any node terminates
  - node ids are unique
  - every `muscleIds` entry resolves to at least one id in `muscles` (`x`, `x-left` or `x-right`)
  - every id listed in `regions` exists in the tree
  - no alias (lowercased) appears on two nodes unless one is an ancestor of the other
  - `tibialis_anterior.parent === 'legs'`, `calves.parent === 'legs'`, `trapezius.parent === 'back'`
  - `rotator_cuff` children are exactly infraspinatus, supraspinatus, subscapularis, teres_minor; `glutes` children are gluteus_maximus, gluteus_medius, gluteus_minimus
  - `head` and `feet` have `selectable: false`
- [ ] **Step 2:** Run `npx vitest run src/features/mcl/data/taxonomy` and confirm it fails (module missing).
- [ ] **Step 3:** Copy the two standalone JSON files from `/Users/lincoggy/My Drive/fitwizard-anatomy/` and apply spec sections 4 and 5. Rename `svgPathIds` to `muscleIds` and fill it from spec section 6 "Already drawn". Nodes for muscles not drawn yet keep `muscleIds: []` until Tasks 6 and 7. Regions list top-level ids plus explicit cross-region muscles (`rotator_cuff` in shoulders and back; `trapezius` in neck, shoulders, back).
- [ ] **Step 4:** Implement `index.ts`: Zod schemas for both files, parse at module load, throw with the Zod message on failure, default `selectable` to `true`.
- [ ] **Step 5:** Run the tests, confirm pass. Commit `feat(mcl): muscle taxonomy and region data with validation`.

### Task 2: Anatomy engine

**Files:**
- Create: `src/features/mcl/lib/anatomyEngine.ts`
- Test: `src/features/mcl/lib/anatomyEngine.test.ts`

**Interfaces:**
- Consumes: Task 1 exports; `muscles` from `data/muscles.ts`; `MuscleHighlight` from `types`.
- Produces:
  ```ts
  export interface AnatomyMember { node: TaxonomyNode; shownAs: TaxonomyNode | null; muscleIds: string[] }
  export interface AnatomyResult { source: 'search' | 'region'; node: TaxonomyNode; members: AnatomyMember[]; muscleIds: string[] }
  export function resolveSearch(query: string): AnatomyResult[]      // best match first, [] when normalized query is shorter than 2
  export function resolveRegion(regionId: string): AnatomyResult | null
  export function toFocusHighlights(muscleIds: string[]): MuscleHighlight[]  // type 'focus', intensity 100
  export function normalizeQuery(raw: string): string  // lowercase, trim, collapse spaces, drop apostrophes and punctuation
  ```
- Rules the signatures do not settle:
  - `members` is the matched node plus all descendants that are `selectable`, in tree order. `muscleIds` on a member are app ids expanded to both sides and filtered to ids that exist.
  - A member with no own `muscleIds` and no children takes its nearest ancestor's ids and sets `shownAs` to that ancestor (muscle heads). A member with no ids anywhere (not drawn yet) keeps `muscleIds: []`, `shownAs: null`.
  - `AnatomyResult.muscleIds` is the de-duplicated union of its members' ids.
  - Ranking: exact name/alias (0), starts-with (1), contains (2), edit distance 1 for query length 5 to 7 or distance up to 2 for length 8+ (3). Ties broken by shallower tree depth, then name. Fuzzy compares against whole names/aliases and their individual words.
  - `resolveRegion` builds a synthetic root result whose `node` is the first listed id of the region and whose members are the union of every listed id's subtree.

- [ ] **Step 1: Write the failing tests** (names are the assertions):
  - `"chest" lists pectoralis major, both pec heads, pectoralis minor, serratus anterior`
  - `"triceps" lists long, lateral and medial heads, each shownAs Triceps Brachii, muscleIds triceps-left and triceps-right`
  - `"calf" lists gastrocnemius, soleus, plantaris and not tibialis anterior`
  - `region "back" lists latissimus dorsi, rhomboids, erector spinae, teres major and the four rotator cuff muscles`
  - `"teardrop" returns vastus medialis first`; `"traps"` returns Trapezius with the three parts
  - `"TRAPS", "bi's", " Calf " equal their clean forms` (Review Focus 2)
  - `"", " ", "a" return []` (Review Focus 1)
  - `"abs" does not return Arms; "lat" returns Latissimus Dorsi first` (Review Focus 3)
  - `"gastrocnemus" (typo) returns gastrocnemius`
  - `search "back" and region "back" give the same muscleIds for every member they share`
  - `toFocusHighlights maps ids to focus highlights at intensity 100`
- [ ] **Step 2:** Run `npx vitest run src/features/mcl/lib/anatomyEngine.test.ts`, confirm fail.
- [ ] **Step 3:** Implement. Build parent/children maps once at module load. Levenshtein written inline.
- [ ] **Step 4:** Run, confirm pass. Commit `feat(mcl): anatomy engine for search and region lookup`.

### Task 3: Search through the engine, shared highlight

**Files:**
- Create: `src/features/mcl/lib/anatomyFocus.ts` (+ `anatomyFocus.test.ts`)
- Create: `src/features/mcl/components/MuscleSelector/ui/AnatomyResultList.tsx`
- Modify: `src/features/mcl/components/MuscleSelector/ui/SearchBar.tsx`
- Modify: `src/features/mcl/components/MuscleSelector/MuscleSelector.tsx`
- Test: `src/features/mcl/components/MuscleSelector/MuscleSelector.anatomy.test.tsx`

**Interfaces:**
- Consumes: Task 2 exports; `getLayerRole` from `lib/layerVisibility.ts`.
- Produces:
  ```ts
  // anatomyFocus.ts
  export function pickViewAndLayer(muscleIds: string[], current: { view: ViewType; layer: MuscleLayer }, allowSide: boolean): { view: ViewType; layer: MuscleLayer }
  // SearchBar props
  interface SearchBarProps { onResultsChange: (result: AnatomyResult | null) => void; onMuscleSelect: (muscle: Muscle) => void }
  // AnatomyResultList props
  interface AnatomyResultListProps { result: AnatomyResult; currentView: ViewType; selectedIds: string[]; onSelectMember: (member: AnatomyMember) => void; onSelectAll: () => void; onClear: () => void }
  ```
- Rules:
  - `pickViewAndLayer`: stay on the current view if any id is drawn there, else the view with the most ids (front, back, side order on ties; side only if `allowSide`). Layer becomes `deep` when every id drawn on the chosen view is deep, `surface` when every one is surface, else unchanged.
  - `SearchBar` debounces 150ms, calls `resolveSearch`, reports the first result through `onResultsChange` (or `null`). It no longer imports `searchMuscles`.
  - `MuscleSelector` holds `const [anatomyFocus, setAnatomyFocus] = useState<AnatomyResult | null>(null)`. One handler `applyAnatomyFocus(result)` sets it and applies `pickViewAndLayer`. The canvas receives `[...(highlightedMuscles ?? []), ...toFocusHighlights(anatomyFocus?.muscleIds ?? [])]`.
  - `AnatomyResultList` renders under the header controls: heading "{node.name}: {n} muscles", one button per member (name, plus "shown as {shownAs.name}" or "on {view} view" or "not drawn yet" where relevant), "Select all" and a clear button. Selecting a member adds its `muscleIds` to the selection with one `setSelection` call; members with no ids are disabled.

- [ ] **Step 1: Write failing tests.** `anatomyFocus.test.ts`: stays on current view when a match is there; moves to back for `['rhomboid-left']` from front; layer deep when all matches on the view are deep (Review Focus 4). `MuscleSelector.anatomy.test.tsx` (fake timers): typing "chest" shows a list containing "Pectoralis Major" and "Serratus Anterior" and marks `pectoralis-major-left` highlighted without selecting it; clicking "Select all" calls `onSelectionChange` with ids including `pectoralis-major-left` and `serratus-anterior-right`; clearing the box removes the list and keeps the selection.
- [ ] **Step 2:** Run both, confirm fail.
- [ ] **Step 3:** Implement `pickViewAndLayer`, `AnatomyResultList`, the `SearchBar` change and the selector wiring.
- [ ] **Step 4:** Run the feature tests (`npx vitest run src/features/mcl`), fix any existing test that relied on the old `SearchBar` props. Commit `feat(mcl): nickname search with result list and shared focus highlight`.

### Task 4: Region chips

**Files:**
- Create: `src/features/mcl/components/MuscleSelector/ui/RegionChips.tsx`
- Modify: `src/features/mcl/components/MuscleSelector/MuscleSelector.tsx`
- Test: add to `MuscleSelector.anatomy.test.tsx`

**Interfaces:**
- Consumes: `REGION_CHIPS`, `resolveRegion`, `applyAnatomyFocus` from Task 3.
- Produces: `interface RegionChipsProps { activeRegionId: string | null; onToggle: (regionId: string) => void }`; root element `data-testid="region-chips"`, each chip a `button` with `aria-pressed`.

- [ ] **Step 1: Write failing tests:** clicking "Back" shows the result list with "Latissimus Dorsi" and "Infraspinatus"; clicking it again clears the list; typing in search clears the active chip; for the shared member Latissimus Dorsi, the highlighted ids after the "Back" chip equal those after typing "lats".
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement. Chips sit in the controls row in a horizontally scrollable strip (`overflow-x-auto`, no page overflow at 375px). Toggle calls `applyAnatomyFocus(resolveRegion(id))` or `applyAnatomyFocus(null)`.
- [ ] **Step 4:** Run, confirm pass. Commit `feat(mcl): region chips sharing the search highlight path`.

### Task 5: Layers on every view

**Files:**
- Modify: `src/features/mcl/lib/layerVisibility.ts` (+ its test)
- Modify: `src/features/mcl/components/MuscleSelector/MuscleSelector.tsx` (toggle no longer side-only)
- Modify tests: `MuscleSelector.layer.test.tsx`, `MuscleSelector.side.test.tsx`

**Interfaces:**
- Produces: `getLayerRole(muscle, view, layer)` keeps its signature; the `view !== 'side'` early return is removed, so the rule is the same on all views.

- [ ] **Step 1: Update tests first:** `getLayerRole` returns `hidden` for `rhomboid-left` on back/surface and `active` on back/deep; `ghost` for `latissimus-dorsi-left` on back/deep; the layer toggle renders on front and back; on back/Surface a pre-selected `rhomboid-left` is still drawn as a selected ghost (Review Focus 5).
- [ ] **Step 2:** Run, confirm the new expectations fail.
- [ ] **Step 3:** Remove the early return; render `LayerToggle` on all views.
- [ ] **Step 4:** Run `npx vitest run src/features/mcl src/components/wizard`, confirm pass. Commit `feat(mcl): surface and deep layers on front and back views`.

### Task 6: Front deep muscles

**Files:**
- Modify: `src/features/mcl/data/muscles.ts`, `src/lib/muscleMapping.ts`, `src/features/mcl/data/taxonomy/muscle-taxonomy.json`
- Test: `src/features/mcl/data/deepAnatomy.test.ts`

**Interfaces:**
- Produces new muscle ids, all `layer: 'deep'`, `views: ['front']`:

| id | name | MCL group | legacy group | host shapes (front) |
|---|---|---|---|---|
| `pectoralis-minor-left/right` | Pectoralis Minor | chest | chest | pectoralis-major |
| `subscapularis-left/right` | Subscapularis | shoulders | rear_deltoid | pectoralis-major, anterior-deltoid |
| `transverse-abdominis` | Transverse Abdominis | core | abs | rectus-abdominis, external-oblique |
| `iliopsoas-left/right` | Iliopsoas | legs | hip_flexors | abs-lower, external-oblique, adductor, rectus-femoris |
| `vastus-intermedius-left/right` | Vastus Intermedius | legs | quads | rectus-femoris |

- [ ] **Step 1: Write failing tests** in `deepAnatomy.test.ts` (shared with Task 7): each id exists with `layer: 'deep'`; each front path uses only absolute M/C/L/Z, has a `C`, ends in `Z`; at least 90% of each path's anchor points (`getAnchorPoints`) fall inside the bounding box of its host shapes on the same side, expanded by 4 units; left and right paths mirror around x = 100 within 1 unit; each id has an entry in `MCL_TO_LEGACY_MAP`; the taxonomy node's `muscleIds` contains the base id.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Draw the paths. Draw the left side, generate the right by mirroring x → 200 − x. Fill `scientificName`, `function`, `exercises` (two or three real exercise names), `relatedMuscles`. Add legacy map entries and taxonomy `muscleIds`.
- [ ] **Step 4:** Run the feature tests, confirm pass. Render the front view on Deep in the browser and compare by eye; adjust paths that read as slivers or sit outside the body. Commit `feat(mcl): front deep muscles`.

### Task 7: Back deep muscles

**Files:** same three data files and `deepAnatomy.test.ts`.

**Interfaces:**
- Produces new muscle ids, all `layer: 'deep'`, `views: ['back']`:

| id | name | MCL group | legacy group | host shapes (back) |
|---|---|---|---|---|
| `supraspinatus-left/right` | Supraspinatus | shoulders | rear_deltoid | trapezius-upper, trapezius-middle |
| `teres-minor-left/right` | Teres Minor | shoulders | rear_deltoid | posterior-deltoid, infraspinatus, teres-major |
| `gluteus-minimus-left/right` | Gluteus Minimus | glutes | glutes | gluteus-maximus, gluteus-medius |
| `semimembranosus-left/right` | Semimembranosus | legs | hamstrings | semitendinosus, biceps-femoris |
| `plantaris-left/right` | Plantaris | calves | calves | gastrocnemius |

- [ ] **Step 1:** Extend `deepAnatomy.test.ts` with these ids (same assertions, back view).
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Draw, mirror, fill data, legacy map, taxonomy `muscleIds`.
- [ ] **Step 4:** Run, confirm pass; check the back view on Deep by eye. Commit `feat(mcl): back deep muscles`.

### Task 8: Full acceptance and wiring check

**Files:**
- Test: `src/features/mcl/lib/anatomyAcceptance.test.ts`
- Modify: `docs/superpowers/specs/2026-11-15-anatomy-taxonomy-and-deep-layers-design.md` only if a call changed during the build

- [ ] **Step 1: Write the acceptance test** from spec section 9, now asserting drawn ids: "chest" `muscleIds` include `pectoralis-minor-left` and `serratus-anterior-right`; "calf" include `plantaris-left` and exclude `tibialis-anterior-left`; region "back" include `supraspinatus-left`, `teres-minor-right`, `infraspinatus-left`; every `selectable` leaf node outside head/feet/internal_oblique and the six muscle-head nodes has non-empty own `muscleIds`.
- [ ] **Step 2:** Run the full suite, lint and the explicit type-check from Global Constraints. All pass.
- [ ] **Step 3:** Browser check in the wizard at desktop width and 375x812: type "chest", "triceps", "calf"; tap the Back chip; Select all; clear; toggle Deep on front and back; no horizontal overflow; no console errors.
- [ ] **Step 4:** Commit `test(mcl): anatomy acceptance test`.
