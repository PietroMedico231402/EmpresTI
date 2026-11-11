import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, operationsProcedure } from "../trpc";

export const operationsRouter = createTRPCRouter({
  listOpenLoans: operationsProcedure.query(async ({ ctx }) => {
    const loans = await ctx.prisma.loan.findMany({
      where: { tenantId: ctx.membership.tenantId, returnedAt: null },
      include: {
        borrower: { select: { displayName: true } },
        equipment: { select: { name: true, assetTag: true } },
      },
      orderBy: { dueAt: "asc" },
    });

    return loans.map((loan) => ({
      id: loan.id,
      borrower: loan.borrower.displayName,
      equipment: loan.equipment.name,
      assetTag: loan.equipment.assetTag,
      borrowedAt: loan.borrowedAt,
      dueAt: loan.dueAt,
      overdue: loan.dueAt < new Date(),
    }));
  }),

  returnLoan: operationsProcedure
    .input(z.object({ loanId: z.string().uuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      const returnedAt = new Date();
      const updated = await ctx.prisma.loan.updateMany({
        where: { id: input.loanId, tenantId: ctx.membership.tenantId, returnedAt: null },
        data: { returnedAt, returnedByMembershipId: ctx.membership.id },
      });
      if (updated.count !== 1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empréstimo em aberto não encontrado." });
      }

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.membership.tenantId,
          actorMembershipId: ctx.membership.id,
          action: "LOAN_RETURNED",
          resourceType: "loan",
          resourceId: input.loanId,
          metadata: { returnedAt: returnedAt.toISOString() },
        },
      });
      return { returnedAt };
    }),
});
