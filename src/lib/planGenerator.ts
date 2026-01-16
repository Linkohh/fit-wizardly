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
  Constraint,
  OptPhase,
  Tempo,
  ExerciseType,
  StabilityLevel
} from '@/types/fitness';
import { EXERCISE_DATABASE } from '@/data/exercises';

// Helper to determine NASM Phase (Duplicate of store logic for safety)
function determineOptPhase(goal: string, experience: string): OptPhase {
  if (experience === 'beginner') return 'stabilization_endurance';
  if (experience === 'intermediate') {
    if (goal === 'strength') return 'strength_endurance';
    if (goal === 'hypertrophy') return 'muscular_development';
    return 'stabilization_endurance';
  }
  if (experience === 'advanced') {
    if (goal === 'strength') return 'maximal_strength';
    if (goal === 'hypertrophy') return 'muscular_development';
    return 'power';
  }
  return 'stabilization_endurance';
}

// NASM Phase Variables
function getPhaseVariables(phase: OptPhase) {
  switch (phase) {
    case 'stabilization_endurance': // Phase 1
      return {
        reps: '12-20',
        sets: 2, // 1-3
        tempo: '4-2-1',
        rest: 90,
        intensity: '50-70%',
        focus: 'unstable' as StabilityLevel
      };
    case 'strength_endurance': // Phase 2 (Supersets)
      return {
        reps: '8-12', // Strength: 8-12, Stab: 8-12
        sets: 3, // 2-4
        tempo: '2-0-2', // Strength: 2-0-2, Stab: 4-2-1
        rest: 60,
        intensity: '70-80%',
        isSuperset: true
      };
    case 'muscular_development': // Phase 3
      return {
        reps: '6-12',
        sets: 4, // 3-6
        tempo: '2-0-2',
        rest: 60, // 0-60s
        intensity: '75-85%',
        focus: 'stable' as StabilityLevel // Hypertrophy relies on stability
      };
    case 'maximal_strength': // Phase 4
      return {
        reps: '1-5',
        sets: 5, // 4-6
        tempo: 'X-X-X', // Explosive/Controlled
        rest: 180, // 3-5 min
        intensity: '85-100%',
        focus: 'stable' as StabilityLevel
      };
    case 'power': // Phase 5 (Supersets)
      return {
        reps: '1-5', // Strength: 1-5, Power: 8-10
        sets: 4, // 3-5
        tempo: 'X-X-X',
        rest: 180, // 1-2 min between pairs
        intensity: '85-100% / 30-45%',
        isSuperset: true
      };
    default:
      return { reps: '10', sets: 3, tempo: '2-0-2', rest: 60, intensity: '60%' };
  }
}

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

// Find a matching exercise for superset/contrast
function findPairExercise(
  primaryExercise: Exercise,
  available: Exercise[],
  requiredType: ExerciseType | undefined,
  requiredStability: StabilityLevel | undefined,
  usedIds: Set<string>
): Exercise | undefined {
  // Look for same muscle group but specific characteristics
  return available.find(e =>
    e.id !== primaryExercise.id &&
    !usedIds.has(e.id) &&
    e.primaryMuscles.some(m => primaryExercise.primaryMuscles.includes(m)) &&
    (!requiredType || e.type === requiredType) &&
    (!requiredStability || e.stabilityLevel === requiredStability)
  );
}

// Select exercises for a muscle group
function selectExercisesForMuscle(
  muscle: MuscleGroup,
  availableExercises: Exercise[],
  targetSets: number,
  usedExerciseIds: Set<string>,
  phase: OptPhase // NEW argument
): { exercises: ExercisePrescription[]; setsAssigned: number } {
  const settings = getPhaseVariables(phase);

  // Filter for relevant exercises
  let muscleExercises = availableExercises.filter(
    e => e.primaryMuscles.includes(muscle)
  );

  // Phase 1 Optimization: Prioritize unstable if available, else standard
  if (phase === 'stabilization_endurance') {
    const unstable = muscleExercises.filter(e => e.stabilityLevel === 'unstable');
    if (unstable.length > 0) {
      // Mix unstable and stable but prioritize unstable
      muscleExercises = [...unstable, ...muscleExercises.filter(e => e.stabilityLevel !== 'unstable')];
    }
  }

  // Phase 4/5 Optimization: Prioritize stable/heavy
  if (phase === 'maximal_strength' || phase === 'power') {
    muscleExercises = muscleExercises.filter(e => e.stabilityLevel !== 'unstable'); // Avoid ball work for max strength
  }

  const prescriptions: ExercisePrescription[] = [];
  let setsAssigned = 0;
  let supersetCounter = 1;

  // Sort by priority (Compound > Isolation)
  // For Phase 5, we specifically need Strength first, then Power
  const sortedExercises = [...muscleExercises].sort((a, b) => {
    const aIsCompound = a.patterns.includes('isolation') ? 1 : 0;
    const bIsCompound = b.patterns.includes('isolation') ? 1 : 0;
    return aIsCompound - bIsCompound;
  });

  for (let i = 0; i < sortedExercises.length; i++) {
    const exercise = sortedExercises[i];
    if (setsAssigned >= targetSets) break;
    if (usedExerciseIds.has(exercise.id)) continue;

    const setsForExercise = Math.min(settings.sets, targetSets - setsAssigned);
    usedExerciseIds.add(exercise.id);

    // Standard rationale
    const isCompound = !exercise.patterns.includes('isolation');
    let rationale = isCompound
      ? `Primary compound movement for ${phase.replace('_', ' ')}.`
      : `Isolation assistance for ${muscle.replace('_', ' ')}.`;

    // SUPERSET LOGIC (Phase 2 & 5)
    if (settings.isSuperset) {
      let pairExercise: Exercise | undefined;
      let pairRationale = "";
      let pairReps = settings.reps;
      let pairTempo = settings.tempo;

      if (phase === 'strength_endurance') {
        // Phase 2: Strength (Stable) + Stabilization (Unstable)
        pairExercise = findPairExercise(exercise, availableExercises, undefined, 'unstable', usedExerciseIds);
        pairRationale = "Superset: Biomechanically similar stabilization exercise.";
        pairTempo = "4-2-1"; // Slow for stabilization
      } else if (phase === 'power') {
        // Phase 5: Strength (Heavy) + Power (Explosive)
        pairExercise = findPairExercise(exercise, availableExercises, 'plyometric', undefined, usedExerciseIds);
        if (!pairExercise) pairExercise = findPairExercise(exercise, availableExercises, 'power', undefined, usedExerciseIds);

        pairRationale = "Contrast Set: Explosive movement to recruit fast-twitch fibers.";
        pairReps = "8-10";
        pairTempo = "X-X-X"; // Max velocity
      }

      // Add Primary
      prescriptions.push({
        exercise,
        sets: setsForExercise,
        reps: phase === 'power' ? '1-5' : settings.reps, // Heavy for power phase first leg
        rir: phase === 'power' ? 1 : 2,
        tempo: settings.tempo,
        restSeconds: 0, // No rest inside superset
        supersetGroup: supersetCounter,
        rationale,
        notes: phase === 'strength_endurance' ? "Perform Strength movement first" : "Heavy resistance exercise"
      });

      if (pairExercise) {
        usedExerciseIds.add(pairExercise.id);
        prescriptions.push({
          exercise: pairExercise,
          sets: setsForExercise,
          reps: pairReps,
          rir: 0, // Push hard on second leg
          tempo: pairTempo,
          restSeconds: settings.rest, // Rest after pair
          supersetGroup: supersetCounter,
          rationale: pairRationale,
          notes: "Perform immediately after previous exercise"
        });
        // Superset counts as 1 "set" of volume for the muscle roughly, but we track actual sets
        setsAssigned += setsForExercise; // Count primary volume
      } else {
        // Fallback if no pair found: Just standard set
        prescriptions[prescriptions.length - 1].restSeconds = settings.rest;
        prescriptions[prescriptions.length - 1].supersetGroup = undefined;
        setsAssigned += setsForExercise;
      }
      supersetCounter++;

    } else {
      // Standard Straight Sets
      prescriptions.push({
        exercise,
        sets: setsForExercise,
        reps: settings.reps,
        rir: 2,
        tempo: settings.tempo,
        restSeconds: settings.rest,
        rationale,
      });
      setsAssigned += setsForExercise;
    }
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

type WarmCoolSuggestion = {
  text: string;
  tags: string[];
  muscles?: MuscleGroup[];
  avoidConstraints?: Constraint[];
};

const WARM_UP_SUGGESTIONS: WarmCoolSuggestion[] = [
  { text: '2-3 min easy cardio (walk, bike, or row)', tags: ['general'] },
  { text: 'Diaphragmatic breathing + core brace (5 breaths)', tags: ['general'] },
  { text: 'Arm circles x10/side', tags: ['upper', 'push', 'pull'], avoidConstraints: ['shoulder_injury', 'no_overhead'] },
  { text: 'Scapular retractions x10', tags: ['upper', 'pull'] },
  { text: 'Wall slides x8', tags: ['upper', 'push'], avoidConstraints: ['shoulder_injury', 'no_overhead'] },
  { text: 'Cat-cow x6', tags: ['general', 'core'], avoidConstraints: ['back_injury'] },
  { text: 'Glute bridges x10', tags: ['lower', 'hinge'], avoidConstraints: ['back_injury'] },
  { text: 'Bodyweight squats x8', tags: ['lower', 'quads'], avoidConstraints: ['knee_injury'] },
  { text: 'Leg swings x8/side', tags: ['lower'], avoidConstraints: ['knee_injury'] },
  { text: 'Dead bug x6/side', tags: ['core'], avoidConstraints: ['back_injury'] },
];

const COOL_DOWN_SUGGESTIONS: WarmCoolSuggestion[] = [
  { text: 'Slow nasal breathing 1-2 min', tags: ['general'] },
  { text: 'Doorway chest stretch 20-30s/side', tags: ['upper', 'push'], avoidConstraints: ['shoulder_injury', 'no_overhead'] },
  { text: 'Lat stretch on wall 20-30s/side', tags: ['upper', 'pull'], avoidConstraints: ['shoulder_injury', 'no_overhead'] },
  { text: 'Child’s pose breathing 20-30s', tags: ['general', 'core'], avoidConstraints: ['back_injury', 'no_overhead'] },
  { text: 'Figure-4 glute stretch 20-30s/side', tags: ['lower'], avoidConstraints: ['knee_injury'] },
  { text: 'Hamstring stretch 20-30s/side', tags: ['lower'], avoidConstraints: ['back_injury'] },
  { text: 'Calf stretch 20-30s/side', tags: ['lower'] },
];

function buildWarmCoolSuggestions(
  suggestions: WarmCoolSuggestion[],
  focusTags: string[],
  dayMuscles: MuscleGroup[],
  constraints: Constraint[],
  maxItems: number
): string[] {
  const constraintSet = new Set(constraints);
  const tagSet = new Set(focusTags);
  if (dayMuscles.some(m => ['abs', 'obliques', 'lower_back'].includes(m))) {
    tagSet.add('core');
  }

  const matches = suggestions.filter(suggestion => {
    if (suggestion.avoidConstraints?.some(constraint => constraintSet.has(constraint))) {
      return false;
    }
    if (suggestion.tags.includes('general')) {
      return true;
    }
    if (suggestion.tags.some(tag => tagSet.has(tag))) {
      return true;
    }
    if (suggestion.muscles?.some(muscle => dayMuscles.includes(muscle))) {
      return true;
    }
    return false;
  });

  const unique = Array.from(new Set(matches.map(item => item.text)));
  return unique.slice(0, maxItems);
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
    sessionDuration,
    optPhase // New
  } = selections;

  // Determine OPT Phase if not provided (fallback)
  const currentPhase = optPhase || determineOptPhase(goal, experienceLevel);
  const phaseSettings = getPhaseVariables(currentPhase);

  // Determine split type
  const splitType = selectSplit(daysPerWeek);

  // Get workout day structure
  const dayStructures = getWorkoutDayStructure(splitType, daysPerWeek);

  // Filter available exercises
  const availableExercises = filterExercises(EXERCISE_DATABASE, equipment, constraints);

  // Get rep range for goal
  // Get rep range for goal (Legacy support but Phase logic overrides)
  // const repRange = REP_RANGES[goal];

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
    const setBudget = Math.max(1, Math.floor(sessionDuration / 3));
    let totalSets = 0;

    // Allocate exercises per muscle
    for (const muscle of dayMuscles) {
      if (totalSets >= setBudget) break;

      const cap = volumeCaps[muscle] || 10;
      const currentVolume = weeklyVolumeTracker[muscle] || 0;
      const remainingCap = cap - currentVolume;

      if (remainingCap <= 0) continue;

      const targetSetsForDay = Math.min(
        Math.ceil(cap / Math.max(1, Math.ceil(daysPerWeek / 2))),
        remainingCap,
        setBudget - totalSets
      );

      if (targetSetsForDay <= 0) break;

      const { exercises: muscleExercises, setsAssigned } = selectExercisesForMuscle(
        muscle,
        availableExercises,
        targetSetsForDay,
        usedExerciseIds,
        currentPhase // pass phase
      );

      // Update rep ranges and rest based on goal
      // Update rep ranges and rest based on goal (LEGACY OVERRIDE CHECK)
      // We rely on selectExercisesForMuscle to set these now via getPhaseVariables, 
      // so we largely skip this or just ensure nothing is wildly off.
      // muscleExercises.forEach(ex => { ... }); 
      // Actually we should just leave them be as selectExercises... does it better now.

      exercises.push(...muscleExercises);
      weeklyVolumeTracker[muscle] = (weeklyVolumeTracker[muscle] || 0) + setsAssigned;
      totalSets += setsAssigned;
    }

    // Estimate duration (3 min per set average)
    const estimatedDuration = Math.round(totalSets * 3);
    const warmUp = buildWarmCoolSuggestions(
      WARM_UP_SUGGESTIONS,
      dayStructure.focusTags,
      dayMuscles,
      constraints,
      3
    );
    const coolDown = buildWarmCoolSuggestions(
      COOL_DOWN_SUGGESTIONS,
      dayStructure.focusTags,
      dayMuscles,
      constraints,
      3
    );

    return {
      dayIndex,
      name: dayStructure.name,
      focusTags: dayStructure.focusTags,
      exercises,
      estimatedDuration,
      warmUp: warmUp.length ? warmUp : undefined,
      coolDown: coolDown.length ? coolDown : undefined,
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
    `Phase: ${currentPhase.replace(/_/g, ' ').toUpperCase()}`,
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
