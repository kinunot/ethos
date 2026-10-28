import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { categories, scenarios, CategoryId } from '../data/scenarios';

export type Attempt = {
  scenarioId: string;
  choiceIndex: number;
  score: number;
  at: string;
};

export type AttemptsLoad = { attempts: Attempt[]; error: string | null };

const keyFor = (userId?: string) => `ethos.attempts.v1.${userId ?? 'guest'}`;

async function loadLocal(userId?: string): Promise<Attempt[]> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Stored progress is not a list.');
    return parsed as Attempt[];
  } catch (error) {
    throw new Error(`Unable to read saved progress: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function saveLocal(userId: string | undefined, attempts: Attempt[]) {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(attempts));
}

function fingerprint(attempt: Attempt) {
  return `${attempt.scenarioId}|${attempt.choiceIndex}|${attempt.score}|${Date.parse(attempt.at)}`;
}

function mergeAttempts(...lists: Attempt[][]) {
  const seen = new Set<string>();
  const merged: Attempt[] = [];
  for (const attempt of lists.flat()) {
    const key = fingerprint(attempt);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(attempt);
    }
  }
  return merged.sort((first, second) => Date.parse(first.at) - Date.parse(second.at));
}

function networkMessage(message: string) {
  return /network|fetch|timeout|offline/i.test(message)
    ? 'No connection to Ethos right now. Your progress is saved on this device and will sync when you are back online.'
    : `Progress could not sync: ${message}`;
}

export async function loadAttempts(userId?: string): Promise<AttemptsLoad> {
  let localAccount: Attempt[];
  let guest: Attempt[];
  try {
    [localAccount, guest] = await Promise.all([loadLocal(userId), userId ? loadLocal() : Promise.resolve([])]);
  } catch (error) {
    return { attempts: [], error: error instanceof Error ? error.message : 'Unable to read saved progress.' };
  }

  if (!supabase || !userId) return { attempts: mergeAttempts(localAccount, guest), error: null };

  const { data, error } = await supabase
    .from('attempts')
    .select('scenario_id, choice_index, score, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return {
      attempts: mergeAttempts(localAccount, guest),
      error: networkMessage(error?.message ?? 'No progress was returned.'),
    };
  }

  const remote = data.map((row) => ({
    scenarioId: row.scenario_id,
    choiceIndex: row.choice_index,
    score: row.score,
    at: row.created_at,
  }));
  const remoteKeys = new Set(remote.map(fingerprint));
  const pending = mergeAttempts(localAccount, guest).filter((attempt) => !remoteKeys.has(fingerprint(attempt)));

  if (pending.length) {
    const { error: syncError } = await supabase.from('attempts').insert(
      pending.map((attempt) => ({
        user_id: userId,
        scenario_id: attempt.scenarioId,
        choice_index: attempt.choiceIndex,
        score: attempt.score,
        created_at: attempt.at,
      }))
    );
    if (syncError) {
      return {
        attempts: mergeAttempts(remote, pending),
        error: networkMessage(syncError.message),
      };
    }
  }

  const attempts = mergeAttempts(remote, pending);
  try {
    await saveLocal(userId, attempts);
    if (guest.length) await AsyncStorage.removeItem(keyFor());
  } catch (storageError) {
    return {
      attempts,
      error: `Progress is synced, but the device cache could not update: ${
        storageError instanceof Error ? storageError.message : String(storageError)
      }`,
    };
  }
  return { attempts, error: null };
}

export async function recordAttempt(userId: string | undefined, attempt: Attempt) {
  const local = await loadLocal(userId);
  await saveLocal(userId, [...local, attempt]);

  if (supabase && userId) {
    const { error } = await supabase.from('attempts').insert({
      user_id: userId,
      scenario_id: attempt.scenarioId,
      choice_index: attempt.choiceIndex,
      score: attempt.score,
      created_at: attempt.at,
    });
    if (error) throw new Error(networkMessage(error.message));
  }
}

export async function clearLocalAttempts(userId?: string) {
  await AsyncStorage.removeItem(keyFor(userId));
}

/** Latest attempt per scenario. */
export function latestByScenario(attempts: Attempt[]): Map<string, Attempt> {
  const map = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const previous = map.get(attempt.scenarioId);
    if (!previous || previous.at <= attempt.at) map.set(attempt.scenarioId, attempt);
  }
  return map;
}

export type CategoryStats = {
  id: CategoryId;
  total: number;
  done: number;
  points: number;
  maxPoints: number;
};

export function computeStats(attempts: Attempt[]) {
  const latest = latestByScenario(attempts);
  const perCategory: CategoryStats[] = categories.map((category) => {
    const inCategory = scenarios.filter((scenario) => scenario.category === category.id);
    const done = inCategory.filter((scenario) => latest.has(scenario.id));
    return {
      id: category.id,
      total: inCategory.length,
      done: done.length,
      points: done.reduce((sum, scenario) => sum + (latest.get(scenario.id)?.score ?? 0), 0),
      maxPoints: done.length * 2,
    };
  });
  const totalDone = perCategory.reduce((sum, category) => sum + category.done, 0);
  const points = perCategory.reduce((sum, category) => sum + category.points, 0);
  const maxPoints = perCategory.reduce((sum, category) => sum + category.maxPoints, 0);
  return {
    latest,
    perCategory,
    totalDone,
    totalScenarios: scenarios.length,
    points,
    maxPoints,
    percent: maxPoints === 0 ? 0 : Math.round((points / maxPoints) * 100),
  };
}

/** Loads cloud progress when signed in and keeps the local cache as an offline fallback. */
export function useAttempts() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadAttempts(userId);
      setAttempts(result.attempts);
      setError(result.error);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load progress.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { attempts, loading, error, refresh, userId };
}
