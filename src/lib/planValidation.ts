import i18n from '@/lib/i18n';
import type { WizardSelections } from '@/types/fitness';

export type ValidationWarning = {
    id: string;
    type: 'warning' | 'info';
    message: string;
    context?: string;
};

export function validatePlanBalance(selections: WizardSelections): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const { goal, daysPerWeek, targetMuscles, equipment } = selections;

    // 1. Frequency Checks
    if ((goal === 'hypertrophy' || goal === 'strength') && daysPerWeek < 3) {
        warnings.push({
            id: 'frequency_low',
            type: 'warning',
            message: i18n.t('validation.frequency_low.title'),
            context: i18n.t('validation.frequency_low.context', { goal }),
        });
    }

    // 2. Muscle Balance Checks (Leg Day Skipper?)
    const hasLegs = targetMuscles.some(m => ['quads', 'hamstrings', 'glutes', 'calves', 'legs'].includes(m));
    if (!hasLegs && targetMuscles.length > 0) {
        warnings.push({
            id: 'missing_legs',
            type: 'warning',
            message: i18n.t('validation.missing_legs.title'),
            context: i18n.t('validation.missing_legs.context'),
        });
    }

    const hasPush = targetMuscles.some(m => ['chest', 'shoulders', 'front_deltoid', 'triceps'].includes(m));
    const hasPull = targetMuscles.some(m => ['back', 'lats', 'upper_back', 'biceps', 'rear_deltoid'].includes(m));

    if (hasPush && !hasPull) {
        warnings.push({
            id: 'imbalance_push',
            type: 'info',
            message: i18n.t('validation.imbalance_push.title'),
            context: i18n.t('validation.imbalance_push.context'),
        });
    }

    // 3. Equipment Checks
    const isBodyweightOnly = equipment.length === 1 && equipment[0] === 'bodyweight';
    if (goal === 'strength' && isBodyweightOnly) {
        warnings.push({
            id: 'equip_strength',
            type: 'info',
            message: i18n.t('validation.equip_strength.title'),
            context: i18n.t('validation.equip_strength.context'),
        });
    }

    return warnings;
}
