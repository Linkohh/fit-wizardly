import { Target, Dumbbell, FileText, Users, type LucideIcon } from 'lucide-react';

/**
 * Feature detail data for the "How Fit Wizard Works" section
 * Used by FeatureDetailModal to display expanded content
 */
export interface FeatureDetail {
  key: string;
  icon: LucideIcon;
  gradient: string;
  variant: 'strength' | 'achievement' | 'magic' | 'cosmic';
}

export const featureDetails: FeatureDetail[] = [
  {
    key: 'smart_goals',
    icon: Target,
    gradient: 'from-orange-500 to-red-500',
    variant: 'strength',
  },
  {
    key: 'equipment',
    icon: Dumbbell,
    gradient: 'from-blue-500 to-cyan-500',
    variant: 'achievement',
  },
  {
    key: 'pdf_export',
    icon: FileText,
    gradient: 'from-purple-500 to-pink-500',
    variant: 'magic',
  },
  {
    key: 'trainer_mode',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
    variant: 'cosmic',
  },
];

/**
 * Get feature detail by key
 */
export function getFeatureDetail(key: string): FeatureDetail | undefined {
  return featureDetails.find((f) => f.key === key);
}
