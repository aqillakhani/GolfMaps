export const ENV = {
  COURSE_API_URL: import.meta.env.VITE_COURSE_API_URL || "http://localhost:8001/api",
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || "",
  REVENUECAT_API_KEY: import.meta.env.VITE_REVENUECAT_API_KEY || "",
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY || "",
} as const;
