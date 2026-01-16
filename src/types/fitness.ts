// FitWizard Domain Types

export type Goal = 'strength' | 'hypertrophy' | 'general';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type SplitType = 'full_body' | 'upper_lower' | 'push_pull_legs';

export type Equipment =
  | 'barbell'
  | 'dumbbells'
  | 'kettlebells'
  | 'cables'
  | 'machines'
  | 'pullup_bar'
  | 'bench'
  | 'squat_rack'
  | 'bodyweight'
  | 'band'
  | 'medicine_ball'
  | 'foam_roller'
  | 'ez_bar'
  | 'sled'
  | 'box'
  | 'rope'
  | 'landmine'
  | 'plate'
  | 'sandbag'
  | 'mini_band'
  | 'stability_ball'
  | 'rings'
  | 'ab_wheel'
  | 'wall'
  | 'tib_bar'
  | 'floor'
  | 'mat'
  | 'pole'
  | 'stone'
  | 'other';

export type MuscleGroup =
  | 'chest'
  | 'front_deltoid'
  | 'side_deltoid'
  | 'rear_deltoid'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hip_flexors'
  | 'adductors'
  | 'upper_back'
  | 'lats'
  | 'lower_back'
  | 'glutes'
  | 'hamstrings'
  | 'calves'
  | 'traps'
  | 'neck';

export type MovementPattern =
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'carry'
  | 'rotation'
  | 'isolation';

export type Constraint =
  | 'no_overhead'
  | 'no_jumping'
  | 'no_heavy_spinal_load'
  | 'no_rotation'
  | 'no_impact'
  | 'shoulder_injury'
  | 'knee_injury'
  | 'back_injury'
  | 'wrist_injury';

// NASM OPT Model Types
export type OptLevel = 1 | 2 | 3;

export type OptPhase =
  | 'stabilization_endurance'  // Phase 1
  | 'strength_endurance'       // Phase 2
  | 'muscular_development'     // Phase 3 (Hypertrophy)
  | 'maximal_strength'         // Phase 4
  | 'power';                   // Phase 5

export interface Tempo {
  eccentric: number;
  isometric: number;
  concentric: number;
  finish?: number; // distinct pause or explosive finish
}

export type StabilityLevel = 'stable' | 'unstable';
export type ExerciseType = 'strength' | 'plyometric' | 'cardio' | 'power';

export interface WizardSelections {
  // Personal Info
  firstName: string;
  lastName: string;
  personalGoalNote: string; // Max 60 characters - what the user wants to achieve

  // Trainer Mode
  isTrainer: boolean;
  coachNotes: string; // Private notes for coach/trainer use

  // Training Config
  goal: Goal;
  optPhase?: OptPhase; // New field for NASM logic
  experienceLevel: ExperienceLevel;
  equipment: Equipment[];
  targetMuscles: MuscleGroup[];
  constraints: Constraint[];
  daysPerWeek: number;
  sessionDuration: number; // minutes
}

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'plyometric'
  | 'core'
  | 'other'; // Simplified mapping from the granular JSON categories

export interface ExerciseVariation {
  name: string;
  description: string;
  type: 'regression' | 'progression' | 'alternative';
}

export interface MetabolicInfo {
  met: number; // Metabolic Equivalent of Task (approximate)
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  patterns: MovementPattern[];

  // NASM Specifics
  stabilityLevel?: StabilityLevel; // 'stable' vs 'unstable'
  type?: ExerciseType;             // 'strength' vs 'plyometric' vs 'power'

  contraindications: Constraint[];
  cues: string[]; // Key coaching cues
  videoUrl?: string;
  videoThumbnailUrl?: string;
  gifUrl?: string;
  muscleDiagramUrl?: string;
  imageUrl?: string;

  // Rich Content Fields
  description?: string; // Detailed description
  steps?: string[]; // Step-by-step instructions
  variations?: ExerciseVariation[]; // Linked variations
  metabolic?: MetabolicInfo; // Calories estimation data
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite' | 'All Levels';
  category?: string; // e.g. "Upper Push", "Cardio" - derived from library
  subcategory?: string;
}

export interface ExercisePrescription {
  exercise: Exercise;
  sets: number;
  reps: string; // e.g., "8-12" or "5"
  rir: number; // Reps in Reserve
  tempo?: string; // e.g. "4-2-1" or "Fast/Explosive"
  restSeconds: number;
  supersetGroup?: number; // If set, exercises with same ID are done back-to-back
  notes?: string;
  rationale?: string; // Explains why this exercise was selected
}

export interface WorkoutDay {
  dayIndex: number;
  name: string;
  focusTags: string[];
  exercises: ExercisePrescription[];
  estimatedDuration: number;
}

export interface WeeklyVolume {
  muscleGroup: MuscleGroup;
  sets: number;
  isWithinCap: boolean;
}

export interface RIRProgression {
  week: number;
  targetRIR: number;
  isDeload: boolean;
}

export interface Plan {
  id: string;
  createdAt: Date;
  selections: WizardSelections;
  splitType: SplitType;
  workoutDays: WorkoutDay[];
  weeklyVolume: WeeklyVolume[];
  rirProgression: RIRProgression[];
  notes: string[];
}

export interface Client {
  id: string;
  displayName: string;
  notes?: string;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  clientId: string;
  planId: string;
  assignedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  planSnapshot: Plan;
  tags: string[];
  createdAt: Date;
}

// ============================================
// WORKOUT LOGGING TYPES
// ============================================

export type WeightUnit = 'lbs' | 'kg';

export type PerceivedDifficulty = 'too_easy' | 'just_right' | 'challenging' | 'too_hard';

export type PerceivedEffort = 'easy' | 'moderate' | 'hard';

export interface SetLog {
  setNumber: number;
  weight: number;
  weightUnit: WeightUnit;
  reps: number;
  rir: number;
  completed: boolean;
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  perceivedEffort?: PerceivedEffort;
  skipped?: boolean;
  skipReason?: string;
}

export interface WorkoutLog {
  id: string;
  planId: string;
  dayIndex: number;
  dayName: string;
  startedAt: Date;
  completedAt: Date;
  duration: number; // minutes
  exercises: ExerciseLog[];
  perceivedDifficulty: PerceivedDifficulty;
  notes?: string;
  totalVolume: number; // weight × reps across all sets
}

// ============================================
// PROGRESSION & ANALYTICS TYPES
// ============================================

export type ProgressionConfidence = 'high' | 'medium' | 'low';

export type ProgressionAction = 'increase' | 'maintain' | 'decrease' | 'swap';

export interface ProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  action: ProgressionAction;
  currentLoad: number;
  recommendedLoad: number;
  changePercentage: number;
  rationale: string;
  confidence: ProgressionConfidence;
}

export interface WeeklySummary {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  workoutsCompleted: number;
  workoutsPlanned: number;
  completionRate: number;
  totalVolume: number;
  avgRIR: number;
  targetRIR: number;
  muscleGroupBreakdown: {
    muscleGroup: MuscleGroup;
    sets: number;
    avgLoad: number;
  }[];
  personalRecords: PersonalRecord[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'volume';
  previousValue: number;
  newValue: number;
  achievedAt: Date;
  workoutLogId: string;
}

// ============================================
// WISDOM AI TYPES
// ============================================

export type WisdomMessageRole = 'user' | 'assistant';

export interface WisdomMessage {
  id: string;
  role: WisdomMessageRole;
  content: string;
  timestamp: Date;
}

export interface WisdomResponse {
  content: string;
  suggestedFollowUps?: string[];
  conceptsIntroduced?: string[];
}

export interface WisdomContext {
  planId: string | null;
  exerciseId: string | null;
  weekNumber: number;
  phase?: OptPhase;
}

// Muscle data for anatomy picker
export interface MuscleData {
  id: MuscleGroup;
  name: string;
  view: 'front' | 'back';
  displayOrder: number;
}

export const MUSCLE_DATA: MuscleData[] = [
  // Front view muscles
  { id: 'chest', name: 'Chest', view: 'front', displayOrder: 1 },
  { id: 'front_deltoid', name: 'Front Deltoids', view: 'front', displayOrder: 2 },
  { id: 'side_deltoid', name: 'Side Deltoids', view: 'front', displayOrder: 3 },
  { id: 'biceps', name: 'Biceps', view: 'front', displayOrder: 4 },
  { id: 'forearms', name: 'Forearms', view: 'front', displayOrder: 5 },
  { id: 'abs', name: 'Abs', view: 'front', displayOrder: 6 },
  { id: 'obliques', name: 'Obliques', view: 'front', displayOrder: 7 },
  { id: 'quads', name: 'Quadriceps', view: 'front', displayOrder: 8 },
  { id: 'hip_flexors', name: 'Hip Flexors', view: 'front', displayOrder: 9 },
  { id: 'adductors', name: 'Adductors', view: 'front', displayOrder: 10 },
  // Back view muscles
  { id: 'traps', name: 'Trapezius', view: 'back', displayOrder: 1 },
  { id: 'rear_deltoid', name: 'Rear Deltoids', view: 'back', displayOrder: 2 },
  { id: 'upper_back', name: 'Upper Back', view: 'back', displayOrder: 3 },
  { id: 'lats', name: 'Lats', view: 'back', displayOrder: 4 },
  { id: 'triceps', name: 'Triceps', view: 'back', displayOrder: 5 },
  { id: 'lower_back', name: 'Lower Back', view: 'back', displayOrder: 6 },
  { id: 'glutes', name: 'Glutes', view: 'back', displayOrder: 7 },
  { id: 'hamstrings', name: 'Hamstrings', view: 'back', displayOrder: 8 },
  { id: 'calves', name: 'Calves', view: 'back', displayOrder: 9 },
  { id: 'neck', name: 'Neck', view: 'back', displayOrder: 10 },
];

export const EQUIPMENT_OPTIONS: { id: Equipment; name: string; icon: string }[] = [
  { id: 'barbell', name: 'Barbell', icon: '🏋️' },
  { id: 'dumbbells', name: 'Dumbbells', icon: '💪' },
  { id: 'kettlebells', name: 'Kettlebells', icon: '🔔' },
  { id: 'cables', name: 'Cable Machine', icon: '🔗' },
  { id: 'machines', name: 'Machines', icon: '⚙️' },
  { id: 'pullup_bar', name: 'Pull-up Bar', icon: '🔩' },
  { id: 'bench', name: 'Bench', icon: '🛋️' },
  { id: 'squat_rack', name: 'Squat Rack', icon: '🏗️' },
  { id: 'bodyweight', name: 'Bodyweight Only', icon: '🧘' },
  { id: 'band', name: 'Resistance Band', icon: '🪢' },
  { id: 'mini_band', name: 'Mini Band', icon: '🎽' },
  { id: 'stability_ball', name: 'Stability Ball', icon: '⚽' },
  { id: 'medicine_ball', name: 'Medicine Ball', icon: '🏐' },
  { id: 'ab_wheel', name: 'Ab Wheel', icon: '🛞' },
  { id: 'ez_bar', name: 'EZ Bar', icon: '🧱' },
  { id: 'plate', name: 'Weight Plate', icon: '🪨' },
  { id: 'landmine', name: 'Landmine', icon: '⚓' },
  { id: 'sandbag', name: 'Sandbag', icon: '🧳' },
  { id: 'sled', name: 'Sled', icon: '🛷' },
  { id: 'box', name: 'Plyo Box', icon: '📦' },
  { id: 'rope', name: 'Jump Rope', icon: '➰' },
  { id: 'rings', name: 'Gymnastic Rings', icon: '⭕' },
  { id: 'foam_roller', name: 'Foam Roller', icon: '🧽' },
  { id: 'wall', name: 'Wall', icon: '🧱' },
  { id: 'floor', name: 'Floor Space', icon: '🧹' },
  { id: 'mat', name: 'Exercise Mat', icon: '🧘‍♀️' },
  { id: 'pole', name: 'Pole', icon: '📍' },
  { id: 'stone', name: 'Atlas Stone', icon: '🪨' },
  { id: 'tib_bar', name: 'Tib Bar', icon: '🦵' },
];

export const CONSTRAINT_OPTIONS: { id: Constraint; name: string; description: string }[] = [
  { id: 'no_overhead', name: 'No Overhead Movements', description: 'Avoid pressing above head' },
  { id: 'no_jumping', name: 'No Jumping', description: 'Avoid plyometrics and jumps' },
  { id: 'no_heavy_spinal_load', name: 'No Heavy Spinal Loading', description: 'Avoid heavy squats/deadlifts' },
  { id: 'no_rotation', name: 'No Rotation', description: 'Avoid twisting movements' },
  { id: 'no_impact', name: 'No Impact', description: 'Avoid high-impact exercises' },
  { id: 'shoulder_injury', name: 'Shoulder Limitation', description: 'Reduce shoulder stress' },
  { id: 'knee_injury', name: 'Knee Limitation', description: 'Reduce knee stress' },
  { id: 'back_injury', name: 'Back Limitation', description: 'Reduce spinal stress' },
  { id: 'wrist_injury', name: 'Wrist Limitation', description: 'Reduce wrist loading' },
];

export const EQUIPMENT_PRESETS: { name: string; equipment: Equipment[] }[] = [
  { name: 'Full Gym', equipment: ['barbell', 'dumbbells', 'cables', 'machines', 'pullup_bar', 'bench', 'squat_rack'] },
  { name: 'Home Gym', equipment: ['dumbbells', 'pullup_bar', 'bench', 'bodyweight'] },
  { name: 'Dumbbells Only', equipment: ['dumbbells', 'bodyweight'] },
  { name: 'Bodyweight Only', equipment: ['bodyweight'] },
];
