import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { Card, PrimaryButton, SecondaryButton } from '../../components/ui';
import { GuestAccountBanner, ProgressSyncNotice } from '../../components/GuestAccountBanner';
import { categories } from '../../data/scenarios';
import { computeStats, useAttempts } from '../../lib/attempts';
import { badgeEarnedDate, badgeForCategory, useBadges } from '../../lib/badges';
import { colors, spacing } from '../../lib/theme';

const ACHIEVEMENT_SEEN_KEY = 'ethos.achievement.seen.v2';

function feedbackFor(percent: number) {
  if (percent >= 85) return 'Excellent judgment. You consistently put professional values into practice.';
  if (percent >= 60) return 'Good progress. Keep reflecting on the impact of each decision.';
  return 'Every decision is a chance to learn. Keep practicing and your judgment will grow.';
}

function SuccessBurst() {
  return (
    <View style={styles.successArtwork}>
      <Svg width={140} height={140} viewBox="0 0 140 140" style={StyleSheet.absoluteFill}>
        <Line x1="70" y1="2" x2="70" y2="15" stroke={colors.good} strokeWidth="3" strokeLinecap="round" />
        <Line x1="20" y1="27" x2="30" y2="37" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
        <Line x1="120" y1="27" x2="110" y2="37" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
        <Line x1="2" y1="70" x2="15" y2="70" stroke={colors.good} strokeWidth="3" strokeLinecap="round" />
        <Line x1="138" y1="70" x2="125" y2="70" stroke={colors.good} strokeWidth="3" strokeLinecap="round" />
        <Polygon points="43,12 46,19 54,20 48,25 50,33 43,29 36,33 38,25 32,20 40,19" fill="#9DC8D7" />
        <Polygon points="99,12 102,19 110,20 104,25 106,33 99,29 92,33 94,25 88,20 96,19" fill={colors.primaryTint} />
      </Svg>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={54} color={colors.card} />
      </View>
    </View>
  );
}

function AchievementArtwork() {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180">
      <Rect x="35" y="24" width="18" height="18" rx="3" fill={colors.primary} transform="rotate(-12 35 24)" />
      <Rect x="174" y="33" width="14" height="14" rx="2" fill={colors.accent} transform="rotate(18 174 33)" />
      <Path d="M110 22l4 10 11 1-8 7 3 10-10-6-9 6 3-10-8-7 11-1z" fill={colors.accent} />
      <Circle cx="110" cy="82" r="52" fill="#FFF2CC" />
      <Path d="M84 55h52v68H84z" fill="#FFFFFF" stroke={colors.primary} strokeWidth="4" />
      <Path d="M96 68h28M96 79h18M96 90h24" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" />
      <Path d="M102 107l7 7 15-17" fill="none" stroke={colors.good} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M76 120h68l-8 28h-52z" fill={colors.accent} stroke="#D79B1A" strokeWidth="3" />
      <Path d="M93 148l17-18 17 18-17 10z" fill="#E0A31F" />
      <Line x1="20" y1="84" x2="38" y2="84" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />
      <Line x1="182" y1="93" x2="201" y2="88" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
      <Polygon points="43,116 47,124 56,125 49,131 51,140 43,135 35,140 37,131 30,125 39,124" fill="#92B7C7" />
      <Polygon points="174,121 177,127 184,128 179,133 180,140 174,136 168,140 169,133 164,128 171,127" fill={colors.primary} />
    </Svg>
  );
}

export default function ResultsScreen() {
  const { category: categoryParam } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { attempts, loading, error, userId } = useAttempts();
  const badgeState = useBadges(attempts, userId);
  const stats = computeStats(attempts);
  const category = categories.find((item) => item.id === categoryParam);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementError, setAchievementError] = useState<string | null>(null);
  const achievementBadge = category ? badgeForCategory(category.id) : null;
  const earnedAt = achievementBadge ? badgeEarnedDate(badgeState.earned, achievementBadge.id) : null;
  const seenKey = achievementBadge
    ? `${ACHIEVEMENT_SEEN_KEY}.${userId ?? 'guest'}.${achievementBadge.id}`
    : null;

  useEffect(() => {
    if (loading || badgeState.loading || !seenKey || !earnedAt) return;
    AsyncStorage.getItem(seenKey).then(
      (value) => setShowAchievement(value !== 'true'),
      (error: unknown) => {
        console.error('Unable to check achievement display preference:', error);
        setAchievementError('The badge was earned, but its reminder preference could not be read.');
        setShowAchievement(true);
      }
    );
  }, [loading, badgeState.loading, seenKey, earnedAt]);

  if (!category) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Category results not found.</Text>
        <SecondaryButton label="Back to home" onPress={() => router.replace('/learn')} />
      </View>
    );
  }

  const categoryStats = stats.perCategory.find((item) => item.id === category.id);
  const points = categoryStats?.points ?? 0;
  const maxPoints = (categoryStats?.total ?? 0) * 2;
  const percent = maxPoints ? Math.round((points / maxPoints) * 100) : 0;

  async function dismissAchievement(viewBadge = false) {
    try {
      if (seenKey) await AsyncStorage.setItem(seenKey, 'true');
    } catch (error) {
      console.error('Unable to save achievement display preference:', error);
      setAchievementError('Your badge is saved, but this reminder may appear again because its preference could not be saved.');
    }
    setShowAchievement(false);
    if (viewBadge && achievementBadge) {
      router.push({ pathname: '/badge/[id]', params: { id: achievementBadge.id } });
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <GuestAccountBanner />
        <ProgressSyncNotice message={error ?? badgeState.error ?? achievementError} />
        {(loading || badgeState.loading) && <Text style={styles.loading}>Loading your progress and badges…</Text>}
        <SuccessBurst />
        <Text style={styles.title}>Category complete</Text>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Card style={styles.scoreCard}>
          <Text style={styles.score}>
            {points} <Text style={styles.scoreTotal}>of {maxPoints} points</Text>
          </Text>
          <Text style={styles.percent}>{percent}%</Text>
          <Text style={styles.feedback}>{feedbackFor(percent)}</Text>
        </Card>
        <View style={styles.actions}>
          <PrimaryButton label="Try another category" onPress={() => router.replace('/learn')} />
          <SecondaryButton label="Back to home" onPress={() => router.replace('/learn')} />
        </View>
      </ScrollView>

      <Modal
        visible={showAchievement}
        transparent
        animationType="fade"
        onRequestClose={() => void dismissAchievement()}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close achievement"
              onPress={() => void dismissAchievement()}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
            <AchievementArtwork />
            <Text style={styles.achievementTitle}>{achievementBadge?.name ?? 'Badge earned!'}</Text>
            <Text style={styles.achievementText}>
              {achievementBadge?.description ?? 'This badge celebrates your progress.'}
            </Text>
            <PrimaryButton label="View my badge" onPress={() => void dismissAchievement(true)} />
            <Pressable onPress={() => void dismissAchievement()} style={styles.laterButton}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  successArtwork: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  successCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.good,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.ink, fontSize: 27, fontWeight: '800', textAlign: 'center' },
  loading: { color: colors.muted, textAlign: 'center', marginBottom: spacing.sm },
  categoryName: { color: colors.muted, fontSize: 15, marginTop: spacing.xs, textAlign: 'center' },
  scoreCard: { width: '100%', alignItems: 'center', marginTop: spacing.lg, padding: spacing.lg },
  score: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  scoreTotal: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  percent: { color: colors.good, fontSize: 42, fontWeight: '800', marginTop: spacing.sm },
  feedback: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: spacing.sm },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: '#111A22AA', alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    backgroundColor: colors.card,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  modalClose: { alignSelf: 'flex-end', width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  achievementTitle: { color: colors.ink, fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: spacing.xs },
  achievementText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginVertical: spacing.md },
  laterButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  laterText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  notFound: { flex: 1, gap: spacing.md, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bg },
  notFoundText: { color: colors.ink },
});
