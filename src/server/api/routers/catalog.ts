import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getCatalogItem, listCatalog } from "@/src/server/services/catalog";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const catalogRouter = createTRPCRouter({
  list: tenantProcedure.input(z.object({
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(100).optional(),
    availability: z.enum(["ALL", "AVAILABLE", "LOANED", "MAINTENANCE", "RETIRED"]).default("ALL"),
  }).default({ availability: "ALL" })).query(({ ctx, input }) =>
    listCatalog(ctx.prisma, ctx.membership.tenantId, input)),

  detail: tenantProcedure.input(z.object({ assetTag: z.string().trim().min(1).max(100) })).query(async ({ ctx, input }) => {
    const item = await getCatalogItem(ctx.prisma, ctx.membership.tenantId, input.assetTag);
    if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Equipamento não encontrado." });
    return item;
  }),
});
