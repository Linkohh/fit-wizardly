import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal, ExperienceLevel, Equipment, MuscleGroup, Constraint, WizardSelections, OptPhase } from '@/types/fitness';

// Helper to determine NASM Phase
function determineOptPhase(goal: Goal, experience: ExperienceLevel): OptPhase {
  if (experience === 'beginner') return 'stabilization_endurance';

  if (experience === 'intermediate') {
    if (goal === 'strength') return 'strength_endurance'; // Phase 2
    if (goal === 'hypertrophy') return 'muscular_development'; // Phase 3
    return 'stabilization_endurance'; // Phase 1 (General fallback)
  }

  if (experience === 'advanced') {
    if (goal === 'strength') return 'maximal_strength'; // Phase 4
    if (goal === 'hypertrophy') return 'muscular_development'; // Phase 3
    return 'power'; // Phase 5 (General/Performance)
  }

  return 'stabilization_endurance';
}

export type WizardStep = 'goal' | 'equipment' | 'anatomy' | 'constraints' | 'schedule' | 'review';

const WIZARD_STEPS: WizardStep[] = ['goal', 'equipment', 'anatomy', 'constraints', 'schedule', 'review'];

interface WizardState {
  currentStep: WizardStep;
  currentStepIndex: number;
  selections: WizardSelections;
  isGenerating: boolean;

  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setPersonalGoalNote: (note: string) => void;
  setGoal: (goal: Goal) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setEquipment: (equipment: Equipment[]) => void;
  toggleEquipment: (equipment: Equipment) => void;
  setTargetMuscles: (muscles: MuscleGroup[]) => void;
  toggleMuscle: (muscle: MuscleGroup) => void;
  setConstraints: (constraints: Constraint[]) => void;
  toggleConstraint: (constraint: Constraint) => void;
  setDaysPerWeek: (days: number) => void;
  setSessionDuration: (duration: number) => void;
  setIsGenerating: (generating: boolean) => void;
  resetWizard: () => void;
  canAdvance: () => boolean;
  getStepValidation: (step: WizardStep) => { valid: boolean; message?: string };
}

const initialSelections: WizardSelections = {
  // Personal Info
  firstName: '',
  lastName: '',
  personalGoalNote: '',

  // Training Config
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  equipment: ['bodyweight'],
  targetMuscles: [],
  constraints: [],
  daysPerWeek: 3,
  sessionDuration: 60,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      currentStep: 'goal',
      currentStepIndex: 0,
      selections: initialSelections,
      isGenerating: false,

      setStep: (step) => {
        const index = WIZARD_STEPS.indexOf(step);
        set({ currentStep: step, currentStepIndex: index });
      },

      nextStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex < WIZARD_STEPS.length - 1) {
          const nextIndex = currentStepIndex + 1;
          set({
            currentStep: WIZARD_STEPS[nextIndex],
            currentStepIndex: nextIndex
          });
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          const prevIndex = currentStepIndex - 1;
          set({
            currentStep: WIZARD_STEPS[prevIndex],
            currentStepIndex: prevIndex
          });
        }
      },

      setFirstName: (firstName) => set((state) => ({
        selections: { ...state.selections, firstName }
      })),

      setLastName: (lastName) => set((state) => ({
        selections: { ...state.selections, lastName }
      })),

      setPersonalGoalNote: (personalGoalNote) => set((state) => ({
        selections: { ...state.selections, personalGoalNote: personalGoalNote.slice(0, 60) } // Max 60 chars
      })),

      setGoal: (goal) => set((state) => ({
        selections: {
          ...state.selections,
          goal,
          optPhase: determineOptPhase(goal, state.selections.experienceLevel)
        }
      })),

      setExperienceLevel: (experienceLevel) => set((state) => ({
        selections: {
          ...state.selections,
          experienceLevel,
          optPhase: determineOptPhase(state.selections.goal, experienceLevel)
        }
      })),

      setEquipment: (equipment) => set((state) => ({
        selections: { ...state.selections, equipment }
      })),

      toggleEquipment: (equipment) => set((state) => {
        const current = state.selections.equipment;
        const updated = current.includes(equipment)
          ? current.filter(e => e !== equipment)
          : [...current, equipment];
        return { selections: { ...state.selections, equipment: updated } };
      }),

      setTargetMuscles: (targetMuscles) => set((state) => ({
        selections: { ...state.selections, targetMuscles }
      })),

      toggleMuscle: (muscle) => set((state) => {
        const current = state.selections.targetMuscles;
        const updated = current.includes(muscle)
          ? current.filter(m => m !== muscle)
          : [...current, muscle];
        return { selections: { ...state.selections, targetMuscles: updated } };
      }),

      setConstraints: (constraints) => set((state) => ({
        selections: { ...state.selections, constraints }
      })),

      toggleConstraint: (constraint) => set((state) => {
        const current = state.selections.constraints;
        const updated = current.includes(constraint)
          ? current.filter(c => c !== constraint)
          : [...current, constraint];
        return { selections: { ...state.selections, constraints: updated } };
      }),

      setDaysPerWeek: (daysPerWeek) => set((state) => ({
        selections: { ...state.selections, daysPerWeek }
      })),

      setSessionDuration: (sessionDuration) => set((state) => ({
        selections: { ...state.selections, sessionDuration }
      })),

      setIsGenerating: (isGenerating) => set({ isGenerating }),

      resetWizard: () => set({
        currentStep: 'goal',
        currentStepIndex: 0,
        selections: initialSelections,
        isGenerating: false,
      }),

      canAdvance: () => {
        const { currentStep, getStepValidation } = get();
        return getStepValidation(currentStep).valid;
      },

      getStepValidation: (step) => {
        const { selections } = get();

        switch (step) {
          case 'goal':
            return { valid: !!selections.goal && !!selections.experienceLevel };
          case 'equipment':
            return {
              valid: selections.equipment.length > 0,
              message: selections.equipment.length === 0 ? 'Select at least one equipment option' : undefined
            };
          case 'anatomy':
            return {
              valid: selections.targetMuscles.length > 0,
              message: selections.targetMuscles.length === 0 ? 'Select at least one muscle group to target' : undefined
            };
          case 'constraints':
            return { valid: true }; // Constraints are optional
          case 'schedule':
            return {
              valid: selections.daysPerWeek >= 2 && selections.daysPerWeek <= 6 && selections.sessionDuration >= 30,
              message: 'Select 2-6 days per week and at least 30 minutes per session'
            };
          case 'review':
            return { valid: true };
          default:
            return { valid: true };
        }
      },
    }),
    {
      name: 'fitwizard-wizard',
      partialize: (state) => ({
        selections: state.selections,
        currentStep: state.currentStep,
        currentStepIndex: state.currentStepIndex,
      }),
    }
  )
);
