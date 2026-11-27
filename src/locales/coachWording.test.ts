import { describe, expect, it } from 'vitest';
import en from './en.json';
import de from './de.json';
import es from './es.json';
import pt from './pt.json';

/**
 * DEBT-140: strings a lifter sees while the coach flag is off must not talk
 * about coaches. Coach-only strings (shown behind isFeatureEnabled('coach'))
 * are deliberately not listed here.
 */
const LIFTER_VISIBLE_KEYS = [
    'hero.tagline',
    'wizard.eyebrow',
    'wizard.goal.personalize_badge',
    'wizard.goal.personalize_helper',
    'wizard.review.coach_summary',
    'wizard.review.coach_summary_copy',
    'wizard.anatomy.coaching_note_title',
    'analytics.header.title',
    'analytics.header.subtitle',
    'analytics.weekly_notes.title',
    'analytics.weekly_notes.description',
    'plan.noplan.kicker',
] as const;

const COACH_WORD = /coach|entrenador|trainer|treinador/i;
/** Paid-tier wording: the app is free, so no lifter-visible string may imply a premium tier. */
const PREMIUM_WORD = /premium|prémium|pro plan|upgrade/i;

function lookup(tree: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>(
        (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
        tree,
    );
}

describe.each([
    ['en', en],
    ['es', es],
    ['de', de],
    ['pt', pt],
] as const)('%s lifter-visible wording', (_code, locale) => {
    it.each(LIFTER_VISIBLE_KEYS)('%s has no coach wording', (key) => {
        const value = lookup(locale, key);
        // A missing key falls back to English, which the "en" run covers.
        if (value === undefined) return;
        expect(typeof value).toBe('string');
        expect(value).not.toMatch(COACH_WORD);
        expect(value).not.toMatch(PREMIUM_WORD);
    });
});

it('en defines every lifter-visible key', () => {
    for (const key of LIFTER_VISIBLE_KEYS) {
        expect(typeof lookup(en, key)).toBe('string');
    }
});
