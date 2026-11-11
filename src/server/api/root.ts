import { catalogRouter } from "./routers/catalog";
import { loanRouter } from "./routers/loan";
import { operationsRouter } from "./routers/operations";
import { sessionRouter } from "./routers/session";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,
  loan: loanRouter,
  operations: operationsRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
