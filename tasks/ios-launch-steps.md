# iOS launch steps (run on a Mac)

Everything below must be executed on macOS — Capacitor's iOS toolchain depends
on Xcode, CocoaPods, and an Apple Developer signing certificate. Budget ~2h
including account setup and TestFlight processing.

## Prerequisites (one-time on the Mac)

1. Install **Xcode** from the Mac App Store (latest stable, currently 16.x).
2. Install **CocoaPods**: `brew install cocoapods` (or `sudo gem install cocoapods`).
3. Install **Node 20+** and **npm** (match the version used on the Windows dev machine).
4. Sign in to the **Apple Developer account** in Xcode → Settings → Accounts.
   Requires a paid Apple Developer Program membership ($99/yr).

## Step 1 — clone the repo and install dependencies

```bash
git clone https://github.com/aqillakhani/GolfMaps.git
cd GolfMaps/app
npm ci
```

## Step 2 — add the iOS platform

This generates the entire `ios/` folder from Capacitor's template and runs
`pod install` automatically.

```bash
npx cap add ios
```

If you get a CocoaPods error, run `sudo gem install cocoapods` then retry.

## Step 3 — set production env vars and sync

Copy `app/.env.production` from a secure source (Bitwarden, 1Password, etc.).
Never paste secrets in chat or commit them. Then build the web bundle into
the iOS project:

```bash
npm run build:cap
```

This runs `vite build` + `npx cap sync`, which copies `dist/` into
`ios/App/App/public/` and updates native configs.

## Step 4 — generate iOS icons + splash screens

The Android iconset was already generated on Windows; run the generator
again on the Mac so it outputs the iOS assets too (they land in
`ios/App/App/Assets.xcassets`).

```bash
npx capacitor-assets generate --ios \
  --iconBackgroundColor "#1A3E23" \
  --iconBackgroundColorDark "#0B1F14" \
  --splashBackgroundColor "#F5F0E8" \
  --splashBackgroundColorDark "#0B1F14"
```

Source files used:
- `app/assets/icon.png` (1024×1024, already in the repo)
- `app/assets/splash.png` (optional — falls back to a solid colour)

## Step 5 — patch Info.plist for required usage descriptions

iOS 14+ rejects the app if Camera / Photo Library usage strings are missing.
After `npx cap add ios` completes, open
`ios/App/App/Info.plist` in Xcode or a text editor and merge the keys
from `tasks/ios-info-plist-patch.xml` (same folder as this file).

Quick sanity check:

```bash
/usr/libexec/PlistBuddy -c "Print :NSCameraUsageDescription" \
  ios/App/App/Info.plist
```

## Step 6 — open the project in Xcode

```bash
npm run open:ios
```

This launches `ios/App/App.xcworkspace`.

### In Xcode

1. Select the **App** target in the left sidebar.
2. **Signing & Capabilities** tab:
   - Team: select your Apple Developer team
   - Bundle Identifier: `com.golfmaps.app` (should match `capacitor.config.ts`)
   - Check "Automatically manage signing"
3. **General** tab:
   - Display name: `GolfMaps`
   - Version: `1.0.0`
   - Build: `1`
   - Deployment target: iOS 14.0 or later
4. **Info** tab — confirm all `NS*UsageDescription` keys from the patch file
   are present (camera, photo library).
5. Build for a simulator first to catch errors: Product → Run (⌘R). Pick
   an iPhone 15 Pro simulator.
6. Test search + poster render against the Fly backend, then test the
   scorecard uploader by dragging a scorecard image into the simulator.
7. When the simulator build works, select **Any iOS Device (arm64)** as the
   target and Product → Archive (⌘B archive). Wait a few minutes.
8. Organizer window opens automatically → **Distribute App** → **App Store
   Connect** → **Upload**.
9. Let Xcode handle signing + upload. Then go to
   https://appstoreconnect.apple.com, find the build under TestFlight (it
   takes 5-30 min to process), enable it for internal testing, and install
   via TestFlight on a physical device.

## Step 7 — TestFlight internal test

1. In App Store Connect → TestFlight tab, add yourself (or a small group)
   as an **internal tester**.
2. Install the TestFlight app on your iPhone, sign in with the same Apple
   ID, and accept the invite email.
3. Open GolfMaps via TestFlight, run through:
   - Search for a real course
   - Generate a poster and confirm the map renders
   - Upload a scorecard photo and confirm Claude Haiku extracts scores
   - Take note of any crashes or layout bugs

## Troubleshooting

- **`Pod install` hangs**: `pod repo update` then retry.
- **Signing errors**: verify the team ID matches in Xcode and that the
  bundle ID `com.golfmaps.app` is registered in the Apple Developer portal
  (Xcode should offer to register it for you).
- **White screen on launch**: check that `ios/App/App/public/index.html`
  exists (created by `npx cap sync`). If missing, re-run `npm run build:cap`.
- **Course API requests fail**: confirm `ios/App/App/capacitor.config.json`
  contains the Fly URL and that Fly's `ALLOWED_ORIGINS` includes
  `capacitor://localhost` (it does).
