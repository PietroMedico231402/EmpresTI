import type { PrismaClient } from "@/src/generated/prisma/client";

export type LoanRequestErrorCode = "EQUIPMENT_UNAVAILABLE" | "LIMIT_REACHED" | "OVERDUE_LOAN";

export class LoanRequestError extends Error {
  constructor(readonly reason: LoanRequestErrorCode) {
    super(reason);
    this.name = "LoanRequestError";
  }
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function requestLoan(
  prisma: PrismaClient,
  input: { tenantId: string; membershipId: string; equipmentId: string },
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const lockedMembership = await tx.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM public.memberships
        WHERE tenant_id = ${input.tenantId}::uuid
          AND id = ${input.membershipId}::uuid
        FOR UPDATE
      `;
      if (lockedMembership.length !== 1) throw new LoanRequestError("EQUIPMENT_UNAVAILABLE");

      const equipment = await tx.equipment.findFirst({
        where: { id: input.equipmentId, tenantId: input.tenantId },
        select: { id: true, status: true },
      });
      if (!equipment || equipment.status !== "AVAILABLE") {
        throw new LoanRequestError("EQUIPMENT_UNAVAILABLE");
      }

      const equipmentOpenLoan = await tx.loan.findFirst({
        where: { tenantId: input.tenantId, equipmentId: equipment.id, returnedAt: null },
        select: { id: true },
      });
      if (equipmentOpenLoan) throw new LoanRequestError("EQUIPMENT_UNAVAILABLE");

      const openLoanCount = await tx.loan.count({
        where: { tenantId: input.tenantId, borrowerMembershipId: input.membershipId, returnedAt: null },
      });
      if (openLoanCount >= 5) throw new LoanRequestError("LIMIT_REACHED");

      const overdueLoan = await tx.loan.findFirst({
        where: {
          tenantId: input.tenantId,
          borrowerMembershipId: input.membershipId,
          returnedAt: null,
          dueAt: { lt: new Date() },
        },
        select: { id: true },
      });
      if (overdueLoan) throw new LoanRequestError("OVERDUE_LOAN");

      const loan = await tx.loan.create({
        data: {
          tenantId: input.tenantId,
          equipmentId: equipment.id,
          borrowerMembershipId: input.membershipId,
          // The database trigger replaces this required Prisma value with the
          // 14th business-day deadline derived from borrowedAt.
          dueAt: new Date(0),
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: input.tenantId,
          actorMembershipId: input.membershipId,
          action: "LOAN_CREATED",
          resourceType: "loan",
          resourceId: loan.id,
          metadata: { equipmentId: equipment.id },
        },
      });

      return loan;
    });
  } catch (error) {
    if (error instanceof LoanRequestError) throw error;
    if (isUniqueConstraintError(error)) throw new LoanRequestError("EQUIPMENT_UNAVAILABLE");
    throw error;
  }
}
