import { useCallback, useMemo } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import {
  playFeedbackTone,
  playRetroClickSound,
} from '@/lib/clickFeedback/clickSound';
import {
  INTERACTION_FEEDBACK_PROFILE,
  type InteractionFeedbackEvent,
} from '@/lib/feedback/interaction-profile';

type EmitFeedbackOptions = {
  pointerType?: string;
  channel?: 'all' | 'haptic' | 'sound';
};

export function useInteractionFeedback() {
  const { impact, notification } = useHaptics();
  const settings = usePreferencesStore((state) => state.settings);

  const soundsEnabled = settings.sounds !== false;
  const hapticsEnabled = settings.haptics !== false;

  const emit = useCallback(
    async (event: InteractionFeedbackEvent, options?: EmitFeedbackOptions) => {
      const profile = INTERACTION_FEEDBACK_PROFILE[event];
      const shouldEmitHaptic = options?.channel !== 'sound';
      const shouldEmitSound = options?.channel !== 'haptic';

      if (shouldEmitHaptic && hapticsEnabled && profile.haptic) {
        const pointerType = options?.pointerType;
        const shouldSkipPointerHaptic =
          pointerType === 'mouse' || pointerType === 'keyboard';

        if (!shouldSkipPointerHaptic) {
          if (profile.haptic.type === 'impact') {
            await impact(profile.haptic.style);
          } else {
            await notification(profile.haptic.notification);
          }
        }
      }

      if (!shouldEmitSound || !soundsEnabled || profile.sound === 'none') return;

      if (profile.sound === 'click') {
        await playRetroClickSound();
        return;
      }

      await playFeedbackTone(profile.sound);
    },
    [hapticsEnabled, impact, notification, soundsEnabled]
  );

  return useMemo(
    () => ({
      emit,
      soundsEnabled,
      hapticsEnabled,
    }),
    [emit, soundsEnabled, hapticsEnabled]
  );
}
