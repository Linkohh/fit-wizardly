import { Capacitor } from '@capacitor/core';
import { canUseWebHaptics } from '@/lib/platform';

export const NotificationType = {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

type HapticsModule = {
    Haptics: {
        impact: (options: { style: unknown }) => Promise<void>;
        notification: (options: { type: unknown }) => Promise<void>;
        selectionStart: () => Promise<void>;
        selectionChanged: () => Promise<void>;
        selectionEnd: () => Promise<void>;
    };
    ImpactStyle: {
        Light: unknown;
        Medium: unknown;
        Heavy: unknown;
    };
    NotificationType: {
        Success: unknown;
        Warning: unknown;
        Error: unknown;
    };
};

let hapticsModulePromise: Promise<HapticsModule | null> | null = null;
const hapticsModuleId = '@capacitor/haptics';

async function getHapticsModule(): Promise<HapticsModule | null> {
    if (!hapticsModulePromise) {
        hapticsModulePromise = import(/* @vite-ignore */ hapticsModuleId)
            .then((module) => module as HapticsModule)
            .catch(() => null);
    }

    return hapticsModulePromise;
}

let hasLoggedDiagnostics = false;

export function useHaptics() {
    const isAvailable = Capacitor.isNativePlatform();
    const canUseVibrationFallback = canUseWebHaptics();

    if (!hasLoggedDiagnostics && import.meta.env.DEV) {
        hasLoggedDiagnostics = true;
        console.debug('[Haptics] native:', isAvailable, 'webFallback:', canUseVibrationFallback, 'platform:', Capacitor.getPlatform());
    }

    const impact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        if (isAvailable) {
            const module = await getHapticsModule();
            if (module) {
                const styleMap = {
                    light: module.ImpactStyle.Light,
                    medium: module.ImpactStyle.Medium,
                    heavy: module.ImpactStyle.Heavy,
                };

                try {
                    await module.Haptics.impact({ style: styleMap[style] });
                    return;
                } catch (e) {
                    console.error('Haptics error:', e);
                }
            }
        }

        if (canUseVibrationFallback) {
            switch (style) {
                case 'light': navigator.vibrate(10); break;
                case 'medium': navigator.vibrate(20); break;
                case 'heavy': navigator.vibrate(40); break;
            }
        }
    };

    const notification = async (type: NotificationType) => {
        if (isAvailable) {
            const module = await getHapticsModule();
            if (module) {
                const notificationTypeMap = {
                    [NotificationType.Success]: module.NotificationType.Success,
                    [NotificationType.Warning]: module.NotificationType.Warning,
                    [NotificationType.Error]: module.NotificationType.Error,
                };

                try {
                    await module.Haptics.notification({ type: notificationTypeMap[type] });
                    return;
                } catch (e) {
                    console.error('Haptics error:', e);
                }
            }
        }

        if (canUseVibrationFallback) {
            switch (type) {
                case NotificationType.Success: navigator.vibrate([50, 50, 50]); break;
                case NotificationType.Warning: navigator.vibrate([100, 50, 100]); break;
                case NotificationType.Error: navigator.vibrate([200, 100, 200]); break;
            }
        }
    };

    const selection = async () => {
        if (isAvailable) {
            const module = await getHapticsModule();
            if (module) {
                try {
                    await module.Haptics.selectionStart();
                    await module.Haptics.selectionChanged();
                    await module.Haptics.selectionEnd();
                    return;
                } catch {
                    // Ignore selection failures to avoid breaking interactions.
                }
            }
        }

        if (canUseVibrationFallback) {
            navigator.vibrate(10);
        }
    };

    return { impact, notification, selection };
}
