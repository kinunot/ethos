import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from './ui';
import { useAuth } from '../lib/AuthContext';
import { colors, spacing } from '../lib/theme';

export function GuestAccountBanner() {
  const { guest } = useAuth();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (!guest || dismissed) return null;

  return (
    <Card style={styles.banner}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss account reminder"
        onPress={() => setDismissed(true)}
        style={styles.close}
      >
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
      <View style={styles.copy}>
        <Ionicons name="cloud-upload-outline" size={21} color={colors.primary} />
        <Text style={styles.message}>Create a free account to save your progress and badges.</Text>
      </View>
      <Button label="Create account" onPress={() => router.push('/login')} />
    </Card>
  );
}

export function ProgressSyncNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <Ionicons name="cloud-offline-outline" size={19} color={colors.mid} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { marginBottom: spacing.md, borderColor: colors.primaryTint, backgroundColor: '#F8FCFD' },
  close: { position: 'absolute', right: spacing.sm, top: spacing.sm, zIndex: 1, padding: 4 },
  copy: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingRight: spacing.lg, marginBottom: spacing.sm },
  message: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.midBg,
  },
  noticeText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
});
