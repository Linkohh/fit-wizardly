import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { useThemeStore } from "@/stores/themeStore";
import Index from "./pages/Index";
import WizardPage from "./pages/Wizard";
import PlanPage from "./pages/Plan";
import NotFound from "./pages/NotFound";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-background">
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/wizard" element={<WizardPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
