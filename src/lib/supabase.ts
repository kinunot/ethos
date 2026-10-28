import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function stripSurroundingQuotes(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  return (first === '"' && last === '"') || (first === "'" && last === "'")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

const url = stripSurroundingQuotes(process.env.EXPO_PUBLIC_SUPABASE_URL);
const anonKey = stripSurroundingQuotes(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

function getUrlProblem(value: string) {
  if (!value) return 'is missing';
  if (value.toUpperCase().includes('YOUR-')) return 'is still a placeholder';
  try {
    const parsed = new URL(value);
    if (!parsed.hostname) return 'has no hostname';
    if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') return null;
    if (parsed.protocol !== 'https:') return 'must use https:// (except http://localhost for local Supabase)';
    if (!parsed.hostname.includes('.')) return 'has an invalid hostname';
    return null;
  } catch {
    return 'is not a valid URL';
  }
}

const invalidVariables: string[] = [];
const urlProblem = getUrlProblem(url);
if (urlProblem) invalidVariables.push(`EXPO_PUBLIC_SUPABASE_URL ${urlProblem}`);
if (!anonKey) invalidVariables.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is missing');
else if (anonKey.toUpperCase().includes('YOUR-')) {
  invalidVariables.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is still a placeholder');
}

export const supabaseConfigError = invalidVariables.length
  ? `Account services are unavailable: ${invalidVariables.join(' and ')}. Add the value${invalidVariables.length > 1 ? 's' : ''} without quotes or spaces around = in the project-root .env file, then restart Expo.`
  : null;

if (supabaseConfigError) {
  console.warn(`[Ethos] ${supabaseConfigError}`);
}

const serverStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};
const authStorage =
  Platform.OS === 'web' && typeof window === 'undefined' ? serverStorage : AsyncStorage;

export const supabase: SupabaseClient | null =
  !supabaseConfigError && url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: authStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
