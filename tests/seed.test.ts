import "dotenv/config";

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const connectionString = process.env.DIRECT_URL;
const client = new Client({ connectionString });
const require = createRequire(import.meta.url);

describe("seed local", () => {
  beforeAll(async () => {
    if (!connectionString) throw new Error("DIRECT_URL is required for local database tests.");
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("test_ca_08_reexecuta_sem_duplicar_tenant_ou_categorias", () => {
    const tsx = require.resolve("tsx/cli");
    execFileSync(process.execPath, [tsx, "prisma/seed.ts"], { stdio: "pipe" });
    execFileSync(process.execPath, [tsx, "prisma/seed.ts"], { stdio: "pipe" });

    return Promise.all([
      client.query("select count(*)::int as count from public.tenants where slug = 'suporte_ti'"),
      client.query("select count(*)::int as count from public.equipment_categories c join public.tenants t on t.id = c.tenant_id where t.slug = 'suporte_ti'"),
    ]).then(([tenants, categories]) => {
      expect(tenants.rows[0].count).toBe(1);
      expect(categories.rows[0].count).toBe(5);
    });
  }, 30_000);
});
