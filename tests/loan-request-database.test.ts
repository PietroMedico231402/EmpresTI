// @vitest-environment node

import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { requestLoan } from "../src/server/services/loan-request";

const directUrl = process.env.DIRECT_URL;
if (directUrl) {
  const url = new URL(directUrl);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.port !== '54322') {
    throw new Error("Os testes de empréstimo só podem acessar o Supabase local na porta 54322.");
  }
}

const prisma = directUrl ? new PrismaClient({ adapter: new PrismaPg({ connectionString: directUrl }) }) : undefined;
type Tx = Prisma.TransactionClient;

async function withRollback(check: (tx: Tx) => Promise<void>) {
  const rollback = new Error("rollback loan request test");
  try {
    await prisma!.$transaction(async (tx) => { await check(tx); throw rollback; });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe.skipIf(!prisma)("solicitação no PostgreSQL local", () => {
  afterAll(async () => prisma?.$disconnect());

  it("test_ca_03_09_grava_emprestimo_prazo_e_auditoria_atomicamente", async () => {
    await withRollback(async (tx) => {
      const tenantId = randomUUID();
      const userId = randomUUID();
      const membershipId = randomUUID();
      const categoryId = randomUUID();
      const equipmentId = randomUUID();
      await tx.tenant.create({ data: { id: tenantId, slug: `loan-${tenantId}`, name: "Loan test" } });
      await tx.$executeRaw`INSERT INTO auth.users (id) VALUES (${userId}::uuid)`;
      await tx.membership.create({ data: { id: membershipId, tenantId, userId, role: "COLLABORATOR", displayName: "Test user" } });
      await tx.equipmentCategory.create({ data: { id: categoryId, tenantId, name: "Notebook" } });
      await tx.equipment.create({ data: { id: equipmentId, tenantId, categoryId, name: "Notebook test", assetTag: `TEST-${equipmentId}`, pickupLocation: "Balcão" } });

      const transactionProxy = { $transaction: async (operation: (client: Tx) => Promise<unknown>) => operation(tx) } as unknown as PrismaClient;
      const loan = await requestLoan(transactionProxy, { tenantId, membershipId, equipmentId });

      expect(loan.dueAt.getTime()).toBeGreaterThan(loan.borrowedAt.getTime());
      await expect(tx.auditLog.count({ where: { tenantId, resourceId: loan.id, action: "LOAN_CREATED" } })).resolves.toBe(1);
      await expect(requestLoan(transactionProxy, { tenantId, membershipId, equipmentId })).rejects.toMatchObject({ reason: "EQUIPMENT_UNAVAILABLE" });
      await expect(tx.loan.count({ where: { tenantId, equipmentId, returnedAt: null } })).resolves.toBe(1);
    });
  });
});
