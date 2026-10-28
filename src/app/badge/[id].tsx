import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Button } from '../../components/ui';
import { ProgressSyncNotice } from '../../components/GuestAccountBanner';
import { badges } from '../../data/badges';
import { computeStats, useAttempts } from '../../lib/attempts';
import { useAuth } from '../../lib/AuthContext';
import { badgeEarnedDate, useBadges } from '../../lib/badges';
import { colors, spacing } from '../../lib/theme';

function CertificateArtwork({ color }: { color: string }) {
  return (
    <Svg width={168} height={148} viewBox="0 0 168 148">
      <Circle cx="84" cy="69" r="60" fill="#F7F1DC" />
      <Polygon points="51,98 74,100 66,144 49,130 31,139 40,99" fill={color} opacity={0.88} />
      <Polygon points="94,100 117,98 128,139 109,130 92,144 86,100" fill={color} opacity={0.68} />
      <Circle cx="84" cy="61" r="41" fill={colors.card} stroke={color} strokeWidth="4" />
      <Path
        d="M84 30l8 17 19 3-14 13 3 19-16-9-17 9 4-19-14-13 19-3z"
        fill={color}
      />
      <Path d="M68 64l11 11 22-25" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="18" y="24" width="9" height="9" rx="2" fill={color} opacity={0.45} transform="rotate(-18 18 24)" />
      <Rect x="138" y="28" width="8" height="8" rx="2" fill={colors.accent} transform="rotate(18 138 28)" />
    </Svg>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function filenamePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function BadgeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { attempts, loading: attemptsLoading, error: attemptsError, userId } = useAttempts();
  const badgeState = useBadges(attempts, userId);
  const certificateRef = useRef<React.ElementRef<typeof View>>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const badge = badges.find((item) => item.id === id);
  const earnedAt = badge ? badgeEarnedDate(badgeState.earned, badge.id) : null;
  const isLoading = attemptsLoading || badgeState.loading;
  const stats = computeStats(attempts);
  const score =
    badge?.category === 'all'
      ? { points: stats.points, maxPoints: stats.maxPoints }
      : stats.perCategory.find((item) => item.id === badge?.category);
  const displayName =
    (session?.user.user_metadata?.display_name as string | undefined) ||
    session?.user.email ||
    'Guest learner';

  async function captureCertificate() {
    if (!certificateRef.current) throw new Error('The certificate is not ready to capture yet.');
    return captureRef(certificateRef.current, {
      format: 'png',
      quality: 1,
      result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
    });
  }

  async function saveToDevice() {
    setBusy('save');
    setMessage(null);
    setPermissionDenied(false);
    try {
      const uri = await captureCertificate();
      if (Platform.OS === 'web') {
        const anchor = document.createElement('a');
        anchor.href = uri;
        anchor.download = `${filenamePart(badge?.name ?? 'ethos-badge')}-certificate.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setMessage('Your badge certificate has been downloaded.');
        return;
      }

      const permission = await requestPermissionsAsync(true, ['photo']);
      if (permission.status !== 'granted') {
        setPermissionDenied(true);
        setMessage('Photo access is off. Open settings to allow Ethos to save your badge certificate.');
        return;
      }
      await Asset.create(uri);
      setMessage('Your badge certificate was saved to your photo gallery.');
    } catch (error) {
      setMessage(error instanceof Error ? `Could not save your badge: ${error.message}` : 'Could not save your badge. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function shareBadge() {
    setBusy('share');
    setMessage(null);
    try {
      if (Platform.OS === 'web') {
        const available = await Sharing.isAvailableAsync();
        const dataUri = await captureCertificate();
        if (available && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
          const blob = await (await fetch(dataUri)).blob();
          const file = new File([blob], `${filenamePart(badge?.name ?? 'ethos-badge')}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: badge?.name ?? 'Ethos badge' });
            return;
          }
        }
        setMessage('Sharing is not available in this browser. Use Save to device to download the certificate.');
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setMessage('Sharing is not available on this device.');
        return;
      }
      const uri = await captureCertificate();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share ${badge?.name ?? 'your Ethos badge'}`,
      });
    } catch (error) {
      setMessage(error instanceof Error ? `Could not share your badge: ${error.message}` : 'Could not share your badge. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function openSettings() {
    try {
      await Linking.openSettings();
    } catch (error) {
      setMessage(error instanceof Error ? `Could not open settings: ${error.message}` : 'Could not open device settings.');
    }
  }

  if (!badge) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Badge not found</Text>
          <Button label="Back to profile" onPress={() => router.replace('/profile')} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loading}>Loading your badge…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!earnedAt) {
    const status = badgeState.statuses.find((item) => item.badge.id === badge.id);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="lock-closed" size={40} color={colors.muted} />
          <Text style={styles.title}>Badge not earned yet</Text>
          <Text style={styles.copy}>{status?.hint ?? 'Complete the related scenarios to earn this badge.'}</Text>
          <ProgressSyncNotice message={attemptsError ?? badgeState.error} />
          <Button label="Back to profile" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR ETHOS ACHIEVEMENT</Text>
        <Text style={styles.title}>My Badge</Text>
        <ProgressSyncNotice message={attemptsError ?? badgeState.error} />

        <View ref={certificateRef} collapsable={false} style={styles.certificate}>
          <View style={styles.certificateBorder}>
            <Text style={styles.certificateKicker}>CERTIFICATE OF ACHIEVEMENT</Text>
            <View style={styles.artwork}>
              <CertificateArtwork color={badge.color} />
            </View>
            <Text style={styles.certificateLabel}>This badge is awarded to</Text>
            <Text style={styles.recipient} numberOfLines={2}>{displayName}</Text>
            <View style={[styles.rule, { backgroundColor: badge.color }]} />
            <Text style={[styles.badgeName, { color: badge.color }]}>{badge.name}</Text>
            <Text style={styles.description}>{badge.description}</Text>
            <View style={styles.certificateFooter}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>DATE EARNED</Text>
                <Text style={styles.footerValue}>{formatDate(earnedAt)}</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>CATEGORY SCORE</Text>
                <Text style={styles.footerValue}>
                  {score ? `${score.points} of ${score.maxPoints} points` : '—'}
                </Text>
              </View>
            </View>
            <Text style={styles.brand}>ETHOS · PROFESSIONAL JUDGMENT</Text>
          </View>
        </View>

        {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
        <View style={styles.actions}>
          <Button
            label={busy === 'save' ? 'Saving…' : 'Save to device'}
            onPress={() => void saveToDevice()}
            disabled={!!busy}
          />
          {permissionDenied && Platform.OS !== 'web' ? (
            <Button label="Open settings" variant="ghost" onPress={() => void openSettings()} disabled={!!busy} />
          ) : null}
          <Button
            label={busy === 'share' ? 'Preparing…' : 'Share'}
            variant="ghost"
            onPress={() => void shareBadge()}
            disabled={!!busy}
          />
          <Button label="Back to profile" variant="ghost" onPress={() => router.back()} disabled={!!busy} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, alignItems: 'center', padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  eyebrow: { alignSelf: 'stretch', color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { alignSelf: 'stretch', color: colors.ink, fontSize: 30, fontWeight: '800', marginBottom: spacing.md },
  loading: { color: colors.muted, marginTop: spacing.sm },
  copy: { color: colors.muted, textAlign: 'center', lineHeight: 22 },
  certificate: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D9CBA6',
  },
  certificateBorder: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: '#E8DDBD',
    borderRadius: 12,
    backgroundColor: '#FFFDF8',
  },
  certificateKicker: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textAlign: 'center' },
  artwork: { height: 148, marginTop: spacing.xs, alignItems: 'center', justifyContent: 'center' },
  certificateLabel: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
  recipient: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: spacing.xs },
  rule: { width: '45%', height: 2, marginVertical: spacing.md, borderRadius: 1 },
  badgeName: { fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 27 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: spacing.xs },
  certificateFooter: { width: '100%', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  footerItem: { flex: 1, alignItems: 'center' },
  footerLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textAlign: 'center' },
  footerValue: { color: colors.ink, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
  brand: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: spacing.lg },
  message: { width: '100%', maxWidth: 430, color: colors.ink, textAlign: 'center', lineHeight: 21, marginTop: spacing.md },
  actions: { width: '100%', maxWidth: 430, gap: spacing.sm, marginTop: spacing.md },
});
