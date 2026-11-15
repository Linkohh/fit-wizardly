# Anatomy Search, Regions and Deep Layers: Refined Build Plan

Date: 2026-11-15
Status: draft, waiting for Lincoln's approval
Refines: `BUILD-PLAN.md`, `muscle-taxonomy.json`, `regions.json` (Google Drive, `fitwizard-anatomy/`)
Builds on: the side-view sculpt work (PR 40, branch `feat/side-view-sculpt`)

## 1. Intent

A FitWizard user can find muscles two ways and get the same answer either way:

- **Type a name.** Beginners type "chest" or "calf". Trainers type "teardrop" or "clavicular head". The app understands nicknames and returns the muscle plus everything beneath it in the tree.
- **Pick a body region.** Choosing "Back" returns lats, rhomboids, erector spinae, teres major and the rotator cuff.

Both go through one engine and one highlight path. They can never disagree.

The same work adds a Surface / Deep layer to the front and back views, because the muscles the taxonomy names but the app does not draw are almost all deep muscles.

## 2. What stays from the original plan

- The tree (`muscle-taxonomy.json`) and the regions (`regions.json`) as the source data.
- One engine with `resolveSearch` and `resolveRegion`, and one shared highlight path. No duplicated logic.
- Engine code is plain TypeScript with no dependencies, including the fuzzy match.
- Mapping never invents ids. A test fails if a node points at a muscle that does not exist.
- A search box, debounced about 150ms, with the matched muscle names listed underneath.
- The acceptance test, word for word (section 9).

## 3. What changes, and why

| Original plan | Refined plan | Why |
|---|---|---|
| Add `data-muscle` attributes to an SVG file and toggle a class with `querySelectorAll` | The engine returns muscle ids. The selector highlights them through its existing `highlighted` state | The selector draws muscles in React from `src/features/mcl/data/muscles.ts`. Changes made to the drawing from outside are lost on the next redraw and bypass selection, hover, sculpt and layers |
| Read `src/data/anatomyPaths.ts` and reuse its bindings | Bind to `src/features/mcl/data/muscles.ts` | `anatomyPaths.ts` is the exercise library's older drawing. The wizard's selector does not use it |
| `svgPathIds[]` on each node | `muscleIds[]` on each node, holding the app's muscle ids without the side (`biceps`, not `biceps-left`) | The app's shapes are identified by muscle id. One node covers left and right |
| Clickable region outlines with `data-region` | A row of region chips above the body map | Tapping the body already selects a single muscle. A region outline on top of it would compete for the same tap |
| Framework-agnostic everything | Engine and data stay framework-free. The search box and chips follow the app's conventions (React, Zod, existing components) | Avoids a second, parallel muscle system inside the app |
| "Lincoln will paste his SVG path list" | Not needed | The shapes are read from the repo |
| Use the bundled copy in `FITWIZARD-ANATOMY-COMPLETE.md` | Use the two standalone JSON files | The bundled copy is damaged: stray keys, a node whose parent is `"parent"`, and "legs" containing "head" |

## 4. Fixes to `muscle-taxonomy.json`

| Problem | Fix |
|---|---|
| "calf" would also light up the shin, because Tibialis Anterior sits under Calves. The acceptance test expects only gastrocnemius, soleus and plantaris | Move `tibialis_anterior` to parent `legs`. Add alias "shins" |
| `calves` has no parent, so "legs" misses the calves | Set `calves` parent to `legs` |
| "long head" is an alias of both Triceps Long Head and Biceps Femoris | Triceps keeps "long head". Biceps Femoris gets "hamstring long head", "outer hamstring" |
| "rotator cuff" only points at Infraspinatus | Add a group node `rotator_cuff` (parent `back`, alias "rotator cuff", "cuff") holding infraspinatus, supraspinatus, subscapularis, teres minor. Remove the alias from infraspinatus |
| "hip flexors" and "glutes" are aliases of the Hips root, so either lights up the whole hip | Remove both from `hips`. Add a group node `glutes` (alias "glutes", "butt", "booty") holding gluteus maximus, medius, minimus. "hip flexors" becomes an alias of `iliopsoas` |
| "abs" is an alias of both Core and Rectus Abdominis | Keep it on `rectus_abdominis` only |
| The app draws upper, middle and lower traps; the tree has one Trapezius whose aliases mention all three | Add child nodes `trapezius_upper`, `trapezius_middle`, `trapezius_lower` and move "upper traps", "mid traps", "lower traps" onto them |
| The app draws upper, middle and lower abs; the tree does not | Add child nodes `abs_upper`, `abs_middle`, `abs_lower` under `rectus_abdominis` |
| Trapezius has parent `neck` | Move to parent `back`. It stays in the neck, shoulders and back regions through `regions.json` |
| `obliques` lumps external and internal | Keep `obliques` as the group; add `external_oblique` (drawn today) and `internal_oblique` (deep, optional artwork) |
| `head` and `feet` have no muscles and no shapes | Keep the nodes, mark them `selectable: false`, leave them out of the chips and search results |

## 5. Fixes to `regions.json`

- `legs` gains nothing new, but `calves` children now resolve through the tree, so the list can shrink to top-level ids: `["legs"]`. Same for the other regions: each lists its top-level ids and the engine walks the tree. Cross-region muscles stay listed explicitly (rotator cuff in both `shoulders` and `back`, trapezius in `neck`, `shoulders` and `back`).
- `hips` becomes `["hips"]`, which now reaches the glutes group, iliopsoas and adductors.
- The chips shown in the app: Neck, Shoulders, Chest, Back, Arms, Core, Hips, Legs. Head and Feet are not shown.

## 6. Mapping the tree to the app's muscles

Already drawn (maps today):

| Tree node | App muscle id |
|---|---|
| sternocleidomastoid | `sternocleidomastoid` |
| trapezius_upper / middle / lower | `trapezius-upper`, `trapezius-middle`, `trapezius-lower` |
| deltoid_anterior / lateral / posterior | `anterior-deltoid`, `lateral-deltoid`, `posterior-deltoid` |
| pectoralis_major | `pectoralis-major` |
| serratus_anterior | `serratus-anterior` |
| latissimus_dorsi, rhomboids, erector_spinae, teres_major, infraspinatus | `latissimus-dorsi`, `rhomboid`, `erector-spinae`, `teres-major`, `infraspinatus` |
| biceps_brachii, triceps_brachii, brachialis, brachioradialis | `biceps`, `triceps`, `brachialis`, `brachioradialis` |
| forearm_flexors, forearm_extensors | `forearm-flexors`, `forearm-extensors` |
| rectus_abdominis, abs_upper / middle / lower | `rectus-abdominis`, `abs-upper`, `abs-middle`, `abs-lower` |
| external_oblique | `external-oblique` |
| gluteus_maximus, gluteus_medius, adductors | `gluteus-maximus`, `gluteus-medius`, `adductor` |
| rectus_femoris, vastus_lateralis, vastus_medialis | `rectus-femoris`, `vastus-lateralis`, `vastus-medialis` |
| biceps_femoris, semitendinosus | `biceps-femoris`, `semitendinosus` |
| gastrocnemius, soleus, tibialis_anterior | `gastrocnemius`, `soleus`, `tibialis-anterior` |

Not drawn yet (new artwork, section 8):

| Tree node | View | Layer |
|---|---|---|
| pectoralis_minor | front | deep |
| subscapularis | front | deep |
| transverse_abdominis | front | deep |
| iliopsoas | front | deep |
| vastus_intermedius | front | deep |
| supraspinatus | back | deep |
| teres_minor | back | deep |
| gluteus_minimus | back | deep |
| semimembranosus | back | deep |
| plantaris | back | deep |
| internal_oblique | front | deep (optional) |

Heads of a muscle (my call, see section 10): `pec_major_clavicular`, `pec_major_sternal`, `tri_long`, `tri_lateral`, `tri_medial`, `biceps_femoris_short` have no shape of their own in phases 1 to 4. They are searchable and listed by name, and they highlight their parent's shape. Drawing them as separate shapes is phase 5.

## 7. Behaviour

- **Search.** As you type, matching muscles light up on the body and their names appear under the box, grouped under the node that matched ("Chest: Pectoralis Major, Pectoralis Minor, Serratus Anterior"). Nothing is selected for the workout yet.
- **Selecting from search.** Tapping a name in the list selects that muscle. A "Select all" button selects every match. (My call, see section 10.)
- **Region chips.** Tapping a chip lights up the region the same way and shows the same list with the same "Select all".
- **Clear.** Clearing the box or tapping the active chip again removes the highlight. Selections stay.
- **Left and right.** One tree node always means both sides.
- **Views.** If none of the matches are on the current view, the selector switches to the view showing the most matches. If some are on another view, the list marks them ("on back view").
- **Layers.** If every match on the current view is deep, the selector switches to Deep. Otherwise deep matches show as highlighted ghosts.
- **Match order.** Exact name or alias, then starts-with, then contains, then one typo allowed for words of 5 or more letters (two for 8 or more).

## 8. Deep layers on front and back

- The Surface / Deep toggle appears on all three views.
- **Back:** the 11 deep muscles already drawn there move behind the toggle (rhomboids, teres major, infraspinatus, erector spinae, gluteus medius, soleus). On Surface they are no longer clickable; a selected one still shows as a ghost. Five new deep shapes are added (section 6).
- **Front:** five new deep shapes are added, joining brachialis.
- Same ghost, sculpt and selected-on-other-layer rules as the side view.
- Each new muscle needs a name, description and exercise links, and an entry in `src/lib/muscleMapping.ts` so it counts toward the right workout group.

## 9. Acceptance test

Checked by automated tests against the engine, then by eye in the wizard.

- "chest" returns pectoralis major, pec major clavicular head, pec major sternal head, pectoralis minor, serratus anterior.
- "triceps" returns the long, lateral and medial heads.
- The Back chip returns latissimus dorsi, rhomboids, erector spinae, teres major and the four rotator cuff muscles.
- "calf" returns gastrocnemius, soleus, plantaris, and not the shin.
- Clear removes the highlight.
- For any muscle reachable both ways, search and chip produce the same highlighted ids.

Extra checks added by this plan:

- Every node's parent exists and there are no loops.
- Every `muscleIds` entry exists in `muscles.ts`.
- No alias belongs to two unrelated nodes.
- Every region id in `regions.json` exists in the tree.

## 10. Calls I made that you can overturn

1. **Search highlights first, selects on a second tap.** The original plan only says "highlight". Auto-selecting everything on each keystroke would fill the workout with muscles the person was only browsing.
2. **Region chips instead of clickable body outlines.** See section 3.
3. **Muscle heads highlight their parent's shape until phase 5.** Splitting the pec, triceps and hamstring shapes changes ids that saved workouts and exercise links already use, so it is safer as its own step.
4. **Internal oblique is optional.** It is in the tree for search; artwork only if you want it.
5. **Side view does not get the ten new deep muscles in this plan.** It keeps its current seven.
6. **Labels stay English** for now, like the rest of the selector.

## 11. Phases

Each phase ends with tests passing and can be reviewed on its own.

1. **Data.** Copy the two JSON files into `src/features/mcl/data/taxonomy/`, apply sections 4 and 5, fill `muscleIds` for everything already drawn, add the validation tests.
2. **Engine.** `src/features/mcl/lib/anatomyEngine.ts`: build the tree once, `resolveSearch`, `resolveRegion`, both returning the same result shape. Acceptance tests that do not need new artwork pass here.
3. **Search and chips in the selector.** Replace the current name-only search, add the result list, the chips, the shared highlight path, and the view and layer switching.
4. **Deep layers.** Toggle on back and front, the ten new shapes, their data and mappings. The full acceptance test passes here.
5. **Optional.** Separate shapes for muscle heads; new deep muscles on the side view; translations.

## 12. Not in this plan

- Hands, feet and deep neck muscles. The app has no shapes for them.
- Changes to the exercise library's separate drawing (`src/data/anatomyPaths.ts`).
- Changing how workouts are generated from the selected muscles.

## 13. Where the work goes

A new branch started from `feat/side-view-sculpt`, because the layer toggle and ghost rendering live there. If PR 40 merges first, start from `preview_b` instead. Nothing is added to PR 40.

## 14. Changes made during the build (2026-11-15)

- **View switching (section 7):** the selector goes to the view showing the most matches, and the current view wins ties. The earlier rule (stay if any match is on the current view) left the Back chip on the front view.
- **Mixed layers (section 7):** a match on the other layer shows as a highlighted ghost on both Surface and Deep, so no match is ever invisible.
- **Result list (section 7):** one slim row above the body map with the names scrolling sideways. A taller list covered the muscles it was highlighting. Group headings such as "Calves" are not listed as muscles.
- **Search box:** now shown on phones as well as desktop.
- **Chip names:** announced to screen readers as "Back region" and so on, so they do not clash with the Front / Back view buttons.
- **Rotator cuff workout group:** the new cuff muscles count toward `upper_back`, matching the existing infraspinatus, not `rear_deltoid`.
- **Non-Apple phone sizing:** the panel is `min(84dvh, 720px)` and the selected list takes 26% while empty, 40% once muscles are selected. Measured at 375x812: body map 319px empty, 281px while searching, 225px with muscles selected, 188px with both.
- **Phase 5 (optional) not built:** separate shapes for muscle heads, the new deep muscles on the side view, internal oblique artwork, translations.
