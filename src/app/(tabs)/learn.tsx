import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, PrimaryButton, ProgressBar, ProgressRing, TimelineItem } from '../../components/ui';
import { BadgeCollection } from '../../components/BadgeCollection';
import { GuestAccountBanner, ProgressSyncNotice } from '../../components/GuestAccountBanner';
import { categories, scenarios } from '../../data/scenarios';
import { computeStats, useAttempts } from '../../lib/attempts';
import { useBadges } from '../../lib/badges';
import { useAuth } from '../../lib/AuthContext';
import { colors, spacing } from '../../lib/theme';

const quotes = [
  'Integrity is doing the right thing when no one is watching.',
  'Good judgment begins with taking a moment to think.',
  'Trust grows when our actions match our values.',
];

export default function Learn() {
  const router = useRouter();
  const { attempts, loading, error, userId } = useAttempts();
  const { session, accountError, accountLoading } = useAuth();
  const badgeState = useBadges(attempts, userId);
  const stats = computeStats(attempts);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const displayName =
    (session?.user.user_metadata?.display_name as string | undefined) ||
    session?.user.email?.split('@')[0] ||
    'Guest';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  function continueCategory(categoryId: string) {
    const categoryScenarios = scenarios.filter((scenario) => scenario.category === categoryId);
    const next = categoryScenarios.find((scenario) => !stats.latest.has(scenario.id)) ?? categoryScenarios[0];
    if (next) router.push({ pathname: '/scenario/[id]', params: { id: next.id } });
  }

  function startNext() {
    const next = scenarios.find((scenario) => !stats.latest.has(scenario.id)) ?? scenarios[0];
    if (next) router.push({ pathname: '/scenario/[id]', params: { id: next.id } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <GuestAccountBanner />
        <ProgressSyncNotice message={error ?? accountError} />
        {accountLoading && <Text style={styles.loading}>Syncing your account profile…</Text>}
        {loading && <Text style={styles.loading}>Loading your progress…</Text>}
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.navigate('/profile')}
            style={styles.menuButton}
          >
            <Ionicons name="menu-outline" size={25} color={colors.ink} />
          </Pressable>
          <Text style={styles.screenTitle}>My Training</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card style={styles.greetingCard}>
          <View style={styles.greetingTop}>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.name}>{displayName}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || 'G'}</Text>
            </View>
          </View>
          <View style={styles.quotePanel}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.quote}>{quotes[quoteIndex]}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setQuoteIndex((value) => (value + 1) % quotes.length)}
              style={styles.changeChip}
            >
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.progressCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardHeading}>Your Progress</Text>
            <Pressable onPress={() => router.navigate('/progress')}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
          <View style={styles.progressContent}>
            <ProgressRing
              value={stats.totalScenarios ? stats.totalDone / stats.totalScenarios : 0}
              size={112}
              label="complete"
            />
            <View style={styles.stats}>
              <View style={styles.statRow}>
                <View style={[styles.statIcon, { backgroundColor: colors.goodBg }]}>
                  <Ionicons name="checkmark" size={17} color={colors.good} />
                </View>
                <View>
                  <Text style={styles.statValue}>{stats.totalDone}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={[styles.statIcon, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name="layers-outline" size={17} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.statValue}>{stats.totalScenarios}</Text>
                  <Text style={styles.statLabel}>Total scenarios</Text>
                </View>
              </View>
            </View>
          </View>
          <PrimaryButton
            label={stats.totalDone === 0 ? 'Start your first scenario' : 'Continue training'}
            onPress={startNext}
          />
        </Card>

        <Card style={styles.badgePreview}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardHeading}>My Badges</Text>
            <Pressable onPress={() => router.navigate('/profile')}>
              <Text style={styles.viewAll}>{badgeState.earned.length} of 5 earned</Text>
            </Pressable>
          </View>
          {badgeState.loading && <Text style={styles.badgeHint}>Loading your badges…</Text>}
          <ProgressSyncNotice message={badgeState.error} />
          <BadgeCollection
            statuses={badgeState.statuses}
            earnedOnly
            limit={2}
            onSelect={(badgeId) => router.push({ pathname: '/badge/[id]', params: { id: badgeId } })}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionHint}>Swipe to explore</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
          {categories.map((category) => {
            const categoryStats = stats.perCategory.find((item) => item.id === category.id);
            const done = categoryStats?.done ?? 0;
            const total = categoryStats?.total ?? 0;
            return (
              <Card key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon} size={22} color={colors.primary} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${category.name}`}
                  onPress={() => router.push({ pathname: '/category/[id]', params: { id: category.id } })}
                >
                  <Text style={styles.categoryName}>{category.name}</Text>
                </Pressable>
                <Text style={styles.categoryCount}>
                  {done} of {total} done
                </Text>
                <ProgressBar value={total ? done / total : 0} />
                <View style={styles.categoryButton}>
                  <PrimaryButton label="Continue" onPress={() => continueCategory(category.id)} />
                </View>
              </Card>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, styles.scenariosHeading]}>Scenarios</Text>
        <View>
          {scenarios.map((scenario, index) => {
            const attempt = stats.latest.get(scenario.id);
            const category = categories.find((item) => item.id === scenario.category);
            return (
              <TimelineItem key={scenario.id} completed={!!attempt} showLine={index < scenarios.length - 1}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })}
                >
                  <Card style={styles.scenarioCard}>
                    <View style={styles.scenarioCopy}>
                      <Text style={styles.scenarioCategory}>{category?.name ?? 'Scenario'}</Text>
                      <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                      <Text style={styles.scenarioStatus}>{attempt ? 'Completed' : 'Ready when you are'}</Text>
                    </View>
                    <View style={styles.arrowButton}>
                      <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                    </View>
                  </Card>
                </Pressable>
              </TimelineItem>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  topRow: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  headerSpacer: { width: 40 },
  greetingCard: { marginTop: spacing.sm, padding: spacing.md },
  greetingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingText: { flex: 1 },
  greeting: { color: colors.muted, fontSize: 14 },
  name: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  quotePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lavender,
    borderRadius: 13,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  quote: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  changeChip: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  changeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  progressCard: { marginTop: spacing.md },
  badgePreview: { marginTop: spacing.md },
  badgeHint: { color: colors.muted, fontSize: 13 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeading: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  viewAll: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  progressContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: spacing.md },
  stats: { gap: spacing.md, minWidth: 130 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 1 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  sectionHint: { color: colors.muted, fontSize: 12 },
  loading: { color: colors.muted, textAlign: 'center', marginBottom: spacing.sm },
  categoryRail: { gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.md },
  categoryCard: { width: 220, padding: spacing.md },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: { color: colors.ink, fontSize: 15, fontWeight: '800', minHeight: 38 },
  categoryCount: { color: colors.muted, fontSize: 12, marginTop: 3, marginBottom: spacing.sm },
  categoryButton: { marginTop: spacing.md },
  scenariosHeading: { marginTop: spacing.md, marginBottom: spacing.sm },
  scenarioCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, minHeight: 78 },
  scenarioCopy: { flex: 1, paddingRight: spacing.sm },
  scenarioCategory: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  scenarioTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 2 },
  scenarioStatus: { color: colors.muted, fontSize: 11, marginTop: 3 },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
