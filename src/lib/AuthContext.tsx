import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigError } from './supabase';

type AuthResult = { error: string | null; warning?: string; needsConfirmation?: boolean; hasSession?: boolean };

type AuthValue = {
  session: Session | null;
  loading: boolean;
  accountLoading: boolean;
  guest: boolean;
  configured: boolean;
  configError: string | null;
  accountError: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function friendlyAuthError(error: AuthError) {
  const message = error.message.toLowerCase();
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return 'Choose a stronger password with at least 8 characters.';
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return 'A network error prevented the request. Check your connection and try again.';
  }
  return error.message;
}

function displayNameFor(user: User) {
  const value = user.user_metadata?.display_name;
  return typeof value === 'string' ? value : '';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [accountLoading, setAccountLoading] = useState(false);
  const [guestChosen, setGuestChosen] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const ensureProfile = useCallback(async (user: User) => {
    if (!supabase) return;
    setAccountLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert(
        { id: user.id, display_name: displayNameFor(user) },
        { onConflict: 'id' }
      );
      if (error) throw new Error(error.message);
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;
    supabase.auth.getSession().then(
      ({ data, error }) => {
        if (!active) return;
        if (error) {
          setAccountError(`Unable to restore your saved sign-in: ${friendlyAuthError(error)}`);
        }
        setSession(data.session);
        setLoading(false);
        if (data.session) {
          void ensureProfile(data.session.user).catch((profileError: unknown) => {
            const message = profileError instanceof Error ? profileError.message : String(profileError);
            console.error('[Ethos] Unable to create or update your profile:', message);
            setAccountError('Your account is signed in, but profile details could not sync. Check your connection and sign in again.');
          });
        }
      },
      (error: unknown) => {
        if (!active) return;
        console.error('[Ethos] Unable to restore the saved sign-in:', error);
        setAccountError('Unable to restore your saved sign-in. Check your connection and try again.');
        setLoading(false);
      }
    );

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      accountLoading,
      guest: guestChosen && !session,
      configured: !!supabase,
      configError: supabaseConfigError,
      accountError,
      async signIn(email, password) {
        if (!supabase) return { error: 'Supabase is not configured.' };
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { error: friendlyAuthError(error) };
          try {
            await ensureProfile(data.user);
            setAccountError(null);
            return { error: null, hasSession: !!data.session };
          } catch (profileError) {
            const warning = 'You signed in, but your profile could not sync. Check your connection and try again.';
            console.error('[Ethos] Unable to create or update your profile:', profileError);
            setAccountError(warning);
            return { error: null, warning, hasSession: !!data.session };
          }
        } catch (error) {
          return {
            error: error instanceof Error && /network|fetch/i.test(error.message)
              ? 'A network error prevented sign-in. Check your connection and try again.'
              : 'Unable to sign in right now. Please try again.',
          };
        }
      },
      async signUp(email, password, name) {
        if (!supabase) return { error: 'Supabase is not configured.' };
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: name ?? '' } },
          });
          if (error) return { error: friendlyAuthError(error) };
          if (data.session && data.user) {
            try {
              await ensureProfile(data.user);
              setAccountError(null);
            } catch (profileError) {
              const warning = 'Your account was created, but your profile could not sync. Check your connection and try again.';
              console.error('[Ethos] Unable to create or update your profile:', profileError);
              setAccountError(warning);
              return { error: null, warning, hasSession: true };
            }
          }
          return { error: null, needsConfirmation: !data.session, hasSession: !!data.session };
        } catch (error) {
          return {
            error: error instanceof Error && /network|fetch/i.test(error.message)
              ? 'A network error prevented account creation. Check your connection and try again.'
              : 'Unable to create your account right now. Please try again.',
          };
        }
      },
      async resetPassword(email) {
        if (!supabase) return { error: 'Supabase is not configured.' };
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          return { error: error ? friendlyAuthError(error) : null };
        } catch (error) {
          return {
            error: error instanceof Error && /network|fetch/i.test(error.message)
              ? 'A network error prevented the reset email. Check your connection and try again.'
              : 'Unable to send a password reset email right now. Please try again.',
          };
        }
      },
      async signOut() {
        try {
          if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) return { error: friendlyAuthError(error) };
          }
          setGuestChosen(false);
          setAccountError(null);
          return { error: null };
        } catch (error) {
          return {
            error: error instanceof Error && /network|fetch/i.test(error.message)
              ? 'A network error prevented sign-out. Check your connection and try again.'
              : 'Unable to sign out right now. Please try again.',
          };
        }
      },
      continueAsGuest() {
        setGuestChosen(true);
      },
    }),
    [session, loading, accountLoading, guestChosen, accountError, ensureProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
