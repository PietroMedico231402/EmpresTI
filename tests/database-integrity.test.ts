// @vitest-environment node

import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const directUrl = process.env.DIRECT_URL;

if (directUrl) {
  const url = new URL(directUrl);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.port !== "54322"
  ) {
    throw new Error("Os testes de banco só podem acessar o Supabase local na porta 54322.");
  }
}

const prisma = directUrl
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: directUrl }) })
  : undefined;

type Tx = Prisma.TransactionClient;

type Fixture = {
  tenantA: string;
  tenantB: string;
  userA: string;
  userB: string;
  memberA: string;
  memberB: string;
  categoryA: string;
  categoryB: string;
  equipmentA: string;
  equipmentB: string;
};

async function fixture(tx: Tx): Promise<Fixture> {
  const ids = {
    tenantA: randomUUID(),
    tenantB: randomUUID(),
    userA: randomUUID(),
    userB: randomUUID(),
    memberA: randomUUID(),
    memberB: randomUUID(),
    categoryA: randomUUID(),
    categoryB: randomUUID(),
    equipmentA: randomUUID(),
    equipmentB: randomUUID(),
  };

  await tx.tenant.createMany({
    data: [
      { id: ids.tenantA, slug: `test-a-${ids.tenantA}`, name: "Tenant A" },
      { id: ids.tenantB, slug: `test-b-${ids.tenantB}`, name: "Tenant B" },
    ],
  });
  await tx.$executeRaw`INSERT INTO auth.users (id) VALUES (${ids.userA}::uuid), (${ids.userB}::uuid)`;
  await tx.membership.createMany({
    data: [
      { id: ids.memberA, tenantId: ids.tenantA, userId: ids.userA, role: "OPERATIONS", displayName: "Operações A" },
      { id: ids.memberB, tenantId: ids.tenantB, userId: ids.userB, role: "COLLABORATOR", displayName: "Colaborador B" },
    ],
  });
  await tx.equipmentCategory.createMany({
    data: [
      { id: ids.categoryA, tenantId: ids.tenantA, name: "Notebook" },
      { id: ids.categoryB, tenantId: ids.tenantB, name: "Notebook" },
    ],
  });
  await tx.equipment.createMany({
    data: [
      { id: ids.equipmentA, tenantId: ids.tenantA, categoryId: ids.categoryA, name: "Item A", assetTag: "TEST-001", pickupLocation: "Balcão" },
      { id: ids.equipmentB, tenantId: ids.tenantB, categoryId: ids.categoryB, name: "Item B", assetTag: "TEST-001", pickupLocation: "Balcão" },
    ],
  });
  return ids;
}

async function withRollback(check: (tx: Tx) => Promise<void>) {
  const rollback = new Error("rollback test fixture");
  try {
    await prisma!.$transaction(async (tx) => {
      await check(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

async function expectDatabaseRejection(tx: Tx, statement: () => Promise<unknown>) {
  await tx.$executeRawUnsafe("SAVEPOINT expected_rejection");
  let rejected = false;
  try {
    await statement();
  } catch {
    rejected = true;
  }
  await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT expected_rejection");
  await tx.$executeRawUnsafe("RELEASE SAVEPOINT expected_rejection");
  expect(rejected).toBe(true);
}

async function asUser<T>(tx: Tx, userId: string, query: () => Promise<T>): Promise<T> {
  await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`;
  await tx.$executeRawUnsafe("SET LOCAL ROLE authenticated");
  return query();
}

describe.skipIf(!prisma)("integridade e RLS no PostgreSQL local", () => {
  afterAll(async () => prisma?.$disconnect());

  it("test_ca_02_isola_patrimonio_e_categoria_por_tenant", async () => {
    await withRollback(async (tx) => {
      const ids = await fixture(tx);
      expect(await tx.equipment.count({ where: { assetTag: "TEST-001" } })).toBe(2);

      await expectDatabaseRejection(tx, () => tx.equipment.create({
        data: { tenantId: ids.tenantA, categoryId: ids.categoryA, name: "Duplicado", assetTag: "TEST-001", pickupLocation: "Balcão" },
      }));
      await expectDatabaseRejection(tx, () => tx.equipment.create({
        data: { tenantId: ids.tenantA, categoryId: ids.categoryB, name: "Categoria cruzada", assetTag: "TEST-002", pickupLocation: "Balcão" },
      }));
    });
  });

  it("test_ca_03_impede_dois_emprestimos_abertos_do_mesmo_item", async () => {
    await withRollback(async (tx) => {
      const ids = await fixture(tx);
      const first = await tx.loan.create({
        data: { tenantId: ids.tenantA, equipmentId: ids.equipmentA, borrowerMembershipId: ids.memberA, dueAt: new Date(Date.now() + 86_400_000) },
      });
      await expectDatabaseRejection(tx, () => tx.loan.create({
        data: { tenantId: ids.tenantA, equipmentId: ids.equipmentA, borrowerMembershipId: ids.memberA, dueAt: new Date(Date.now() + 86_400_000) },
      }));
      await tx.loan.update({ where: { id: first.id }, data: { returnedAt: new Date(), returnedByMembershipId: ids.memberA } });
      await tx.loan.create({
        data: { tenantId: ids.tenantA, equipmentId: ids.equipmentA, borrowerMembershipId: ids.memberA, dueAt: new Date(Date.now() + 86_400_000) },
      });
      expect(await tx.loan.count({ where: { equipmentId: ids.equipmentA, returnedAt: null } })).toBe(1);
    });
  });

  it("test_ca_04_05_deriva_atraso_e_preserva_devolucao", async () => {
    await withRollback(async (tx) => {
      const ids = await fixture(tx);
      const borrowedAt = new Date(Date.now() - 30 * 86_400_000);
      const loan = await tx.loan.create({
        data: { tenantId: ids.tenantA, equipmentId: ids.equipmentA, borrowerMembershipId: ids.memberA, borrowedAt, dueAt: new Date() },
      });
      expect(loan.dueAt.getTime()).toBeGreaterThan(borrowedAt.getTime());
      const open = await tx.$queryRaw<Array<{ overdue: boolean }>>`SELECT returned_at IS NULL AND due_at < now() AS overdue FROM public.loans WHERE id = ${loan.id}::uuid`;
      expect(open[0].overdue).toBe(true);

      await expectDatabaseRejection(tx, () => tx.loan.update({ where: { id: loan.id }, data: { returnedAt: new Date() } }));
      const returnedAt = new Date();
      await tx.loan.update({ where: { id: loan.id }, data: { returnedAt, returnedByMembershipId: ids.memberA } });
      const closed = await tx.$queryRaw<Array<{ overdue: boolean }>>`SELECT returned_at IS NULL AND due_at < now() AS overdue FROM public.loans WHERE id = ${loan.id}::uuid`;
      expect(closed[0].overdue).toBe(false);
      await expectDatabaseRejection(tx, () => tx.loan.update({ where: { id: loan.id }, data: { returnedAt: new Date(returnedAt.getTime() + 1000) } }));
    });
  });

  it("test_ca_04_calcula_14_dias_uteis_no_fuso_de_sao_paulo", async () => {
    await withRollback(async (tx) => {
      const ids = await fixture(tx);
      const cases = [
        { borrowedAt: "2026-11-06T15:00:00Z", dueAt: "2026-11-28T02:59:59.999Z" },
        { borrowedAt: "2026-11-07T02:30:00Z", dueAt: "2026-11-28T02:59:59.999Z" },
        { borrowedAt: "2026-03-19T15:00:00Z", dueAt: "2026-04-10T02:59:59.999Z" },
        { borrowedAt: "2026-12-18T15:00:00Z", dueAt: "2027-01-12T02:59:59.999Z" },
      ];

      for (const { borrowedAt, dueAt } of cases) {
        const loan = await tx.loan.create({
          data: {
            tenantId: ids.tenantA,
            equipmentId: ids.equipmentA,
            borrowerMembershipId: ids.memberA,
            borrowedAt: new Date(borrowedAt),
            dueAt: new Date(borrowedAt),
          },
        });
        expect(loan.dueAt.toISOString()).toBe(dueAt);
        const [exact] = await tx.$queryRaw<Array<{ exact: boolean }>>`
          SELECT due_at = (${dueAt.replace(".999Z", ".999999Z")}::timestamptz) AS exact
          FROM public.loans WHERE id = ${loan.id}::uuid
        `;
        expect(exact.exact).toBe(true);
        await tx.loan.update({
          where: { id: loan.id },
          data: { returnedAt: new Date("2027-02-01T00:00:00Z"), returnedByMembershipId: ids.memberA },
        });
      }
    });
  });

  it("test_ca_07_mantem_auditoria_append_only", async () => {
    await withRollback(async (tx) => {
      const ids = await fixture(tx);
      const audit = await tx.auditLog.create({
        data: { tenantId: ids.tenantA, actorMembershipId: ids.memberA, action: "TEST", resourceType: "equipment", resourceId: ids.equipmentA },
      });
      await expectDatabaseRejection(tx, () => tx.auditLog.update({ where: { id: audit.id }, data: { action: "CHANGED" } }));
      await expectDatabaseRejection(tx, () => tx.auditLog.delete({ where: { id: audit.id } }));
      expect(await tx.auditLog.count({ where: { id: audit.id } })).toBe(1);
    });
  });

  it("test_ca_06_10_impede_leitura_entre_tenants_por_rls", async () => {
    await withRollback(async (tx) => {
      const ids = await fixture(tx);
      await tx.loan.createMany({
        data: [
          { tenantId: ids.tenantA, equipmentId: ids.equipmentA, borrowerMembershipId: ids.memberA, dueAt: new Date(Date.now() + 86_400_000) },
          { tenantId: ids.tenantB, equipmentId: ids.equipmentB, borrowerMembershipId: ids.memberB, dueAt: new Date(Date.now() + 86_400_000) },
        ],
      });
      const a = await asUser(tx, ids.userA, async () => ({
        tenants: await tx.tenant.findMany(),
        equipment: await tx.equipment.findMany(),
        loans: await tx.loan.findMany(),
      }));
      expect(a.tenants.map((tenant) => tenant.id)).toEqual([ids.tenantA]);
      expect(a.equipment.map((item) => item.id)).toEqual([ids.equipmentA]);
      expect(a.loans).toHaveLength(1);
      await tx.$executeRawUnsafe("RESET ROLE");

      const b = await asUser(tx, ids.userB, async () => ({
        tenants: await tx.tenant.findMany(),
        equipment: await tx.equipment.findMany(),
        loans: await tx.loan.findMany(),
      }));
      expect(b.tenants.map((tenant) => tenant.id)).toEqual([ids.tenantB]);
      expect(b.equipment.map((item) => item.id)).toEqual([ids.equipmentB]);
      expect(b.loans).toHaveLength(1);
    });
  });
});
