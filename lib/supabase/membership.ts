import type { SupabaseClient } from "@supabase/supabase-js";

export type MembershipRole = "COLLABORATOR" | "OPERATIONS";

export type InitialMembership = {
  id: string;
  tenantId: string;
  userId: string;
  role: MembershipRole;
};

function isMembershipRole(value: unknown): value is MembershipRole {
  return value === "COLLABORATOR" || value === "OPERATIONS";
}

export async function getInitialMembership(
  supabase: SupabaseClient,
  userId: string,
): Promise<InitialMembership | null> {
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", "suporte_ti")
    .maybeSingle();
  if (tenantError || !tenant?.id) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("id, role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError || !membership?.id || !isMembershipRole(membership.role)) return null;

  return {
    id: membership.id,
    tenantId: tenant.id,
    userId,
    role: membership.role,
  };
}

export async function hasInitialMembership(supabase: SupabaseClient, userId: string) {
  return Boolean(await getInitialMembership(supabase, userId));
}
