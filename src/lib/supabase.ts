import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

function requireExpoEnv(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be set before the Supabase client can be initialized.`);
  }

  return value;
}

const supabaseUrl = requireExpoEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = requireExpoEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
