import { sessionRouter } from "./routers/session";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
