import { describe, expect, it } from 'vitest';
import { HOVER_QUIPS, MAX_HOVER_QUIP_LENGTH, pickHoverQuip } from './hoverQuips';

describe('HOVER_QUIPS', () => {
    it('has at least 50 short, unique, non-empty quips', () => {
        expect(HOVER_QUIPS.length).toBeGreaterThanOrEqual(50);
        expect(new Set(HOVER_QUIPS).size).toBe(HOVER_QUIPS.length);
        for (const quip of HOVER_QUIPS) {
            expect(quip.trim()).toBe(quip);
            expect(quip.length).toBeGreaterThan(0);
            expect(quip.length).toBeLessThanOrEqual(MAX_HOVER_QUIP_LENGTH);
        }
    });
});

describe('pickHoverQuip', () => {
    it('returns a quip from the list', () => {
        expect(HOVER_QUIPS).toContain(pickHoverQuip());
    });

    it('covers the first and last quip at the ends of the random range', () => {
        expect(pickHoverQuip(undefined, () => 0)).toBe(HOVER_QUIPS[0]);
        expect(pickHoverQuip(undefined, () => 0.999999)).toBe(HOVER_QUIPS[HOVER_QUIPS.length - 1]);
    });

    it('never returns the previous quip, whatever the random source says', () => {
        for (const value of [0, 0.5, 0.999999]) {
            const first = pickHoverQuip(undefined, () => value);
            const second = pickHoverQuip(first, () => value);
            expect(second).not.toBe(first);
            expect(HOVER_QUIPS).toContain(second);
        }
    });
});
