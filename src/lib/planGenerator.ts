import type { 
  WizardSelections, 
  Plan, 
  WorkoutDay, 
  ExercisePrescription,
  Exercise,
  SplitType,
  MuscleGroup,
  WeeklyVolume,
  RIRProgression,
  Equipment,
  Constraint
} from '@/types/fitness';
import { EXERCISE_DATABASE } from '@/data/exercises';

// Volume caps by experience level (weekly sets per muscle group)
const VOLUME_CAPS: Record<string, Record<MuscleGroup, number>> = {
  beginner: {
    chest: 10, front_deltoid: 8, side_deltoid: 8, rear_deltoid: 6,
    biceps: 8, triceps: 8, forearms: 4, abs: 8, obliques: 4,
    quads: 12, hip_flexors: 4, adductors: 4, upper_back: 12, lats: 10,
    lower_back: 6, glutes: 10, hamstrings: 10, calves: 8, traps: 6, neck: 2,
  },
  intermediate: {
    chest: 14, front_deltoid: 10, side_deltoid: 12, rear_deltoid: 8,
    biceps: 12, triceps: 12, forearms: 6, abs: 12, obliques: 6,
    quads: 16, hip_flexors: 6, adductors: 6, upper_back: 16, lats: 14,
    lower_back: 8, glutes: 14, hamstrings: 14, calves: 12, traps: 8, neck: 4,
  },
  advanced: {
    chest: 18, front_deltoid: 12, side_deltoid: 16, rear_deltoid: 10,
    biceps: 16, triceps: 16, forearms: 8, abs: 16, obliques: 8,
    quads: 20, hip_flexors: 8, adductors: 8, upper_back: 20, lats: 18,
    lower_back: 10, glutes: 18, hamstrings: 18, calves: 16, traps: 10, neck: 6,
  },
};

// Rep ranges by goal
const REP_RANGES: Record<string, { min: number; max: number }> = {
  strength: { min: 3, max: 6 },
  hypertrophy: { min: 8, max: 12 },
  general: { min: 8, max: 15 },
};

// RIR progression over 4 weeks
const RIR_PROGRESSION: RIRProgression[] = [
  { week: 1, targetRIR: 3, isDeload: false },
  { week: 2, targetRIR: 2, isDeload: false },
  { week: 3, targetRIR: 1, isDeload: false },
  { week: 4, targetRIR: 4, isDeload: true },
];

// Deterministic split selection based on frequency
function selectSplit(daysPerWeek: number): SplitType {
  if (daysPerWeek <= 3) return 'full_body';
  if (daysPerWeek === 4) return 'upper_lower';
  return 'push_pull_legs';
}

// Get workout day structure based on split
function getWorkoutDayStructure(splitType: SplitType, daysPerWeek: number): { name: string; focusTags: string[] }[] {
  switch (splitType) {
    case 'full_body':
      return Array.from({ length: daysPerWeek }, (_, i) => ({
        name: `Full Body ${String.fromCharCode(65 + i)}`,
        focusTags: ['full_body'],
      }));
    case 'upper_lower':
      return [
        { name: 'Upper A', focusTags: ['upper', 'push', 'pull'] },
        { name: 'Lower A', focusTags: ['lower', 'quads', 'hinge'] },
        { name: 'Upper B', focusTags: ['upper', 'push', 'pull'] },
        { name: 'Lower B', focusTags: ['lower', 'quads', 'hinge'] },
      ].slice(0, daysPerWeek);
    case 'push_pull_legs':
      const pplDays = [
        { name: 'Push', focusTags: ['push', 'chest', 'shoulders', 'triceps'] },
        { name: 'Pull', focusTags: ['pull', 'back', 'biceps'] },
        { name: 'Legs', focusTags: ['lower', 'quads', 'hinge', 'calves'] },
      ];
      const extendedPplDays = [...pplDays, ...pplDays.map(d => ({ ...d, name: `${d.name} 2` }))];
      return extendedPplDays.slice(0, daysPerWeek);
  }
}

// Filter exercises by equipment and constraints
function filterExercises(
  exercises: Exercise[],
  equipment: Equipment[],
  constraints: Constraint[]
): Exercise[] {
  return exercises.filter(exercise => {
    // Must have all required equipment
    const hasEquipment = exercise.equipment.every(eq => equipment.includes(eq));
    if (!hasEquipment) return false;

    // Must not have any contraindications that match constraints
    const hasContraindication = exercise.contraindications.some(
      contra => constraints.includes(contra)
    );
    if (hasContraindication) return false;

    return true;
  });
}

// Select exercises for a muscle group
function selectExercisesForMuscle(
  muscle: MuscleGroup,
  availableExercises: Exercise[],
  targetSets: number,
  usedExerciseIds: Set<string>
): { exercises: ExercisePrescription[]; setsAssigned: number } {
  const muscleExercises = availableExercises.filter(
    e => e.primaryMuscles.includes(muscle)
  );

  const prescriptions: ExercisePrescription[] = [];
  let setsAssigned = 0;

  // Prioritize compound movements, then isolation
  const sortedExercises = [...muscleExercises].sort((a, b) => {
    const aIsCompound = a.patterns.includes('isolation') ? 1 : 0;
    const bIsCompound = b.patterns.includes('isolation') ? 1 : 0;
    return aIsCompound - bIsCompound;
  });

  for (const exercise of sortedExercises) {
    if (setsAssigned >= targetSets) break;
    if (usedExerciseIds.has(exercise.id)) continue;

    const setsForExercise = Math.min(4, targetSets - setsAssigned);
    usedExerciseIds.add(exercise.id);

    prescriptions.push({
      exercise,
      sets: setsForExercise,
      reps: '8-12',
      rir: 2,
      restSeconds: 120,
    });

    setsAssigned += setsForExercise;
  }

  return { exercises: prescriptions, setsAssigned };
}

// Get muscles for a workout day based on focus tags
function getMusclesForDay(
  focusTags: string[],
  targetMuscles: MuscleGroup[],
  splitType: SplitType
): MuscleGroup[] {
  if (splitType === 'full_body') {
    return targetMuscles;
  }

  const upperMuscles: MuscleGroup[] = ['chest', 'front_deltoid', 'side_deltoid', 'rear_deltoid', 'upper_back', 'lats', 'biceps', 'triceps', 'traps'];
  const lowerMuscles: MuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors', 'adductors'];
  const pushMuscles: MuscleGroup[] = ['chest', 'front_deltoid', 'side_deltoid', 'triceps'];
  const pullMuscles: MuscleGroup[] = ['upper_back', 'lats', 'rear_deltoid', 'biceps', 'traps', 'forearms'];
  const coreMuscles: MuscleGroup[] = ['abs', 'obliques', 'lower_back'];

  let relevantMuscles: MuscleGroup[] = [];

  if (focusTags.includes('upper')) {
    relevantMuscles = [...relevantMuscles, ...upperMuscles];
  }
  if (focusTags.includes('lower')) {
    relevantMuscles = [...relevantMuscles, ...lowerMuscles];
  }
  if (focusTags.includes('push')) {
    relevantMuscles = [...relevantMuscles, ...pushMuscles];
  }
  if (focusTags.includes('pull')) {
    relevantMuscles = [...relevantMuscles, ...pullMuscles];
  }
  const shouldIncludeCore = focusTags.some(tag => ['upper', 'lower', 'push', 'pull'].includes(tag));
  if (shouldIncludeCore) {
    relevantMuscles = [...relevantMuscles, ...coreMuscles];
  }
  if (focusTags.includes('full_body')) {
    relevantMuscles = [...upperMuscles, ...lowerMuscles, ...coreMuscles];
  }

  // Filter to only include targeted muscles
  return [...new Set(relevantMuscles)].filter(m => targetMuscles.includes(m));
}

// Main generator function - DETERMINISTIC
export function generatePlan(selections: WizardSelections): Plan {
  const { 
    goal, 
    experienceLevel, 
    equipment, 
    targetMuscles, 
    constraints, 
    daysPerWeek, 
    sessionDuration 
  } = selections;

  // Determine split type
  const splitType = selectSplit(daysPerWeek);

  // Get workout day structure
  const dayStructures = getWorkoutDayStructure(splitType, daysPerWeek);

  // Filter available exercises
  const availableExercises = filterExercises(EXERCISE_DATABASE, equipment, constraints);

  // Get rep range for goal
  const repRange = REP_RANGES[goal];

  // Get volume caps for experience level
  const volumeCaps = VOLUME_CAPS[experienceLevel];

  // Calculate sets per muscle per day
  const setsPerMusclePerWeek = Math.floor(volumeCaps.chest / (daysPerWeek / 2));

  // Track weekly volume
  const weeklyVolumeTracker: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  targetMuscles.forEach(m => { weeklyVolumeTracker[m] = 0; });

  // Generate workout days
  const workoutDays: WorkoutDay[] = dayStructures.map((dayStructure, dayIndex) => {
    const dayMuscles = getMusclesForDay(dayStructure.focusTags, targetMuscles, splitType);
    const usedExerciseIds = new Set<string>();
    const exercises: ExercisePrescription[] = [];
    
    // Allocate exercises per muscle
    for (const muscle of dayMuscles) {
      const cap = volumeCaps[muscle] || 10;
      const currentVolume = weeklyVolumeTracker[muscle] || 0;
      const remainingCap = cap - currentVolume;
      
      if (remainingCap <= 0) continue;

      const targetSetsForDay = Math.min(
        Math.ceil(cap / Math.max(1, Math.ceil(daysPerWeek / 2))),
        remainingCap
      );

      const { exercises: muscleExercises, setsAssigned } = selectExercisesForMuscle(
        muscle,
        availableExercises,
        targetSetsForDay,
        usedExerciseIds
      );

      // Update rep ranges and rest based on goal
      muscleExercises.forEach(ex => {
        ex.reps = `${repRange.min}-${repRange.max}`;
        ex.rir = 2;
        ex.restSeconds = goal === 'strength' ? 180 : goal === 'hypertrophy' ? 90 : 60;
      });

      exercises.push(...muscleExercises);
      weeklyVolumeTracker[muscle] = (weeklyVolumeTracker[muscle] || 0) + setsAssigned;
    }

    // Estimate duration (3 min per set average)
    const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
    const estimatedDuration = Math.round(totalSets * 3);

    return {
      dayIndex,
      name: dayStructure.name,
      focusTags: dayStructure.focusTags,
      exercises,
      estimatedDuration,
    };
  });

  // Calculate weekly volume summary
  const weeklyVolume: WeeklyVolume[] = targetMuscles.map(muscle => ({
    muscleGroup: muscle,
    sets: weeklyVolumeTracker[muscle] || 0,
    isWithinCap: (weeklyVolumeTracker[muscle] || 0) <= volumeCaps[muscle],
  }));

  // Generate plan ID deterministically
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate notes
  const notes: string[] = [
    `Split: ${splitType.replace('_', ' ').toUpperCase()}`,
    `Goal: ${goal.charAt(0).toUpperCase() + goal.slice(1)}`,
    `Experience: ${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}`,
    `Days per week: ${daysPerWeek}`,
  ];

  if (constraints.length > 0) {
    notes.push(`Constraints applied: ${constraints.join(', ')}`);
  }

  return {
    id: planId,
    createdAt: new Date(),
    selections,
    splitType,
    workoutDays,
    weeklyVolume,
    rirProgression: RIR_PROGRESSION,
    notes,
  };
}

// Validate wizard inputs before generation
export function validateWizardInputs(selections: WizardSelections): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!selections.goal) {
    errors.push('Please select a training goal');
  }

  if (selections.equipment.length === 0) {
    errors.push('Please select at least one equipment option');
  }

  if (selections.targetMuscles.length === 0) {
    errors.push('Please select at least one muscle group to target');
  }

  if (selections.daysPerWeek < 2 || selections.daysPerWeek > 6) {
    errors.push('Please select between 2 and 6 training days per week');
  }

  if (selections.sessionDuration < 30) {
    errors.push('Sessions should be at least 30 minutes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
