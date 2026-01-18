import { DifficultyLevel } from '../types';

/**
 * Muscle relationship and training metadata
 * This data enhances the base muscle definitions with:
 * - Synergist relationships (muscles that assist)
 * - Antagonist relationships (opposing muscles)
 * - Stabilizer relationships (muscles that stabilize)
 * - Training metadata (difficulty, compound primary, recovery hours)
 */

export interface MuscleMetadata {
    synergists: string[];
    antagonists: string[];
    stabilizers: string[];
    difficulty: DifficultyLevel;
    compoundPrimary: boolean;
    recoveryHours: number;
}

// Muscle relationship data keyed by muscle ID
export const muscleRelationships: Record<string, MuscleMetadata> = {
    // ==================== CHEST ====================
    'pectoralis-major-left': {
        synergists: ['anterior-deltoid-left', 'triceps-left', 'serratus-anterior-left'],
        antagonists: ['latissimus-dorsi-left', 'rhomboid-left', 'posterior-deltoid-left'],
        stabilizers: ['rectus-abdominis', 'external-oblique-left', 'biceps-left'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 48,
    },
    'pectoralis-major-right': {
        synergists: ['anterior-deltoid-right', 'triceps-right', 'serratus-anterior-right'],
        antagonists: ['latissimus-dorsi-right', 'rhomboid-right', 'posterior-deltoid-right'],
        stabilizers: ['rectus-abdominis', 'external-oblique-right', 'biceps-right'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 48,
    },
    'serratus-anterior-left': {
        synergists: ['pectoralis-major-left', 'trapezius-lower'],
        antagonists: ['rhomboid-left'],
        stabilizers: ['external-oblique-left', 'rectus-abdominis'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'serratus-anterior-right': {
        synergists: ['pectoralis-major-right', 'trapezius-lower'],
        antagonists: ['rhomboid-right'],
        stabilizers: ['external-oblique-right', 'rectus-abdominis'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },

    // ==================== SHOULDERS ====================
    'anterior-deltoid-left': {
        synergists: ['pectoralis-major-left', 'lateral-deltoid-left', 'triceps-left'],
        antagonists: ['posterior-deltoid-left', 'latissimus-dorsi-left'],
        stabilizers: ['trapezius-upper', 'rotator-cuff', 'rectus-abdominis'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 48,
    },
    'anterior-deltoid-right': {
        synergists: ['pectoralis-major-right', 'lateral-deltoid-right', 'triceps-right'],
        antagonists: ['posterior-deltoid-right', 'latissimus-dorsi-right'],
        stabilizers: ['trapezius-upper', 'rotator-cuff', 'rectus-abdominis'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 48,
    },
    'lateral-deltoid-left': {
        synergists: ['anterior-deltoid-left', 'trapezius-upper', 'supraspinatus-left'],
        antagonists: ['latissimus-dorsi-left'],
        stabilizers: ['rotator-cuff', 'trapezius-middle'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'lateral-deltoid-right': {
        synergists: ['anterior-deltoid-right', 'trapezius-upper', 'supraspinatus-right'],
        antagonists: ['latissimus-dorsi-right'],
        stabilizers: ['rotator-cuff', 'trapezius-middle'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'posterior-deltoid-left': {
        synergists: ['latissimus-dorsi-left', 'rhomboid-left', 'trapezius-middle'],
        antagonists: ['anterior-deltoid-left', 'pectoralis-major-left'],
        stabilizers: ['infraspinatus-left', 'teres-major-left'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'posterior-deltoid-right': {
        synergists: ['latissimus-dorsi-right', 'rhomboid-right', 'trapezius-middle'],
        antagonists: ['anterior-deltoid-right', 'pectoralis-major-right'],
        stabilizers: ['infraspinatus-right', 'teres-major-right'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },

    // ==================== BACK ====================
    'trapezius-upper': {
        synergists: ['levator-scapulae', 'rhomboid-left', 'rhomboid-right'],
        antagonists: ['pectoralis-major-left', 'pectoralis-major-right'],
        stabilizers: ['neck-muscles', 'erector-spinae'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'trapezius-middle': {
        synergists: ['rhomboid-left', 'rhomboid-right', 'posterior-deltoid-left', 'posterior-deltoid-right'],
        antagonists: ['pectoralis-major-left', 'pectoralis-major-right', 'serratus-anterior-left', 'serratus-anterior-right'],
        stabilizers: ['erector-spinae', 'trapezius-upper', 'trapezius-lower'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'trapezius-lower': {
        synergists: ['serratus-anterior-left', 'serratus-anterior-right', 'rhomboid-left', 'rhomboid-right'],
        antagonists: ['trapezius-upper'],
        stabilizers: ['erector-spinae', 'trapezius-middle'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'latissimus-dorsi-left': {
        synergists: ['teres-major-left', 'rhomboid-left', 'biceps-left', 'posterior-deltoid-left'],
        antagonists: ['pectoralis-major-left', 'anterior-deltoid-left'],
        stabilizers: ['erector-spinae', 'rectus-abdominis', 'external-oblique-left'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'latissimus-dorsi-right': {
        synergists: ['teres-major-right', 'rhomboid-right', 'biceps-right', 'posterior-deltoid-right'],
        antagonists: ['pectoralis-major-right', 'anterior-deltoid-right'],
        stabilizers: ['erector-spinae', 'rectus-abdominis', 'external-oblique-right'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'rhomboid-left': {
        synergists: ['trapezius-middle', 'posterior-deltoid-left'],
        antagonists: ['serratus-anterior-left', 'pectoralis-major-left'],
        stabilizers: ['erector-spinae', 'trapezius-upper'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'rhomboid-right': {
        synergists: ['trapezius-middle', 'posterior-deltoid-right'],
        antagonists: ['serratus-anterior-right', 'pectoralis-major-right'],
        stabilizers: ['erector-spinae', 'trapezius-upper'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'teres-major-left': {
        synergists: ['latissimus-dorsi-left', 'posterior-deltoid-left'],
        antagonists: ['pectoralis-major-left', 'anterior-deltoid-left'],
        stabilizers: ['infraspinatus-left', 'rhomboid-left'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'teres-major-right': {
        synergists: ['latissimus-dorsi-right', 'posterior-deltoid-right'],
        antagonists: ['pectoralis-major-right', 'anterior-deltoid-right'],
        stabilizers: ['infraspinatus-right', 'rhomboid-right'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'infraspinatus-left': {
        synergists: ['teres-major-left', 'posterior-deltoid-left'],
        antagonists: ['pectoralis-major-left', 'anterior-deltoid-left'],
        stabilizers: ['trapezius-middle', 'rhomboid-left'],
        difficulty: 'advanced',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'infraspinatus-right': {
        synergists: ['teres-major-right', 'posterior-deltoid-right'],
        antagonists: ['pectoralis-major-right', 'anterior-deltoid-right'],
        stabilizers: ['trapezius-middle', 'rhomboid-right'],
        difficulty: 'advanced',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'erector-spinae': {
        synergists: ['gluteus-maximus-left', 'gluteus-maximus-right', 'biceps-femoris-left', 'biceps-femoris-right'],
        antagonists: ['rectus-abdominis', 'external-oblique-left', 'external-oblique-right'],
        stabilizers: ['gluteus-medius-left', 'gluteus-medius-right', 'quadratus-lumborum'],
        difficulty: 'intermediate',
        compoundPrimary: true,
        recoveryHours: 72,
    },

    // ==================== ARMS - BICEPS ====================
    'biceps-left': {
        synergists: ['brachialis-left', 'brachioradialis-left', 'forearm-flexors-left'],
        antagonists: ['triceps-left'],
        stabilizers: ['anterior-deltoid-left', 'trapezius-upper'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'biceps-right': {
        synergists: ['brachialis-right', 'brachioradialis-right', 'forearm-flexors-right'],
        antagonists: ['triceps-right'],
        stabilizers: ['anterior-deltoid-right', 'trapezius-upper'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'brachialis-left': {
        synergists: ['biceps-left', 'brachioradialis-left'],
        antagonists: ['triceps-left'],
        stabilizers: ['forearm-flexors-left'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'brachialis-right': {
        synergists: ['biceps-right', 'brachioradialis-right'],
        antagonists: ['triceps-right'],
        stabilizers: ['forearm-flexors-right'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },

    // ==================== ARMS - TRICEPS ====================
    'triceps-left': {
        synergists: ['anterior-deltoid-left', 'pectoralis-major-left'],
        antagonists: ['biceps-left', 'brachialis-left'],
        stabilizers: ['lateral-deltoid-left', 'trapezius-upper'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'triceps-right': {
        synergists: ['anterior-deltoid-right', 'pectoralis-major-right'],
        antagonists: ['biceps-right', 'brachialis-right'],
        stabilizers: ['lateral-deltoid-right', 'trapezius-upper'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },

    // ==================== ARMS - FOREARMS ====================
    'forearm-flexors-left': {
        synergists: ['biceps-left', 'brachialis-left'],
        antagonists: ['forearm-extensors-left'],
        stabilizers: ['brachioradialis-left'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'forearm-flexors-right': {
        synergists: ['biceps-right', 'brachialis-right'],
        antagonists: ['forearm-extensors-right'],
        stabilizers: ['brachioradialis-right'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'forearm-extensors-left': {
        synergists: ['triceps-left'],
        antagonists: ['forearm-flexors-left'],
        stabilizers: ['brachioradialis-left'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'forearm-extensors-right': {
        synergists: ['triceps-right'],
        antagonists: ['forearm-flexors-right'],
        stabilizers: ['brachioradialis-right'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },

    // ==================== CORE ====================
    'rectus-abdominis': {
        synergists: ['external-oblique-left', 'external-oblique-right'],
        antagonists: ['erector-spinae'],
        stabilizers: ['gluteus-maximus-left', 'gluteus-maximus-right'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 24,
    },
    'abs-upper': {
        synergists: ['rectus-abdominis', 'external-oblique-left', 'external-oblique-right'],
        antagonists: ['erector-spinae'],
        stabilizers: [],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 24,
    },
    'abs-middle': {
        synergists: ['rectus-abdominis', 'external-oblique-left', 'external-oblique-right'],
        antagonists: ['erector-spinae'],
        stabilizers: [],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 24,
    },
    'abs-lower': {
        synergists: ['rectus-abdominis', 'external-oblique-left', 'external-oblique-right'],
        antagonists: ['erector-spinae'],
        stabilizers: ['rectus-femoris-left', 'rectus-femoris-right'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 24,
    },
    'external-oblique-left': {
        synergists: ['rectus-abdominis', 'external-oblique-right'],
        antagonists: ['erector-spinae', 'quadratus-lumborum'],
        stabilizers: ['gluteus-medius-left'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 24,
    },
    'external-oblique-right': {
        synergists: ['rectus-abdominis', 'external-oblique-left'],
        antagonists: ['erector-spinae', 'quadratus-lumborum'],
        stabilizers: ['gluteus-medius-right'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 24,
    },

    // ==================== GLUTES ====================
    'gluteus-maximus-left': {
        synergists: ['biceps-femoris-left', 'erector-spinae', 'gluteus-medius-left'],
        antagonists: ['rectus-femoris-left', 'psoas'],
        stabilizers: ['external-oblique-left', 'rectus-abdominis'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'gluteus-maximus-right': {
        synergists: ['biceps-femoris-right', 'erector-spinae', 'gluteus-medius-right'],
        antagonists: ['rectus-femoris-right', 'psoas'],
        stabilizers: ['external-oblique-right', 'rectus-abdominis'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'gluteus-medius-left': {
        synergists: ['gluteus-maximus-left', 'tensor-fasciae-latae'],
        antagonists: ['adductor-left'],
        stabilizers: ['external-oblique-left', 'rectus-abdominis'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'gluteus-medius-right': {
        synergists: ['gluteus-maximus-right', 'tensor-fasciae-latae'],
        antagonists: ['adductor-right'],
        stabilizers: ['external-oblique-right', 'rectus-abdominis'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },

    // ==================== LEGS - QUADRICEPS ====================
    'rectus-femoris-left': {
        synergists: ['vastus-lateralis-left', 'vastus-medialis-left'],
        antagonists: ['biceps-femoris-left', 'semitendinosus-left'],
        stabilizers: ['gluteus-medius-left', 'rectus-abdominis'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'rectus-femoris-right': {
        synergists: ['vastus-lateralis-right', 'vastus-medialis-right'],
        antagonists: ['biceps-femoris-right', 'semitendinosus-right'],
        stabilizers: ['gluteus-medius-right', 'rectus-abdominis'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'vastus-lateralis-left': {
        synergists: ['rectus-femoris-left', 'vastus-medialis-left'],
        antagonists: ['biceps-femoris-left'],
        stabilizers: ['gluteus-medius-left'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'vastus-lateralis-right': {
        synergists: ['rectus-femoris-right', 'vastus-medialis-right'],
        antagonists: ['biceps-femoris-right'],
        stabilizers: ['gluteus-medius-right'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'vastus-medialis-left': {
        synergists: ['rectus-femoris-left', 'vastus-lateralis-left'],
        antagonists: ['biceps-femoris-left'],
        stabilizers: ['adductor-left'],
        difficulty: 'intermediate',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'vastus-medialis-right': {
        synergists: ['rectus-femoris-right', 'vastus-lateralis-right'],
        antagonists: ['biceps-femoris-right'],
        stabilizers: ['adductor-right'],
        difficulty: 'intermediate',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'adductor-left': {
        synergists: ['adductor-right'],
        antagonists: ['gluteus-medius-left'],
        stabilizers: ['external-oblique-left', 'rectus-abdominis'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'adductor-right': {
        synergists: ['adductor-left'],
        antagonists: ['gluteus-medius-right'],
        stabilizers: ['external-oblique-right', 'rectus-abdominis'],
        difficulty: 'intermediate',
        compoundPrimary: false,
        recoveryHours: 48,
    },

    // ==================== LEGS - HAMSTRINGS ====================
    'biceps-femoris-left': {
        synergists: ['semitendinosus-left', 'gluteus-maximus-left'],
        antagonists: ['rectus-femoris-left', 'vastus-lateralis-left', 'vastus-medialis-left'],
        stabilizers: ['gastrocnemius-left', 'erector-spinae'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'biceps-femoris-right': {
        synergists: ['semitendinosus-right', 'gluteus-maximus-right'],
        antagonists: ['rectus-femoris-right', 'vastus-lateralis-right', 'vastus-medialis-right'],
        stabilizers: ['gastrocnemius-right', 'erector-spinae'],
        difficulty: 'beginner',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'semitendinosus-left': {
        synergists: ['biceps-femoris-left', 'gluteus-maximus-left'],
        antagonists: ['rectus-femoris-left'],
        stabilizers: ['gastrocnemius-left'],
        difficulty: 'intermediate',
        compoundPrimary: true,
        recoveryHours: 72,
    },
    'semitendinosus-right': {
        synergists: ['biceps-femoris-right', 'gluteus-maximus-right'],
        antagonists: ['rectus-femoris-right'],
        stabilizers: ['gastrocnemius-right'],
        difficulty: 'intermediate',
        compoundPrimary: true,
        recoveryHours: 72,
    },

    // ==================== CALVES ====================
    'gastrocnemius-left': {
        synergists: ['soleus-left'],
        antagonists: ['tibialis-anterior-left'],
        stabilizers: ['biceps-femoris-left'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'gastrocnemius-right': {
        synergists: ['soleus-right'],
        antagonists: ['tibialis-anterior-right'],
        stabilizers: ['biceps-femoris-right'],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'soleus-left': {
        synergists: ['gastrocnemius-left'],
        antagonists: ['tibialis-anterior-left'],
        stabilizers: [],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
    'soleus-right': {
        synergists: ['gastrocnemius-right'],
        antagonists: ['tibialis-anterior-right'],
        stabilizers: [],
        difficulty: 'beginner',
        compoundPrimary: false,
        recoveryHours: 48,
    },
};

/**
 * Get metadata for a specific muscle
 */
export const getMuscleMetadata = (muscleId: string): MuscleMetadata | undefined => {
    return muscleRelationships[muscleId];
};

/**
 * Default metadata for muscles not explicitly defined
 */
export const defaultMuscleMetadata: MuscleMetadata = {
    synergists: [],
    antagonists: [],
    stabilizers: [],
    difficulty: 'intermediate',
    compoundPrimary: false,
    recoveryHours: 48,
};

/**
 * Get all antagonist muscles for a given muscle
 */
export const getAntagonists = (muscleId: string): string[] => {
    return muscleRelationships[muscleId]?.antagonists ?? [];
};

/**
 * Get all synergist muscles for a given muscle
 */
export const getSynergists = (muscleId: string): string[] => {
    return muscleRelationships[muscleId]?.synergists ?? [];
};

/**
 * Get all stabilizer muscles for a given muscle
 */
export const getStabilizers = (muscleId: string): string[] => {
    return muscleRelationships[muscleId]?.stabilizers ?? [];
};

/**
 * Check if two muscles are antagonists
 */
export const areAntagonists = (muscleId1: string, muscleId2: string): boolean => {
    const antagonists1 = getAntagonists(muscleId1);
    const antagonists2 = getAntagonists(muscleId2);
    return antagonists1.includes(muscleId2) || antagonists2.includes(muscleId1);
};

/**
 * Check if two muscles are synergists
 */
export const areSynergists = (muscleId1: string, muscleId2: string): boolean => {
    const synergists1 = getSynergists(muscleId1);
    const synergists2 = getSynergists(muscleId2);
    return synergists1.includes(muscleId2) || synergists2.includes(muscleId1);
};
