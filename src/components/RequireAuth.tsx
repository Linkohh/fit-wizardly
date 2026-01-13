import { useAuthStore } from "@/stores/authStore";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface RequireAuthProps {
    children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
    const { session, isLoading, setShowAuthModal } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !session) {
            // Trigger auth modal so user can sign in immediately
            setShowAuthModal(true);
        }
    }, [isLoading, session, setShowAuthModal]);

    if (isLoading) {
        // You could replace this with a nice loading spinner
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session) {
        // Redirect to home where the Auth Modal will likely appear (triggered by useEffect)
        // or stay on current page but blocked?
        // Redirecting to index is safer/cleaner.
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
