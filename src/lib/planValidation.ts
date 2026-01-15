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
            message: 'Low Training Frequency',
            context: `For ${goal} goals, 3+ days/week is recommended for optimal progress.`,
        });
    }

    // 2. Muscle Balance Checks (Leg Day Skipper?)
    const hasLegs = targetMuscles.some(m => ['quads', 'hamstrings', 'glutes', 'calves', 'legs'].includes(m));
    if (!hasLegs && targetMuscles.length > 0) {
        warnings.push({
            id: 'missing_legs',
            type: 'warning',
            message: 'No Leg Exercises',
            context: 'Skipping lower body can lead to muscular imbalances and reduced caloric burn.',
        });
    }

    const hasPush = targetMuscles.some(m => ['chest', 'shoulders', 'front_deltoid', 'triceps'].includes(m));
    const hasPull = targetMuscles.some(m => ['back', 'lats', 'upper_back', 'biceps', 'rear_deltoid'].includes(m));

    if (hasPush && !hasPull) {
        warnings.push({
            id: 'imbalance_push',
            type: 'info',
            message: 'Push Dominant',
            context: 'Consider adding back/bicep exercises to balance your pressing movements.',
        });
    }

    // 3. Equipment Checks
    const isBodyweightOnly = equipment.length === 1 && equipment[0] === 'bodyweight';
    if (goal === 'strength' && isBodyweightOnly) {
        warnings.push({
            id: 'equip_strength',
            type: 'info',
            message: 'Limited Resistance',
            context: 'Building max strength is harder with bodyweight only. Consider adding bands or weights if possible.',
        });
    }

    return warnings;
}
