import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("recharts")) return "vendor-charts";
          if (
            id.includes("jspdf") ||
            id.includes("jspdf-autotable")
          ) {
            return "vendor-jspdf";
          }
          if (
            id.includes("canvg") ||
            id.includes("svg-pathdata") ||
            id.includes("rgbcolor") ||
            id.includes("stackblur-canvas") ||
            id.includes("fflate") ||
            id.includes("pako") ||
            id.includes("core-js")
          ) {
            return "vendor-export-support";
          }
          if (id.includes("html2canvas") || id.includes("dompurify")) {
            return "vendor-export-canvas";
          }
          if (
            id.includes("react-markdown") ||
            id.includes("remark-") ||
            id.includes("rehype-") ||
            id.includes("micromark") ||
            id.includes("mdast-") ||
            id.includes("hast-") ||
            id.includes("unist-") ||
            id.includes("vfile") ||
            id.includes("property-information")
          ) {
            return "vendor-markdown";
          }
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }
          if (id.includes("react-hook-form") || id.includes("@hookform")) {
            return "vendor-forms";
          }
          if (
            id.includes("@reduxjs") ||
            id.includes("redux") ||
            id.includes("immer") ||
            id.includes("reselect") ||
            id.includes("zustand")
          ) {
            return "vendor-state";
          }
          if (
            id.includes("zod") ||
            id.includes("date-fns") ||
            id.includes("react-day-picker") ||
            id.includes("sonner") ||
            id.includes("cmdk") ||
            id.includes("vaul") ||
            id.includes("@capacitor")
          ) {
            return "vendor-utils";
          }
          if (
            id.includes("@radix-ui") ||
            id.includes("lucide-react") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge")
          ) {
            return "vendor-ui";
          }
          if (
            id.includes("react-router") ||
            id.includes("/react/") ||
            id.includes("/react-dom/")
          ) {
            return "vendor-react";
          }
          return "vendor-misc";
        },
      },
    },
  },
}));
