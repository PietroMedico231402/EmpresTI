import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicSupabaseConfig } from "./config";

export function createAdminClient() {
  const { url } = publicSupabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Chave administrativa do Supabase ausente.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
