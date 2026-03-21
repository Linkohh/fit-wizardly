import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // Initialize i18n

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

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
