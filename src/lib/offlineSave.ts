/**
 * Queue for saves made while the device is offline.
 *
 * Each action carries the stable id of the thing being saved, so a flush is
 * idempotent: an id that the server has already acknowledged is never sent
 * again, even if the same action is queued or flushed more than once.
 *
 * The queue is held in memory only. Nothing here writes user data to
 * localStorage.
 *
 * Status (2026-11-13): no save path calls this yet. Meals and workouts are not
 * written to any server today, so there is no network write to protect. Wire
 * `enqueueIfOffline` in front of that write when one exists.
 */

export interface QueuedActionInput<T extends { id: string }> {
    type: string;
    payload: T;
}

export interface OfflineSaveAction<T extends { id: string }> extends QueuedActionInput<T> {
    /** Same as payload.id. */
    id: string;
    queuedAt: number;
}

type AnyAction = OfflineSaveAction<{ id: string }>;

let queue: AnyAction[] = [];
const acknowledgedIds = new Set<string>();
let activeFlush: Promise<void> | null = null;

/**
 * Queues `action` when offline.
 * @returns true if the action was queued and the caller should skip the network write.
 */
export function enqueueIfOffline<T extends { id: string }>(
    action: QueuedActionInput<T>,
    isOnline: boolean
): boolean {
    if (isOnline) return false;

    const id = action.payload.id;
    if (!queue.some((queued) => queued.id === id)) {
        queue = [...queue, { ...action, id, queuedAt: Date.now() }];
    }
    return true;
}

export function getOfflineSaveQueue(): ReadonlyArray<AnyAction> {
    return queue;
}

/**
 * Sends queued actions in order. An action leaves the queue only after `sender`
 * resolves for it. The first failure stops the flush and keeps that action and
 * everything after it. Overlapping calls share one flush.
 */
export function flushOfflineSaves<T extends { id: string }>(
    sender: (action: OfflineSaveAction<T>) => Promise<void>
): Promise<void> {
    if (activeFlush) return activeFlush;

    activeFlush = (async () => {
        try {
            while (queue.length > 0) {
                const next = queue[0];

                if (!acknowledgedIds.has(next.id)) {
                    try {
                        await sender(next as OfflineSaveAction<T>);
                    } catch {
                        return;
                    }
                    acknowledgedIds.add(next.id);
                }

                queue = queue.filter((queued) => queued.id !== next.id);
            }
        } finally {
            activeFlush = null;
        }
    })();

    return activeFlush;
}

export function resetOfflineSavesForTests(): void {
    queue = [];
    acknowledgedIds.clear();
    activeFlush = null;
}
