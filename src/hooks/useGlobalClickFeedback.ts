import { useEffect, useRef } from 'react';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { playRetroClickSound } from '@/lib/clickFeedback/clickSound';
import { getClickFeedbackTarget } from '@/lib/clickFeedback/interactiveTarget';
import { useHaptics } from '@/hooks/useHaptics';

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function useGlobalClickFeedback() {
  // Force HMR update
  const settings = usePreferencesStore((state) => state.settings);
  const { impact } = useHaptics();

  // Default to enabled for everyone; only disable when explicitly set to false.
  const soundsEnabled = settings.sounds !== false;
  const hapticsEnabled = settings.haptics !== false;

  const soundsEnabledRef = useLatestRef(soundsEnabled);
  const hapticsEnabledRef = useLatestRef(hapticsEnabled);
  const impactRef = useLatestRef(impact);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!soundsEnabledRef.current && !hapticsEnabledRef.current) return;

      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const feedbackTarget = getClickFeedbackTarget(event.target);
      if (!feedbackTarget) return;

      if (soundsEnabledRef.current) {
        void playRetroClickSound();
      }

      // Haptics are most appropriate on touch devices.
      if (hapticsEnabledRef.current && event.pointerType !== 'mouse') {
        impactRef.current('light');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!soundsEnabledRef.current) return;
      if (event.repeat) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;

      const feedbackTarget = getClickFeedbackTarget(event.target);
      if (!feedbackTarget) return;

      void playRetroClickSound();
    };

    const target = document;
    target.addEventListener('pointerdown', handlePointerDown as any, {
      capture: true,
      passive: true,
    });
    target.addEventListener('keydown', handleKeyDown as any, { capture: true });

    return () => {
      target.removeEventListener('pointerdown', handlePointerDown as any, {
        capture: true,
      });
      target.removeEventListener('keydown', handleKeyDown as any, { capture: true });
    };
  }, [soundsEnabledRef, hapticsEnabledRef, impactRef]);
}

