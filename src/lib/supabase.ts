import { createClient } from "@supabase/supabase-js";

let supabaseClientInstance: ReturnType<typeof createClient> | null = null;

/**
 * Lazily initializes and retrieves the Supabase client.
 * This pattern ensures that the app doesn't crash on startup if environment variables are not set yet.
 */
export function getSupabase() {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  // Support both Vite prefixed variables for client-side and process.env for server-side / build-time
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are missing. " +
      "Supabase integration is configured, but will operate in offline/mock mode until configured."
    );
    return null;
  }

  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClientInstance;
}
