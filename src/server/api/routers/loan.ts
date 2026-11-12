import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { LoanRequestError, requestLoan } from "@/src/server/services/loan-request";
import { createTRPCRouter, tenantProcedure } from "../trpc";

function toTRPCError(error: LoanRequestError) {
  if (error.reason === "EQUIPMENT_UNAVAILABLE") {
    return new TRPCError({ code: "CONFLICT", message: "O equipamento não está disponível." });
  }
  if (error.reason === "LIMIT_REACHED") {
    return new TRPCError({ code: "PRECONDITION_FAILED", message: "O limite de cinco empréstimos em aberto foi atingido." });
  }
  return new TRPCError({ code: "PRECONDITION_FAILED", message: "Existe um empréstimo em atraso." });
}

export const loanRouter = createTRPCRouter({
  listMine: tenantProcedure.query(async ({ ctx }) => {
    const loans = await ctx.prisma.loan.findMany({
      where: { tenantId: ctx.membership.tenantId, borrowerMembershipId: ctx.membership.id, returnedAt: null },
      include: { equipment: { include: { category: { select: { name: true } } } } },
      orderBy: { dueAt: "asc" },
    });
    return loans.map((loan) => ({
      id: loan.id,
      borrowedAt: loan.borrowedAt,
      dueAt: loan.dueAt,
      overdue: loan.dueAt < new Date(),
      equipment: { name: loan.equipment.name, assetTag: loan.equipment.assetTag, category: loan.equipment.category.name },
    }));
  }),

  returnMine: tenantProcedure
    .input(z.object({ loanId: z.string().uuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      const returnedAt = new Date();
      const updated = await ctx.prisma.loan.updateMany({
        where: { id: input.loanId, tenantId: ctx.membership.tenantId, borrowerMembershipId: ctx.membership.id, returnedAt: null },
        data: { returnedAt, returnedByMembershipId: ctx.membership.id },
      });
      if (updated.count !== 1) throw new TRPCError({ code: "NOT_FOUND", message: "Empréstimo em aberto não encontrado." });
      await ctx.prisma.auditLog.create({
        data: { tenantId: ctx.membership.tenantId, actorMembershipId: ctx.membership.id, action: "LOAN_RETURNED", resourceType: "loan", resourceId: input.loanId, metadata: { returnedAt: returnedAt.toISOString() } },
      });
      return { returnedAt };
    }),

  request: tenantProcedure
    .input(z.object({ equipmentId: z.string().uuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (ctx.membership.role !== "COLLABORATOR") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      try {
        return await requestLoan(ctx.prisma, {
          tenantId: ctx.membership.tenantId,
          membershipId: ctx.membership.id,
          equipmentId: input.equipmentId,
        });
      } catch (error) {
        if (error instanceof LoanRequestError) throw toTRPCError(error);
        throw error;
      }
    }),
});
