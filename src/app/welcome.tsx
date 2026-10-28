import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, TertiaryButton } from '../components/ui';
import { colors, spacing } from '../lib/theme';

const ONBOARDING_KEY = 'ethos.onboarding.complete.v1';
const slides = [
  {
    title: 'Real situations, real choices',
    body: 'Practice decisions you may face in your work and study.\nExplore realistic dilemmas in a safe space.',
    icons: ['person', 'chatbubble-ellipses', 'checkmark-circle'] as const,
  },
  {
    title: 'Learn why, not just what',
    body: 'See how each choice affects the people around you.\nBuild understanding with thoughtful explanations.',
    icons: ['help-circle', 'chatbox-ellipses', 'bulb'] as const,
  },
  {
    title: 'Build your professional judgment',
    body: 'Strengthen your confidence one decision at a time.\nYour progress is saved as you learn.',
    icons: ['compass', 'shield-checkmark', 'ribbon'] as const,
  },
];

export default function Welcome() {
  const router = useRouter();
  const [splash, setSplash] = useState(true);
  const [slide, setSlide] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(ONBOARDING_KEY).then(
      (value) => {
        timer = setTimeout(() => {
          setSplash(false);
          if (value === 'true') router.replace('/login');
          else setSlide(0);
        }, 1500);
      },
      (storageError: unknown) => {
        console.error('Unable to check onboarding preference:', storageError);
        timer = setTimeout(() => {
          setSplash(false);
          setSlide(0);
        }, 1500);
      }
    );
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  async function finishOnboarding() {
    setSaving(true);
    setError('');
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/login');
    } catch {
      setError('We could not save your onboarding progress. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (splash) {
    return (
      <SafeAreaView style={styles.splash}>
        <View style={styles.logoMark}>
          <Ionicons name="shield-checkmark" size={44} color={colors.primary} />
        </View>
        <Text style={styles.wordmark}>Ethos</Text>
      </SafeAreaView>
    );
  }

  const current = slides[slide];
  if (!current) return null;

  function advance() {
    if (slide === slides.length - 1) {
      void finishOnboarding();
    } else {
      setSlide((value) => value + 1);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.panel}>
        <View style={styles.artwork}>
          <View style={[styles.orbit, styles.orbitOne]} />
          <View style={[styles.orbit, styles.orbitTwo]} />
          {current.icons.map((icon, index) => (
            <View
              key={icon}
              style={[
                styles.iconTile,
                index === 0 ? styles.iconLeft : index === 1 ? styles.iconCenter : styles.iconRight,
              ]}
            >
              <Ionicons name={icon} size={index === 1 ? 40 : 32} color={colors.primary} />
            </View>
          ))}
          <View style={styles.artDot} />
          <View style={styles.artDotSmall} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.kicker}>ETHOS · PROFESSIONAL JUDGMENT</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
        <View style={styles.progressRow}>
          {slides.map((item, index) => (
            <View key={item.title} style={[styles.progressPill, index === slide && styles.progressActive]} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={slide === slides.length - 1 ? "Let's start" : 'Next'}
          onPress={advance}
          disabled={saving}
        />
        {slide === slides.length - 1 && saving ? (
          <Text style={styles.saving}>Saving your preference...</Text>
        ) : (
          <TertiaryButton label="Skip" onPress={() => void finishOnboarding()} disabled={saving} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  splash: {
    flex: 1,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { color: colors.primary, fontSize: 36, fontWeight: '800', marginTop: spacing.md },
  panel: {
    flex: 1.1,
    minHeight: 240,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 110,
    borderBottomRightRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artwork: { width: '80%', aspectRatio: 1.2, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: '#FFFFFF33' },
  orbitOne: { width: '85%', height: '85%' },
  orbitTwo: { width: '62%', height: '62%' },
  iconTile: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#001F2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  iconLeft: { left: '4%', top: '18%' },
  iconCenter: { zIndex: 2 },
  iconRight: { right: '4%', bottom: '14%' },
  artDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8BB8C8',
    top: '10%',
    right: '24%',
  },
  artDotSmall: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BFDCE6',
    left: '24%',
    bottom: '8%',
  },
  content: { flex: 0.95, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: spacing.sm },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: spacing.sm },
  progressRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.md },
  progressPill: { width: 22, height: 6, backgroundColor: colors.border, borderRadius: 4 },
  progressActive: { width: 42, backgroundColor: colors.primary },
  error: { color: colors.bad, fontSize: 13, marginBottom: spacing.sm },
  saving: { textAlign: 'center', color: colors.muted, marginTop: spacing.sm },
});
