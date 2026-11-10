import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasInitialMembership(supabase: SupabaseClient, userId: string) {
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", "suporte_ti")
    .maybeSingle();
  if (tenantError || !tenant) return false;

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("user_id", userId)
    .maybeSingle();

  return !membershipError && Boolean(membership);
}
