import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { badges, BadgeDefinition } from '../data/badges';
import { scenarios, CategoryId } from '../data/scenarios';
import { Attempt, computeStats } from './attempts';
import { supabase } from './supabase';

export type EarnedBadge = { badgeId: string; earnedAt: string };
export type BadgeStatus = {
  badge: BadgeDefinition;
  earnedAt: string | null;
  remaining: number;
  hint: string;
};
export type BadgeLoad = { earned: EarnedBadge[]; error: string | null };

const keyFor = (userId?: string) => `ethos.badges.v1.${userId ?? 'guest'}`;

function earnedFromAttempts(attempts: Attempt[]): EarnedBadge[] {
  const firstAnswerByScenario = new Map<string, string>();
  for (const attempt of attempts) {
    const previous = firstAnswerByScenario.get(attempt.scenarioId);
    if (!previous || Date.parse(attempt.at) < Date.parse(previous)) {
      firstAnswerByScenario.set(attempt.scenarioId, attempt.at);
    }
  }
  return badges.flatMap((badge) => {
    const categoryScenarios =
      badge.category === 'all'
        ? scenarios
        : scenarios.filter((scenario) => scenario.category === badge.category);
    if (
      !categoryScenarios.length ||
      !categoryScenarios.every((scenario) => firstAnswerByScenario.has(scenario.id))
    ) {
      return [];
    }
    const lastFirstAnswer = Math.max(
      ...categoryScenarios.map((scenario) => Date.parse(firstAnswerByScenario.get(scenario.id) ?? ''))
    );
    const earnedAt = Number.isFinite(lastFirstAnswer) ? new Date(lastFirstAnswer).toISOString() : '';
    return earnedAt ? [{ badgeId: badge.id, earnedAt }] : [];
  });
}

function mergeEarned(...lists: EarnedBadge[][]) {
  const byId = new Map<string, EarnedBadge>();
  for (const earnedList of lists) {
    for (const earned of earnedList) {
      if (!byId.has(earned.badgeId)) byId.set(earned.badgeId, earned);
    }
  }
  return badges.flatMap((badge) => {
    const earned = byId.get(badge.id);
    return earned ? [earned] : [];
  });
}

async function loadLocal(userId?: string): Promise<EarnedBadge[]> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) throw new Error('Stored badge collection is not a list.');
    return value as EarnedBadge[];
  } catch (error) {
    throw new Error(`Unable to read saved badges: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function saveLocal(userId: string | undefined, earned: EarnedBadge[]) {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(earned));
}

function syncError(message: string) {
  return /network|fetch|timeout|offline/i.test(message)
    ? 'Badges could not sync while offline. They are still available from this device.'
    : `Badges could not sync: ${message}`;
}

export async function loadBadges(userId: string | undefined, attempts: Attempt[]): Promise<BadgeLoad> {
  let localAccount: EarnedBadge[];
  let localGuest: EarnedBadge[];
  try {
    [localAccount, localGuest] = await Promise.all([
      loadLocal(userId),
      userId ? loadLocal() : Promise.resolve([]),
    ]);
  } catch (error) {
    return {
      earned: mergeEarned(earnedFromAttempts(attempts)),
      error: error instanceof Error ? error.message : 'Unable to read saved badges.',
    };
  }

  const earnedByAttempts = earnedFromAttempts(attempts);
  if (!supabase || !userId) {
    const earned = mergeEarned(localAccount, earnedByAttempts);
    try {
      await saveLocal(userId, earned);
    } catch (error) {
      return {
        earned,
        error: `Badges are available, but the device cache could not update: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
    return { earned, error: null };
  }

  const { data, error } = await supabase
    .from('badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: true });

  if (error || !data) {
    const earned = mergeEarned(localAccount, localGuest, earnedByAttempts);
    try {
      await saveLocal(userId, earned);
    } catch (storageError) {
      return {
        earned,
        error: `Badges could not sync, and the device cache could not update: ${
          storageError instanceof Error ? storageError.message : String(storageError)
        }`,
      };
    }
    return {
      earned,
      error: syncError(error?.message ?? 'No badge data was returned.'),
    };
  }

  const remote: EarnedBadge[] = data.map((row) => ({ badgeId: row.badge_id, earnedAt: row.earned_at }));
  const existing = new Set(remote.map((earned) => earned.badgeId));
  const pending = mergeEarned(localAccount, localGuest, earnedByAttempts).filter(
    (earned) => !existing.has(earned.badgeId)
  );

  const withPending = mergeEarned(remote, pending);
  try {
    await saveLocal(userId, withPending);
  } catch (storageError) {
    return {
      earned: withPending,
      error: `Badges are available, but the device cache could not update: ${
        storageError instanceof Error ? storageError.message : String(storageError)
      }`,
    };
  }

  if (pending.length) {
    const { error: insertError } = await supabase.from('badges').insert(
      pending.map((earned) => ({
        user_id: userId,
        badge_id: earned.badgeId,
        earned_at: earned.earnedAt,
      }))
    );
    if (insertError) {
      return {
        earned: mergeEarned(remote, pending),
        error: syncError(insertError.message),
      };
    }
  }

  const earned = mergeEarned(remote, pending);
  try {
    await saveLocal(userId, earned);
    if (localGuest.length) await AsyncStorage.removeItem(keyFor());
  } catch (error) {
    return {
      earned,
      error: `Badges are synced, but the device cache could not update: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
  return { earned, error: null };
}

export function useBadges(attempts: Attempt[], userId?: string) {
  const [loadedState, setLoadedState] = useState<{
    attempts: Attempt[];
    userId?: string;
    result: BadgeLoad;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void loadBadges(userId, attempts).then(
      (result) => {
        if (!active) return;
        setLoadedState({ attempts, userId, result });
      },
      (loadError: unknown) => {
        if (!active) return;
        setLoadedState({
          attempts,
          userId,
          result: {
            earned: earnedFromAttempts(attempts),
            error: loadError instanceof Error ? loadError.message : 'Unable to load badges.',
          },
        });
      }
    );
    return () => {
      active = false;
    };
  }, [attempts, userId]);

  const currentState =
    loadedState?.attempts === attempts && loadedState.userId === userId ? loadedState.result : null;
  const earned = currentState?.earned ?? [];
  const stats = computeStats(attempts);
  const statuses: BadgeStatus[] = badges.map((badge) => {
    const categoryStats =
      badge.category === 'all'
        ? { total: stats.totalScenarios, done: stats.totalDone }
        : stats.perCategory.find((category) => category.id === badge.category);
    const done = categoryStats?.done ?? 0;
    const total = categoryStats?.total ?? 0;
    const remaining = Math.max(0, total - done);
    const earnedAt = earned.find((earnedBadge) => earnedBadge.badgeId === badge.id)?.earnedAt ?? null;
    const hint = remaining === 0 ? 'Ready to earn' : `Finish ${remaining} more ${remaining === 1 ? 'scenario' : 'scenarios'}`;
    return { badge, earnedAt, remaining, hint };
  });

  return { earned, statuses, loading: currentState === null, error: currentState?.error ?? null };
}

export function badgeForCategory(category: CategoryId): BadgeDefinition {
  const badge = badges.find((item) => item.category === category);
  if (!badge) throw new Error(`No badge is defined for category ${category}.`);
  return badge;
}

export function badgeEarnedDate(earned: EarnedBadge[], badgeId: string) {
  return earned.find((badge) => badge.badgeId === badgeId)?.earnedAt ?? null;
}
