import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/src/server/api/root";
import { createTRPCContext } from "@/src/server/api/context";

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: createTRPCContext,
  });
}

export { handler as GET, handler as POST };
