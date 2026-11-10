export function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) throw new Error("Configuração pública do Supabase ausente.");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL pública do Supabase inválida.");
  }

  if (process.env.NODE_ENV === "development" && !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
    throw new Error("O desenvolvimento deve usar somente o Supabase local.");
  }

  return { url, key };
}
