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

## Phase 2 — Deploy course-api to Fly.io ✅ DONE 2026-04-08
- [x] `fly apps create golfmaps-api --org personal`
- [x] `fly secrets set ANTHROPIC_API_KEY=... SCORECARD_AUTH_SECRET=... ALLOWED_ORIGINS=...`
- [x] `fly deploy` — 2 machines in iad region, both passing health checks
- [x] Verify /health from public URL (200)
- [x] Verify /api/scorecard/parse — 401 without header, 18 scores with header
- [x] Update VITE_COURSE_API_URL to https://golfmaps-api.fly.dev/api in .env.production
- [x] Write VITE_SCORECARD_AUTH_SECRET matching the Fly secret

Public URL: https://golfmaps-api.fly.dev

## Phase 3 — Mobile builds

### Phase 3A — Android (from Windows)
- [x] Brand icon source committed at `app/assets/icon.png` (1024×1024)
- [x] `@capacitor/assets` generates full Android iconset + splashes
- [x] Debug APK built and installed on physical device (verified end-to-end
      against Fly backend)
- [x] `app/android/app/build.gradle` wired for release signing via
      `android/keystore.properties` (gitignored), with R8 minification
      + resource shrinking enabled
- [x] ProGuard rules hardened to keep Capacitor reflection classes
- [x] Keystore files globally gitignored (`*.jks`, `*.keystore`,
      `keystore.properties`)
- [x] `keystore.properties.example` template added
- [x] versionName bumped to "1.0.0", versionCode = 1 for first release
- [ ] **BLOCKED ON USER**: keystore password decision. Then I generate
      `android/app/release.keystore`, populate `keystore.properties`, and
      run `./gradlew bundleRelease` to produce the signed AAB.

### Phase 3B — iOS (requires Mac)
- [x] Full step-by-step Xcode checklist in `tasks/ios-launch-steps.md`
- [x] Info.plist patch template in `tasks/ios-info-plist-patch.xml` with
      NSCameraUsageDescription, NSPhotoLibraryUsageDescription,
      NSAppTransportSecurity exceptions, CAPLaunchScreen reference
- [x] Icon source already committed — same `@capacitor/assets` run on the
      Mac will produce the iOS assets
- [ ] **BLOCKED ON USER**: Mac access (borrowed Mac or MacInCloud ~$30/mo)
- [ ] On Mac: `npx cap add ios` → `npm run build:cap` → patch Info.plist
      → Xcode signing + archive → upload to App Store Connect → TestFlight

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
