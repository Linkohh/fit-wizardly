import { useAuthStore } from "@/stores/authStore";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface RequireAuthProps {
    children: React.ReactNode;
    /** If true, require authentication. If false, allow guest access. Default: false (guest allowed) */
    strict?: boolean;
}

export function RequireAuth({ children, strict = false }: RequireAuthProps) {
    const { session, isLoading, isConfigured, setShowAuthModal } = useAuthStore();
    const location = useLocation();

    const { t } = useTranslation();

    useEffect(() => {
        // Only show auth modal if strict mode and user isn't logged in
        if (!isLoading && !session && isConfigured && strict) {
            setShowAuthModal(true);
        }
    }, [isLoading, session, isConfigured, strict, setShowAuthModal]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
    }

    // Allow access if Supabase isn't configured (local dev/demo mode)
    if (!isConfigured) {
        return <>{children}</>;
    }

    // In non-strict mode, allow guest browsing (most pages)
    // Only redirect in strict mode (e.g., user-specific data like saved plans)
    if (!strict) {
        return <>{children}</>;
    }

    if (!session) {
        // Redirect to home where the Auth Modal will appear
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
