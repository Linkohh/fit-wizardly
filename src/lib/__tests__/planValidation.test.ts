import { validatePlanBalance } from '../planValidation';
import { describe, it, expect } from 'vitest';
import type { WizardSelections } from '@/types/fitness';

describe('validatePlanBalance', () => {
    const baseSelections: WizardSelections = {
        firstName: '', lastName: '', personalGoalNote: 'test',
        isTrainer: false, coachNotes: '',
        goal: 'general', experienceLevel: 'intermediate',
        equipment: ['dumbbells'], targetMuscles: ['chest', 'back', 'quads'],
        constraints: [], daysPerWeek: 3, sessionDuration: 60, optPhase: 'stabilization_endurance'
    };

    it('warns on low frequency for hypertrophy', () => {
        const warnings = validatePlanBalance({ ...baseSelections, goal: 'hypertrophy', daysPerWeek: 2 });
        expect(warnings.some(w => w.id === 'frequency_low')).toBe(true);
    });

    it('warns on low frequency for strength', () => {
        const warnings = validatePlanBalance({ ...baseSelections, goal: 'strength', daysPerWeek: 2 });
        expect(warnings.some(w => w.id === 'frequency_low')).toBe(true);
    });

    it('warns on missing legs', () => {
        const warnings = validatePlanBalance({ ...baseSelections, targetMuscles: ['chest', 'biceps'] });
        expect(warnings.some(w => w.id === 'missing_legs')).toBe(true);
    });

    it('warns on push without pull', () => {
        const warnings = validatePlanBalance({ ...baseSelections, targetMuscles: ['chest', 'shoulders'] });
        expect(warnings.some(w => w.id === 'imbalance_push')).toBe(true);
    });

    it('warns on strength goal with only bodyweight', () => {
        const warnings = validatePlanBalance({ ...baseSelections, goal: 'strength', equipment: ['bodyweight'] });
        expect(warnings.some(w => w.id === 'equip_strength')).toBe(true);
    });

    it('returns no warnings for balanced plan', () => {
        const warnings = validatePlanBalance({ ...baseSelections });
        expect(warnings).toHaveLength(0);
    });
});
