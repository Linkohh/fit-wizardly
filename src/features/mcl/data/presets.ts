/**
 * Workout presets for common training splits
 */
export interface WorkoutPreset {
    id: string;
    name: string;
    description: string;
    muscleIds: string[];
    category: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody' | 'custom';
}

export const presets: WorkoutPreset[] = [
    // Push/Pull/Legs Split
    {
        id: 'push-day',
        name: 'Push Day',
        description: 'Chest, shoulders, and triceps',
        muscleIds: [
            'pectoralis-major-left',
            'pectoralis-major-right',
            'anterior-deltoid-left',
            'anterior-deltoid-right',
            'lateral-deltoid-left',
            'lateral-deltoid-right',
            'triceps-left',
            'triceps-right',
            'serratus-anterior-left',
            'serratus-anterior-right',
        ],
        category: 'push',
    },
    {
        id: 'pull-day',
        name: 'Pull Day',
        description: 'Back and biceps',
        muscleIds: [
            'latissimus-dorsi-left',
            'latissimus-dorsi-right',
            'trapezius-upper',
            'trapezius-middle',
            'trapezius-lower',
            'rhomboid-left',
            'rhomboid-right',
            'posterior-deltoid-left',
            'posterior-deltoid-right',
            'biceps-left',
            'biceps-right',
            'brachialis-left',
            'brachialis-right',
            'forearm-flexors-left',
            'forearm-flexors-right',
        ],
        category: 'pull',
    },
    {
        id: 'legs-day',
        name: 'Legs Day',
        description: 'Quads, hamstrings, glutes, and calves',
        muscleIds: [
            'rectus-femoris-left',
            'rectus-femoris-right',
            'vastus-lateralis-left',
            'vastus-lateralis-right',
            'vastus-medialis-left',
            'vastus-medialis-right',
            'biceps-femoris-left',
            'biceps-femoris-right',
            'semitendinosus-left',
            'semitendinosus-right',
            'gluteus-maximus-left',
            'gluteus-maximus-right',
            'gluteus-medius-left',
            'gluteus-medius-right',
            'gastrocnemius-left',
            'gastrocnemius-right',
            'soleus-left',
            'soleus-right',
            'adductor-left',
            'adductor-right',
        ],
        category: 'legs',
    },

    // Upper/Lower Split
    {
        id: 'upper-body',
        name: 'Upper Body',
        description: 'All upper body muscles',
        muscleIds: [
            'pectoralis-major-left',
            'pectoralis-major-right',
            'latissimus-dorsi-left',
            'latissimus-dorsi-right',
            'trapezius-upper',
            'trapezius-middle',
            'anterior-deltoid-left',
            'anterior-deltoid-right',
            'lateral-deltoid-left',
            'lateral-deltoid-right',
            'posterior-deltoid-left',
            'posterior-deltoid-right',
            'biceps-left',
            'biceps-right',
            'triceps-left',
            'triceps-right',
        ],
        category: 'upper',
    },
    {
        id: 'lower-body',
        name: 'Lower Body',
        description: 'All lower body muscles',
        muscleIds: [
            'rectus-femoris-left',
            'rectus-femoris-right',
            'vastus-lateralis-left',
            'vastus-lateralis-right',
            'vastus-medialis-left',
            'vastus-medialis-right',
            'biceps-femoris-left',
            'biceps-femoris-right',
            'semitendinosus-left',
            'semitendinosus-right',
            'gluteus-maximus-left',
            'gluteus-maximus-right',
            'gluteus-medius-left',
            'gluteus-medius-right',
            'gastrocnemius-left',
            'gastrocnemius-right',
            'soleus-left',
            'soleus-right',
            'adductor-left',
            'adductor-right',
        ],
        category: 'lower',
    },

    // Core Focus
    {
        id: 'core-focus',
        name: 'Core Focus',
        description: 'Abs and obliques',
        muscleIds: [
            'rectus-abdominis',
            'abs-upper',
            'abs-middle',
            'abs-lower',
            'external-oblique-left',
            'external-oblique-right',
            'erector-spinae',
        ],
        category: 'custom',
    },

    // Full Body
    {
        id: 'full-body',
        name: 'Full Body',
        description: 'All major muscle groups',
        muscleIds: [
            'pectoralis-major-left',
            'pectoralis-major-right',
            'latissimus-dorsi-left',
            'latissimus-dorsi-right',
            'anterior-deltoid-left',
            'anterior-deltoid-right',
            'biceps-left',
            'biceps-right',
            'triceps-left',
            'triceps-right',
            'rectus-abdominis',
            'external-oblique-left',
            'external-oblique-right',
            'rectus-femoris-left',
            'rectus-femoris-right',
            'biceps-femoris-left',
            'biceps-femoris-right',
            'gluteus-maximus-left',
            'gluteus-maximus-right',
            'gastrocnemius-left',
            'gastrocnemius-right',
        ],
        category: 'fullbody',
    },

    // Arms Focus
    {
        id: 'arms-focus',
        name: 'Arms Focus',
        description: 'Biceps, triceps, and forearms',
        muscleIds: [
            'biceps-left',
            'biceps-right',
            'brachialis-left',
            'brachialis-right',
            'triceps-left',
            'triceps-right',
            'forearm-flexors-left',
            'forearm-flexors-right',
            'forearm-extensors-left',
            'forearm-extensors-right',
        ],
        category: 'custom',
    },
];

export const getPresetById = (id: string): WorkoutPreset | undefined => {
    return presets.find((p) => p.id === id);
};

export const getPresetsByCategory = (category: WorkoutPreset['category']): WorkoutPreset[] => {
    return presets.filter((p) => p.category === category);
};
