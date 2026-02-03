/**
 * Adaptive Exercise Theming
 *
 * Provides dynamic color theming based on exercise category and type.
 * Card glows and accents shift based on exercise context while
 * maintaining brand consistency.
 *
 * Color Scheme:
 * - Strength/Power: Deep Blue/Purple glow
 * - Cardio/HIIT: Energetic Orange/Red glow
 * - Yoga/Mobility/Flexibility: Calming Teal/Green glow
 * - Explosive/Plyometric: Electric Yellow glow
 * - Core: Violet/Magenta glow
 */

import type { Exercise, ExerciseCategory, ExerciseType, MuscleGroup } from '@/types/fitness';

// Theme color configuration
export interface ExerciseThemeColors {
    glow: string; // Shadow color for glow effect
    glowHover: string; // Enhanced glow on hover
    accent: string; // Accent color for badges/highlights
    accentForeground: string; // Text color on accent
    gradient: string; // Gradient for backgrounds
    border: string; // Border color
    icon: string; // Icon color
}

// Predefined color themes
const THEME_COLORS: Record<string, ExerciseThemeColors> = {
    strength: {
        glow: 'rgba(139, 92, 246, 0.15)', // Purple
        glowHover: 'rgba(139, 92, 246, 0.3)',
        accent: 'hsl(270, 80%, 60%)',
        accentForeground: 'white',
        gradient: 'from-purple-500/20 to-blue-500/20',
        border: 'rgba(139, 92, 246, 0.3)',
        icon: 'text-purple-400',
    },
    cardio: {
        glow: 'rgba(249, 115, 22, 0.15)', // Orange
        glowHover: 'rgba(249, 115, 22, 0.3)',
        accent: 'hsl(25, 95%, 53%)',
        accentForeground: 'white',
        gradient: 'from-orange-500/20 to-red-500/20',
        border: 'rgba(249, 115, 22, 0.3)',
        icon: 'text-orange-400',
    },
    flexibility: {
        glow: 'rgba(20, 184, 166, 0.15)', // Teal
        glowHover: 'rgba(20, 184, 166, 0.3)',
        accent: 'hsl(168, 80%, 40%)',
        accentForeground: 'white',
        gradient: 'from-teal-500/20 to-green-500/20',
        border: 'rgba(20, 184, 166, 0.3)',
        icon: 'text-teal-400',
    },
    plyometric: {
        glow: 'rgba(234, 179, 8, 0.15)', // Yellow
        glowHover: 'rgba(234, 179, 8, 0.3)',
        accent: 'hsl(48, 96%, 53%)',
        accentForeground: 'black',
        gradient: 'from-yellow-500/20 to-amber-500/20',
        border: 'rgba(234, 179, 8, 0.3)',
        icon: 'text-yellow-400',
    },
    core: {
        glow: 'rgba(217, 70, 239, 0.15)', // Magenta
        glowHover: 'rgba(217, 70, 239, 0.3)',
        accent: 'hsl(292, 84%, 60%)',
        accentForeground: 'white',
        gradient: 'from-fuchsia-500/20 to-pink-500/20',
        border: 'rgba(217, 70, 239, 0.3)',
        icon: 'text-fuchsia-400',
    },
    power: {
        glow: 'rgba(59, 130, 246, 0.15)', // Blue
        glowHover: 'rgba(59, 130, 246, 0.3)',
        accent: 'hsl(217, 91%, 60%)',
        accentForeground: 'white',
        gradient: 'from-blue-500/20 to-indigo-500/20',
        border: 'rgba(59, 130, 246, 0.3)',
        icon: 'text-blue-400',
    },
    default: {
        glow: 'rgba(139, 92, 246, 0.15)', // Primary purple
        glowHover: 'rgba(139, 92, 246, 0.3)',
        accent: 'hsl(270, 80%, 60%)',
        accentForeground: 'white',
        gradient: 'from-purple-500/20 to-violet-500/20',
        border: 'rgba(139, 92, 246, 0.3)',
        icon: 'text-primary',
    },
};

// Muscle group to theme mapping (for when category is unavailable)
const MUSCLE_GROUP_THEMES: Partial<Record<MuscleGroup, string>> = {
    chest: 'strength',
    upper_back: 'strength',
    lats: 'strength',
    quads: 'strength',
    hamstrings: 'strength',
    glutes: 'strength',
    biceps: 'strength',
    triceps: 'strength',
    abs: 'core',
    obliques: 'core',
    lower_back: 'core',
    calves: 'plyometric',
    hip_flexors: 'flexibility',
    adductors: 'flexibility',
};

/**
 * Get theme colors for an exercise category
 */
export function getThemeForCategory(category?: ExerciseCategory | string): ExerciseThemeColors {
    if (!category) return THEME_COLORS.default;

    const normalizedCategory = category.toLowerCase();

    // Direct category match
    if (normalizedCategory in THEME_COLORS) {
        return THEME_COLORS[normalizedCategory];
    }

    // Category string matching
    if (normalizedCategory.includes('cardio') || normalizedCategory.includes('hiit')) {
        return THEME_COLORS.cardio;
    }
    if (normalizedCategory.includes('yoga') || normalizedCategory.includes('stretch') || normalizedCategory.includes('mobility') || normalizedCategory.includes('flexibility')) {
        return THEME_COLORS.flexibility;
    }
    if (normalizedCategory.includes('plyo') || normalizedCategory.includes('explosive') || normalizedCategory.includes('jump')) {
        return THEME_COLORS.plyometric;
    }
    if (normalizedCategory.includes('core') || normalizedCategory.includes('abs')) {
        return THEME_COLORS.core;
    }
    if (normalizedCategory.includes('power') || normalizedCategory.includes('olympic')) {
        return THEME_COLORS.power;
    }
    if (normalizedCategory.includes('strength') || normalizedCategory.includes('push') || normalizedCategory.includes('pull')) {
        return THEME_COLORS.strength;
    }

    return THEME_COLORS.default;
}

/**
 * Get theme colors for an exercise type
 */
export function getThemeForType(type?: ExerciseType): ExerciseThemeColors {
    switch (type) {
        case 'strength':
            return THEME_COLORS.strength;
        case 'cardio':
            return THEME_COLORS.cardio;
        case 'plyometric':
            return THEME_COLORS.plyometric;
        case 'power':
            return THEME_COLORS.power;
        default:
            return THEME_COLORS.default;
    }
}

/**
 * Get theme colors for an exercise based on its properties
 * Priority: category > type > primary muscle > default
 */
export function getExerciseTheme(exercise: Exercise): ExerciseThemeColors {
    // Try category first
    if (exercise.category) {
        return getThemeForCategory(exercise.category);
    }

    // Try type
    if (exercise.type) {
        return getThemeForType(exercise.type);
    }

    // Try primary muscle group
    if (exercise.primaryMuscles && exercise.primaryMuscles.length > 0) {
        const primaryMuscle = exercise.primaryMuscles[0];
        const themeName = MUSCLE_GROUP_THEMES[primaryMuscle];
        if (themeName && themeName in THEME_COLORS) {
            return THEME_COLORS[themeName];
        }
    }

    return THEME_COLORS.default;
}

/**
 * Get CSS class names for exercise card styling
 */
export function getExerciseCardClasses(exercise: Exercise): {
    glowClass: string;
    gradientClass: string;
    iconClass: string;
} {
    const theme = getExerciseTheme(exercise);

    return {
        // Use a CSS variable to avoid invalid Tailwind output from dynamic arbitrary values.
        // Consumer can set `--exercise-glow` via inline styles when using this class.
        glowClass: 'hover:shadow-[0_0_20px_var(--exercise-glow)]',
        gradientClass: `bg-gradient-to-br ${theme.gradient}`,
        iconClass: theme.icon,
    };
}

/**
 * Get inline styles for exercise card glow
 */
export function getExerciseCardStyles(exercise: Exercise): {
    default: React.CSSProperties;
    hover: React.CSSProperties;
} {
    const theme = getExerciseTheme(exercise);

    return {
        default: {
            boxShadow: `0 0 0 1px ${theme.border}`,
        },
        hover: {
            boxShadow: `0 0 20px ${theme.glowHover}, 0 0 0 1px ${theme.border}`,
        },
    };
}

/**
 * Get the dominant theme color for an exercise (for badges, charts, etc.)
 */
export function getExerciseAccentColor(exercise: Exercise): string {
    return getExerciseTheme(exercise).accent;
}

/**
 * Get theme colors by name
 */
export function getThemeByName(name: string): ExerciseThemeColors {
    return THEME_COLORS[name.toLowerCase()] || THEME_COLORS.default;
}

/**
 * All available theme names
 */
export const THEME_NAMES = Object.keys(THEME_COLORS);

export default {
    getExerciseTheme,
    getThemeForCategory,
    getThemeForType,
    getExerciseCardClasses,
    getExerciseCardStyles,
    getExerciseAccentColor,
    getThemeByName,
    THEME_NAMES,
};
