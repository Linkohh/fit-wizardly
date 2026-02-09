import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export function useHaptics() {
    const isAvailable = Capacitor.isNativePlatform();

    const impact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        const styleMap = {
            'light': ImpactStyle.Light,
            'medium': ImpactStyle.Medium,
            'heavy': ImpactStyle.Heavy
        };
        const capacitorStyle = styleMap[style];

        if (isAvailable) {
            try {
                await Haptics.impact({ style: capacitorStyle });
            } catch (e) {
                console.error('Haptics error:', e);
            }
        } else {
            // Web vibration fallback for supported browsers
            if (navigator.vibrate) {
                switch (style) {
                    case 'light': navigator.vibrate(10); break;
                    case 'medium': navigator.vibrate(20); break;
                    case 'heavy': navigator.vibrate(40); break;
                }
            }
        }
    };

    const notification = async (type: NotificationType) => {
        if (isAvailable) {
            try {
                await Haptics.notification({ type });
            } catch (e) {
                console.error('Haptics error:', e);
            }
        } else {
            if (navigator.vibrate) {
                switch (type) {
                    case NotificationType.Success: navigator.vibrate([50, 50, 50]); break;
                    case NotificationType.Warning: navigator.vibrate([100, 50, 100]); break;
                    case NotificationType.Error: navigator.vibrate([200, 100, 200]); break;
                }
            }
        }
    };

    const selection = async () => {
        if (isAvailable) {
            try {
                await Haptics.selectionStart();
                await Haptics.selectionChanged();
                await Haptics.selectionEnd();
            } catch (e) {
                // Ignore
            }
        }
    };

    return { impact, notification, selection };
}
