import { Navigate, useLocation } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ReactNode } from 'react';
import { hasStoredConsent } from '@/lib/consent';

interface OnboardingGuardProps {
    children: ReactNode;
}

/**
 * Guard component that redirects users to onboarding if they haven't completed it.
 * Wraps the main app layout to ensure new users go through personalized onboarding.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
    const { isComplete } = useOnboardingStore();
    const location = useLocation();
    const hasConsent = hasStoredConsent();

    // Allow only onboarding and legal pages before mandatory consent is stored.
    const allowedPaths = ['/onboarding', '/legal'];
    const isAllowedPath = allowedPaths.some(
        path => location.pathname === path || location.pathname.startsWith(`${path}/`),
    );

    // If onboarding or mandatory consent are incomplete, keep users in the welcome flow.
    if ((!isComplete || !hasConsent) && !isAllowedPath) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
}
