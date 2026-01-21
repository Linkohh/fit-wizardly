import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type {
  Plan,
  Exercise,
  ExercisePrescription,
  WorkoutLog,
  ExerciseLog,
  SetLog,
  ProgressionRecommendation,
  WeeklySummary,
  PersonalRecord,
  WeightUnit,
  PerceivedDifficulty,
} from '@/types/fitness';
import { savePlan, deletePlanApi, getPlans } from '@/lib/apiClient';
import {
  analyzePerformance,
  generateWeeklySummary,
  detectPersonalRecords,
  calculateTotalVolume,
} from '@/lib/progressionEngine';
import {
  postWorkoutToCircles,
  postPRToCircles,
} from '@/lib/circleActivity';

// Helper for generating unique IDs
const generateUniqueId = () => `log_${crypto.randomUUID()}`;

// Helper for async operations with error handling
const handleAsyncOperation = async <T>(
  operation: Promise<T>,
  onSuccess?: (result: T) => void,
  errorMessage = 'Operation failed'
): Promise<T | null> => {
  try {
    const result = await operation;
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    console.error(errorMessage, error);
    toast.error(errorMessage);
    return null;
  }
};

// ============================================
// ACTIVE WORKOUT STATE
// ============================================

interface ActiveWorkout {
  planId: string;
  dayIndex: number;
  dayName: string;
  startedAt: Date;
  exercises: ExerciseLog[];
  currentExerciseIndex: number;
  currentSetIndex: number;
}

// ============================================
// PLAN STATE INTERFACE
// ============================================

interface PlanState {
  // Existing plan state
  currentPlan: Plan | null;
  planHistory: Plan[];

  // NEW: Workout logging state
  workoutLogs: WorkoutLog[];
  currentWeek: number;
  activeWorkout: ActiveWorkout | null;
  personalRecords: PersonalRecord[];
  preferredWeightUnit: WeightUnit;

  // Existing actions
  setCurrentPlan: (plan: Plan) => void;
  clearCurrentPlan: () => void;
  savePlanToHistory: (plan: Plan) => void;
  deletePlanFromHistory: (planId: string) => void;
  getPlanById: (planId: string) => Plan | undefined;
  syncWithBackend: () => Promise<void>;
  updateExercisePrescription: (
    dayIndex: number,
    exerciseIndex: number,
    updates: Partial<Pick<ExercisePrescription, 'sets' | 'reps' | 'rir' | 'restSeconds' | 'notes'>>
  ) => void;
  swapExercise: (dayIndex: number, exerciseIndex: number, newExercise: Exercise) => void;

  // NEW: Workout logging actions
  startWorkout: (planId: string, dayIndex: number) => void;
  cancelWorkout: () => void;
  logSet: (exerciseIndex: number, setLog: SetLog) => void;
  skipExercise: (exerciseIndex: number, reason?: string) => void;
  completeWorkout: (perceivedDifficulty: PerceivedDifficulty, notes?: string) => WorkoutLog | null;

  // NEW: Analytics actions
  getWorkoutLogsForPlan: (planId: string) => WorkoutLog[];
  getWeeklySummary: (planId: string, weekNumber: number) => WeeklySummary | null;
  getProgressionRecommendations: () => ProgressionRecommendation[];
  applyProgressionRecommendations: (recommendations: ProgressionRecommendation[]) => void;

  // NEW: Preferences
  setPreferredWeightUnit: (unit: WeightUnit) => void;
  setCurrentWeek: (week: number) => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPlan: null,
      planHistory: [],
      workoutLogs: [],
      currentWeek: 1,
      activeWorkout: null,
      personalRecords: [],
      preferredWeightUnit: 'lbs',

      // ========================================
      // EXISTING ACTIONS
      // ========================================

      setCurrentPlan: (plan) => set({ currentPlan: plan }),

      clearCurrentPlan: () => set({ currentPlan: null }),

      savePlanToHistory: (plan) => {
        set((state) => ({
          planHistory: [plan, ...state.planHistory.filter(p => p.id !== plan.id)].slice(0, 20)
        }));
        // Save to backend with error handling
        handleAsyncOperation(
          savePlan(plan),
          undefined,
          'Failed to save plan. Changes saved locally.'
        );
      },

      deletePlanFromHistory: (planId) => {
        set((state) => ({
          planHistory: state.planHistory.filter(p => p.id !== planId),
          currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
          // Also clean up workout logs for this plan
          workoutLogs: state.workoutLogs.filter(log => log.planId !== planId),
        }));
        // Delete from backend with error handling
        handleAsyncOperation(
          deletePlanApi(planId),
          undefined,
          'Failed to delete plan from server. Removed locally.'
        );
      },

      getPlanById: (planId) => {
        const { currentPlan, planHistory } = get();
        if (currentPlan?.id === planId) return currentPlan;
        return planHistory.find(p => p.id === planId);
      },

      syncWithBackend: async () => {
        try {
          const result = await getPlans();
          if (result.data) {
            set({ planHistory: result.data });
          } else if (result.error) {
            toast.error('Failed to sync with server');
          }
        } catch (error) {
          console.error('Sync failed:', error);
          toast.error('Failed to connect to server');
        }
      },

      updateExercisePrescription: (dayIndex, exerciseIndex, updates) => {
        set((state) => {
          if (!state.currentPlan) return state;

          const newWorkoutDays = state.currentPlan.workoutDays.map((day, dIdx) => {
            if (dIdx !== dayIndex) return day;

            const newExercises = day.exercises.map((ex, eIdx) => {
              if (eIdx !== exerciseIndex) return ex;
              return { ...ex, ...updates };
            });

            return { ...day, exercises: newExercises };
          });

          const updatedPlan = { ...state.currentPlan, workoutDays: newWorkoutDays };
          // Save with error handling
          handleAsyncOperation(
            savePlan(updatedPlan),
            undefined,
            'Failed to save exercise changes'
          );

          return { currentPlan: updatedPlan };
        });
      },

      swapExercise: (dayIndex, exerciseIndex, newExercise) => {
        set((state) => {
          if (!state.currentPlan) return state;

          const newWorkoutDays = state.currentPlan.workoutDays.map((day, dIdx) => {
            if (dIdx !== dayIndex) return day;

            const newExercises = day.exercises.map((ex, eIdx) => {
              if (eIdx !== exerciseIndex) return ex;
              return { ...ex, exercise: newExercise };
            });

            return { ...day, exercises: newExercises };
          });

          const updatedPlan = { ...state.currentPlan, workoutDays: newWorkoutDays };
          // Save with error handling
          handleAsyncOperation(
            savePlan(updatedPlan),
            undefined,
            'Failed to save exercise swap'
          );

          return { currentPlan: updatedPlan };
        });
      },

      // ========================================
      // WORKOUT LOGGING ACTIONS
      // ========================================

      startWorkout: (planId, dayIndex) => {
        const plan = get().getPlanById(planId);
        if (!plan) return;

        const day = plan.workoutDays[dayIndex];
        if (!day) return;

        // Initialize exercise logs with empty sets based on prescription
        const exercises: ExerciseLog[] = day.exercises.map(prescription => ({
          exerciseId: prescription.exercise.id,
          exerciseName: prescription.exercise.name,
          sets: Array.from({ length: prescription.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: 0,
            weightUnit: get().preferredWeightUnit,
            reps: 0,
            rir: prescription.rir,
            completed: false,
          })),
          skipped: false,
        }));

        set({
          activeWorkout: {
            planId,
            dayIndex,
            dayName: day.name,
            startedAt: new Date(),
            exercises,
            currentExerciseIndex: 0,
            currentSetIndex: 0,
          },
        });
      },

      cancelWorkout: () => {
        set({ activeWorkout: null });
      },

      logSet: (exerciseIndex, setLog) => {
        set((state) => {
          if (!state.activeWorkout) return state;

          const exercises = [...state.activeWorkout.exercises];
          const exercise = { ...exercises[exerciseIndex] };
          const sets = [...exercise.sets];

          sets[setLog.setNumber - 1] = setLog;
          exercise.sets = sets;
          exercises[exerciseIndex] = exercise;

          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises,
              currentSetIndex: setLog.setNumber,
            },
          };
        });
      },

      skipExercise: (exerciseIndex, reason?) => {
        set((state) => {
          if (!state.activeWorkout) return state;

          const exercises = [...state.activeWorkout.exercises];
          exercises[exerciseIndex] = {
            ...exercises[exerciseIndex],
            skipped: true,
            skipReason: reason,
          };

          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises,
              currentExerciseIndex: exerciseIndex + 1,
              currentSetIndex: 0,
            },
          };
        });
      },

      completeWorkout: (perceivedDifficulty, notes) => {
        const { activeWorkout, workoutLogs } = get();
        if (!activeWorkout) return null;

        const completedAt = new Date();
        const duration = Math.round(
          (completedAt.getTime() - new Date(activeWorkout.startedAt).getTime()) / 60000
        );

        // Calculate total volume with error handling
        let totalVolume = 0;
        try {
          for (const exercise of activeWorkout.exercises) {
            totalVolume += calculateTotalVolume(exercise.sets);
          }
        } catch (error) {
          console.error('Error calculating volume:', error);
          // Continue with 0 volume rather than failing
        }

        const workoutLog: WorkoutLog = {
          id: generateUniqueId(),
          planId: activeWorkout.planId,
          dayIndex: activeWorkout.dayIndex,
          dayName: activeWorkout.dayName,
          startedAt: activeWorkout.startedAt,
          completedAt,
          duration,
          exercises: activeWorkout.exercises,
          perceivedDifficulty,
          notes,
          totalVolume,
        };

        // Detect personal records with error handling
        let newPRs: PersonalRecord[] = [];
        try {
          newPRs = detectPersonalRecords(workoutLog, workoutLogs);
        } catch (error) {
          console.error('Error detecting PRs:', error);
          // Continue without PR detection
        }

        set((state) => ({
          workoutLogs: [workoutLog, ...state.workoutLogs].slice(0, 100), // Keep last 100 logs
          activeWorkout: null,
          personalRecords: [...newPRs, ...state.personalRecords].slice(0, 50),
        }));

        // Post workout to user's circles (fire-and-forget)
        postWorkoutToCircles({
          workoutName: workoutLog.dayName,
          duration: workoutLog.duration,
          exerciseCount: workoutLog.exercises.length,
          totalVolume: workoutLog.totalVolume,
        }).catch(err => console.error('Failed to post workout to circles:', err));

        // Post any new PRs to circles
        if (newPRs.length > 0) {
          for (const pr of newPRs) {
            postPRToCircles({
              exerciseName: pr.exerciseName,
              oldValue: pr.previousValue || 0,
              newValue: pr.value,
              prType: pr.type as 'weight' | 'reps' | 'volume',
            }).catch(err => console.error('Failed to post PR to circles:', err));
          }
        }

        return workoutLog;
      },

      // ========================================
      // ANALYTICS ACTIONS
      // ========================================

      getWorkoutLogsForPlan: (planId) => {
        return get().workoutLogs.filter(log => log.planId === planId);
      },

      getWeeklySummary: (planId, weekNumber) => {
        const plan = get().getPlanById(planId);
        if (!plan) return null;

        // Filter logs for this week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (weekNumber - 1) * 7 - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekLogs = get().workoutLogs.filter(log => {
          const logDate = new Date(log.completedAt);
          return log.planId === planId && logDate >= weekStart && logDate < weekEnd;
        });

        const weekPRs = get().personalRecords.filter(pr => {
          const prDate = new Date(pr.achievedAt);
          return prDate >= weekStart && prDate < weekEnd;
        });

        return generateWeeklySummary(weekLogs, plan, weekNumber, weekStart, weekPRs);
      },

      getProgressionRecommendations: () => {
        const { currentPlan, workoutLogs } = get();
        if (!currentPlan) return [];

        const planLogs = workoutLogs.filter(log => log.planId === currentPlan.id);
        return analyzePerformance(planLogs, currentPlan);
      },

      applyProgressionRecommendations: (recommendations) => {
        set((state) => {
          if (!state.currentPlan) return state;

          const newWorkoutDays = state.currentPlan.workoutDays.map(day => ({
            ...day,
            exercises: day.exercises.map(prescription => {
              const rec = recommendations.find(
                r => r.exerciseId === prescription.exercise.id && r.action === 'increase'
              );
              if (rec) {
                // Apply the recommended load as a note for the user
                return {
                  ...prescription,
                  notes: `Target: ${rec.recommendedLoad} ${state.preferredWeightUnit} (+${rec.changePercentage.toFixed(1)}%)`,
                };
              }
              return prescription;
            }),
          }));

          const updatedPlan = { ...state.currentPlan, workoutDays: newWorkoutDays };
          // Save with error handling
          handleAsyncOperation(
            savePlan(updatedPlan),
            () => toast.success('Progression recommendations applied'),
            'Failed to save progression recommendations'
          );

          return { currentPlan: updatedPlan };
        });
      },

      // ========================================
      // PREFERENCES
      // ========================================

      setPreferredWeightUnit: (unit) => set({ preferredWeightUnit: unit }),

      setCurrentWeek: (week) => set({ currentWeek: Math.max(1, Math.min(4, week)) }),
    }),
    {
      name: 'fitwizard-plans',
    }
  )
);
