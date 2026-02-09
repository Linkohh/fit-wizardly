import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
      includeAssets: ['favicon.png', 'logo.png', 'robots.txt'],
      manifest: {
        name: 'FitWizard',
        short_name: 'FitWizard',
        description: 'Your AI-powered workout companion',
        theme_color: '#8B5CF6',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.png',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
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
            !dep.includes("vendor-auth")
          );
        });
      },
    },
  },
}));
