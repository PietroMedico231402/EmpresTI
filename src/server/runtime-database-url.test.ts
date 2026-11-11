import { describe, expect, it } from "vitest";

import { validateRuntimeDatabaseUrl } from "./runtime-database-url";

describe("configuração da conexão de runtime", () => {
  it("test_ca_09_aceita_apenas_supabase_local_fora_de_producao", () => {
    const local = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
    expect(validateRuntimeDatabaseUrl(local, "development")).toBe(local);
    expect(() => validateRuntimeDatabaseUrl(
      "postgresql://postgres:secret@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
      "development",
    )).toThrow("somente o Supabase local");
  });

  it("test_ca_09_exige_pool_transacional_em_producao", () => {
    const pooled = "postgresql://postgres.ref:secret@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
    expect(validateRuntimeDatabaseUrl(pooled, "production")).toBe(pooled);
    expect(() => validateRuntimeDatabaseUrl(
      "postgresql://postgres:secret@db.ref.supabase.co:5432/postgres",
      "production",
    )).toThrow("Supavisor transacional");
  });
});
