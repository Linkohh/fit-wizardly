import { describe, expect, it } from 'vitest';
import {
  INTERACTION_FEEDBACK_PROFILE,
  type InteractionFeedbackEvent,
} from './interaction-profile';

describe('interaction feedback profile', () => {
  it('defines all required premium interaction events', () => {
    const requiredEvents: InteractionFeedbackEvent[] = [
      'navigation',
      'brandHome',
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

  it('gives brand taps a distinct sound and stronger haptic than default navigation', () => {
    expect(INTERACTION_FEEDBACK_PROFILE.brandHome.sound).toBe('brand');
    expect(INTERACTION_FEEDBACK_PROFILE.brandHome.haptic).toEqual({
      type: 'impact',
      style: 'medium',
    });
    expect(INTERACTION_FEEDBACK_PROFILE.navigation.haptic).toEqual({
      type: 'impact',
      style: 'light',
    });
  });

  it('maps success/warning/error to notification haptics', () => {
    expect(INTERACTION_FEEDBACK_PROFILE.success.haptic?.type).toBe('notification');
    expect(INTERACTION_FEEDBACK_PROFILE.warning.haptic?.type).toBe('notification');
    expect(INTERACTION_FEEDBACK_PROFILE.error.haptic?.type).toBe('notification');
  });
});
