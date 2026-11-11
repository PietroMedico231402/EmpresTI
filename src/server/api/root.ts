import { catalogRouter } from "./routers/catalog";
import { loanRouter } from "./routers/loan";
import { sessionRouter } from "./routers/session";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,
  loan: loanRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
