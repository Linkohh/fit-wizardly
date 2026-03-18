import { useAuthStore } from "@/stores/authStore";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthUnavailableState } from "@/components/auth/AuthUnavailableState";

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const {
    session,
    isLoading,
    isConfigured,
    setShowAuthModal,
    setRedirectUrl,
  } = useAuthStore();
  const location = useLocation();

  const { t } = useTranslation();
  const requestedPath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (isLoading || !isConfigured || session) {
      return;
    }

    setRedirectUrl(`${window.location.origin}${requestedPath}`);
    setShowAuthModal(true);
  }, [
    isConfigured,
    isLoading,
    requestedPath,
    session,
    setRedirectUrl,
    setShowAuthModal,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t("common.loading")}
      </div>
    );
  }

  if (!isConfigured) {
    return <AuthUnavailableState />;
  }

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
