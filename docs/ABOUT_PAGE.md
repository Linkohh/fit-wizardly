# About Page, "What's New" & Back Navigation

> Introduced in **v1.0.0** (PR #36, branch `LinC/about-me` → `preview_b`).
> This guide explains what exists, where it lives, and how to maintain it.

---

## 1. What was built

| Feature | Where users see it |
|---|---|
| **About FitWizard page** (`/about`) | Story, creator, mission, credits, "Start your plan" CTA |
| **What's new** release notes | Tap the version pill on `/about`, or Settings → About & Support → Version |
| **About & Support** card | Bottom of Settings & Profile (`/profile`) |
| **Footer redesign** | Web only: About · Guide · Privacy · Terms · Disclaimer |
| **Menu quick links** | Native apps only: About · Help · Legal row in the menu drawer |
| **Back button** | Top of About, Legal and Guide |
| **Swipe-back gesture** | Touch devices: swipe from the left edge |
| **Android back button** | Native Android: steps back through app history |

### Placement strategy (why About is where it is)
About is deliberately **discoverable but not featured**. It never appears in the primary nav.

| Platform | Where About appears |
|---|---|
| **Web (any size)** | Footer link + Settings card + ⌘K command |
| **Native iOS / Android** | Menu drawer quick links (with a one-time "New" dot) + Settings card. The footer is hidden. |

Each platform gets one lightweight, conventional entry point plus Settings, with no duplicates on screen.

---

## 2. File map

```
src/pages/About.tsx                      Page shell (composes sections)
src/components/about/
  AboutHero.tsx                          Icon, easter egg, parallax/tilt, version pill
  AboutStats.tsx                         Count-up stats
  StoryTimeline.tsx                      "Our Story" (scroll-drawn timeline)
  CreatorCard.tsx                        Photo + aura, bio, flip to "Why I lift"
  MissionTiles.tsx                       Expandable mission principles
  AboutCta.tsx                           "Start your plan" → /wizard
  AboutSection.tsx                       Shared card + reveal animation
  ReadingProgress.tsx                    Progress bar under the header
  WhatsNewPanel.tsx                      Release notes (drawer/sheet/dialog)
  AboutSupportCard.tsx                   Settings "About & Support" card
  aboutMotion.ts                         Shared motion tokens
src/data/changelog.ts                    Release notes data (edit this per release)
src/components/navigation/
  BackButton.tsx                         "‹ Back" / "Back to Home"
  EdgeSwipeBack.tsx                      Swipe-back indicator (mounted in App.tsx)
src/components/header/DrawerQuickLinks.tsx   Native drawer About · Help · Legal row
src/components/Footer.tsx                Web footer
src/hooks/
  useGoBack.ts                           Safe back (falls back to Home on first page)
  useEdgeSwipeBack.ts                    Touch gesture logic
  useAndroidBackButton.ts                Android system back (@capacitor/app)
  useLongPress.ts                        Hold detection for the easter egg
src/lib/
  appInfo.ts                             APP_VERSION (from package.json)
  aboutSeen.ts                           "New" dot state for the drawer
  changelogSeen.ts                       Unread dot state for What's new
public/creator-avatar.jpg                480px creator portrait
public/app-icon-384.png                  Hero icon
```

All copy lives in `src/locales/{en,es,pt,de}.json` under `about.*`, `footer.*`, `navigation.*`, `header.quick_links.*` and `profile.about_support.*`. The long-form About copy is English; the other locales fall back to it.

---

## 3. How to…

### Ship a new version (release notes)
1. Bump `"version"` in `package.json` (and the native versions in Xcode and `android/app/build.gradle`).
2. Add an entry at the **top** of `CHANGELOG` in `src/data/changelog.ts`:
   ```ts
   {
     version: '1.1.0',
     name: 'Short Name',
     date: '2026-10',
     highlights: {
       new: ['…'],
       improved: ['…'],
       fixed: ['…'],
     },
   },
   ```
3. Keep bullets short and user-facing: what changed, not how.

`src/data/changelog.test.ts` **fails CI** if the top entry doesn't match `package.json`, if versions aren't newest-first, or if an entry is empty. Users see an unread dot on the version pill until they open the new notes.

> Versions **0.1.0 – 0.7.0** are retroactive milestones grouped from git history (the repo had no release tags). Tag future releases in git (`git tag v1.1.0`) to keep history and notes aligned.

### Add "Get in Touch" social links
The section is **hidden** until public links exist; a personal email was intentionally not published. To add it:
1. Add the handles (e.g., Instagram, LinkedIn) as `about.contact.*` strings.
2. Render a section in `About.tsx` where the placeholder comment sits (after Credits), using `AboutSection` with large, tappable buttons.

### Replace the creator photo
Export a **square, face-centered, 480×480** JPEG to `public/creator-avatar.jpg`. 480px keeps it sharp at 160px on 3× screens. On macOS:
```bash
sips -s format jpeg -s formatOptions 82 --cropToHeightWidth 1000 1000 --cropOffset <top> <left> source.jpg --out public/creator-avatar.jpg && sips -Z 480 public/creator-avatar.jpg
```

### Edit the story, mission or bio
All copy is in `src/locales/en.json` → `about.story`, `about.mission`, `about.creator`, `about.cta`. `About.test.tsx` fails if any `[bracketed placeholder]` text reaches the page.

---

## 4. Behavior details

- **Back button:** returns to the previous in-app page. When the page was opened directly (shared link, fresh load), it reads "Back to Home" and goes to `/` instead of leaving the app (`location.key === 'default'` check in `useGoBack`).
- **Swipe-back:**
  - It starts within 24px of the left edge and triggers after 80px.
  - It cancels on vertical scroll, and it's ignored while a menu or dialog is open.
  - It's disabled on `/` and `/onboarding`.
  - After release it waits 350ms and skips if the browser already went back (`popstate`), so iOS Safari / Chrome gestures never cause a double back.
- **Android back:** app history → Home → minimize the app (never closes it). This requires `npx cap sync` after installing plugins (already run; see `capacitor.settings.gradle` / `Package.swift`).
- **Reduced motion:** every animation (parallax, tilt, flips, aura, heartbeat, confetti, reveals) respects the OS setting and the in-app setting via `useMotionPreferences()`.
- **Responsive surfaces:**
  - **What's new** uses `useViewportTier()`: phone → vaul `Drawer`, tablet → `Sheet`, desktop → `Dialog`, the same split as the exercise library detail modal.
  - **Creator portrait:** 128 / 144 / 160px.
  - **Hero icon:** 112 / 128px.

---

## 5. Known follow-ups

- **Device checks:** on-device testing of swipe-back, haptics and the Android back button (unit-tested only so far).
- **Get in Touch:** add it once the Instagram / LinkedIn handles are provided.
- **Legal review:** have the "not medical advice" guidance on `/legal` reviewed before store release.
- **Repo cleanup:** pre-existing duplicate files `ios/App/App/config {2,3}.xml` and `android/app/src/main/res/xml/config {2,3}.xml` are tracked in git (committed in `ff07994`) and should be removed.
- **Type errors:** 5 pre-existing TypeScript errors on `preview_b` (4 in test files, 1 in `useCountUp.ts`).
