import { catalogRouter } from "./routers/catalog";
import { sessionRouter } from "./routers/session";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
