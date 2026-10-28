import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { buttonRadius, colors, radius, spacing } from '../lib/theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ActionButtonProps = PressableProps & { label: string };

export function PrimaryButton({ label, ...rest }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        styles.buttonPrimary,
        pressed && { opacity: 0.85 },
        rest.disabled && { opacity: 0.5 },
      ]}
      {...rest}
    >
      <Text style={styles.buttonPrimaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, ...rest }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        styles.buttonSecondary,
        pressed && { opacity: 0.85 },
        rest.disabled && { opacity: 0.5 },
      ]}
      {...rest}
    >
      <Text style={styles.buttonSecondaryText}>{label}</Text>
    </Pressable>
  );
}

export function TertiaryButton({ label, ...rest }: ActionButtonProps) {
  return (
    <Pressable accessibilityRole="button" style={styles.tertiary} {...rest}>
      <Text style={styles.tertiaryText}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  variant = 'primary',
  ...rest
}: PressableProps & { label: string; variant?: 'primary' | 'ghost' }) {
  return variant === 'ghost' ? (
    <SecondaryButton label={label} {...rest} />
  ) : (
    <PrimaryButton label={label} {...rest} />
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={styles.barTrack}
    >
      <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export function ProgressRing({
  value,
  size = 112,
  strokeWidth = 10,
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          fill="none"
          stroke={colors.primaryTint}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          fill="none"
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringValue}>{Math.round(pct * 100)}%</Text>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

export function TimelineItem({
  completed,
  showLine = true,
  children,
}: {
  completed: boolean;
  showLine?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.timeline}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, completed && styles.timelineDotDone]}>
          {completed && <Ionicons name="checkmark" size={13} color={colors.card} />}
        </View>
        {showLine && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineContent}>{children}</View>
    </View>
  );
}

export function ChoiceOption({
  children,
  state = 'default',
  ...rest
}: PressableProps & { children: React.ReactNode; state?: 'default' | 'good' | 'mid' | 'bad' }) {
  const stateStyle =
    state === 'good'
      ? styles.choiceGood
      : state === 'mid'
        ? styles.choiceMid
        : state === 'bad'
          ? styles.choiceBad
          : null;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.choice,
        stateStyle,
        pressed && { opacity: 0.88 },
        rest.disabled && { opacity: 1 },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: '#153041',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    minHeight: 52,
    borderRadius: buttonRadius,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary },
  buttonPrimaryText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  buttonSecondaryText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  tertiary: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  tertiaryText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  barTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primaryTint,
    overflow: 'hidden',
  },
  barFill: { height: 7, backgroundColor: colors.primary, borderRadius: 4 },
  ringValue: { color: colors.ink, fontSize: 25, fontWeight: '800' },
  ringLabel: { color: colors.muted, fontSize: 12, marginTop: 1 },
  timeline: { flexDirection: 'row', alignItems: 'stretch' },
  timelineRail: { width: 30, alignItems: 'center' },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDone: { backgroundColor: colors.good, borderColor: colors.good },
  timelineLine: {
    flex: 1,
    minHeight: spacing.md,
    borderLeftWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  timelineContent: { flex: 1, paddingBottom: spacing.sm, paddingLeft: spacing.xs },
  choice: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  choiceGood: { backgroundColor: colors.goodBg, borderColor: colors.good },
  choiceMid: { backgroundColor: colors.midBg, borderColor: colors.mid },
  choiceBad: { backgroundColor: colors.badBg, borderColor: colors.bad },
});
