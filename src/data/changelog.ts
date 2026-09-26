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
