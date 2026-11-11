import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.membership || ctx.membership.userId !== ctx.user.id) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, membership: ctx.membership } });
});

export const operationsProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (ctx.membership.role !== "OPERATIONS") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
