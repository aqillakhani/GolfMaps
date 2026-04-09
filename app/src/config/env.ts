/**
 * Centralized environment configuration.
 *
 * All Vite env vars referenced anywhere in the app should flow through this
 * file so we have a single place to validate, document, and type them.
 *
 * IMPORTANT: any value here is embedded into the client bundle at build time.
 * Do NOT add server-only secrets.
 */

const isProd = import.meta.env.PROD;

function readEnv(key: string): string {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
}

export const ENV = {
  COURSE_API_URL: readEnv("VITE_COURSE_API_URL") || "http://localhost:8001/api",
  SCORECARD_AUTH_SECRET: readEnv("VITE_SCORECARD_AUTH_SECRET"),
  SUPABASE_URL: readEnv("VITE_SUPABASE_URL"),
  SUPABASE_ANON_KEY: readEnv("VITE_SUPABASE_ANON_KEY"),
  SENTRY_DSN: readEnv("VITE_SENTRY_DSN"),
  REVENUECAT_API_KEY: readEnv("VITE_REVENUECAT_API_KEY"),
  STRIPE_PUBLISHABLE_KEY: readEnv("VITE_STRIPE_PUBLISHABLE_KEY"),
  POSTHOG_KEY: readEnv("VITE_POSTHOG_KEY"),
  IS_PROD: isProd,
  IS_DEV: import.meta.env.DEV,
} as const;

/**
 * Runtime sanity check. Logs (dev) or throws (prod) when required values are
 * missing. Call once at app bootstrap from `main.tsx`.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  if (!ENV.COURSE_API_URL) missing.push("VITE_COURSE_API_URL");

  if (isProd) {
    if (!ENV.SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
    if (!ENV.SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    const msg =
      `Missing required environment variables: ${missing.join(", ")}.\n` +
      `Copy .env.example to .env.local (dev) or .env.production (prod) and fill them in.`;
    if (isProd) {
      throw new Error(msg);
    }
    // eslint-disable-next-line no-console
    console.warn(`[env] ${msg}`);
  }

  if (isProd && !ENV.SCORECARD_AUTH_SECRET) {
    // eslint-disable-next-line no-console
    console.warn(
      "[env] VITE_SCORECARD_AUTH_SECRET is unset — scorecard upload will fail against a secured server.",
    );
  }
}
