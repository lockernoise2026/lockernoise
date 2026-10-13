# LockerNoise Android — Build and release checklist

The Android app is a **planned distributable** using Capacitor and the same React frontend as the website. Its Google Play release does not exist yet. No Apple/iOS build is planned.

1. Connect newly created, separate LockerNoise GitHub, Netlify and Supabase accounts, never Trinity Crafters Market.
2. Install pinned frontend dependencies, commit a verified lockfile, and run `npm test` and `npm run build`.
3. Install compatible current `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` package versions; preserve exact versions in package-lock.json.
4. Use `npx cap add android` once, then `npx cap sync android` after each frontend build. `capacitor.config.json` sets a provisional app ID `net.lockernoise.app`, which must be checked against final domain and identity.
5. Open Android Studio, test on physical Android phones, configure secure deep links and permission prompts, generate a signed Android App Bundle (.aab) and upload through the developer's own Google Play Console.
6. Provide a public privacy policy, account deletion workflow, content moderation/reporting, Data Safety declarations, and complete any Play Console testing requirements before submitting for review. Google reviews and approves the listing, not this project archive.

The app can be installed as a browser PWA during early testing, but **a PWA installation is not a Google Play listing**.
