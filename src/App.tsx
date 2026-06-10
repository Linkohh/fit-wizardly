import { AnimatePresence } from "framer-motion";
import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useThemeStore } from "@/stores/themeStore";
import { PageTransition } from "@/components/ui/page-transition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TrainerGuard } from "./components/TrainerGuard";
import { OnboardingGuard } from "./components/OnboardingGuard";
import { useAuthStore } from "./stores/authStore";
import { useTrainerStore } from "./stores/trainerStore";
import { CommandPalette } from "@/components/CommandPalette";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { RequireAuth } from "@/components/RequireAuth";
import { usePlanStore } from "@/stores/planStore";
import { useGlobalClickFeedback } from "@/hooks/useGlobalClickFeedback";
import { Footer } from "@/components/Footer";
import { ConsentModal } from "@/components/legal/ConsentModal";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cn } from "@/lib/utils";
import { isNativeApp } from "@/lib/platform";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useScrollActivity } from "@/hooks/use-scroll-activity";
import { NavigationDirectionProvider } from "@/contexts/navigation-direction-context";

const Index = lazy(() => import("./pages/Index"));
const WizardPage = lazy(() => import("./pages/Wizard"));
const PlanPage = lazy(() => import("./pages/Plan"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ClientsPage = lazy(() => import("./pages/Clients"));
const ClientDetailsPage = lazy(() => import("./pages/ClientDetails"));
const MCLIntegrationTest = lazy(() => import("./pages/MCLIntegrationTest"));
const OnboardingPage = lazy(() => import("./pages/Onboarding"));
const NutritionPage = lazy(() => import("./pages/Nutrition"));
const HistoryPage = lazy(() => import("./pages/History"));
const CirclesPage = lazy(() => import("./pages/Circles"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const LegalPage = lazy(() => import("./pages/Legal"));
const TemplateLibrary = lazy(() => import("./pages/TemplateLibrary"));
const Revenue = lazy(() => import("./pages/Revenue"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ProfilePage = lazy(() =>
  import("./pages/Profile").then((module) => ({
    default: module.Profile,
  }))
);

const LivingBackground = lazy(() =>
  import("@/components/ui/living-background").then((module) => ({
    default: module.LivingBackground,
  }))
);

const ExerciseLibraryPage = lazy(() =>
  import("./features/exercise-library").then((module) => ({
    default: module.ExerciseLibraryPage,
  }))
);

const WorkoutLogger = lazy(() =>
  import("./components/logging/WorkoutLogger").then((module) => ({
    default: module.WorkoutLogger,
  }))
);
const CircleLayout = lazy(() =>
  import("./components/circles/CircleLayout").then((module) => ({
    default: module.CircleLayout,
  }))
);
const JoinCircleHandler = lazy(() =>
  import("./components/circles/JoinCircleHandler").then((module) => ({
    default: module.JoinCircleHandler,
  }))
);
const CircleFeedTab = lazy(() =>
  import("./components/circles/tabs").then((module) => ({
    default: module.CircleFeedTab,
  }))
);
const CircleLeaderboardTab = lazy(() =>
  import("./components/circles/tabs").then((module) => ({
    default: module.CircleLeaderboardTab,
  }))
);
const CircleChallengesTab = lazy(() =>
  import("./components/circles/tabs").then((module) => ({
    default: module.CircleChallengesTab,
  }))
);
const CircleMembersTab = lazy(() =>
  import("./components/circles/tabs").then((module) => ({
    default: module.CircleMembersTab,
  }))
);
const CircleSettingsTab = lazy(() =>
  import("./components/circles/tabs").then((module) => ({
    default: module.CircleSettingsTab,
  }))
);
const CircleDashboardTab = lazy(() =>
  import("./components/circles/tabs").then((module) => ({
    default: module.CircleDashboardTab,
  }))
);

const queryClient = new QueryClient();

// Auth initialization wrapper
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const syncSystemTheme = useThemeStore((state) => state.syncSystemTheme);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.removeAttribute('data-theme-transition');
    document.documentElement.removeAttribute('data-theme-transition-context');
    document
      .querySelector<HTMLElement>('[data-testid="app-shell"]')
      ?.removeAttribute('data-theme-transition');
    document
      .querySelector<HTMLElement>('[data-testid="app-shell"]')
      ?.removeAttribute('data-theme-transition-context');
  }, [resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    syncSystemTheme(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncSystemTheme(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [syncSystemTheme]);

  return <>{children}</>;
}

// Auth initialization wrapper
function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isTrainerMode = useTrainerStore((state) => state.isTrainerMode);
  const setTrainerMode = useTrainerStore((state) => state.setTrainerMode);
  const clearTrainerSession = useTrainerStore((state) => state.clearTrainerSession);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const userId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;
    const didClearAuthenticatedSession = previousUserId !== null && userId === null;
    const didSwitchAuthenticatedSession =
      previousUserId !== null && userId !== null && previousUserId !== userId;

    if (didClearAuthenticatedSession || didSwitchAuthenticatedSession) {
      clearTrainerSession();
      previousUserIdRef.current = userId;
      return;
    }

    if (!isTrainerMode) {
      previousUserIdRef.current = userId;
      return;
    }

    if (user && profile?.is_trainer !== true) {
      setTrainerMode(false);
    }

    previousUserIdRef.current = userId;
  }, [clearTrainerSession, isTrainerMode, profile?.is_trainer, setTrainerMode, user]);

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  // Onboarding keeps the shared shell but manages its own page content layout.
  if (location.pathname === '/onboarding') {
    return (
      <NavigationDirectionProvider>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Suspense fallback={<LoadingScreen />}>
              <Routes location={location}>
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Routes>
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </NavigationDirectionProvider>
    );
  }

  return (
    <NavigationDirectionProvider>
      <OnboardingGuard>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Suspense fallback={<LoadingScreen />}>
              <Routes location={location}>
                <Route path="/" element={<Index />} />
                <Route path="/wizard" element={<WizardPage />} />

                <Route path="/plan" element={<PlanPage />} />
                <Route path="/workout/:planId/:dayIndex" element={<WorkoutLogger />} />
                <Route path="/nutrition" element={<NutritionPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/exercises" element={<ExerciseLibraryPage />} />

                {/* Auth-backed trainer routes */}
                <Route path="/clients">
                  <Route index element={
                    <RequireAuth>
                      <TrainerGuard>
                        <ClientsPage />
                      </TrainerGuard>
                    </RequireAuth>
                  } />
                  <Route path=":clientId" element={
                    <RequireAuth>
                      <TrainerGuard>
                        <ClientDetailsPage />
                      </TrainerGuard>
                    </RequireAuth>
                  } />
                </Route>
                <Route path="/templates" element={
                  <RequireAuth>
                    <TrainerGuard>
                      <TemplateLibrary />
                    </TrainerGuard>
                  </RequireAuth>
                } />
                <Route path="/revenue" element={
                  <RequireAuth>
                    <TrainerGuard>
                      <Revenue />
                    </TrainerGuard>
                  </RequireAuth>
                } />

                {/* Demo landing + auth-backed circle membership routes */}
                <Route path="/circles">
                  <Route index element={<CirclesPage />} />

                  <Route path="join/:inviteCode" element={
                    <JoinCircleHandler />
                  } />

                  <Route path=":circleId" element={
                    <RequireAuth>
                      <CircleLayout />
                    </RequireAuth>
                  }>
                    <Route index element={<CircleDashboardTab />} />
                    <Route path="feed" element={<CircleFeedTab />} />
                    <Route path="leaderboard" element={<CircleLeaderboardTab />} />
                    <Route path="challenges" element={<CircleChallengesTab />} />
                    <Route path="members" element={<CircleMembersTab />} />
                    <Route path="settings" element={<CircleSettingsTab />} />
                  </Route>
                </Route>

                <Route path="/mcl" element={<MCLIntegrationTest />} />

                <Route path="/legal" element={<LegalPage />} />
                <Route path="/guide" element={<UserGuide />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </OnboardingGuard>
    </NavigationDirectionProvider>
  );
}

const App = () => {
  // Network status handled by OfflineBanner component
  useGlobalClickFeedback();
  useScrollActivity();
  const nativeApp = isNativeApp();
  const hasAnalyticsConsent = useAnalyticsStore((state) => state.hasConsented);
  const [shouldRenderLivingBackground, setShouldRenderLivingBackground] = useState(false);

  // Handle post-login redirects for invites
  const { user, isLoading } = useAuthStore();
  const syncWithBackend = usePlanStore((state) => state.syncWithBackend);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setShouldRenderLivingBackground(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      const pendingInvite = sessionStorage.getItem('pendingInviteCode');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInviteCode');
        navigate(`/circles/join/${pendingInvite}`);
      }
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user) {
      syncWithBackend(user.id);
    }
  }, [user, isLoading, syncWithBackend]);

  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        syncWithBackend(user.id);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, syncWithBackend]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <OfflineBanner />
              <AuthModal />
              <CommandPalette />
              <div
                data-testid="app-shell"
                className={cn(
                  "theme-transition-shell min-h-screen flex flex-col transition-colors duration-300 relative app-shell-main-offset",
                  nativeApp ? "app-shell-native" : "app-shell-web",
                )}
              >
                <Suspense fallback={null}>
                  {shouldRenderLivingBackground && <LivingBackground />}
                </Suspense>
                <Header />
                <ConsentModal />
                <div id="main-content" className="flex-1 overflow-x-hidden">
                  <AnimatedRoutes />
                </div>
                <Footer />
              </div>
              {hasAnalyticsConsent && <VercelAnalytics />}
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
