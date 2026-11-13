import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    enqueueIfOffline,
    flushOfflineSaves,
    getOfflineSaveQueue,
    resetOfflineSavesForTests,
    type OfflineSaveAction,
} from './offlineSave';

type Meal = { id: string; name: string };

const mealAction = (id: string) => ({ type: 'meal', payload: { id, name: `Meal ${id}` } });

describe('enqueueIfOffline', () => {
    beforeEach(() => resetOfflineSavesForTests());

    it('queues the action and tells the caller to skip the network write when offline', () => {
        expect(enqueueIfOffline(mealAction('a'), false)).toBe(true);
        expect(getOfflineSaveQueue()).toHaveLength(1);
        expect(getOfflineSaveQueue()[0]).toMatchObject({ id: 'a', type: 'meal' });
    });

    it('leaves the queue alone when online', () => {
        expect(enqueueIfOffline(mealAction('a'), true)).toBe(false);
        expect(getOfflineSaveQueue()).toHaveLength(0);
    });

    it('does not queue the same id twice', () => {
        enqueueIfOffline(mealAction('a'), false);
        enqueueIfOffline(mealAction('a'), false);
        expect(getOfflineSaveQueue()).toHaveLength(1);
    });
});

describe('flushOfflineSaves', () => {
    beforeEach(() => resetOfflineSavesForTests());

    it('sends each queued action once, in order, and empties the queue', async () => {
        const sent: string[] = [];
        enqueueIfOffline(mealAction('a'), false);
        enqueueIfOffline(mealAction('b'), false);

        await flushOfflineSaves<Meal>(async (action) => { sent.push(action.id); });

        expect(sent).toEqual(['a', 'b']);
        expect(getOfflineSaveQueue()).toEqual([]);
    });

    it('sends an action once even when it is queued again and flushed again', async () => {
        const sender = vi.fn(async (_action: OfflineSaveAction<Meal>) => {});
        enqueueIfOffline(mealAction('a'), false);
        await flushOfflineSaves<Meal>(sender);

        enqueueIfOffline(mealAction('a'), false);
        await flushOfflineSaves<Meal>(sender);

        expect(sender).toHaveBeenCalledTimes(1);
        expect(getOfflineSaveQueue()).toEqual([]);
    });

    it('keeps the failed action and everything after it, and does not re-send what succeeded', async () => {
        const sender = vi.fn(async (action: OfflineSaveAction<Meal>) => {
            if (action.id === 'b') throw new Error('network down');
        });
        ['a', 'b', 'c'].forEach((id) => enqueueIfOffline(mealAction(id), false));

        await flushOfflineSaves<Meal>(sender);
        expect(getOfflineSaveQueue().map((action) => action.id)).toEqual(['b', 'c']);
        expect(sender.mock.calls.map(([action]) => action.id)).toEqual(['a', 'b']);

        sender.mockImplementation(async () => {});
        await flushOfflineSaves<Meal>(sender);

        expect(sender.mock.calls.map(([action]) => action.id)).toEqual(['a', 'b', 'b', 'c']);
        expect(getOfflineSaveQueue()).toEqual([]);
    });

    it('does not double-send when two flushes overlap', async () => {
        let release: () => void = () => {};
        const gate = new Promise<void>((resolve) => { release = resolve; });
        const sender = vi.fn(async (_action: OfflineSaveAction<Meal>) => { await gate; });
        enqueueIfOffline(mealAction('a'), false);

        const first = flushOfflineSaves<Meal>(sender);
        const second = flushOfflineSaves<Meal>(sender);
        release();
        await Promise.all([first, second]);

        expect(sender).toHaveBeenCalledTimes(1);
        expect(getOfflineSaveQueue()).toEqual([]);
    });
});
