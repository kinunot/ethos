# Ethos: setup guide

Ethos is a mobile app for practicing professionalism and ethical decision-making through short scenarios.
This folder contains the app's source files. You create the Expo project shell on your laptop and copy these
files into it, so the dependency versions always match the current Expo release.

## 1. Create the Expo project (laptop)

```bash
npx create-expo-app@latest ethos
cd ethos
npm run reset-project        # answer "n" when asked to keep the example files, or delete app-example/ afterwards
```

## 2. Copy these files in

Copy these folders and files from this download into the `ethos` project, replacing anything that exists:

- `src/app/`
- `src/components/`
- `src/data/`
- `src/lib/`
- `supabase/` (for reference)
- `.env.example`

If the template left a `components/`, `hooks/` or `constants/` folder from the starter, you can delete it. Ethos
does not use it.

## 3. Install the extra packages

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill react-native-svg expo-linear-gradient @expo/vector-icons
```

## 4. Run it (guest mode works right away)

```bash
npx expo start
```

Press `w` for the browser, `a` for an Android emulator, or scan the QR code with Expo Go on your phone.
Without Supabase keys, the app runs in guest mode: everything works and progress is saved on the device.

## 5. Turn on accounts (Supabase)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it.
3. Open **Project Settings -> API** and copy the Project URL and the `anon` public key.
4. Copy `.env.example` to `.env` and fill both values. Never commit `.env` and never use the `service_role` key in the app.
5. In **Authentication -> Providers -> Email**, turn off "Confirm email" while testing.
6. Restart with `npx expo start -c`.

Sign up in the app, answer a scenario, then check **Table Editor -> attempts** in Supabase to see the saved row.

## Project layout

```
src/
  app/
    _layout.tsx        auth gate + navigation
    welcome.tsx        splash and first-launch onboarding
    login.tsx          sign in / sign up / guest
    (tabs)/            Learn, Progress, Profile
    category/[id].tsx  scenarios in a category
    scenario/[id].tsx  the scenario + feedback screen
    results/[category].tsx category results and achievement
  data/
    scenarios.ts       all scenario content (add yours here)
  lib/                 supabase client, auth, progress logic, theme
  components/
    ui.tsx             shared cards, buttons, and progress displays
supabase/schema.sql    database tables and security rules
```

## Adding scenarios

Add an object to `scenarios` in `src/data/scenarios.ts` with a unique `id`, a `category`, a `situation`, and 3-4
`choices`. Each choice has a `score` (2 = strongest, 1 = defensible but incomplete, 0 = problematic) and an
`explanation`. Progress and scoring update automatically.

## Before you share it

- Replace `FEEDBACK_URL` in `src/app/(tabs)/profile.tsx` with your own form link.
- Turn "Confirm email" back on in Supabase.
- Have a classmate or two read the scenarios and tell you which ones feel unrealistic.

## Notes on what is not done yet

- The code was written without running it, so expect to fix small issues on the first run.
- Scenarios live in the app, not in the database. Moving them to Supabase is a good next step.
- No push notifications, streaks, or leaderboard yet.
