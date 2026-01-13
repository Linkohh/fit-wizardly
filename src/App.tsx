import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { useThemeStore } from "@/stores/themeStore";
import { PageTransition } from "@/components/ui/page-transition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import WizardPage from "./pages/Wizard";
import PlanPage from "./pages/Plan";
import NotFound from "./pages/NotFound";
import ClientsPage from "./pages/Clients";
import { ExercisesBrowser } from "./components/exercises/ExercisesBrowser";
import { TrainerGuard } from "./components/TrainerGuard";
import { OnboardingGuard } from "./components/OnboardingGuard";
import { WorkoutLogger } from "./components/logging/WorkoutLogger";
import CirclesPage from "./pages/Circles";
import OnboardingPage from "./pages/Onboarding";
import { useAuthStore } from "./stores/authStore";
import { CommandPalette } from "@/components/CommandPalette";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { RequireAuth } from "@/components/RequireAuth";

const queryClient = new QueryClient();

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, getEffectiveTheme } = useThemeStore();

  useEffect(() => {
    const applyTheme = () => {
      const effectiveTheme = getEffectiveTheme();
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, getEffectiveTheme]);

  return <>{children}</>;
}

// Auth initialization wrapper
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  // Onboarding has its own layout (no header/footer)
  if (location.pathname === '/onboarding') {
    return (
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    );
  }

  return (
    <OnboardingGuard>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/wizard" element={<WizardPage />} />

            {/* Protected Routes */}
            <Route path="/plan" element={
              <RequireAuth>
                <PlanPage />
              </RequireAuth>
            } />
            <Route path="/workout/:planId/:dayIndex" element={
              <RequireAuth>
                <WorkoutLogger />
              </RequireAuth>
            } />
            <Route path="/exercises" element={
              <RequireAuth>
                <ExercisesBrowser />
              </RequireAuth>
            } />
            <Route path="/clients" element={
              <RequireAuth>
                <TrainerGuard>
                  <ClientsPage />
                </TrainerGuard>
              </RequireAuth>
            }
            />
            <Route path="/circles" element={
              <RequireAuth>
                <CirclesPage />
              </RequireAuth>
            } />

            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </OnboardingGuard>
  );
}

import LegalPage from "./pages/Legal";
import { Footer } from "@/components/Footer";
import { ConsentModal } from "@/components/legal/ConsentModal";
import { LivingBackground } from "@/components/ui/living-background";

const App = () => {
  // Monitor network status and show notifications
  useNetworkStatus();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <CommandPalette />
              <div className="min-h-screen flex flex-col bg-background transition-colors duration-300 relative overflow-hidden">
                <LivingBackground />
                <Header />
                <ConsentModal />
                <AnimatedRoutes />
                <Footer />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
