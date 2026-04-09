# Native app assets

Drop the source files below into `app/assets/`, then generate the full iOS +
Android iconsets in one go:

```bash
cd app
npx @capacitor/assets generate --iconBackgroundColor "#F5F0E8" --iconBackgroundColorDark "#0B1F14"
```

## Required inputs

| File                | Size       | Notes                                             |
|---------------------|------------|---------------------------------------------------|
| `icon.png`          | 1024x1024  | Square, opaque. Use the full logo — no padding.   |
| `icon-foreground.png` (optional) | 1024x1024 | Used for Android adaptive icon foreground layer. |
| `splash.png`        | 2732x2732  | Centered logo, safe area 1200x1200, brand bg.     |
| `splash-dark.png`   | 2732x2732  | Dark-mode variant.                                |

After running the generator, `npx cap sync` will copy everything into the
iOS `App/App/Assets.xcassets` and Android `res/mipmap-*` folders.
