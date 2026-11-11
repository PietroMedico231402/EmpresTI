import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/src/generated/prisma/client";

import { runtimeDatabaseUrl } from "./runtime-database-url";

const globalDatabase = globalThis as unknown as { empresTiPrisma?: PrismaClient };

export function getPrisma() {
  if (!globalDatabase.empresTiPrisma) {
    globalDatabase.empresTiPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: runtimeDatabaseUrl() }),
    });
  }

  return globalDatabase.empresTiPrisma;
}
