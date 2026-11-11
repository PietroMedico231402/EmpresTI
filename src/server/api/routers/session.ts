import { z } from "zod";

import { createTRPCRouter, tenantProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
  current: tenantProcedure
    .input(z.undefined())
    .query(({ ctx }) => ({
      userId: ctx.user.id,
      membershipId: ctx.membership.id,
      tenantId: ctx.membership.tenantId,
      role: ctx.membership.role,
    })),
});
