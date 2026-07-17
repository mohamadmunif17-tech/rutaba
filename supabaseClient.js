import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Kalau env belum diisi, jangan crash saat build — beri pesan jelas saat dipakai.
export const supabase = (url && anonKey)
  ? createClient(url, anonKey)
  : null;

export function isSupabaseConfigured() {
  return !!supabase;
}
