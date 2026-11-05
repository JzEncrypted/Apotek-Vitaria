/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://fmhmzmdyejmefztsmrjl.supabase.co';
const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG16bWR5ZWptZWZ6dHNtcmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MTc4MDIsImV4cCI6MjEwOTI5MzgwMn0.aWLRyuI0AWSpy7B-8v74rUDupmKMW-homXIsGhdTcOE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Trigger official Supabase Google OAuth Sign-in
 */
export async function signInWithGoogleOAuth() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.warn('Supabase Google OAuth direct redirect fallback:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
