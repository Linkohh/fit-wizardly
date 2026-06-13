import { defineConfig, loadEnv } from "vite";
import type { ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import { handleMotivationQuoteRequest } from "./src/lib/motivation/motivationQuoteEndpoint";
import { handleApiNinjasExerciseSearchRequest } from "./src/lib/services/api/apiNinjasExerciseEndpoint";

const wgerProxyPlugin = () => ({
  name: 'wger-proxy-plugin',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/exercise-search-ninjas')) {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        await handleApiNinjasExerciseSearchRequest(
          {
            method: req.method,
            query: Object.fromEntries(url.searchParams.entries()),
          },
          {
            setHeader: (key, value) => res.setHeader(key, value),
            status(code) {
              res.statusCode = code;
              return this;
            },
            json(body) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            },
            end() {
              res.end();
            },
          }
        );
        return;
      }

      if (req.url && req.url.startsWith('/api/motivation-quote')) {
        await handleMotivationQuoteRequest(
          { method: req.method },
          {
            setHeader: (key, value) => res.setHeader(key, value),
            status(code) {
              res.statusCode = code;
              return this;
            },
            json(body) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            },
            end() {
              res.end();
            },
          }
        );
        return;
      }

      if (req.url && req.url.startsWith('/api/proxy-wger')) {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }

          const targetUrlParsed = new URL(targetUrl);
          const allowedHosts = ['wger.de', 'www.wger.de'];
          if (!allowedHosts.includes(targetUrlParsed.hostname)) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Forbidden: Host not allowed' }));
            return;
          }

          const response = await fetch(targetUrl, {
            headers: { 'Accept': 'application/json' }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Wger API returned HTTP ${response.status}` }));
            return;
          }

          const data = await response.json();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }));
        }
      } else {
        next();
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (env.API_NINJAS_API_KEY && !process.env.API_NINJAS_API_KEY) {
    process.env.API_NINJAS_API_KEY = env.API_NINJAS_API_KEY;
  }

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/plans": "http://localhost:3001",
        "/health": "http://localhost:3001",
      },
      allowedHosts: true,
    },
    plugins: [
      wgerProxyPlugin(),
    tailwindcss(),
    react(),
    mode === "development" && componentTagger(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'app-icon.png',
        'app-icon-192.png',
        'app-icon-512.png',
        'apple-touch-icon.png',
        'favicon.png',
        'exercise-data/legacy-exercises.v1.json',
        'exercise-data/wger-snapshot.v1.json',
        'logo.png',
        'robots.txt',
      ],
      manifest: {
        name: 'FitWizard',
        short_name: 'FitWizard',
        description: 'Your AI-powered workout companion',
        theme_color: '#140A1F', // keep in sync with src/lib/theme-color.ts (DARK_CHROME_COLOR)
        background_color: '#140A1F', // dark splash to match the app background
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'app-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'app-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
          if (
            id.includes("/src/features/exercise-library/") ||
            id.includes("/src/components/exercises/") ||
            id.includes("/src/lib/exerciseRepository.ts") ||
            id.includes("/src/lib/exercise-utils.ts") ||
            id.includes("/src/lib/suggestExercises.ts")
          ) {
            return "feature-exercises";
          }

          if (id.includes("node_modules")) {
            // Core React ecosystem (Critical)
            if (
              id.includes("react-router") ||
              id.includes("/react/") ||
              id.includes("/react-dom/")
            ) {
              return "vendor-react";
            }

            // UI Libraries (Critical Path - Keep together for coherence)
            if (
              id.includes("@radix-ui") ||
              id.includes("lucide-react") ||
              id.includes("framer-motion") ||
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")
            ) {
              return "vendor-ui";
            }

            // Supabase (Auth - Semi-critical)
            if (id.includes("@supabase")) {
              return "vendor-auth";
            }

            // Charts (Heavy - Lazy Load)
            if (id.includes("recharts")) {
              return "vendor-charts";
            }

            // PDF/Export (Heavy - Lazy Load)
            if (id.includes("jspdf") || id.includes("html2canvas")) {
              return "vendor-pdf";
            }

            // Data & State (Critical-ish)
            if (
              id.includes("@tanstack") ||
              id.includes("zustand") ||
              id.includes("react-hook-form") ||
              id.includes("zod")
            ) {
              return "vendor-data";
            }
          }
          },
        },
      },
      modulePreload: {
        resolveDependencies: (filename, deps, { hostId, hostType }) => {
          // Don't preload heavy/lazy chunks
          return deps.filter((dep) => {
            return (
              !dep.includes("vendor-pdf") &&
              !dep.includes("vendor-charts") &&
              !dep.includes("vendor-auth") &&
              !dep.includes("feature-exercises")
            );
          });
        },
      },
    },
  };
});
