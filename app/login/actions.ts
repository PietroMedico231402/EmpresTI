"use server";

import { createClient } from "@/lib/supabase/server";
import { hasInitialMembership } from "@/lib/supabase/membership";

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  if (!email.trim() || !password) return { error: "Informe e-mail e senha." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error?.code === "email_provider_disabled") {
    return { error: "Login por e-mail indisponível. Fale com Operações." };
  }
  if (error || !data.user) return { error: "E-mail ou senha inválidos." };

  if (!await hasInitialMembership(supabase, data.user.id)) {
    await supabase.auth.signOut();
    return { error: "Acesso não autorizado. Fale com Operações." };
  }

  return {};
}
