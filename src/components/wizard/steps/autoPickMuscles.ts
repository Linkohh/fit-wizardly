import { presets } from '@/features/mcl';
import { mapMclToLegacy } from '@/lib/muscleMapping';
import type { MuscleGroup } from '@/types/fitness';

/** The balanced full-body focus used when the user lets FitWizard choose the muscles. */
export function getAutoPickMuscles(): MuscleGroup[] {
  const fullBody = presets.find((preset) => preset.category === 'fullbody');
  return fullBody ? mapMclToLegacy(fullBody.muscleIds) : [];
}
