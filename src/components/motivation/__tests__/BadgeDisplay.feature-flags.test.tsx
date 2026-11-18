import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BadgeGrid } from '@/components/motivation/BadgeDisplay';
import { BADGES, type BadgeId } from '@/stores/achievementStore';

const ALL_BADGE_IDS = Object.keys(BADGES) as BadgeId[];
const SOCIAL_BADGE_IDS: BadgeId[] = ['circle_founder', 'team_player', 'circle_champion', 'social_butterfly'];
const COACH_BADGE_IDS: BadgeId[] = [
  'trainer_activated',
  'first_client',
  'clients_5',
  'clients_10',
  'clients_50',
  'template_creator',
];

const badgeNames = (ids: BadgeId[]) => ids.map((id) => BADGES[id].name);

function renderGrid() {
  render(<BadgeGrid badges={ALL_BADGE_IDS} unlockedBadges={[]} />);
}

describe('BadgeGrid feature flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('leaves out social and coach badges when both flags are off', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'false');
    vi.stubEnv('VITE_FEATURE_COACH', 'false');

    renderGrid();

    for (const name of badgeNames([...SOCIAL_BADGE_IDS, ...COACH_BADGE_IDS])) {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    }
    expect(screen.getByText(BADGES.first_plan.name)).toBeInTheDocument();
    expect(screen.getByText(BADGES.first_workout.name)).toBeInTheDocument();
  });

  it('shows every badge when both flags are on', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');
    vi.stubEnv('VITE_FEATURE_COACH', 'true');

    renderGrid();

    for (const name of badgeNames(ALL_BADGE_IDS)) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('gates social and coach badges independently', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');
    vi.stubEnv('VITE_FEATURE_COACH', 'false');

    renderGrid();

    for (const name of badgeNames(SOCIAL_BADGE_IDS)) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    for (const name of badgeNames(COACH_BADGE_IDS)) {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    }
  });
});
