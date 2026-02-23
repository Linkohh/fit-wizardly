import { useCallback, useMemo } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { playRetroClickSound } from '@/lib/clickFeedback/clickSound';
import {
  INTERACTION_FEEDBACK_PROFILE,
  type FeedbackSound,
  type InteractionFeedbackEvent,
} from '@/lib/feedback/interaction-profile';

type EmitFeedbackOptions = {
  pointerType?: string;
};

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const SOUND_PATTERNS: Record<Exclude<FeedbackSound, 'none' | 'click'>, number[]> = {
  success: [587.33, 783.99],
  warning: [440, 349.23],
  error: [329.63, 246.94],
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudioContext) return sharedAudioContext;

  const AudioContextCtor =
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;

  if (!AudioContextCtor) return null;

  try {
    sharedAudioContext = new AudioContextCtor({ latencyHint: 'interactive' });
    return sharedAudioContext;
  } catch {
    return null;
  }
}

async function playTonePattern(type: Exclude<FeedbackSound, 'none' | 'click'>) {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const pattern = SOUND_PATTERNS[type];
  const start = context.currentTime;

  pattern.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const toneStart = start + index * 0.085;
    const toneEnd = toneStart + 0.08;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, toneStart);
    gain.gain.setValueAtTime(0.0001, toneStart);
    gain.gain.exponentialRampToValueAtTime(0.09, toneStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(toneStart);
    oscillator.stop(toneEnd + 0.01);
  });
}

export function useInteractionFeedback() {
  const { impact, notification } = useHaptics();
  const settings = usePreferencesStore((state) => state.settings);

  const soundsEnabled = settings.sounds !== false;
  const hapticsEnabled = settings.haptics !== false;

  const emit = useCallback(
    async (event: InteractionFeedbackEvent, options?: EmitFeedbackOptions) => {
      const profile = INTERACTION_FEEDBACK_PROFILE[event];

      if (hapticsEnabled && profile.haptic) {
        const pointerType = options?.pointerType;
        const isMousePointer = pointerType === 'mouse';
        const shouldSkipMouseHaptic = event === 'globalClick' && isMousePointer;

        if (!shouldSkipMouseHaptic) {
          if (profile.haptic.type === 'impact') {
            await impact(profile.haptic.style);
          } else {
            await notification(profile.haptic.notification);
          }
        }
      }

      if (!soundsEnabled || profile.sound === 'none') return;

      if (profile.sound === 'click') {
        await playRetroClickSound();
        return;
      }

      await playTonePattern(profile.sound);
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
