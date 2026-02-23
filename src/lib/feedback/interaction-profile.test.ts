import { describe, expect, it } from 'vitest';
import {
  INTERACTION_FEEDBACK_PROFILE,
  type InteractionFeedbackEvent,
} from './interaction-profile';

describe('interaction feedback profile', () => {
  it('defines all required premium interaction events', () => {
    const requiredEvents: InteractionFeedbackEvent[] = [
      'select',
      'deselect',
      'sheetOpen',
      'sheetSnap',
      'longPressInfo',
      'success',
      'warning',
      'error',
    ];

    requiredEvents.forEach((event) => {
      expect(INTERACTION_FEEDBACK_PROFILE[event]).toBeDefined();
    });
  });

  it('keeps selection and long-press sounds silent to avoid noisy UI', () => {
    expect(INTERACTION_FEEDBACK_PROFILE.select.sound).toBe('none');
    expect(INTERACTION_FEEDBACK_PROFILE.deselect.sound).toBe('none');
    expect(INTERACTION_FEEDBACK_PROFILE.longPressInfo.sound).toBe('none');
  });

  it('maps success/warning/error to notification haptics', () => {
    expect(INTERACTION_FEEDBACK_PROFILE.success.haptic?.type).toBe('notification');
    expect(INTERACTION_FEEDBACK_PROFILE.warning.haptic?.type).toBe('notification');
    expect(INTERACTION_FEEDBACK_PROFILE.error.haptic?.type).toBe('notification');
  });
});
