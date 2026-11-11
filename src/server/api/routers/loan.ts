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
