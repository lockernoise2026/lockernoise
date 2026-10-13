# LockerNoise — LN Spin & Burst Splash Update

**For the existing `lockernoise2026/lockernoise` repository.** Use the owner-approved large LN shield. No old football icon and no database changes.

## Update your website before the next Netlify deployment

1. Download this ZIP and extract it. On GitHub, open `lockernoise2026/lockernoise`.
2. Replace `src/App.jsx` and `src/main.jsx` with the copies in this ZIP. Upload **new files** `src/LaunchSplash.jsx` and `src/splash.css`.
3. Upload **new asset** `public/brand/splash-shield.png` and `public/brand/splash-wordmark.png`. Keep your existing `public/brand/` assets, favicon, and all other website files.
4. Update `capacitor.config.json` as included (for future Android builds). This does not publish an Android app.
5. Commit. Your existing Netlify auto-deploy should rebuild from `main`. Confirm deployment is **Published**.
6. Open `https://lockernoise-test.netlify.app/` in a NEW tab or force reload. The shield rotates then bursts into neon-lime particles; then account sign-in or the home feed appears. Try an Incognito window as well.

**No Supabase SQL, API keys, environment-variable changes, new accounts, or paid services** are required. Do not upload this ZIP as a ZIP inside GitHub—upload its contained paths. Do not touch Trinity Crafters Market.

## Function and accessibility

- First page/app load: animated LN shield splash first; Supabase session check happens underneath.
- Signed in: after animation & session resolution, existing app routes to the home feed (or existing onboarding).
- Signed out: only after animation & session resolution, show existing account sign-in/registration screen.
- If Supabase is slow, remain on the branded loading screen rather than flash the login form. If the session fails, the existing sign-in screen appears.
- Reduced-motion setting: static approved shield and wordmark, no spin/flash, short delay.
- Android: matching native static launch asset already exists in the branding project (`resources/splash.png`); this React splash animates in the WebView afterwards. Regenerate Android native splash assets when creating the Android project. Don't show two full-length splashes.

## Notes

- Animation timing: ~2.7 seconds normally, ~0.35 seconds with reduced-motion preferences.
- Use the approved brand image; don't replace logo with generated art or older lime-square football icon.
- Splash is triggered on **fresh app/page start**, not on every navigation inside LockerNoise.
- Netlify deploy must succeed, then test on desktop browser and Android/mobile browser.
