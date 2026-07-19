import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Bersihkan whitespace/newline tersembunyi yang kadang ikut ter-copy-paste
const url = rawUrl ? rawUrl.trim() : rawUrl;
const anonKey = rawKey ? rawKey.trim() : rawKey;

// Kalau env belum diisi, jangan crash saat build — beri pesan jelas saat dipakai.
export const supabase = (url && anonKey)
  ? createClient(url, anonKey)
  : null;

export function isSupabaseConfigured() {
  return !!supabase;
}

// Untuk membantu diagnosa dari browser console (F12) tanpa membocorkan key penuh
export function debugSupabaseEnv() {
  return {
    urlPresent: !!url,
    urlPreview: url ? url.slice(0, 25) + "..." : null,
    keyPresent: !!anonKey,
    keyLength: anonKey ? anonKey.length : 0,
  };
}
