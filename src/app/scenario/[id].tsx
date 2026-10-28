import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, ChoiceOption, PrimaryButton, ProgressBar, SecondaryButton } from '../../components/ui';
import { ProgressSyncNotice } from '../../components/GuestAccountBanner';
import { categories, getScenario, scenarios, scenariosFor } from '../../data/scenarios';
import { computeStats, recordAttempt, useAttempts } from '../../lib/attempts';
import { useAuth } from '../../lib/AuthContext';
import { colors, spacing } from '../../lib/theme';

const verdicts = [
  { title: 'Consider another approach', color: colors.bad, icon: 'close' as const, state: 'bad' as const },
  { title: 'A thoughtful start', color: colors.mid, icon: 'remove' as const, state: 'mid' as const },
  { title: 'Strong choice', color: colors.good, icon: 'checkmark' as const, state: 'good' as const },
];

export default function ScenarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { attempts, refresh, error: progressError } = useAttempts();
  const [answer, setAnswer] = useState<{ scenarioId: string; choiceIndex: number } | null>(null);
  const [savingScenarioId, setSavingScenarioId] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const scenario = id ? getScenario(id) : undefined;
  const selected = answer?.scenarioId === id ? answer.choiceIndex : null;
  const saving = savingScenarioId === id;

  if (!scenario) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Scenario not found.</Text>
      </View>
    );
  }

  const currentScenario = scenario;
  const category = categories.find((item) => item.id === currentScenario.category);
  const categoryScenarios = scenariosFor(currentScenario.category);
  const index = categoryScenarios.findIndex((item) => item.id === currentScenario.id);
  const overallIndex = scenarios.findIndex((item) => item.id === currentScenario.id);
  const latest = computeStats(attempts).latest;
  const categoryComplete = categoryScenarios.every((item) => latest.has(item.id));
  const answered = selected !== null;

  async function choose(choiceIndex: number) {
    if (answered || saving) return;
    setAnswerError(null);
    setAnswer({ scenarioId: currentScenario.id, choiceIndex });
    setSavingScenarioId(currentScenario.id);
    try {
      await recordAttempt(session?.user.id, {
        scenarioId: currentScenario.id,
        choiceIndex,
        score: currentScenario.choices[choiceIndex].score,
        at: new Date().toISOString(),
      });
      await refresh();
      const completeAfterAnswer = categoryScenarios.every(
        (item) => item.id === currentScenario.id || latest.has(item.id)
      );
      if (completeAfterAnswer) {
        router.replace({ pathname: '/results/[category]', params: { category: currentScenario.category } });
      }
    } catch (error) {
      setAnswerError(error instanceof Error ? error.message : 'Your answer could not sync. It remains saved on this device.');
    } finally {
      setSavingScenarioId((current) => (current === currentScenario.id ? null : current));
    }
  }

  function navigateToScenario(nextId: string) {
    router.replace({ pathname: '/scenario/[id]', params: { id: nextId } });
  }

  function goPrevious() {
    const previous = categoryScenarios[index - 1];
    if (previous) navigateToScenario(previous.id);
  }

  function goNext() {
    const next = categoryScenarios[index + 1];
    if (next) navigateToScenario(next.id);
  }

  function finishCategory() {
    router.replace({ pathname: '/results/[category]', params: { category: currentScenario.category } });
  }

  function goToUnanswered() {
    const unanswered = categoryScenarios.find((item) => !latest.has(item.id));
    if (unanswered) navigateToScenario(unanswered.id);
    else finishCategory();
  }

  function closeScenario() {
    if (router.canGoBack()) router.back();
    else router.replace('/learn');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={closeScenario} style={styles.closeButton}>
            <Text style={styles.closeText}>CLOSE</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Scenario</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.counterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous scenario"
            disabled={index === 0}
            onPress={goPrevious}
            style={styles.chevron}
          >
            <Ionicons name="chevron-back" size={20} color={index === 0 ? colors.border : colors.primary} />
          </Pressable>
          <Text style={styles.counter}>
            {overallIndex + 1} <Text style={styles.counterTotal}>/ {scenarios.length}</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next scenario"
            disabled={index === categoryScenarios.length - 1}
            onPress={goNext}
            style={styles.chevron}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={index === categoryScenarios.length - 1 ? colors.border : colors.primary}
            />
          </Pressable>
        </View>
        <ProgressBar value={scenarios.length ? (overallIndex + 1) / scenarios.length : 0} />

        <Text style={styles.category}>{category?.name ?? 'Professional judgment'}</Text>
        <Text style={styles.title}>{currentScenario.title}</Text>
        <Text style={styles.situation}>{currentScenario.situation}</Text>

        <ProgressSyncNotice message={answerError ?? progressError} />
        <Text style={styles.prompt}>{answered ? 'How each choice plays out' : 'What would you do?'}</Text>
        {saving && <Text style={styles.saving}>Saving your answer…</Text>}
        <View style={styles.choices}>
          {currentScenario.choices.map((choice, choiceIndex) => {
            const isSelected = selected === choiceIndex;
            const verdict = verdicts[choice.score];
            return (
              <ChoiceOption
                key={`${currentScenario.id}-${choiceIndex}`}
                state={answered ? verdict.state : 'default'}
                disabled={answered || saving}
                onPress={() => void choose(choiceIndex)}
              >
                <View style={styles.choiceHeading}>
                  <Text style={styles.choiceText}>{choice.text}</Text>
                  {answered && <Ionicons name={verdict.icon} size={19} color={verdict.color} />}
                </View>
                {answered && (
                  <View style={styles.feedback}>
                    <Text style={[styles.verdictLabel, { color: verdict.color }]}>
                      {isSelected ? `Your choice · ${verdict.title}` : verdict.title}
                    </Text>
                    <Text style={styles.explanation}>{choice.explanation}</Text>
                  </View>
                )}
              </ChoiceOption>
            );
          })}
        </View>

        {answered && (
          <View style={styles.afterAnswer}>
            <Card style={styles.principleCard}>
              <View style={styles.principleHeading}>
                <Ionicons name="compass-outline" size={18} color={colors.primary} />
                <Text style={styles.principleLabel}>Key principle</Text>
              </View>
              <Text style={styles.principle}>{currentScenario.principle}</Text>
            </Card>
            {index < categoryScenarios.length - 1 ? (
              <PrimaryButton label="Next scenario" onPress={goNext} />
            ) : categoryComplete ? (
              <PrimaryButton label="View results" onPress={finishCategory} />
            ) : (
              <PrimaryButton label="Next scenario" onPress={goToUnanswered} />
            )}
            <SecondaryButton
              label="Try this one again"
              onPress={() => {
                setAnswerError(null);
                setAnswer(null);
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  closeButton: { width: 58, minHeight: 40, justifyContent: 'center' },
  closeText: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 58 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  chevron: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  counter: { minWidth: 48, textAlign: 'center', color: colors.primary, fontSize: 16, fontWeight: '800' },
  counterTotal: { color: colors.muted, fontWeight: '600' },
  category: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: spacing.lg, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { color: colors.ink, fontSize: 25, lineHeight: 31, fontWeight: '800', marginTop: spacing.xs },
  situation: { color: colors.ink, fontSize: 17, lineHeight: 26, fontWeight: '600', marginTop: spacing.md },
  prompt: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.sm },
  saving: { color: colors.muted, fontSize: 13, marginBottom: spacing.sm },
  choices: { gap: spacing.sm },
  choiceHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  choiceText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  feedback: { borderTopWidth: 1, borderTopColor: '#00000012', marginTop: spacing.sm, paddingTop: spacing.sm },
  verdictLabel: { fontSize: 13, fontWeight: '800' },
  explanation: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
  afterAnswer: { marginTop: spacing.lg, gap: spacing.sm },
  principleCard: { borderColor: colors.primaryTint, backgroundColor: '#F9FCFD' },
  principleHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  principleLabel: { color: colors.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  principle: { color: colors.ink, fontSize: 15, fontWeight: '600', marginTop: spacing.xs, lineHeight: 22 },
  notFound: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  notFoundText: { color: colors.ink },
});
