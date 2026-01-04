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
import ExerciseCategories from "./pages/exercises/ExerciseCategories";
import ExerciseList from "./pages/exercises/ExerciseList";
import ExerciseDetail from "./pages/exercises/ExerciseDetail";
import { TrainerGuard } from "./components/TrainerGuard";

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

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/wizard" element={<WizardPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/exercises" element={<ExerciseCategories />} />
        <Route path="/exercises/:categoryId" element={<ExerciseList />} />
        <Route path="/exercises/:categoryId/:exerciseId" element={<ExerciseDetail />} />
        <Route path="/clients" element={
          <TrainerGuard>
            <ClientsPage />
          </TrainerGuard>
        }
        />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
}

import LegalPage from "./pages/Legal";
import { Footer } from "@/components/Footer";
import { ConsentModal } from "@/components/legal/ConsentModal";

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
            <Header />
            <ConsentModal />
            <AnimatedRoutes />
            <Footer />
          </div>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
