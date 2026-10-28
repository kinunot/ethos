import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, ProgressBar, ProgressRing } from '../../components/ui';
import { ProgressSyncNotice } from '../../components/GuestAccountBanner';
import { categories } from '../../data/scenarios';
import { computeStats, useAttempts } from '../../lib/attempts';
import { colors, spacing } from '../../lib/theme';

function label(percent: number) {
  if (percent >= 85) return 'Strong judgment';
  if (percent >= 60) return 'Solid progress';
  return 'Room to grow';
}

export default function Progress() {
  const { attempts, loading, error } = useAttempts();
  const stats = computeStats(attempts);
  const completedRatio = stats.totalScenarios ? stats.totalDone / stats.totalScenarios : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR LEARNING JOURNEY</Text>
        <Text style={styles.title}>Progress</Text>
        <ProgressSyncNotice message={error} />
        {loading && <Text style={styles.loading}>Loading your progress…</Text>}

        <Card style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryCopy}>
              <Text style={styles.cardLabel}>Overall score</Text>
              <Text style={styles.summaryTitle}>{stats.totalDone ? label(stats.percent) : 'Start exploring'}</Text>
              <Text style={styles.sub}>
                {stats.totalDone === 0
                  ? 'Complete a scenario to see your score here.'
                  : `${stats.points} of ${stats.maxPoints} points across ${stats.totalDone} scenarios`}
              </Text>
            </View>
            <ProgressRing value={completedRatio} size={104} label="completed" />
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats.totalDone}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats.totalScenarios}</Text>
              <Text style={styles.statLabel}>Total scenarios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats.totalDone ? `${stats.percent}%` : '—'}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.section}>By category</Text>
        <View style={{ gap: spacing.sm }}>
          {categories.map((category) => {
            const categoryStats = stats.perCategory.find((item) => item.id === category.id);
            const done = categoryStats?.done ?? 0;
            const total = categoryStats?.total ?? 0;
            const scorePercent =
              categoryStats && categoryStats.maxPoints > 0
                ? Math.round((categoryStats.points / categoryStats.maxPoints) * 100)
                : 0;
            const completion = total ? done / total : 0;
            return (
              <Card key={category.id} style={styles.categoryCard}>
                <View style={styles.row}>
                  <View style={styles.categoryIcon}>
                    <Ionicons name={category.icon} size={19} color={colors.primary} />
                  </View>
                  <View style={styles.categoryCopy}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.sub}>
                      {done} of {total} scenarios completed
                    </Text>
                  </View>
                  <Text style={styles.categoryPct}>{done ? `${scorePercent}%` : '—'}</Text>
                </View>
                <View style={styles.barWrap}>
                  <ProgressBar value={completion} />
                </View>
              </Card>
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
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: 2 },
  loading: { color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
  summaryCard: { marginTop: spacing.md },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  summaryCopy: { flex: 1 },
  cardLabel: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  summaryTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: spacing.xs },
  sub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', minWidth: 75 },
  statNumber: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statDivider: { height: 34, width: 1, backgroundColor: colors.border },
  section: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  categoryCard: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  categoryIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  categoryPct: { fontSize: 16, fontWeight: '800', color: colors.primary },
  barWrap: { marginTop: spacing.sm, paddingLeft: 46 },
});
