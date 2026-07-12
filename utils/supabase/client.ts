import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eygunisvclakxyetlwsf.supabase.co";
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_i7b_hzFbK5Smwilj1aVFMA_nez4VSDm";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
