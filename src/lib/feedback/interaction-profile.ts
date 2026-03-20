import { NotificationType } from '@/hooks/useHaptics';

export const INTERACTION_FEEDBACK_EVENTS = [
  'globalClick',
  'keyboardClick',
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
] as const;

export type InteractionFeedbackEvent =
  (typeof INTERACTION_FEEDBACK_EVENTS)[number];

export function isInteractionFeedbackEvent(
  value: string | null | undefined
): value is InteractionFeedbackEvent {
  return (
    typeof value === 'string' &&
    (INTERACTION_FEEDBACK_EVENTS as readonly string[]).includes(value)
  );
}

export type FeedbackSound =
  | 'none'
  | 'click'
  | 'brand'
  | 'success'
  | 'warning'
  | 'error';

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
  navigation: {
    haptic: { type: 'impact', style: 'light' },
    sound: 'click',
  },
  brandHome: {
    haptic: { type: 'impact', style: 'medium' },
    sound: 'brand',
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
