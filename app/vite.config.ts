import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode !== "production",
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // Optional integration packages — only bundled if installed. Keeping
      // them external lets the app build and run without RevenueCat/Sentry.
      external: [
        "@sentry/react",
        "@sentry/capacitor",
        "@revenuecat/purchases-capacitor",
        "@stripe/stripe-js",
      ],
      output: {
        globals: {
          "@sentry/react": "Sentry",
        },
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["framer-motion", "lucide-react"],
          "vendor-d3": ["d3-geo", "d3-shape", "d3-path"],
        },
      },
    },
  },
}));
