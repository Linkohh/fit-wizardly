import { MuscleGroup } from '@/types/fitness';
import { muscles } from '@/features/mcl/data/muscles';

// Mapping from MCL Muscle IDs to Legacy Muscle Groups
export const MCL_TO_LEGACY_MAP: Record<string, MuscleGroup> = {
    // Chest
    'pectoralis-major-left': 'chest',
    'pectoralis-major-right': 'chest',
    'serratus-anterior-left': 'chest',
    'serratus-anterior-right': 'chest',

    // Shoulders
    'anterior-deltoid-left': 'front_deltoid',
    'anterior-deltoid-right': 'front_deltoid',
    'lateral-deltoid-left': 'side_deltoid',
    'lateral-deltoid-right': 'side_deltoid',
    'posterior-deltoid-left': 'rear_deltoid',
    'posterior-deltoid-right': 'rear_deltoid',

    // Arms
    'biceps-left': 'biceps',
    'biceps-right': 'biceps',
    'brachialis-left': 'biceps',
    'brachialis-right': 'biceps',
    'triceps-left': 'triceps',
    'triceps-right': 'triceps',
    'forearm-flexors-left': 'forearms',
    'forearm-flexors-right': 'forearms',
    'forearm-extensors-left': 'forearms',
    'forearm-extensors-right': 'forearms',
    'brachioradialis-left': 'forearms',
    'brachioradialis-right': 'forearms',

    // Core
    'rectus-abdominis': 'abs',
    'abs-upper': 'abs',
    'abs-middle': 'abs',
    'abs-lower': 'abs',
    'external-oblique-left': 'obliques',
    'external-oblique-right': 'obliques',

    // Back
    'trapezius-upper': 'traps',
    'trapezius-middle': 'upper_back', // or traps? Legacy has 'traps' and 'upper_back'
    'trapezius-lower': 'upper_back',
    'rhomboid-left': 'upper_back',
    'rhomboid-right': 'upper_back',
    'latissimus-dorsi-left': 'lats',
    'latissimus-dorsi-right': 'lats',
    'teres-major-left': 'lats', // Often grouped with lats functionality
    'teres-major-right': 'lats',
    'infraspinatus-left': 'upper_back', // Rotator cuff
    'infraspinatus-right': 'upper_back',
    'erector-spinae': 'lower_back',

    // Legs
    'gluteus-maximus-left': 'glutes',
    'gluteus-maximus-right': 'glutes',
    'gluteus-medius-left': 'glutes',
    'gluteus-medius-right': 'glutes',
    'rectus-femoris-left': 'quads',
    'rectus-femoris-right': 'quads',
    'vastus-lateralis-left': 'quads',
    'vastus-lateralis-right': 'quads',
    'vastus-medialis-left': 'quads',
    'vastus-medialis-right': 'quads',
    'biceps-femoris-left': 'hamstrings',
    'biceps-femoris-right': 'hamstrings',
    'semitendinosus-left': 'hamstrings',
    'semitendinosus-right': 'hamstrings',
    'gastrocnemius-left': 'calves',
    'gastrocnemius-right': 'calves',
    'soleus-left': 'calves',
    'soleus-right': 'calves',
    'tibialis-anterior-left': 'calves', // Front of lower leg, often grouped or ignored
    'tibialis-anterior-right': 'calves',

    // Hip Flexors (Need to verify IDs from muscles.ts)
    // 'iliopsoas-left': 'hip_flexors',
    // 'iliopsoas-right': 'hip_flexors',

    // Adductors
    'adductor-left': 'adductors',
    'adductor-right': 'adductors',

    // Neck
    'sternocleidomastoid-left': 'neck',
    'sternocleidomastoid-right': 'neck',
};

// Helper to get all MCL IDs for a given Legacy Group
export function getMclIdsForLegacyGroup(group: MuscleGroup): string[] {
    return Object.entries(MCL_TO_LEGACY_MAP)
        .filter(([_, legacyGroup]) => legacyGroup === group)
        .map(([mclId]) => mclId);
}

// Helper to map an array of Legacy Groups to MCL IDs
export function mapLegacyToMcl(groups: MuscleGroup[]): string[] {
    const ids = new Set<string>();
    groups.forEach(group => {
        getMclIdsForLegacyGroup(group).forEach(id => ids.add(id));
    });
    return Array.from(ids);
}

// Helper to map an array of MCL IDs to Legacy Groups
export function mapMclToLegacy(ids: string[]): MuscleGroup[] {
    const groups = new Set<MuscleGroup>();
    ids.forEach(id => {
        const group = MCL_TO_LEGACY_MAP[id];
        if (group) {
            groups.add(group);
        }
    });
    return Array.from(groups);
}
