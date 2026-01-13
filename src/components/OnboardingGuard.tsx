import { Navigate, useLocation } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ReactNode } from 'react';

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

    // Allow access to onboarding page and legal pages without completion
    const allowedPaths = ['/onboarding', '/legal'];
    const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));

    // If onboarding not complete and not on allowed path, redirect to onboarding
    if (!isComplete && !isAllowedPath) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
}
