import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, ProgressBar, TimelineItem } from '../../components/ui';
import { ProgressSyncNotice } from '../../components/GuestAccountBanner';
import { categories, CategoryId, scenariosFor } from '../../data/scenarios';
import { computeStats, useAttempts } from '../../lib/attempts';
import { colors, spacing } from '../../lib/theme';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { attempts, loading, error } = useAttempts();
  const stats = computeStats(attempts);
  const category = categories.find((item) => item.id === id);

  if (!category) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Category not found.</Text>
      </View>
    );
  }

  const categoryStats = stats.perCategory.find((item) => item.id === category.id);
  const list = scenariosFor(category.id as CategoryId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/learn');
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{category.name}</Text>
        </View>
        <Text style={styles.description}>{category.description}</Text>
        <ProgressSyncNotice message={error} />
        {loading && <Text style={styles.loading}>Loading your progress…</Text>}
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>Your progress</Text>
            <Text style={styles.progressCount}>
              {categoryStats?.done ?? 0} of {categoryStats?.total ?? list.length}
            </Text>
          </View>
          <ProgressBar value={categoryStats?.total ? (categoryStats.done / categoryStats.total) : 0} />
        </Card>
        <Text style={styles.section}>Scenarios</Text>
        <View>
          {list.map((scenario, index) => {
            const attempt = stats.latest.get(scenario.id);
            return (
              <TimelineItem key={scenario.id} completed={!!attempt} showLine={index < list.length - 1}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })}
                >
                  <Card style={styles.row}>
                    <View style={styles.copy}>
                      <Text style={styles.num}>Scenario {index + 1}</Text>
                      <Text style={styles.title}>{scenario.title}</Text>
                      <Text style={styles.status}>{attempt ? 'Completed' : 'Not started'}</Text>
                    </View>
                    <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} />
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 23, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  loading: { color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
  progressCard: { marginTop: spacing.md },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressTitle: { color: colors.ink, fontWeight: '700' },
  progressCount: { color: colors.primary, fontWeight: '800' },
  section: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  copy: { flex: 1 },
  num: { color: colors.primary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 3 },
  status: { color: colors.muted, fontSize: 12, marginTop: 4 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  notFoundText: { color: colors.ink },
});
