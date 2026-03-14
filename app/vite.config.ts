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
    rollupOptions: {
      // These are optional dependencies — only available when installed
      external: [
        "@sentry/react",
        "@sentry/capacitor",
        "@revenuecat/purchases-capacitor",
        "@stripe/stripe-js",
      ],
      output: {
        // Provide globals for externalized modules
        globals: {
          "@sentry/react": "Sentry",
        },
      },
    },
  },
}));
