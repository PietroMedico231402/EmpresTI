import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function reply(status: number, message: string) {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin !== requestUrl.origin) return reply(403, "Origem da solicitação não autorizada.");

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return reply(401, "Entre para enviar convites.");

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants").select("id").eq("slug", "suporte_ti").maybeSingle();
  if (tenantError || !tenant) return reply(403, "Acesso não autorizado.");

  const { data: actor, error: actorError } = await supabase
    .from("memberships").select("id").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
  if (actorError || !actor) return reply(403, "Acesso não autorizado.");

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return reply(400, "Informe e-mail e nome do colaborador.");
  }
  if (!input || typeof input !== "object") return reply(400, "Informe e-mail e nome do colaborador.");

  const fields = input as Record<string, unknown>;
  const email = typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || name.length < 2 || name.length > 120) {
    return reply(400, "Informe um e-mail válido e um nome de 2 a 120 caracteres.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return reply(503, "Convites indisponíveis. Fale com Operações.");
  }

  // O Auth pode aceitar reenviar convites pendentes; confirme a duplicidade antes do envio.
  const pageSize = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) return reply(502, "Não foi possível verificar o convite. Tente novamente.");
    if (data.users.some((existing) => existing.email?.toLowerCase() === email)) {
      return reply(409, "Esta pessoa já possui uma conta.");
    }
    if (data.users.length < pageSize) break;
  }

  const redirectTo = new URL("/auth/confirm", requestUrl.origin).toString();
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo,
  });
  if (inviteError) {
    if (["email_exists", "user_already_exists"].includes(inviteError.code ?? "")) {
      return reply(409, "Esta pessoa já possui uma conta.");
    }
    return reply(502, "Não foi possível enviar o convite. Tente novamente.");
  }
  if (!invitation.user?.id) return reply(502, "Não foi possível concluir o convite.");

  // Protege contra convites concorrentes para o mesmo usuário.
  const { data: existingMembership, error: membershipCheckError } = await admin.from("memberships")
    .select("id").eq("tenant_id", tenant.id).eq("user_id", invitation.user.id).maybeSingle();
  if (membershipCheckError) {
    await admin.auth.admin.deleteUser(invitation.user.id);
    return reply(502, "Não foi possível concluir o convite. Tente novamente.");
  }
  if (existingMembership) return reply(409, "Esta pessoa já possui uma conta.");

  const { error: membershipError } = await admin.from("memberships").insert({
    tenant_id: tenant.id,
    user_id: invitation.user.id,
    role: "COLLABORATOR",
    display_name: name,
  });
  if (membershipError) {
    // O usuário foi criado por este convite. Removê-lo evita uma conta sem
    // membership que bloquearia uma nova tentativa com o mesmo e-mail.
    await admin.auth.admin.deleteUser(invitation.user.id);
    return reply(502, "Não foi possível concluir o convite. Tente novamente.");
  }

  return reply(201, "Convite enviado. A pessoa receberá um link para definir a senha.");
}
