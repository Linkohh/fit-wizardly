import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * AUDIT-004 regression guard: the /mcl dev integration page must only be routable
 * in dev builds. In production (import.meta.env.DEV === false) it must fall through
 * to the 404 page.
 */

// New-user onboarding/consent redirect is not what this test is about; let routes render.
vi.mock('./components/OnboardingGuard', () => ({
    OnboardingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

async function renderAppAt(path: string, isDev: boolean) {
    vi.resetModules();
    vi.stubEnv('DEV', isDev);
    await import('@/lib/i18n');
    const { MemoryRouter } = await import('react-router-dom');
    const { default: App } = await import('./App');
    return render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>
    );
}

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
});

describe('/mcl dev route gating', () => {
    it('serves the MCL integration page in dev builds', async () => {
        await renderAppAt('/mcl', true);
        expect(await screen.findByText('MCL Integration Test', {}, { timeout: 10000 })).toBeTruthy();
    }, 20000);

    it('does not serve the MCL integration page in production builds', async () => {
        await renderAppAt('/mcl', false);
        expect(await screen.findByText('404', {}, { timeout: 10000 })).toBeTruthy();
        expect(screen.queryByText('MCL Integration Test')).toBeNull();
    }, 20000);
});
