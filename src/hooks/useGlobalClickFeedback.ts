import { useEffect, useRef } from 'react';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import {
  getClickFeedbackEvent,
  getClickFeedbackTarget,
} from '@/lib/clickFeedback/interactiveTarget';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';

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
  const { emit } = useInteractionFeedback();

  // Default to enabled for everyone; only disable when explicitly set to false.
  const soundsEnabled = settings.sounds !== false;
  const hapticsEnabled = settings.haptics !== false;

  const soundsEnabledRef = useLatestRef(soundsEnabled);
  const hapticsEnabledRef = useLatestRef(hapticsEnabled);
  const emitRef = useLatestRef(emit);

  useEffect(() => {
    const handlePointerDown: EventListener = (event) => {
      if (!(event instanceof PointerEvent)) return;
      if (!soundsEnabledRef.current && !hapticsEnabledRef.current) return;

      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const feedbackTarget = getClickFeedbackTarget(event.target);
      if (!feedbackTarget) return;
      if (feedbackTarget.closest('[data-interaction-feedback="explicit"]')) return;

      if (soundsEnabledRef.current || hapticsEnabledRef.current) {
        const feedbackEvent = getClickFeedbackEvent(feedbackTarget) ?? 'globalClick';
        void emitRef.current(feedbackEvent, { pointerType: event.pointerType });
      }
    };

    const handleKeyDown: EventListener = (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (!soundsEnabledRef.current) return;
      if (event.repeat) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;

      const feedbackTarget = getClickFeedbackTarget(event.target);
      if (!feedbackTarget) return;
      if (feedbackTarget.closest('[data-interaction-feedback="explicit"]')) return;

      const feedbackEvent = getClickFeedbackEvent(feedbackTarget) ?? 'keyboardClick';
      void emitRef.current(feedbackEvent, { pointerType: 'keyboard' });
    };

    const target = document;
    target.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
      passive: true,
    });
    target.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      target.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
      target.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [soundsEnabledRef, hapticsEnabledRef, emitRef]);
}
