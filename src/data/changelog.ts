/**
 * User-facing release notes, newest first.
 *
 * Versions before 1.0.0 are retroactive milestones grouped from the git history
 * (the repo has no release tags). When shipping a release: bump package.json and add
 * an entry at the top; changelog.test.ts fails if the top entry doesn't match APP_VERSION.
 *
 * Keep bullets short and user-facing: what changed, not how.
 */

export interface ChangelogHighlights {
  new?: string[];
  improved?: string[];
  fixed?: string[];
}

export interface ChangelogEntry {
  /** Semantic version, e.g. "1.0.0". */
  version: string;
  /** Short release name. */
  name: string;
  /** ISO month the release landed, e.g. "2026-09". */
  date: string;
  highlights: ChangelogHighlights;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    name: 'Your training, kept safe',
    date: '2026-11',
    highlights: {
      new: [
        'Your workouts, plans, records, meals, measurements, check-ins and badges are saved on your device',
        'Pick up an unfinished workout, or choose to discard it',
        'Sign in with a 6-digit code from your email, and stay signed in',
        'Signed in, your training is backed up and kept in step across your devices',
        'Sign out safely: your last changes are sent first, then this device is cleared',
        'Delete your account, or erase everything on this device, from Profile → Details',
        'Your data export now includes everything the app stores',
        'A plain-language privacy policy and terms',
        'A notification when you earn a badge',
      ],
      improved: [
        'Fewer taps to your first plan',
        'Your weekly goal counts finished workouts and resets every Monday',
        'Clear next steps on empty History, Analytics and Nutrition screens',
        'Smaller and faster to load; the exercise library works offline',
        'Fonts load from FitWizard, so opening the app no longer contacts Google',
        'Screen readers name every slider and use the language you picked',
        'Follows your Reduce Motion setting; larger buttons in the muscle selector',
        'The muscle selector follows the theme, and theme changes fade smoothly again',
        'Language menu offers English and Español',
        'Sign-in errors and the Start Over dialog appear in your language',
      ],
      fixed: [
        'Removed wording that promised features the app does not have, and placeholder content',
        'Hidden features no longer appear in menus, search, the guide or your badges',
        'Every set in a workout can be logged, and finished workouts appear in History',
        'Saved sets show as done after a reload',
        'Plan cards show real reps and rest times',
        'Full body plans no longer end with an empty day',
        'Exported PDF plans read cleanly',
        'Reps-in-reserve colours are easier to read in the light theme',
      ],
    },
  },
  {
    version: '1.0.0',
    name: 'Launch',
    date: '2026-09',
    highlights: {
      new: [
        'About page: the story, the mission and the creator',
        "What's new release notes",
        'Swipe from the left edge to go back',
        'Android back button support',
        'About, Help and Legal quick links in the app menu',
      ],
      improved: [
        'Cleaner, lighter footer',
        'Direct links to Privacy, Terms and Disclaimer',
      ],
      fixed: ['Security hardening across the app'],
    },
  },
  {
    version: '0.7.0',
    name: 'Smoother Everywhere',
    date: '2026-06',
    highlights: {
      new: [
        'Premium page transitions',
        'Exercise search with smart fallbacks',
        'Daily motivation quotes',
      ],
      improved: ['Mobile menu polish', 'Auto-hiding scrollbars'],
      fixed: ['iOS status bar colors', 'Theme syncing between screens'],
    },
  },
  {
    version: '0.6.0',
    name: 'Recover Smarter',
    date: '2026-04',
    highlights: {
      new: ['Recovery & Readiness dashboard', 'Analytics coaching cards'],
      improved: ['Clearer privacy and consent controls'],
      fixed: ['Security and data-protection hardening'],
    },
  },
  {
    version: '0.5.0',
    name: 'Premium Feel',
    date: '2026-03',
    highlights: {
      new: [
        'Glass design with a living background',
        '3D motion tilt',
        'Redesigned menu drawer',
        'Add-to-home-screen guide',
        'Weekly progress card',
        'Haptic feedback',
      ],
      improved: ['Light mode readability'],
      fixed: ['Sign-in hardening', 'Onboarding layout on iPhone'],
    },
  },
  {
    version: '0.4.0',
    name: 'Coach & iOS',
    date: '2026-02',
    highlights: {
      new: [
        'iOS app',
        'Coach portal for managing clients',
        'Full exercise library with instructions',
        'Meal suggestions',
        'Click sounds',
      ],
      improved: ['Faster loading', 'Cloud plan sync'],
    },
  },
  {
    version: '0.3.0',
    name: 'Train Together',
    date: '2026-01',
    highlights: {
      new: [
        'Workout logging',
        'Nutrition tracking with a macro calculator',
        'Circles: feed, leaderboards and challenges',
        'Trainer mode and PDF export',
        'RIR progression, warm-ups and cool-downs',
        'Available in 4 languages',
      ],
      improved: ['Onboarding and exercise swaps'],
    },
  },
  {
    version: '0.2.0',
    name: 'The Wizard',
    date: '2026-01',
    highlights: {
      new: [
        'Step-by-step plan wizard',
        'Interactive muscle map',
        'Exercise database',
        'Smart split programming',
      ],
      improved: ['Safety filters for injuries and equipment'],
    },
  },
  {
    version: '0.1.0',
    name: 'First Rep',
    date: '2025-12',
    highlights: {
      new: ['Project foundation and the first wizard prototype'],
    },
  },
];
