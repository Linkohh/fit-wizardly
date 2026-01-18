import { Exercise } from '../types/exercise';

/**
 * Comprehensive exercise database with muscle targeting
 * 75+ exercises covering all muscle groups
 */
export const exercises: Exercise[] = [
  // ==================== CHEST EXERCISES ====================
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    description: 'Fundamental chest exercise for mass and strength',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'triceps-left', 'triceps-right'],
    equipment: ['barbell', 'bench'],
    difficulty: 'beginner',
    movementPattern: 'push',
    instructions: [
      'Lie on bench with feet flat on floor',
      'Grip bar slightly wider than shoulder width',
      'Lower bar to mid-chest with control',
      'Press up until arms are extended'
    ],
    tips: ['Keep shoulder blades retracted', 'Maintain slight arch in lower back']
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    description: 'Targets upper chest with angled pressing',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'triceps-left', 'triceps-right'],
    equipment: ['barbell', 'bench'],
    difficulty: 'beginner',
    movementPattern: 'push'
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    description: 'Unilateral chest press for balanced development',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'triceps-left', 'triceps-right'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    movementPattern: 'push'
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    description: 'Classic bodyweight chest exercise',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'triceps-left', 'triceps-right', 'rectus-abdominis'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'push'
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    description: 'Isolation movement for chest stretch and contraction',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    movementPattern: 'isolation'
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    description: 'Constant tension chest isolation',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'serratus-anterior-left', 'serratus-anterior-right'],
    equipment: ['cable'],
    difficulty: 'intermediate',
    movementPattern: 'isolation'
  },
  {
    id: 'dips',
    name: 'Dips',
    description: 'Compound push for chest and triceps',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right', 'triceps-left', 'triceps-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    movementPattern: 'push'
  },
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    description: 'Targets lower chest fibers',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['triceps-left', 'triceps-right', 'anterior-deltoid-left', 'anterior-deltoid-right'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    movementPattern: 'push'
  },
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    description: 'Guided chest pressing motion',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'triceps-left', 'triceps-right'],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'push'
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck Fly',
    description: 'Machine-based chest isolation',
    primaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right'],
    secondaryMuscles: ['serratus-anterior-left', 'serratus-anterior-right'],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },

  // ==================== BACK EXERCISES ====================
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    description: 'Fundamental vertical pulling movement',
    primaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right'],
    secondaryMuscles: ['biceps-left', 'biceps-right', 'rhomboid-left', 'rhomboid-right', 'trapezius-middle'],
    equipment: ['pull-up-bar', 'bodyweight'],
    difficulty: 'intermediate',
    movementPattern: 'pull'
  },
  {
    id: 'chin-ups',
    name: 'Chin-Ups',
    description: 'Underhand grip vertical pull with bicep emphasis',
    primaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right', 'biceps-left', 'biceps-right'],
    secondaryMuscles: ['brachialis-left', 'brachialis-right', 'rhomboid-left', 'rhomboid-right'],
    equipment: ['pull-up-bar', 'bodyweight'],
    difficulty: 'intermediate',
    movementPattern: 'pull'
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    description: 'Machine vertical pull for lats',
    primaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right'],
    secondaryMuscles: ['biceps-left', 'biceps-right', 'rhomboid-left', 'rhomboid-right', 'teres-major-left', 'teres-major-right'],
    equipment: ['cable'],
    difficulty: 'beginner',
    movementPattern: 'pull'
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    description: 'Horizontal pulling for back thickness',
    primaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right', 'rhomboid-left', 'rhomboid-right'],
    secondaryMuscles: ['trapezius-middle', 'biceps-left', 'biceps-right', 'erector-spinae'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'pull'
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    description: 'Unilateral horizontal pull',
    primaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right'],
    secondaryMuscles: ['rhomboid-left', 'rhomboid-right', 'biceps-left', 'biceps-right', 'posterior-deltoid-left', 'posterior-deltoid-right'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    movementPattern: 'pull'
  },
  {
    id: 'cable-row',
    name: 'Seated Cable Row',
    description: 'Constant tension horizontal pull',
    primaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right', 'rhomboid-left', 'rhomboid-right'],
    secondaryMuscles: ['trapezius-middle', 'biceps-left', 'biceps-right'],
    equipment: ['cable'],
    difficulty: 'beginner',
    movementPattern: 'pull'
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    description: 'Heavy rowing variation for back thickness',
    primaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right', 'rhomboid-left', 'rhomboid-right'],
    secondaryMuscles: ['trapezius-middle', 'trapezius-lower', 'biceps-left', 'biceps-right'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'pull'
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    description: 'Rear delt and upper back health exercise',
    primaryMuscles: ['posterior-deltoid-left', 'posterior-deltoid-right', 'trapezius-middle'],
    secondaryMuscles: ['rhomboid-left', 'rhomboid-right', 'infraspinatus-left', 'infraspinatus-right'],
    equipment: ['cable'],
    difficulty: 'beginner',
    movementPattern: 'pull'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'Full body posterior chain compound lift',
    primaryMuscles: ['erector-spinae', 'gluteus-maximus-left', 'gluteus-maximus-right'],
    secondaryMuscles: ['latissimus-dorsi-left', 'latissimus-dorsi-right', 'biceps-femoris-left', 'biceps-femoris-right', 'trapezius-upper'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'hinge'
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    description: 'Hip hinge for hamstrings and glutes',
    primaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right', 'gluteus-maximus-left', 'gluteus-maximus-right'],
    secondaryMuscles: ['erector-spinae', 'semitendinosus-left', 'semitendinosus-right'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'hinge'
  },
  {
    id: 'shrugs',
    name: 'Barbell Shrugs',
    description: 'Trap isolation for upper back',
    primaryMuscles: ['trapezius-upper'],
    secondaryMuscles: ['trapezius-middle'],
    equipment: ['barbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'reverse-fly',
    name: 'Reverse Fly',
    description: 'Rear delt isolation',
    primaryMuscles: ['posterior-deltoid-left', 'posterior-deltoid-right'],
    secondaryMuscles: ['rhomboid-left', 'rhomboid-right', 'trapezius-middle'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },

  // ==================== SHOULDER EXERCISES ====================
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    description: 'Fundamental vertical pressing movement',
    primaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'lateral-deltoid-left', 'lateral-deltoid-right'],
    secondaryMuscles: ['triceps-left', 'triceps-right', 'trapezius-upper'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'push'
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    description: 'Unilateral overhead pressing',
    primaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'lateral-deltoid-left', 'lateral-deltoid-right'],
    secondaryMuscles: ['triceps-left', 'triceps-right', 'trapezius-upper'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'push'
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    description: 'Rotational shoulder press for full delt activation',
    primaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'lateral-deltoid-left', 'lateral-deltoid-right'],
    secondaryMuscles: ['triceps-left', 'triceps-right'],
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
    movementPattern: 'push'
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    description: 'Side delt isolation',
    primaryMuscles: ['lateral-deltoid-left', 'lateral-deltoid-right'],
    secondaryMuscles: ['trapezius-upper', 'anterior-deltoid-left', 'anterior-deltoid-right'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    description: 'Anterior deltoid isolation',
    primaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right'],
    secondaryMuscles: ['lateral-deltoid-left', 'lateral-deltoid-right', 'pectoralis-major-left', 'pectoralis-major-right'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'upright-row',
    name: 'Upright Row',
    description: 'Compound for delts and traps',
    primaryMuscles: ['lateral-deltoid-left', 'lateral-deltoid-right', 'trapezius-upper'],
    secondaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'biceps-left', 'biceps-right'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'pull'
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    description: 'Constant tension lateral delt work',
    primaryMuscles: ['lateral-deltoid-left', 'lateral-deltoid-right'],
    secondaryMuscles: ['trapezius-upper'],
    equipment: ['cable'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    description: 'Guided overhead pressing',
    primaryMuscles: ['anterior-deltoid-left', 'anterior-deltoid-right', 'lateral-deltoid-left', 'lateral-deltoid-right'],
    secondaryMuscles: ['triceps-left', 'triceps-right'],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'push'
  },

  // ==================== ARM EXERCISES - BICEPS ====================
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    description: 'Classic bicep mass builder',
    primaryMuscles: ['biceps-left', 'biceps-right'],
    secondaryMuscles: ['brachialis-left', 'brachialis-right', 'forearm-flexors-left', 'forearm-flexors-right'],
    equipment: ['barbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    description: 'Unilateral bicep curls',
    primaryMuscles: ['biceps-left', 'biceps-right'],
    secondaryMuscles: ['brachialis-left', 'brachialis-right'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    description: 'Neutral grip for brachialis and forearms',
    primaryMuscles: ['brachialis-left', 'brachialis-right', 'biceps-left', 'biceps-right'],
    secondaryMuscles: ['forearm-flexors-left', 'forearm-flexors-right'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    description: 'Strict bicep isolation',
    primaryMuscles: ['biceps-left', 'biceps-right'],
    secondaryMuscles: ['brachialis-left', 'brachialis-right'],
    equipment: ['barbell', 'bench'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    description: 'Stretched position bicep curl',
    primaryMuscles: ['biceps-left', 'biceps-right'],
    secondaryMuscles: ['brachialis-left', 'brachialis-right'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    movementPattern: 'isolation'
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    description: 'Constant tension bicep work',
    primaryMuscles: ['biceps-left', 'biceps-right'],
    secondaryMuscles: ['brachialis-left', 'brachialis-right'],
    equipment: ['cable'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'concentration-curl',
    name: 'Concentration Curl',
    description: 'Peak contraction bicep isolation',
    primaryMuscles: ['biceps-left', 'biceps-right'],
    secondaryMuscles: ['brachialis-left', 'brachialis-right'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },

  // ==================== ARM EXERCISES - TRICEPS ====================
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    description: 'Cable tricep isolation',
    primaryMuscles: ['triceps-left', 'triceps-right'],
    secondaryMuscles: [],
    equipment: ['cable'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close Grip Bench Press',
    description: 'Compound tricep and chest movement',
    primaryMuscles: ['triceps-left', 'triceps-right'],
    secondaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right', 'anterior-deltoid-left', 'anterior-deltoid-right'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    movementPattern: 'push'
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    description: 'Lying tricep extension',
    primaryMuscles: ['triceps-left', 'triceps-right'],
    secondaryMuscles: [],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    movementPattern: 'isolation'
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    description: 'Stretched position tricep work',
    primaryMuscles: ['triceps-left', 'triceps-right'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'tricep-kickback',
    name: 'Tricep Kickback',
    description: 'Peak contraction tricep isolation',
    primaryMuscles: ['triceps-left', 'triceps-right'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'diamond-push-ups',
    name: 'Diamond Push-Ups',
    description: 'Bodyweight tricep focus',
    primaryMuscles: ['triceps-left', 'triceps-right'],
    secondaryMuscles: ['pectoralis-major-left', 'pectoralis-major-right', 'anterior-deltoid-left', 'anterior-deltoid-right'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    movementPattern: 'push'
  },

  // ==================== ARM EXERCISES - FOREARMS ====================
  {
    id: 'wrist-curls',
    name: 'Wrist Curls',
    description: 'Forearm flexor development',
    primaryMuscles: ['forearm-flexors-left', 'forearm-flexors-right'],
    secondaryMuscles: [],
    equipment: ['barbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'reverse-wrist-curls',
    name: 'Reverse Wrist Curls',
    description: 'Forearm extensor development',
    primaryMuscles: ['forearm-extensors-left', 'forearm-extensors-right'],
    secondaryMuscles: [],
    equipment: ['barbell'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'farmers-walk',
    name: 'Farmers Walk',
    description: 'Grip and full body carry exercise',
    primaryMuscles: ['forearm-flexors-left', 'forearm-flexors-right'],
    secondaryMuscles: ['trapezius-upper', 'rectus-abdominis', 'external-oblique-left', 'external-oblique-right'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    movementPattern: 'carry'
  },

  // ==================== CORE EXERCISES ====================
  {
    id: 'crunches',
    name: 'Crunches',
    description: 'Basic ab isolation',
    primaryMuscles: ['rectus-abdominis', 'abs-upper'],
    secondaryMuscles: ['external-oblique-left', 'external-oblique-right'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'leg-raises',
    name: 'Hanging Leg Raises',
    description: 'Lower ab focus with hip flexion',
    primaryMuscles: ['rectus-abdominis', 'abs-lower'],
    secondaryMuscles: ['external-oblique-left', 'external-oblique-right'],
    equipment: ['pull-up-bar', 'bodyweight'],
    difficulty: 'intermediate',
    movementPattern: 'isolation'
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Isometric core stability',
    primaryMuscles: ['rectus-abdominis', 'abs-middle'],
    secondaryMuscles: ['external-oblique-left', 'external-oblique-right', 'erector-spinae'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    description: 'Rotational core work for obliques',
    primaryMuscles: ['external-oblique-left', 'external-oblique-right'],
    secondaryMuscles: ['rectus-abdominis'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'rotation'
  },
  {
    id: 'cable-crunches',
    name: 'Cable Crunches',
    description: 'Weighted ab isolation',
    primaryMuscles: ['rectus-abdominis', 'abs-upper', 'abs-middle'],
    secondaryMuscles: ['external-oblique-left', 'external-oblique-right'],
    equipment: ['cable'],
    difficulty: 'intermediate',
    movementPattern: 'isolation'
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    description: 'Core stability with limb movement',
    primaryMuscles: ['rectus-abdominis', 'abs-middle'],
    secondaryMuscles: ['external-oblique-left', 'external-oblique-right'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    description: 'Advanced core exercise',
    primaryMuscles: ['rectus-abdominis', 'abs-middle', 'abs-lower'],
    secondaryMuscles: ['serratus-anterior-left', 'serratus-anterior-right', 'latissimus-dorsi-left', 'latissimus-dorsi-right'],
    equipment: ['bodyweight'],
    difficulty: 'advanced',
    movementPattern: 'isolation'
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    description: 'Lateral core stability',
    primaryMuscles: ['external-oblique-left', 'external-oblique-right'],
    secondaryMuscles: ['gluteus-medius-left', 'gluteus-medius-right', 'rectus-abdominis'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },

  // ==================== LEG EXERCISES - QUADRICEPS ====================
  {
    id: 'barbell-squat',
    name: 'Barbell Back Squat',
    description: 'King of leg exercises',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'vastus-lateralis-left', 'vastus-lateralis-right', 'vastus-medialis-left', 'vastus-medialis-right'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right', 'adductor-left', 'adductor-right', 'erector-spinae'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'squat'
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    description: 'Quad-dominant squat variation',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'vastus-lateralis-left', 'vastus-lateralis-right', 'vastus-medialis-left', 'vastus-medialis-right'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right', 'rectus-abdominis'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    movementPattern: 'squat'
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    description: 'Machine-based leg compound',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'vastus-lateralis-left', 'vastus-lateralis-right', 'vastus-medialis-left', 'vastus-medialis-right'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right'],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'squat'
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    description: 'Unilateral leg development',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'gluteus-maximus-left', 'gluteus-maximus-right'],
    secondaryMuscles: ['vastus-lateralis-left', 'vastus-lateralis-right', 'biceps-femoris-left', 'biceps-femoris-right'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'squat'
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    description: 'Quad isolation machine',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'vastus-lateralis-left', 'vastus-lateralis-right', 'vastus-medialis-left', 'vastus-medialis-right'],
    secondaryMuscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    description: 'Front-loaded squat for beginners',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'vastus-lateralis-left', 'vastus-lateralis-right'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right', 'rectus-abdominis'],
    equipment: ['dumbbell', 'kettlebell'],
    difficulty: 'beginner',
    movementPattern: 'squat'
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    description: 'Elevated rear foot squat',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'gluteus-maximus-left', 'gluteus-maximus-right'],
    secondaryMuscles: ['vastus-lateralis-left', 'vastus-lateralis-right', 'biceps-femoris-left', 'biceps-femoris-right'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    movementPattern: 'squat'
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    description: 'Machine squat for quad emphasis',
    primaryMuscles: ['rectus-femoris-left', 'rectus-femoris-right', 'vastus-lateralis-left', 'vastus-lateralis-right', 'vastus-medialis-left', 'vastus-medialis-right'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right'],
    equipment: ['machine'],
    difficulty: 'intermediate',
    movementPattern: 'squat'
  },

  // ==================== LEG EXERCISES - HAMSTRINGS ====================
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    description: 'Hamstring isolation',
    primaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right', 'semitendinosus-left', 'semitendinosus-right'],
    secondaryMuscles: ['gastrocnemius-left', 'gastrocnemius-right'],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    description: 'Hamstring isolation with hip flexion',
    primaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right', 'semitendinosus-left', 'semitendinosus-right'],
    secondaryMuscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'stiff-leg-deadlift',
    name: 'Stiff Leg Deadlift',
    description: 'Hamstring-focused hip hinge',
    primaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right', 'semitendinosus-left', 'semitendinosus-right'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right', 'erector-spinae'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'hinge'
  },
  {
    id: 'good-morning',
    name: 'Good Morning',
    description: 'Loaded hip hinge for posterior chain',
    primaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right', 'erector-spinae'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    movementPattern: 'hinge'
  },

  // ==================== GLUTE EXERCISES ====================
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    description: 'Primary glute builder',
    primaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right'],
    secondaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right', 'rectus-abdominis'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    movementPattern: 'hinge'
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    description: 'Bodyweight glute activation',
    primaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right'],
    secondaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'hinge'
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    description: 'Glute isolation with cable',
    primaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right'],
    secondaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right'],
    equipment: ['cable'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    description: 'Wide stance deadlift for glutes and inner thighs',
    primaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right', 'adductor-left', 'adductor-right'],
    secondaryMuscles: ['biceps-femoris-left', 'biceps-femoris-right', 'erector-spinae', 'rectus-femoris-left', 'rectus-femoris-right'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    movementPattern: 'hinge'
  },
  {
    id: 'clamshells',
    name: 'Clamshells',
    description: 'Glute medius activation',
    primaryMuscles: ['gluteus-medius-left', 'gluteus-medius-right'],
    secondaryMuscles: ['gluteus-maximus-left', 'gluteus-maximus-right'],
    equipment: ['resistance-band', 'bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'side-lying-leg-raise',
    name: 'Side Lying Leg Raise',
    description: 'Glute medius isolation',
    primaryMuscles: ['gluteus-medius-left', 'gluteus-medius-right'],
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },

  // ==================== CALF EXERCISES ====================
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    description: 'Primary calf builder',
    primaryMuscles: ['gastrocnemius-left', 'gastrocnemius-right'],
    secondaryMuscles: ['soleus-left', 'soleus-right'],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    description: 'Soleus-focused calf work',
    primaryMuscles: ['soleus-left', 'soleus-right'],
    secondaryMuscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'donkey-calf-raise',
    name: 'Donkey Calf Raise',
    description: 'Stretched position calf exercise',
    primaryMuscles: ['gastrocnemius-left', 'gastrocnemius-right'],
    secondaryMuscles: ['soleus-left', 'soleus-right'],
    equipment: ['machine', 'bodyweight'],
    difficulty: 'intermediate',
    movementPattern: 'isolation'
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    description: 'Dynamic calf conditioning',
    primaryMuscles: ['gastrocnemius-left', 'gastrocnemius-right', 'soleus-left', 'soleus-right'],
    secondaryMuscles: ['tibialis-anterior-left', 'tibialis-anterior-right'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
  {
    id: 'tibialis-raise',
    name: 'Tibialis Raise',
    description: 'Shin muscle development',
    primaryMuscles: ['tibialis-anterior-left', 'tibialis-anterior-right'],
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    movementPattern: 'isolation'
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get exercise by ID
 */
export const getExerciseById = (id: string): Exercise | undefined => {
  return exercises.find(e => e.id === id);
};

/**
 * Get all exercises that target a specific muscle
 */
export const getExercisesForMuscle = (muscleId: string): Exercise[] => {
  return exercises.filter(e =>
    e.primaryMuscles.includes(muscleId) || e.secondaryMuscles.includes(muscleId)
  );
};

/**
 * Get exercises that target any of the selected muscles
 */
export const getExercisesForMuscles = (muscleIds: string[]): Exercise[] => {
  const muscleSet = new Set(muscleIds);
  return exercises.filter(e =>
    e.primaryMuscles.some(m => muscleSet.has(m)) ||
    e.secondaryMuscles.some(m => muscleSet.has(m))
  );
};

/**
 * Get primary exercises (where muscle is primary target) for selected muscles
 */
export const getPrimaryExercisesForMuscles = (muscleIds: string[]): Exercise[] => {
  const muscleSet = new Set(muscleIds);
  return exercises.filter(e =>
    e.primaryMuscles.some(m => muscleSet.has(m))
  );
};

/**
 * Get compound exercises that hit multiple selected muscles
 */
export const getCompoundExercises = (muscleIds: string[]): Exercise[] => {
  const muscleSet = new Set(muscleIds);
  return exercises.filter(e => {
    const primaryMatches = e.primaryMuscles.filter(m => muscleSet.has(m)).length;
    return primaryMatches >= 2 || (primaryMatches >= 1 && e.secondaryMuscles.filter(m => muscleSet.has(m)).length >= 1);
  });
};

/**
 * Filter exercises by available equipment
 */
export const filterByEquipment = (
  exerciseList: Exercise[],
  availableEquipment: string[]
): Exercise[] => {
  const equipmentSet = new Set(availableEquipment);
  return exerciseList.filter(e =>
    e.equipment.some(eq => equipmentSet.has(eq))
  );
};

/**
 * Filter exercises by difficulty
 */
export const filterByDifficulty = (
  exerciseList: Exercise[],
  maxDifficulty: 'beginner' | 'intermediate' | 'advanced'
): Exercise[] => {
  const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
  const maxLevel = difficultyOrder[maxDifficulty];
  return exerciseList.filter(e => difficultyOrder[e.difficulty] <= maxLevel);
};

/**
 * Filter exercises by movement pattern
 */
export const filterByMovementPattern = (
  exerciseList: Exercise[],
  patterns: string[]
): Exercise[] => {
  const patternSet = new Set(patterns);
  return exerciseList.filter(e => patternSet.has(e.movementPattern));
};

/**
 * Get exercise count by muscle group
 */
export const getExerciseCountByGroup = (): Record<string, number> => {
  const counts: Record<string, number> = {};

  exercises.forEach(e => {
    e.primaryMuscles.forEach(muscleId => {
      // Extract group from muscle ID (e.g., 'pectoralis-major-left' -> 'chest')
      // This is a simplified version - in production, look up the muscle's group
      if (!counts[muscleId]) {
        counts[muscleId] = 0;
      }
      counts[muscleId]++;
    });
  });

  return counts;
};
