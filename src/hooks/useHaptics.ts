/**
 * Haptic Feedback Hook
 *
 * Provides haptic feedback for premium interactions.
 * Uses the Vibration API where available.
 *
 * Haptic patterns:
 * - light: Quick tap (10ms) - card taps, hovers
 * - medium: Noticeable pulse (25ms) - toggles, selections
 * - success: Celebratory pattern - achievements, completions
 * - heavy: Strong feedback - workout completion, major actions
 * - error: Short sharp pulse - validation errors
 */

import { useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { usePreferencesStore } from './useUserPreferences';

// Haptic pattern types
export type HapticPattern =
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'error'
    | 'selection'
    | 'notification';

type NativeHapticsPlugin = {
    impact: (options: { style: string }) => Promise<void>;
    notification: (options: { type: string }) => Promise<void>;
    vibrate: (options?: { duration?: number }) => Promise<void>;
};

const NativeHaptics = registerPlugin<NativeHapticsPlugin>('Haptics');
let nativeHapticsUnavailable = false;

// Pattern definitions (duration in ms or pattern array)
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
    light: 10, // Quick tap
    medium: 25, // Noticeable pulse
    heavy: 50, // Strong pulse
    success: [50, 30, 50], // Celebratory: pulse-pause-pulse
    error: [100, 50, 100], // Alert: pulse-pause-pulse
    selection: 15, // Toggle/select
    notification: [50, 100, 50, 100, 50], // Attention-grabbing
};

// Custom patterns for specific actions
export const HAPTIC_ACTIONS = {
    cardTap: 'light' as HapticPattern,
    favoriteToggle: 'medium' as HapticPattern,
    addToWorkout: 'success' as HapticPattern,
    badgeUnlock: 'success' as HapticPattern,
    workoutComplete: [100, 50, 100, 50, 100] as number[], // Strong celebration
    streakMilestone: [50, 30, 50, 30, 100] as number[], // Building excitement
    error: 'error' as HapticPattern,
    sliderDrag: 'light' as HapticPattern,
    buttonPress: 'selection' as HapticPattern,
    modalOpen: 'light' as HapticPattern,
    modalClose: 'light' as HapticPattern,
    swipeAction: 'medium' as HapticPattern,
};

/**
 * Check if the device supports haptic feedback
 */
export function supportsHaptics(): boolean {
    return 'vibrate' in navigator || Capacitor.isNativePlatform();
}

function getNativeImpactStyle(pattern: HapticPattern): string | null {
    switch (pattern) {
        case 'light':
        case 'selection':
            return 'LIGHT';
        case 'medium':
            return 'MEDIUM';
        case 'heavy':
            return 'HEAVY';
        case 'success':
        case 'error':
        case 'notification':
            return null;
    }
}

function getNativeNotificationType(pattern: HapticPattern): string | null {
    switch (pattern) {
        case 'success':
            return 'SUCCESS';
        case 'notification':
            return 'WARNING';
        case 'error':
            return 'ERROR';
        case 'light':
        case 'medium':
        case 'heavy':
        case 'selection':
            return null;
    }
}

function isNotImplementedPluginError(error: unknown): boolean {
    if (typeof error === 'string') {
        return /not implemented|plugin|unavailable/i.test(error);
    }
    if (error instanceof Error) {
        return /not implemented|plugin|unavailable/i.test(error.message);
    }
    return false;
}

function tryNativeHaptics(action: () => Promise<void>): boolean {
    if (!Capacitor.isNativePlatform()) return false;
    if (nativeHapticsUnavailable) return false;

    action().catch((error) => {
        if (isNotImplementedPluginError(error)) {
            nativeHapticsUnavailable = true;
        }
    });

    return true;
}

/**
 * Trigger haptic feedback
 * @param pattern - The pattern name or custom duration/array
 */
export function triggerHaptic(
    pattern: HapticPattern | number | number[]
): boolean {
    if (!supportsHaptics()) return false;

    const resolvedPattern =
        typeof pattern === 'string' ? HAPTIC_PATTERNS[pattern] : pattern;

    if (typeof pattern === 'string') {
        const impactStyle = getNativeImpactStyle(pattern);
        if (impactStyle) {
            return tryNativeHaptics(() => NativeHaptics.impact({ style: impactStyle }));
        }

        const notificationType = getNativeNotificationType(pattern);
        if (notificationType) {
            return tryNativeHaptics(() =>
                NativeHaptics.notification({ type: notificationType })
            );
        }
    } else if (typeof resolvedPattern === 'number') {
        if (tryNativeHaptics(() => NativeHaptics.vibrate({ duration: resolvedPattern }))) {
            return true;
        }
    }

    if (!('vibrate' in navigator)) return false;

    try {
        navigator.vibrate(resolvedPattern);
        return true;
    } catch {
        return false;
    }
}

/**
 * Stop any ongoing haptic feedback
 */
export function stopHaptic(): void {
    if (supportsHaptics()) {
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
    }
}

/**
 * Hook for using haptic feedback with user preferences
 */
export function useHaptics() {
    const settings = usePreferencesStore((state) => state.settings);
    const hapticsEnabled = settings.haptics !== false; // Default to enabled

    /**
     * Trigger haptic with user preference check
     */
    const vibrate = useCallback(
        (pattern: HapticPattern | number | number[] = 'medium'): boolean => {
            if (!hapticsEnabled) return false;
            return triggerHaptic(pattern);
        },
        [hapticsEnabled]
    );

    /**
     * Trigger light haptic (card taps, hovers)
     */
    const light = useCallback(() => vibrate('light'), [vibrate]);

    /**
     * Trigger medium haptic (toggles, selections)
     */
    const medium = useCallback(() => vibrate('medium'), [vibrate]);

    /**
     * Trigger heavy haptic (major actions)
     */
    const heavy = useCallback(() => vibrate('heavy'), [vibrate]);

    /**
     * Trigger success haptic (achievements, completions)
     */
    const success = useCallback(() => vibrate('success'), [vibrate]);

    /**
     * Trigger error haptic (validation errors)
     */
    const error = useCallback(() => vibrate('error'), [vibrate]);

    /**
     * Trigger selection haptic (button presses, toggles)
     */
    const selection = useCallback(() => vibrate('selection'), [vibrate]);

    /**
     * Trigger notification haptic
     */
    const notification = useCallback(() => vibrate('notification'), [vibrate]);

    /**
     * Trigger workout complete haptic
     */
    const workoutComplete = useCallback(
        () => vibrate(HAPTIC_ACTIONS.workoutComplete),
        [vibrate]
    );

    /**
     * Trigger badge unlock haptic
     */
    const badgeUnlock = useCallback(
        () => vibrate(HAPTIC_ACTIONS.badgeUnlock),
        [vibrate]
    );

    /**
     * Trigger streak milestone haptic
     */
    const streakMilestone = useCallback(
        () => vibrate(HAPTIC_ACTIONS.streakMilestone),
        [vibrate]
    );

    /**
     * Trigger favorite toggle haptic
     */
    const favoriteToggle = useCallback(
        () => vibrate(HAPTIC_ACTIONS.favoriteToggle),
        [vibrate]
    );

    /**
     * Trigger add to workout haptic
     */
    const addToWorkout = useCallback(
        () => vibrate(HAPTIC_ACTIONS.addToWorkout),
        [vibrate]
    );

    /**
     * Stop haptic feedback
     */
    const stop = useCallback(() => stopHaptic(), []);

    return {
        // Core
        vibrate,
        stop,
        isEnabled: hapticsEnabled,
        isSupported: supportsHaptics(),

        // Convenience methods
        light,
        medium,
        heavy,
        success,
        error,
        selection,
        notification,

        // Action-specific
        workoutComplete,
        badgeUnlock,
        streakMilestone,
        favoriteToggle,
        addToWorkout,
    };
}

export default useHaptics;
