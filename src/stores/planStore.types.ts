import type { ExerciseLog } from '@/types/fitness';

export interface ActiveWorkout {
  planId: string;
  dayIndex: number;
  dayName: string;
  startedAt: Date;
  exercises: ExerciseLog[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  restTimerEndTime: number | null;
}
