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
import { deletePlanRemote, getPlansRemote, isPlansRemoteEnabled, savePlanRemote } from '@/lib/plans/plansClient';
import { useAuthStore } from '@/stores/authStore';
import {
  postWorkoutToCircles,
  postPRToCircles,
} from '@/lib/circleActivity';
import type { ActiveWorkout } from '@/stores/planStore.types';
import {
  applyRecommendationsToPlan,
  buildProgressionRecommendations,
  buildWeeklyPlanSummary,
  buildWorkoutLog,
  detectNewPersonalRecords,
  findLastExercisePerformance,
} from '@/lib/plans/planAnalytics';
import {
  removePlanFromHistory,
  syncPlanStateWithRemote,
  upsertPlanHistory,
} from '@/lib/plans/planSyncService';

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

const sanitizePlanPersistedState = (state: Partial<PlanState> | undefined) => ({
  currentWeek: typeof state?.currentWeek === 'number' ? state.currentWeek : 1,
  preferredWeightUnit:
    state?.preferredWeightUnit === 'kg' ? 'kg' : 'lbs',
});

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
  syncWithBackend: (userId?: string) => Promise<void>;
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

  // NEW: Timer actions
  startRestTimer: (durationSeconds: number) => void;
  cancelRestTimer: () => void;
  adjustRestTimer: (seconds: number) => void;

  // NEW: Analytics actions
  getWorkoutLogsForPlan: (planId: string) => WorkoutLog[];
  getWeeklySummary: (planId: string, weekNumber: number) => WeeklySummary | null;
  getProgressionRecommendations: () => ProgressionRecommendation[];
  applyProgressionRecommendations: (recommendations: ProgressionRecommendation[]) => void;

  // NEW: Preferences
  setPreferredWeightUnit: (unit: WeightUnit) => void;
  setCurrentWeek: (week: number) => void;

  // NEW: History
  getLastPerformance: (exerciseId: string) => ExerciseLog | null;
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
          planHistory: upsertPlanHistory(state.planHistory, plan)
        }));
        const userId = useAuthStore.getState().user?.id;
        if (!userId || !isPlansRemoteEnabled()) return;

        // Save to backend with error handling
        handleAsyncOperation(
          savePlanRemote(plan, userId),
          (savedPlan) => {
            set((state) => ({
              planHistory: upsertPlanHistory(state.planHistory, savedPlan),
              currentPlan: state.currentPlan?.id === savedPlan.id ? savedPlan : state.currentPlan,
            }));
          },
          'Failed to save plan. Changes saved locally.'
        );
      },

      deletePlanFromHistory: (planId) => {
        set((state) => ({
          planHistory: removePlanFromHistory(state.planHistory, planId),
          currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
          // Also clean up workout logs for this plan
          workoutLogs: state.workoutLogs.filter(log => log.planId !== planId),
        }));
        const userId = useAuthStore.getState().user?.id;
        if (!userId || !isPlansRemoteEnabled()) return;

        // Delete from backend with error handling
        handleAsyncOperation(deletePlanRemote(planId), undefined, 'Failed to delete plan from server. Removed locally.');
      },

      getPlanById: (planId) => {
        const { currentPlan, planHistory } = get();
        if (currentPlan?.id === planId) return currentPlan;
        return planHistory.find(p => p.id === planId);
      },

      syncWithBackend: async (userId?: string) => {
        if (!userId || !isPlansRemoteEnabled()) return;
        if (!useAuthStore.getState().user) return;

        try {
          const { mergedPlanHistory, nextCurrentPlan, failedMigrationCount } =
            await syncPlanStateWithRemote(userId, get().planHistory, get().currentPlan);

          if (failedMigrationCount > 0) {
            toast.error(`Failed to migrate ${failedMigrationCount} plan(s) to your account`);
          }

          if (mergedPlanHistory.length === 0) return;

          set({
            currentPlan: nextCurrentPlan,
            planHistory: mergedPlanHistory,
          });
        } catch (error) {
          console.error('Sync failed:', error);
          toast.error('Failed to sync plans');
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
          const userId = useAuthStore.getState().user?.id;
          if (userId && isPlansRemoteEnabled()) {
            handleAsyncOperation(
              savePlanRemote(updatedPlan, userId),
              (savedPlan) => {
                set((s) => ({
                  currentPlan: savedPlan,
                  planHistory: upsertPlanHistory(s.planHistory, savedPlan),
                }));
              },
              'Failed to save exercise changes'
            );
          }

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
          const userId = useAuthStore.getState().user?.id;
          if (userId && isPlansRemoteEnabled()) {
            handleAsyncOperation(
              savePlanRemote(updatedPlan, userId),
              (savedPlan) => {
                set((s) => ({
                  currentPlan: savedPlan,
                  planHistory: upsertPlanHistory(s.planHistory, savedPlan),
                }));
              },
              'Failed to save exercise swap'
            );
          }

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
            restTimerEndTime: null,
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

      // TIMER ACTIONS
      startRestTimer: (durationSeconds) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              restTimerEndTime: Date.now() + durationSeconds * 1000,
            },
          };
        });
      },

      cancelRestTimer: () => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              restTimerEndTime: null,
            },
          };
        });
      },

      adjustRestTimer: (seconds) => {
        set((state) => {
          if (!state.activeWorkout || !state.activeWorkout.restTimerEndTime) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              restTimerEndTime: state.activeWorkout.restTimerEndTime + seconds * 1000,
            },
          };
        });
      },

      completeWorkout: (perceivedDifficulty, notes) => {
        const { activeWorkout, workoutLogs } = get();
        if (!activeWorkout) return null;

        try {
          const workoutLog = buildWorkoutLog(activeWorkout, perceivedDifficulty, notes);
          const newPRs = detectNewPersonalRecords(workoutLog, workoutLogs);

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
                newValue: pr.newValue,
                prType: pr.type as 'weight' | 'reps' | 'volume',
              }).catch(err => console.error('Failed to post PR to circles:', err));
            }
          }

          return workoutLog;
        } catch (error) {
          console.error('Error completing workout:', error);
          toast.error('Failed to complete workout');
          return null;
        }
      },

      // ========================================
      // ANALYTICS ACTIONS
      // ========================================

      getWorkoutLogsForPlan: (planId) => {
        return get().workoutLogs.filter(log => log.planId === planId);
      },

      getWeeklySummary: (planId, weekNumber) => {
        return buildWeeklyPlanSummary(
          planId,
          weekNumber,
          get().workoutLogs,
          get().personalRecords,
          get().getPlanById(planId) ?? null,
        );
      },

      getProgressionRecommendations: () => {
        return buildProgressionRecommendations(get().currentPlan, get().workoutLogs);
      },

      applyProgressionRecommendations: (recommendations) => {
        set((state) => {
          if (!state.currentPlan) return state;

          const updatedPlan = applyRecommendationsToPlan(
            state.currentPlan,
            recommendations,
            state.preferredWeightUnit,
          );
          const userId = useAuthStore.getState().user?.id;
          if (userId && isPlansRemoteEnabled()) {
            handleAsyncOperation(
              savePlanRemote(updatedPlan, userId),
              (savedPlan) => {
                set((s) => ({
                  currentPlan: savedPlan,
                  planHistory: upsertPlanHistory(s.planHistory, savedPlan),
                }));
                toast.success('Progression recommendations applied');
              },
              'Failed to save progression recommendations'
            );
          } else {
            toast.success('Progression recommendations applied');
          }

          return { currentPlan: updatedPlan };
        });
      },

      // ========================================
      // PREFERENCES
      // ========================================

      setPreferredWeightUnit: (unit) => set({ preferredWeightUnit: unit }),

      setCurrentWeek: (week) => set({ currentWeek: Math.max(1, Math.min(4, week)) }),

      getLastPerformance: (exerciseId) => {
        return findLastExercisePerformance(get().workoutLogs, exerciseId);
      },
    }),
    {
      name: 'fitwizard-plans',
      partialize: sanitizePlanPersistedState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePlanPersistedState(persistedState as Partial<PlanState>),
      }),
    }
  )
);
