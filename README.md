# Transport Deutsch

Simple Expo React Native app for toddlers to tap and drag a bus, plane, and train into the right zone.

## Config

- Expo SDK: `54.0.6`
- App name: `Transport Deutsch`
- Slug: `transport-deutsch`
- Version: `1.0.0`
- Android package placeholder: `com.example.transportdeutsch`

Replace the Android package id in `app.json` before shipping to the Play Store.

## 1. Run Locally

```bash
cd "/Users/vishakha/Downloads/German Transport App/german-transport-app"
npm install
npm start
```

This starts the Expo development server. From there you can:

- press `a` to open Android
- press `i` to open iOS
- press `w` to open web

## 2. Test With Expo Go

This project is set up to run in Expo Go first.

1. Install Expo Go on your Android phone.
2. Start the app:

```bash
cd "/Users/vishakha/Downloads/German Transport App/german-transport-app"
npm start
```

3. Scan the QR code from the terminal.

If your phone and computer are on different networks or QR discovery is flaky, try:

```bash
npx expo start --tunnel
```

## 3. Build For Android

This project includes a minimal `eas.json` for Android builds:

- `preview` builds an installable internal `.apk`
- `production` builds a Play Store `.aab`

Install EAS CLI if needed:

```bash
npm install -g eas-cli
```

Log in to Expo:

```bash
eas login
```

Create an Android APK for direct device testing:

```bash
eas build --platform android --profile preview
```

Create an Android AAB for Google Play:

```bash
eas build --platform android --profile production
```

Before a real store build, replace the placeholder Android package id in `app.json`.

## Notes

- Uses only local UI primitives, emoji, placeholder sound effects, Expo Audio for local SFX, and Expo Speech for German text-to-speech.
- No login, backend, database, or external services.
- Built as a single-screen app to keep the first version easy to run and extend.
- Local sound placeholders are documented in `assets/sounds/README.md`. Add the real files there and then replace the commented `asset: null` entries in `src/utils/soundEffects.ts`.
# German-transport-app
