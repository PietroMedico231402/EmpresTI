const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function validateRuntimeDatabaseUrl(
  value: string | undefined,
  environment: string | undefined = process.env.NODE_ENV,
) {
  if (!value) throw new Error("DATABASE_URL ausente.");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL inválida.");
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL deve usar PostgreSQL.");
  }

  if (environment !== "production") {
    if (!localHosts.has(url.hostname) || url.port !== "54322") {
      throw new Error("O desenvolvimento deve usar somente o Supabase local na porta 54322.");
    }
    return value;
  }

  const validProductionPool = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname)
    && url.port === "6543"
    && url.searchParams.get("pgbouncer") === "true"
    && url.searchParams.get("connection_limit") === "1";

  if (!validProductionPool) {
    throw new Error("DATABASE_URL de produção deve usar o Supavisor transacional na porta 6543.");
  }

  return value;
}

export function runtimeDatabaseUrl() {
  return validateRuntimeDatabaseUrl(process.env.DATABASE_URL);
}
