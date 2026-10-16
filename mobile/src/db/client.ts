/**
 * Supabase client.
 *
 * One client for both data (`supabase.from(...)`) and auth (`supabase.auth.*`). The backend is
 * tinbase, which speaks the Supabase API, so nothing here is vendor-specific — the same code runs
 * against Supabase itself.
 *
 * WHY THERE IS NO ADAPTER LAYER
 * This template previously went through @vibecode-db/client, choosing between a mock adapter and a
 * Supabase adapter at runtime, with the schema duplicated in TypeScript. That indirection is gone:
 * the schema lives in supabase/migrations/*.sql and is applied to a real database, so there is one
 * way to reach data and it behaves the same in development and production.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from './types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  // Warn rather than throw: the app should still boot and render, so a missing key shows up as
  // failing queries you can see rather than a white screen before the first frame.
  console.warn('[db] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set — data calls will fail.');
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // AsyncStorage on native, where there is no window. NOT on web: the web
    // bundle is also evaluated in Node — the dev server bundles it at boot, and
    // AsyncStorage reaches for `window` the moment Supabase restores a session,
    // which throws `ReferenceError: window is not defined` and takes the whole
    // dev server down before it ever listens. Leaving storage undefined lets
    // Supabase fall back to localStorage in the browser and to an in-memory
    // store under Node, where neither path touches `window` at import time.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No OAuth redirect flow in this app — sessions come from the auth screens.
    detectSessionInUrl: false,
  },
});
