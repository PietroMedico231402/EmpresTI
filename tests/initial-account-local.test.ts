// @vitest-environment node

import { randomBytes, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { ensureEquipment, ensureIdentity } from "../scripts/operator-initial-data";

const directUrl = process.env.DIRECT_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (directUrl) {
  const url = new URL(directUrl);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.port !== "54322") {
    throw new Error("O teste de Auth só pode acessar o Supabase local.");
  }
}
const localUrl = "http://127.0.0.1:54321";

describe.skipIf(!directUrl || !serviceKey)("provisionamento da conta no Supabase local", () => {
  it("test_ca_01_ca_04_publicacao_dos_equipamentos_preserva_ids_na_reexecucao", async () => {
    const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
    const admin = createClient(localUrl, serviceKey!, options);
    const tenantId = await ensureEquipment(admin);
    const first = await admin.from("equipment").select("id,asset_tag").eq("tenant_id", tenantId).order("asset_tag");
    expect(first.error).toBeNull();
    expect(first.data).toHaveLength(12);
    expect(await ensureEquipment(admin)).toBe(tenantId);
    const second = await admin.from("equipment").select("id,asset_tag").eq("tenant_id", tenantId).order("asset_tag");
    expect(second.error).toBeNull();
    expect(second.data).toEqual(first.data);
  }, 120_000);

  it("test_ca_03_ca_04_login_real_e_membership_idempotente_sem_emprestimos", async () => {
    const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
    const admin = createClient(localUrl, serviceKey!, options);
    const login = createClient(localUrl, serviceKey!, options);
    const tenantResult = await admin.from("tenants").select("id").eq("slug", "suporte_ti").single();
    expect(tenantResult.error).toBeNull();
    const tenantId = tenantResult.data!.id as string;
    const fixtureEmail = `test-initial-${randomUUID()}@example.invalid`;
    const password = randomBytes(32).toString("base64url");
    let userId: string | undefined;
    try {
      const first = await ensureIdentity(admin, login, {
        tenantId, email: fixtureEmail, displayName: "Conta de Teste Inicial", password,
      });
      const second = await ensureIdentity(admin, login, {
        tenantId, email: fixtureEmail, displayName: "Conta de Teste Inicial", password,
      });
      expect(second).toBe(first);
      const memberships = await admin.from("memberships").select("id,user_id,role,display_name")
        .eq("tenant_id", tenantId).eq("id", first);
      expect(memberships.error).toBeNull();
      expect(memberships.data).toHaveLength(1);
      expect(memberships.data![0]).toMatchObject({ role: "COLLABORATOR", display_name: "Conta de Teste Inicial" });
      userId = memberships.data![0].user_id as string;
      const loans = await admin.from("loans").select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId).eq("borrower_membership_id", first);
      expect(loans.error).toBeNull();
      expect(loans.count).toBe(0);
    } finally {
      if (!userId) {
        const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        userId = listed.data.users.find((user) => user.email === fixtureEmail)?.id;
      }
      if (userId) {
        await admin.from("memberships").delete().eq("tenant_id", tenantId).eq("user_id", userId);
        await admin.auth.admin.deleteUser(userId);
      }
    }
  }, 120_000);
});
