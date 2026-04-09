# GolfMaps Launch Plan

## Phase 1 — Code hardening (doing now, no external accounts needed)

### Course-API
- [ ] Fix scorecard rate limit — replace broken inline slowapi call with proper decorator
- [ ] Add shared-secret auth header on /api/scorecard/parse so Anthropic credits can't be burned by random callers
- [ ] Tighten CORS — require ALLOWED_ORIGINS in prod, fail fast if missing
- [ ] Dockerfile: non-root user, multi-stage build, healthcheck
- [ ] fly.toml — region, secrets, healthcheck, memory sizing
- [ ] .env.example documenting every required var
- [ ] .dockerignore improvements (skip caches, __pycache__, .git)

### App (frontend)
- [ ] .env.example for the app (VITE_* vars)
- [ ] env.ts — add runtime validation with clear error if required vars missing in prod
- [ ] Scorecard service — send shared-secret header
- [ ] Gate SourceDebugPanel behind import.meta.env.DEV
- [ ] Confirm lovable-tagger is dev-only (already gated, verify)
- [ ] Production build smoke test — `vite build` clean, no warnings

### Capacitor
- [ ] capacitor.config.ts — production server URL via env, deep linking scheme, app store IDs
- [ ] Android: variables.gradle version bump, signing config template
- [ ] iOS placeholder Info.plist notes (will be generated on Mac)
- [ ] Icon + splash: @capacitor/assets config scaffolded (waits for 1024x1024 source image)

## Phase 2 — Deploy course-api to Fly.io
- [ ] `fly launch --no-deploy` → generate app
- [ ] `fly secrets set ANTHROPIC_API_KEY=... SCORECARD_AUTH_SECRET=... ALLOWED_ORIGINS=...`
- [ ] `fly deploy`
- [ ] Verify /health from public URL
- [ ] Update VITE_COURSE_API_URL to the Fly URL in .env.production

## Phase 3 — Mobile builds
### Android (from Windows, solo)
- [ ] `npm run build:cap`
- [ ] `npm run open:android`
- [ ] Configure signing config (keystore)
- [ ] Build signed AAB
- [ ] Test on physical device

### iOS (requires Mac)
- [ ] On Mac: `npx cap add ios`
- [ ] Open in Xcode, configure signing team
- [ ] Archive + upload to App Store Connect
- [ ] TestFlight internal test

## Phase 4 — Accounts + services
- [ ] Supabase project: URL, anon key, run schema SQL
- [ ] RevenueCat: entitlements + product IDs
- [ ] Stripe: for canvas print orders
- [ ] Apple Developer ($99/yr)
- [ ] Google Play Console ($25 one-time)

## Phase 5 — Submission
- [ ] App icons 1024x1024 + screenshots (6.7", 6.5", Android phone, 7" tablet)
- [ ] Privacy policy URL
- [ ] Data safety / App Privacy forms
- [ ] Age rating, export compliance
- [ ] TestFlight review (24h typical)
- [ ] Play Console closed testing (14-day minimum for production)
