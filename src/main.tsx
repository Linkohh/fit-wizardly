import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // Initialize i18n
import { syncThemeColor } from "./lib/theme-color";

function applyInitialTheme() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const storage = window.localStorage.getItem("fitwizard-theme") || window.localStorage.getItem("theme-storage");
    if (storage) {
      const theme = JSON.parse(storage).state?.mode;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = theme === "dark" || (theme === "system" && prefersDark);
      document.documentElement.classList.toggle("dark", Boolean(isDark));
      syncThemeColor(Boolean(isDark));
      return;
    }
  } catch {
    // Fall back to the system theme when storage is unavailable or malformed.
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", prefersDark);
  syncThemeColor(prefersDark);
}

function registerAppServiceWorker() {
  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateServiceWorker(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return;
      }

      const refreshRegistration = () => {
        if (document.visibilityState === "visible") {
          void registration.update();
        }
      };

      window.addEventListener("focus", refreshRegistration);
      window.addEventListener("pageshow", refreshRegistration);
      document.addEventListener("visibilitychange", refreshRegistration);
    },
  });
}

if (import.meta.env.PROD) {
  registerAppServiceWorker();
}

applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
