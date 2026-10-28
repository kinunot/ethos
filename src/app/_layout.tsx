import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';

const ONBOARDING_KEY = 'ethos.onboarding.complete.v1';

function Gate() {
  const { session, loading, guest } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = React.useState<boolean | null>(null);
  const [storageError, setStorageError] = React.useState(false);
  const entryShown = React.useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(
      (value) => setOnboardingDone(value === 'true'),
      (error: unknown) => {
        console.error('Unable to load onboarding preference:', error);
        setStorageError(true);
      }
    );
  }, []);

  useEffect(() => {
    if (loading || onboardingDone === null) return;
    const onWelcome = segments[0] === 'welcome';
    const onLogin = segments[0] === 'login';
    const allowed = !!session || guest;
    if (!entryShown.current) {
      entryShown.current = true;
      if (!onWelcome) router.replace('/welcome');
      return;
    }
    if (!onWelcome && !allowed && !onLogin) router.replace('/login');
    else if (session && onLogin) router.replace('/learn');
  }, [loading, onboardingDone, session, guest, segments, router]);

  if (loading || (onboardingDone === null && !storageError)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (storageError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <Text style={{ color: colors.ink, textAlign: 'center', lineHeight: 22 }}>
          Ethos could not read your onboarding preference. Please restart the app and try again.
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="scenario/[id]" options={{ title: '' }} />
      <Stack.Screen name="results/[category]" options={{ headerShown: false }} />
      <Stack.Screen name="badge/[id]" options={{ title: 'My Badge' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Gate />
    </AuthProvider>
  );
}
