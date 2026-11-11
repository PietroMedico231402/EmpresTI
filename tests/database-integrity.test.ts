import "dotenv/config";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const client = new Client({ connectionString: process.env.DIRECT_URL });

describe("integridade do modelo", () => {
  beforeAll(async () => client.connect());
  afterAll(async () => client.end());

  it("test_ca_02_e_ca_03_rejeita_patrimonio_duplicado_e_dois_emprestimos_abertos", async () => {
    await client.query("begin");
    try {
      const tenant = await client.query("insert into public.tenants (slug, name) values ('teste-integridade', 'Teste') returning id");
      const tenantId = tenant.rows[0].id;
      const category = await client.query("insert into public.equipment_categories (tenant_id, name) values ($1, 'Notebook') returning id", [tenantId]);
      const categoryId = category.rows[0].id;
      const equipment = await client.query("insert into public.equipment (tenant_id, category_id, name, asset_tag, pickup_location) values ($1, $2, 'Teste', 'TEST-001', 'Help Desk') returning id", [tenantId, categoryId]);
      const equipmentId = equipment.rows[0].id;
      await client.query("savepoint duplicate_asset");
      await expect(client.query("insert into public.equipment (tenant_id, category_id, name, asset_tag, pickup_location) values ($1, $2, 'Outro', 'TEST-001', 'Help Desk')", [tenantId, categoryId])).rejects.toMatchObject({ code: "23505" });
      await client.query("rollback to savepoint duplicate_asset");

      const user = await client.query("insert into auth.users (id) values (gen_random_uuid()) returning id");
      const membership = await client.query("insert into public.memberships (tenant_id, user_id, display_name) values ($1, $2, 'Teste') returning id", [tenantId, user.rows[0].id]);
      await client.query("insert into public.loans (tenant_id, equipment_id, borrower_membership_id, due_at) values ($1, $2, $3, now() + interval '1 day')", [tenantId, equipmentId, membership.rows[0].id]);
      await client.query("savepoint duplicate_open_loan");
      await expect(client.query("insert into public.loans (tenant_id, equipment_id, borrower_membership_id, due_at) values ($1, $2, $3, now() + interval '1 day')", [tenantId, equipmentId, membership.rows[0].id])).rejects.toMatchObject({ code: "23505" });
      await client.query("rollback to savepoint duplicate_open_loan");
    } finally { await client.query("rollback"); }
  }, 30_000);
});
