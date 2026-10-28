import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeStatus } from '../lib/badges';
import { colors, spacing } from '../lib/theme';

function earnedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function BadgeCollection({
  statuses,
  onSelect,
  earnedOnly = false,
  limit,
}: {
  statuses: BadgeStatus[];
  onSelect: (badgeId: string) => void;
  earnedOnly?: boolean;
  limit?: number;
}) {
  const visible = statuses.filter((status) => !earnedOnly || status.earnedAt).slice(0, limit);
  if (!visible.length) {
    return (
      <Text style={styles.empty}>
        {earnedOnly ? 'Complete every scenario in a category to earn your first badge.' : 'No badges to show yet.'}
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {visible.map(({ badge, earnedAt, hint }) => {
        const earned = !!earnedAt;
        const color = earned ? badge.color : colors.muted;
        return (
          <Pressable
            key={badge.id}
            accessibilityRole={earned ? 'button' : undefined}
            accessibilityLabel={earned ? `View ${badge.name}` : `${badge.name}, locked. ${hint}`}
            disabled={!earned}
            onPress={() => onSelect(badge.id)}
            style={({ pressed }) => [styles.row, !earned && styles.locked, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: earned ? '#F7F1DC' : '#EEF1F3' }]}>
              {earned ? (
                <Ionicons name={badge.icon} size={21} color={color} />
              ) : (
                <Ionicons name="lock-closed" size={18} color={colors.muted} />
              )}
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color }]}>{badge.name}</Text>
              <Text style={styles.detail}>{earnedAt ? `Earned ${earnedDate(earnedAt)}` : hint}</Text>
            </View>
            {earned && <Ionicons name="chevron-forward" size={19} color={colors.muted} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locked: { backgroundColor: '#F6F7F8', borderColor: '#E8ECEF' },
  pressed: { opacity: 0.8 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 12, marginTop: 3 },
  empty: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
