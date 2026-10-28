import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ProgressRing } from '../../components/ui';
import { BadgeCollection } from '../../components/BadgeCollection';
import { ProgressSyncNotice } from '../../components/GuestAccountBanner';
import { useAuth } from '../../lib/AuthContext';
import { clearLocalAttempts, computeStats, useAttempts } from '../../lib/attempts';
import { useBadges } from '../../lib/badges';
import { colors, spacing } from '../../lib/theme';

const FEEDBACK_URL = 'https://example.com/ethos-feedback';

export default function Profile() {
  const router = useRouter();
  const { session, signOut, configured, accountError, accountLoading } = useAuth();
  const { attempts, userId, refresh, loading, error } = useAttempts();
  const [signOutError, setSignOutError] = React.useState<string | null>(null);
  const [signingOut, setSigningOut] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const badgeState = useBadges(attempts, userId);
  const stats = computeStats(attempts);
  const name = (session?.user.user_metadata?.display_name as string | undefined) || '';
  const email = session?.user.email;
  const initials = (name || email || 'Guest')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  function confirmReset() {
    setResetError(null);
    Alert.alert(
      'Reset progress on this device?',
      configured && userId
        ? 'This clears the copy saved on this device. Progress saved to your account will still be there.'
        : 'This clears all your saved progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLocalAttempts(userId);
              await refresh();
            } catch (error) {
              setResetError(error instanceof Error ? error.message : 'Unable to clear saved progress.');
            }
          },
        },
      ]
    );
  }

  async function handleSignOut() {
    setSignOutError(null);
    setSigningOut(true);
    try {
      const result = await signOut();
      if (result.error) {
        setSignOutError(result.error);
        return;
      }
      router.replace('/login');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR ETHOS ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>
        <ProgressSyncNotice message={error ?? accountError ?? signOutError ?? resetError} />
        {accountLoading && <Text style={styles.loading}>Syncing your account profile…</Text>}
        {loading && <Text style={styles.loading}>Loading your progress…</Text>}

        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials || 'G'}</Text>
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{name || (email ? 'Ethos learner' : 'Guest')}</Text>
              <Text style={styles.sub}>{email ?? 'Progress is saved on this device only.'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.progressRow}>
            <ProgressRing
              value={stats.totalScenarios ? stats.totalDone / stats.totalScenarios : 0}
              size={84}
              strokeWidth={8}
              label="complete"
            />
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.totalDone}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.totalDone === 0 ? '—' : `${stats.percent}%`}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
            </View>
          </View>
        </Card>

        <Text style={styles.section}>My Badges</Text>
        {badgeState.loading && <Text style={styles.badgeLoading}>Loading your badges…</Text>}
        <ProgressSyncNotice message={badgeState.error} />
        <BadgeCollection
          statuses={badgeState.statuses}
          onSelect={(badgeId) => router.push({ pathname: '/badge/[id]', params: { id: badgeId } })}
        />

        <Text style={styles.section}>Account settings</Text>
        <View style={styles.actions}>
          <Button label="Send feedback" variant="ghost" onPress={() => Linking.openURL(FEEDBACK_URL)} />
          <Button label="Reset progress on this device" variant="ghost" onPress={confirmReset} />
          {signingOut ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
          ) : (
            <Button label={session ? 'Sign out' : 'Back to sign in'} onPress={() => void handleSignOut()} />
          )}
        </View>

        <Card style={styles.noteCard}>
          <View style={styles.noteHeading}>
            <Ionicons name="information-circle-outline" size={19} color={colors.primary} />
            <Text style={styles.noteTitle}>A note about Ethos</Text>
          </View>
          <Text style={styles.footer}>
            Ethos is a training tool. The scenarios encourage reflection and do not replace your school or employer&apos;s
            official policies.
          </Text>
        </Card>
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
  badgeLoading: { color: colors.muted, marginBottom: spacing.md },
  profileCard: { marginTop: spacing.md },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.primary, fontSize: 21, fontWeight: '800' },
  nameBlock: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  stat: { alignItems: 'center', minWidth: 90 },
  statNum: { fontSize: 23, fontWeight: '800', color: colors.ink },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statDivider: { height: 36, width: 1, backgroundColor: colors.border },
  section: { fontSize: 19, fontWeight: '800', color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  actions: { gap: spacing.sm },
  noteCard: { marginTop: spacing.lg, backgroundColor: '#F9FCFD' },
  noteHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  noteTitle: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  footer: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
});
