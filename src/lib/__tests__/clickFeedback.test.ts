import { describe, it, expect } from 'vitest';
import { getClickFeedbackTarget } from '@/lib/clickFeedback/interactiveTarget';
import { playRetroClickSound } from '@/lib/clickFeedback/clickSound';

describe('clickFeedback', () => {
    describe('getClickFeedbackTarget', () => {
        it('matches semantic interactive elements', () => {
            document.body.innerHTML = `
                <button id="btn"><span id="btnChild">Go</span></button>
                <a id="link" href="/x"><span id="linkChild">Link</span></a>
            `;

            expect(getClickFeedbackTarget(document.getElementById('btnChild'))?.id).toBe('btn');
            expect(getClickFeedbackTarget(document.getElementById('linkChild'))?.id).toBe('link');
        });

        it('matches text-entry form controls', () => {
            document.body.innerHTML = `
                <input id="searchInput" type="text" />
                <textarea id="notes"><span id="notesChild">Notes</span></textarea>
                <select id="picker"><option>One</option></select>
            `;

            expect(getClickFeedbackTarget(document.getElementById('searchInput'))?.id).toBe('searchInput');
            expect(getClickFeedbackTarget(document.getElementById('notes'))?.id).toBe('notes');
            expect(getClickFeedbackTarget(document.getElementById('picker'))?.id).toBe('picker');
        });

        it('returns null for non-interactive elements by default', () => {
            document.body.innerHTML = `<div id="box"><span id="child">Hi</span></div>`;
            expect(getClickFeedbackTarget(document.getElementById('child'))).toBeNull();
        });

        it('respects disabled state', () => {
            document.body.innerHTML = `
                <button id="btn" disabled>Disabled</button>
                <div id="roleBtn" role="button" aria-disabled="true">No</div>
            `;

            expect(getClickFeedbackTarget(document.getElementById('btn'))).toBeNull();
            expect(getClickFeedbackTarget(document.getElementById('roleBtn'))).toBeNull();
        });

        it('supports opt-in and opt-out overrides', () => {
            document.body.innerHTML = `
                <div data-click-feedback="on" id="optIn"><span id="optInChild">Click</span></div>
                <div data-click-feedback="off" id="optOut"><button id="nestedBtn">Nested</button></div>
                <div data-click-feedback="off" id="outerOff">
                    <div data-click-feedback="on" id="innerOn"><span id="innerOnChild">Inner</span></div>
                </div>
            `;

            expect(getClickFeedbackTarget(document.getElementById('optInChild'))?.id).toBe('optIn');
            expect(getClickFeedbackTarget(document.getElementById('nestedBtn'))).toBeNull();
            expect(getClickFeedbackTarget(document.getElementById('innerOnChild'))?.id).toBe('innerOn');
        });

        it('matches react click handlers on custom pointer targets', () => {
            document.body.innerHTML = `
                <div id="custom" class="cursor-pointer"><span id="customChild">Custom</span></div>
            `;

            const custom = document.getElementById('custom');
            expect(custom).not.toBeNull();
            Object.defineProperty(custom as Element, '__reactProps$test', {
                configurable: true,
                value: {
                    onClick: () => undefined,
                },
            });

            expect(getClickFeedbackTarget(document.getElementById('customChild'))?.id).toBe('custom');
        });

        it('matches react click handlers without extra affordance', () => {
            document.body.innerHTML = `
                <div id="custom"><span id="customChild">Custom</span></div>
            `;

            const custom = document.getElementById('custom');
            expect(custom).not.toBeNull();
            Object.defineProperty(custom as Element, '__reactProps$test', {
                configurable: true,
                value: {
                    onClick: () => undefined,
                },
            });

            expect(getClickFeedbackTarget(document.getElementById('customChild'))?.id).toBe('custom');
        });

        it('allows opt-out overrides for react click handlers', () => {
            document.body.innerHTML = `
                <div id="custom" data-click-feedback="off"><span id="customChild">Custom</span></div>
            `;

            const custom = document.getElementById('custom');
            expect(custom).not.toBeNull();
            Object.defineProperty(custom as Element, '__reactProps$test', {
                configurable: true,
                value: {
                    onClick: () => undefined,
                },
            });

            expect(getClickFeedbackTarget(document.getElementById('customChild'))).toBeNull();
        });
    });

    describe('playRetroClickSound', () => {
        it('does not throw when AudioContext is unavailable', async () => {
            await expect(playRetroClickSound()).resolves.toBeUndefined();
        });
    });
});
