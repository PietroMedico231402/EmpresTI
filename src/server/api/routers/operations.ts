import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, operationsProcedure } from "../trpc";

export const operationsRouter = createTRPCRouter({
  listCategories: operationsProcedure.query(({ ctx }) => ctx.prisma.equipmentCategory.findMany({
    where: { tenantId: ctx.membership.tenantId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })),

  createEquipment: operationsProcedure
    .input(z.object({
      name: z.string().trim().min(2).max(120),
      assetTag: z.string().trim().min(2).max(100),
      categoryId: z.string().uuid(),
      pickupLocation: z.string().trim().min(2).max(120),
      status: z.enum(["AVAILABLE", "MAINTENANCE"]),
      notes: z.string().trim().max(2_000).optional(),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.equipmentCategory.findFirst({
        where: { id: input.categoryId, tenantId: ctx.membership.tenantId }, select: { id: true },
      });
      if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "Categoria inválida." });
      try {
        const equipment = await ctx.prisma.equipment.create({
          data: { tenantId: ctx.membership.tenantId, categoryId: category.id, name: input.name, assetTag: input.assetTag, pickupLocation: input.pickupLocation, status: input.status, notes: input.notes || null },
        });
        await ctx.prisma.auditLog.create({
          data: { tenantId: ctx.membership.tenantId, actorMembershipId: ctx.membership.id, action: "EQUIPMENT_CREATED", resourceType: "equipment", resourceId: equipment.id, metadata: { assetTag: equipment.assetTag } },
        });
        return equipment;
      } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe um equipamento com esse patrimônio." });
        }
        throw error;
      }
    }),

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
