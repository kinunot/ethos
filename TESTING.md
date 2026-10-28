# Manual test checklist

Before testing, configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, run `supabase/schema.sql` and `supabase/badges.sql` in the Supabase SQL Editor, and restart the app.

1. **Create an account:** On the sign-up screen, enter a display name, valid email, password with at least 8 characters, and matching confirmation. Verify invalid email, short password, and mismatched passwords are rejected. If email confirmation is enabled, verify the confirmation message appears and the screen switches to Sign in; otherwise verify the app opens Home.
2. **Verify Supabase rows:** Sign in (and confirm the email first if required). In Supabase, verify `profiles` has a row for the new user with the display name. Answer a scenario and verify `attempts` has a row with that user's `user_id`, scenario ID, choice, and score.
3. **Stay signed in:** Force-quit/kill the app, reopen it, and verify it returns to Home without asking you to sign in again.
4. **Sync across devices:** Sign in to the same account on a second device and verify the completed scenario and progress score appear there.
5. **Migrate guest progress:** Continue as a guest, answer several scenarios, then create an account or sign in. Verify the same scenarios and scores appear in the account and in the Supabase `attempts` table, with no duplicate copies after reopening or signing in again.
6. **Earn and retain badges:** Complete every scenario in one category. Verify Results opens, the category badge appears in the achievement modal, and View my badge opens its certificate. Choose Later in another completion flow and verify the badge remains on Home/Profile after closing and reopening the app.
7. **Save/share a badge:** On iOS/Android, save an earned certificate and verify it appears in the photo gallery; deny photo access and verify the explanation and Open settings action appear. On web, save the certificate and verify a PNG downloads; verify Share either opens the system share UI when supported or explains that the browser does not support sharing.
