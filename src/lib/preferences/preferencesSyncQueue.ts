export interface QueuedAction {
  id: string;
  type: 'favorite' | 'unfavorite' | 'collection' | 'settings' | 'recently_viewed';
  payload: unknown;
  timestamp: number;
}

export function createQueuedAction(
  action: Omit<QueuedAction, 'id' | 'timestamp'>,
): QueuedAction {
  return {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
}
