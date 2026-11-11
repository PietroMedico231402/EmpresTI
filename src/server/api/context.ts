import type { User } from "@supabase/supabase-js";

import { getInitialMembership, type InitialMembership } from "@/lib/supabase/membership";
import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/src/server/db";

export type TRPCContext = {
  prisma: ReturnType<typeof getPrisma>;
  user: User | null;
  membership: InitialMembership | null;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  const prisma = getPrisma();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return { prisma, user: null, membership: null };

  const membership = await getInitialMembership(supabase, user.id);
  return { prisma, user, membership };
}
