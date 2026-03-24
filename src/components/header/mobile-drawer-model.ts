import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  ChartColumn,
  CirclePlus,
  Dumbbell,
  Eye,
  FileStack,
  History,
  House,
  Users,
  WalletCards,
} from 'lucide-react';
import type { Profile } from '@/types/supabase';
import type { OnboardingUserData } from '@/stores/onboardingStore';

type TranslateFn = (key: string, fallback?: string) => string;

type DrawerUser = {
  email: string | null;
  user_metadata?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
} | null;

type DrawerProfile = Pick<
  Profile,
  'avatar_url' | 'display_name' | 'experience_level' | 'primary_goal'
> | null;

type DrawerOnboarding = Pick<OnboardingUserData, 'avatarEmoji' | 'displayName' | 'role'> | null;

export type MobileNavSection = 'primary' | 'trainer';

export interface MobileNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  section: MobileNavSection;
  trainerOnly?: boolean;
}

export interface DrawerProfileViewModel {
  avatarEmoji: string | null;
  avatarUrl: string | null;
  badge: string | null;
  displayName: string;
  initials: string;
  subtitle: string;
}

interface BuildMobileNavItemsOptions {
  isTrainerMode: boolean;
  t: TranslateFn;
}

interface BuildDrawerProfileOptions {
  isTrainerMode: boolean;
  onboarding: DrawerOnboarding;
  profile: DrawerProfile;
  t: TranslateFn;
  user: DrawerUser;
}

const trimText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const humanizeValue = (value?: string | null) => {
  const normalized = trimText(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getInitials = (name: string) => {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'FW';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

export function isMobileNavPathActive(currentPath: string, itemPath: string) {
  if (itemPath === '/') {
    return currentPath === '/';
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function buildMobileNavItems({ isTrainerMode, t }: BuildMobileNavItemsOptions): MobileNavItem[] {
  const items: MobileNavItem[] = [
    { path: '/', label: t('nav.home', 'Home'), icon: House, section: 'primary' },
    { path: '/wizard', label: t('nav.create_plan', 'Create Plan'), icon: CirclePlus, section: 'primary' },
    { path: '/plan', label: t('nav.view_plan', 'View Plan'), icon: Eye, section: 'primary' },
    { path: '/exercises', label: t('nav.exercises', 'Exercises'), icon: Dumbbell, section: 'primary' },
    { path: '/history', label: t('nav.history', 'History'), icon: History, section: 'primary' },
    { path: '/analytics', label: t('nav.analytics', 'Analytics'), icon: ChartColumn, section: 'primary' },
    { path: '/circles', label: t('nav.circles', 'Circles'), icon: Users, section: 'primary' },
    { path: '/nutrition', label: t('nav.nutrition', 'Nutrition'), icon: Apple, section: 'primary' },
  ];

  if (!isTrainerMode) {
    return items;
  }

  return [
    ...items,
    { path: '/clients', label: t('nav.clients', 'Clients'), icon: Users, section: 'trainer', trainerOnly: true },
    {
      path: '/templates',
      label: t('nav.templates', 'Templates'),
      icon: FileStack,
      section: 'trainer',
      trainerOnly: true,
    },
    {
      path: '/revenue',
      label: t('nav.revenue', 'Revenue'),
      icon: WalletCards,
      section: 'trainer',
      trainerOnly: true,
    },
  ];
}

export function buildDrawerProfileViewModel({
  isTrainerMode,
  onboarding,
  profile,
  t,
  user,
}: BuildDrawerProfileOptions): DrawerProfileViewModel {
  const authName = trimText(user?.user_metadata?.full_name);
  const profileName = trimText(profile?.display_name);
  const onboardingName = trimText(onboarding?.displayName);
  const displayName = authName ?? profileName ?? onboardingName ?? t('header.mobile_drawer.guest_name', 'Guest User');

  const primaryGoal = humanizeValue(profile?.primary_goal);
  const experienceLevel = humanizeValue(profile?.experience_level);
  const detailedSubtitle = [experienceLevel, primaryGoal].filter(Boolean).join(' • ');

  const subtitle =
    detailedSubtitle ||
    trimText(user?.email) ||
    (isTrainerMode
      ? t('header.mobile_drawer.trainer_subtitle', 'Coach control surface')
      : onboardingName
        ? t('header.mobile_drawer.user_subtitle', 'Personal training mode')
        : t('header.mobile_drawer.guest_subtitle', 'Local Account'));

  const avatarUrl = trimText(user?.user_metadata?.avatar_url) ?? trimText(profile?.avatar_url);
  const avatarEmoji = avatarUrl ? null : trimText(onboarding?.avatarEmoji);

  return {
    avatarEmoji,
    avatarUrl,
    badge: isTrainerMode ? t('header.mobile_drawer.trainer_badge', 'Pro Trainer Mode') : null,
    displayName,
    initials: getInitials(displayName),
    subtitle,
  };
}
