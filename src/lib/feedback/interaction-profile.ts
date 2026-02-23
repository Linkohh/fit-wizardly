import { NotificationType } from '@/hooks/useHaptics';

export type InteractionFeedbackEvent =
  | 'globalClick'
  | 'keyboardClick'
  | 'select'
  | 'deselect'
  | 'sheetOpen'
  | 'sheetSnap'
  | 'longPressInfo'
  | 'success'
  | 'warning'
  | 'error';

export type FeedbackSound = 'none' | 'click' | 'success' | 'warning' | 'error';

export interface InteractionFeedbackProfile {
  haptic?:
    | { type: 'impact'; style: 'light' | 'medium' | 'heavy' }
    | { type: 'notification'; notification: NotificationType };
  sound: FeedbackSound;
}

export const INTERACTION_FEEDBACK_PROFILE: Record<
  InteractionFeedbackEvent,
  InteractionFeedbackProfile
> = {
  globalClick: {
    haptic: { type: 'impact', style: 'light' },
    sound: 'click',
  },
  keyboardClick: {
    sound: 'click',
  },
  select: {
    haptic: { type: 'impact', style: 'light' },
    sound: 'none',
  },
  deselect: {
    haptic: { type: 'impact', style: 'light' },
    sound: 'none',
  },
  sheetOpen: {
    haptic: { type: 'impact', style: 'light' },
    sound: 'none',
  },
  sheetSnap: {
    haptic: { type: 'impact', style: 'light' },
    sound: 'none',
  },
  longPressInfo: {
    haptic: { type: 'impact', style: 'medium' },
    sound: 'none',
  },
  success: {
    haptic: { type: 'notification', notification: NotificationType.Success },
    sound: 'success',
  },
  warning: {
    haptic: { type: 'notification', notification: NotificationType.Warning },
    sound: 'warning',
  },
  error: {
    haptic: { type: 'notification', notification: NotificationType.Error },
    sound: 'error',
  },
};
