import { TrendingUp, Target, Activity } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { Goal, ExperienceLevel } from '@/types/fitness';

export const getGoals = (t: TFunction): { id: Goal; label: string; description: string; icon: any }[] => [
  {
    id: 'strength',
    label: t('wizard.goal.options.strength.label'),
    description: t('wizard.goal.options.strength.description'),
    icon: TrendingUp,
  },
  {
    id: 'hypertrophy',
    label: t('wizard.goal.options.hypertrophy.label'),
    description: t('wizard.goal.options.hypertrophy.description'),
    icon: Target,
  },
  {
    id: 'general',
    label: t('wizard.goal.options.general.label'),
    description: t('wizard.goal.options.general.description'),
    icon: Activity,
  },
];

export const getExperienceLevels = (t: TFunction): { id: ExperienceLevel; label: string; description: string }[] => [
  {
    id: 'beginner',
    label: t('wizard.goal.experience_levels.beginner.label'),
    description: t('wizard.goal.experience_levels.beginner.description'),
  },
  {
    id: 'intermediate',
    label: t('wizard.goal.experience_levels.intermediate.label'),
    description: t('wizard.goal.experience_levels.intermediate.description'),
  },
  {
    id: 'advanced',
    label: t('wizard.goal.experience_levels.advanced.label'),
    description: t('wizard.goal.experience_levels.advanced.description'),
  },
];

// NASM Phase Info
export const PHASE_INFO = {
  stabilization_endurance: {
    title: "Phase 1: Stabilization Endurance",
    description: "Build a rock-solid foundation with high reps (12-20) and controlled instability.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  },
  strength_endurance: {
    title: "Phase 2: Strength Endurance",
    description: "Bridge the gap between stability and strength using supersets.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
  },
  muscular_development: {
    title: "Phase 3: Muscular Development",
    description: "Maximize muscle growth with high volume and moderate intensity.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400"
  },
  maximal_strength: {
    title: "Phase 4: Maximal Strength",
    description: "Increase peak force production with heavy loads (85-100% 1RM).",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400"
  },
  power: {
    title: "Phase 5: Power",
    description: "Enhance speed and explosiveness with contrast supersets.",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "bg-red-500/10 text-red-700 dark:text-red-400"
  }
};
