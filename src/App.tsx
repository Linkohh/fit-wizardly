import { AnimatePresence } from "framer-motion";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
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
import { MOBILE_BREAKPOINT } from "@/hooks/use-mobile";
import { AuthModal } from "@/components/auth/AuthModal";

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
const THEME_TRANSITION_DURATION_MS = 920;
type ThemeTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished: Promise<void>;
  };
};

const getSystemTheme = (mediaQuery: MediaQueryList): 'light' | 'dark' =>
  mediaQuery.matches ? 'dark' : 'light';

// Auth initialization wrapper
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((state) => state.mode);
  const location = useLocation();
  const previousEffectiveThemeRef = useRef<'light' | 'dark' | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const activeTransitionIdRef = useRef(0);
  const activeTransitionContextRef = useRef<'drawer-open' | null>(null);

  const getAppShell = useCallback(
    () => document.querySelector<HTMLElement>('[data-testid="app-shell"]'),
    [],
  );

  const isDrawerOpen = useCallback(
    () => Boolean(document.querySelector('.aetheric-drawer[data-state="open"]')),
    [],
  );

  const clearTransitionAttributes = useCallback(() => {
    document.documentElement.removeAttribute('data-theme-transition');
    document.documentElement.removeAttribute('data-theme-transition-context');
    getAppShell()?.removeAttribute('data-theme-transition');
    getAppShell()?.removeAttribute('data-theme-transition-context');
  }, [getAppShell]);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const beginTransitionCycle = useCallback(() => {
    clearTransitionTimer();
    activeTransitionContextRef.current = null;
    clearTransitionAttributes();
    activeTransitionIdRef.current += 1;
    return activeTransitionIdRef.current;
  }, [clearTransitionAttributes, clearTransitionTimer]);

  const clearPendingTransition = useCallback((transitionId?: number) => {
    if (transitionId !== undefined && activeTransitionIdRef.current !== transitionId) {
      return;
    }

    clearTransitionTimer();
    activeTransitionContextRef.current = null;
    clearTransitionAttributes();
  }, [clearTransitionAttributes, clearTransitionTimer]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyTheme = (effectiveTheme: 'light' | 'dark') => {
      const previousTheme = previousEffectiveThemeRef.current;
      const shouldAnimate =
        previousTheme !== null &&
        previousTheme !== effectiveTheme &&
        !prefersReducedMotion.matches;
      const themeDocument = document as ThemeTransitionDocument;
      const drawerOpen = isDrawerOpen();
      const transitionId = beginTransitionCycle();
      const commitTheme = () => {
        root.classList.toggle('dark', effectiveTheme === 'dark');
        previousEffectiveThemeRef.current = effectiveTheme;
      };

      if (shouldAnimate) {
        const transitionValue = effectiveTheme === 'dark' ? 'to-dark' : 'to-light';
        root.setAttribute('data-theme-transition', transitionValue);
        getAppShell()?.setAttribute('data-theme-transition', transitionValue);

        if (drawerOpen) {
          root.setAttribute('data-theme-transition-context', 'drawer-open');
          getAppShell()?.setAttribute('data-theme-transition-context', 'drawer-open');
          activeTransitionContextRef.current = 'drawer-open';
        }
      }

      if (shouldAnimate && themeDocument.startViewTransition && !drawerOpen) {
        const transition = themeDocument.startViewTransition(() => {
          commitTheme();
        });
        transition.finished.finally(() => {
          clearPendingTransition(transitionId);
        });
      } else {
        commitTheme();
      }

      if (shouldAnimate && (drawerOpen || !themeDocument.startViewTransition)) {
        transitionTimeoutRef.current = window.setTimeout(() => {
          clearPendingTransition(transitionId);
        }, THEME_TRANSITION_DURATION_MS);
      }
    };

    const resolveTheme = () => (mode === 'system' ? getSystemTheme(mediaQuery) : mode);

    applyTheme(resolveTheme());

    // Listen for system theme changes
    const handleChange = (event: MediaQueryListEvent) => {
      if (mode === 'system') {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      clearPendingTransition(activeTransitionIdRef.current);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [beginTransitionCycle, clearPendingTransition, getAppShell, isDrawerOpen, mode]);

  useEffect(() => {
    if (activeTransitionContextRef.current !== 'drawer-open') {
      return;
    }

    clearPendingTransition(activeTransitionIdRef.current);
  }, [clearPendingTransition, location.key]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (activeTransitionContextRef.current !== 'drawer-open') {
        return;
      }

      if (!isDrawerOpen()) {
        clearPendingTransition(activeTransitionIdRef.current);
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });

    return () => {
      observer.disconnect();
    };
  }, [clearPendingTransition, isDrawerOpen]);

  return <>{children}</>;
}

// Auth initialization wrapper
function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  // Onboarding keeps the shared shell but manages its own page content layout.
  if (location.pathname === '/onboarding') {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Suspense fallback={<LoadingScreen />}>
            <Routes location={location}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    );
  }

  return (
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
  );
}

const App = () => {
  // Network status handled by OfflineBanner component
  useGlobalClickFeedback();
  const nativeApp = isNativeApp();
  const [shouldRenderLivingBackground, setShouldRenderLivingBackground] = useState(false);

  // Handle post-login redirects for invites
  const { user, isLoading } = useAuthStore();
  const syncWithBackend = usePlanStore((state) => state.syncWithBackend);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < MOBILE_BREAKPOINT) {
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
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
