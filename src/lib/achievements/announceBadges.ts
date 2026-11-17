import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import { BADGES, type BadgeId } from '@/stores/achievementStore';

/**
 * Tells the user about badges they just unlocked, one toast per badge.
 * Before this, unlocks were recorded silently and never shown.
 */
export function announceNewBadges(badgeIds: readonly BadgeId[]): void {
  for (const badgeId of badgeIds) {
    const badge = BADGES[badgeId];
    if (!badge) continue;

    toast.success(
      i18n.t('achievements.badge_unlocked', 'Badge unlocked: {{name}}', { name: badge.name }),
      { description: `${badge.icon} ${badge.description}` },
    );
  }
}
