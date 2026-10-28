import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../components/ui';
import { useAuth } from '../lib/AuthContext';
import { colors, spacing } from '../lib/theme';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function Login() {
  const router = useRouter();
  const { signIn, signUp, resetPassword, continueAsGuest, configured, configError, accountError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: 'error' | 'info' } | null>(null);

  async function submit() {
    setMessage(null);
    if (!isValidEmail(email)) {
      setMessage({ text: 'Enter a valid email address.', kind: 'error' });
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setMessage({ text: 'Enter the name you want shown on your profile.', kind: 'error' });
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setMessage({ text: 'Choose a password with at least 8 characters.', kind: 'error' });
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setMessage({ text: 'Your passwords do not match.', kind: 'error' });
      return;
    }
    if (mode === 'signin' && !password) {
      setMessage({ text: 'Enter your password.', kind: 'error' });
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        const result = await signIn(email.trim(), password);
        if (result.error) {
          setMessage({ text: result.error, kind: 'error' });
        } else {
          if (result.warning) setMessage({ text: result.warning, kind: 'error' });
          router.replace('/learn');
        }
        return;
      }

      const result = await signUp(email.trim(), password, name.trim());
      if (result.error) {
        setMessage({ text: result.error, kind: 'error' });
      } else if (result.needsConfirmation) {
        setMessage({ text: 'Check your email to confirm your account, then sign in.', kind: 'info' });
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
      } else {
        if (result.warning) setMessage({ text: result.warning, kind: 'error' });
        router.replace('/learn');
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    setMessage(null);
    if (!isValidEmail(email)) {
      setMessage({ text: 'Enter your email address first so we know where to send the reset link.', kind: 'error' });
      return;
    }
    setBusy(true);
    try {
      const result = await resetPassword(email.trim());
      setMessage(
        result.error
          ? { text: result.error, kind: 'error' }
          : { text: 'If an account exists for this email, a password reset link is on its way.', kind: 'info' }
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseGuest() {
    continueAsGuest();
    router.replace('/learn');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Ionicons name="shield-checkmark" size={30} color={colors.primary} />
            </View>
            <Text style={styles.logo}>Ethos</Text>
            <Text style={styles.tagline}>Practice professional judgment, one scenario at a time.</Text>
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.formSubtitle}>
              {configured ? 'Sign in to keep your learning progress with you.' : 'Your next thoughtful decision starts here.'}
            </Text>

            {configured ? (
              <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                {accountError ? <Text style={styles.error}>{accountError}</Text> : null}
                {mode === 'signup' && (
                  <TextInput
                    accessibilityLabel="Display name"
                    placeholder="Display name"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    style={styles.input}
                  />
                )}
                <TextInput
                  accessibilityLabel="Email"
                  placeholder="Email"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
                <TextInput
                  accessibilityLabel="Password"
                  placeholder="Password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
                {mode === 'signup' && (
                  <TextInput
                    accessibilityLabel="Confirm password"
                    placeholder="Confirm password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                  />
                )}
                {message && (
                  <Text style={{ color: message.kind === 'error' ? colors.bad : colors.good }}>{message.text}</Text>
                )}
                {busy ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
                ) : (
                  <Button label={mode === 'signin' ? 'Sign in' : 'Create account'} onPress={() => void submit()} />
                )}
                {mode === 'signin' && (
                  <Pressable accessibilityRole="button" disabled={busy} onPress={() => void sendPasswordReset()}>
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                )}
                <Pressable
                  disabled={busy}
                  onPress={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setMessage(null);
                  }}
                >
                  <Text style={styles.link}>
                    {mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.notice}>{configError}</Text>
                <View style={{ marginTop: spacing.lg }}>
                  <Button label="Continue as guest" onPress={chooseGuest} />
                </View>
              </>
            )}
          </Card>

          <Text style={styles.footnote}>Guest progress stays on this device only.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingVertical: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.lg },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: 36, fontWeight: '800', color: colors.primary, letterSpacing: -1, marginTop: spacing.sm },
  tagline: { fontSize: 15, color: colors.muted, marginTop: spacing.xs, lineHeight: 22, textAlign: 'center' },
  formCard: { padding: spacing.lg },
  formTitle: { fontSize: 24, fontWeight: '800', color: colors.ink },
  formSubtitle: { fontSize: 14, color: colors.muted, lineHeight: 20, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.ink,
  },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.sm, fontWeight: '700' },
  notice: { marginTop: spacing.lg, color: colors.muted, lineHeight: 22 },
  error: { color: colors.bad, lineHeight: 20 },
  footnote: { color: colors.muted, textAlign: 'center', marginTop: spacing.md, fontSize: 13 },
});
