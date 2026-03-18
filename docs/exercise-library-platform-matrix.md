# Exercise Library Platform Matrix

Last updated: 2026-03-14

## Support target
- Evergreen browsers only
- Browser-first compatibility across macOS, Windows, Linux, iOS, iPadOS, and Android
- Existing Capacitor iOS shell included as a smoke target
- Existing Android Capacitor shell included as a secondary smoke target
- No desktop-native packaging in scope

## Acceptance matrix
| Surface | Primary target | Verification mode |
| --- | --- | --- |
| Desktop web | Safari and Chrome on macOS | Automated smoke + manual spot check |
| Desktop web | Edge and Chrome on Windows | Automated smoke |
| Desktop web | Chrome and Firefox on Linux | Automated smoke |
| Tablet web | Safari on iPadOS, portrait and landscape | Automated smoke + manual spot check |
| Mobile web | Safari on iPhone | Automated smoke + manual spot check |
| Mobile web | Chrome on Android | Automated smoke + manual spot check |
| Native shell | Capacitor iOS | Manual smoke |
| Native shell | Capacitor Android | Manual smoke if local project launches cleanly |

## Automated verification
- Focused Vitest coverage:
  - `npm run test:exercise-library`
- Browser-matrix smoke:
  - `npm run test:playwright`

The Playwright smoke suite covers `/exercises` in Chromium, Firefox, and WebKit across desktop, tablet, and mobile viewports. It forces the library onto its local-first boot path by aborting the live `wger` request so the verification stays deterministic.

## Manual smoke checklist
- Load `/exercises` and verify the page boots from local data with the backup-source state card.
- Search, filter, clear filters, and load more results.
- Open and close the detail surface on desktop, tablet, and mobile.
- Verify tablet uses the intermediate overlay mode instead of the desktop dialog.
- Verify phone uses the full-height drawer with safe-area spacing and an explicit close button.
- Verify media cards render across photo, muscle-map, and branded-fallback states without clipped controls.
- Verify planner and workout flows still resolve exercises from the curated local dataset with no dependency on the exercise-library route.

## Commands for native smoke
- iOS sync:
  - `npm run ios:sync`
- iOS live run:
  - `npm run ios:dev`
- Android sync:
  - `npx cap sync android`
- Android open:
  - `npx cap open android`
