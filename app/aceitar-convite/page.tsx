"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { hasInitialMembership } from "@/lib/supabase/membership";

export default function AcceptInvitePage() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabaseRef.current = supabase;
    async function checkInvite() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const allowed = !authError && user && await hasInitialMembership(supabase, user.id);
      if (active) setState(allowed ? "ready" : "invalid");
    }
    void checkInvite();
    return () => { active = false; supabaseRef.current = null; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    const confirmation = String(values.get("confirmation") ?? "");
    if (password.length < 8 || password !== confirmation) {
      setError("Use pelo menos 8 caracteres e repita a mesma senha.");
      return;
    }

    setPending(true);
    const supabase = supabaseRef.current;
    if (!supabase) {
      setError("Convite não disponível. Reabra o link recebido.");
      setPending(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Não foi possível definir a senha. Peça um novo convite se o link expirou.");
      setPending(false);
      return;
    }
    router.replace("/catalogo");
    router.refresh();
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <section className="w-full max-w-sm rounded-xl border border-[#222c4a] bg-[#0b1128] p-8">
        <h1 className="text-2xl font-semibold text-foreground">Aceitar convite</h1>
        {state === "checking" && <p role="status" className="mt-5 text-sm text-[#9aa3bc]">Conferindo convite...</p>}
        {state === "invalid" && (
          <div className="mt-5 space-y-4 text-sm text-[#9aa3bc]">
            <p role="alert">Convite inválido ou expirado. Peça um novo convite a um membro da equipe.</p>
            <Link href="/login" className="inline-block text-[#b4c6f6] hover:text-foreground">Voltar ao login</Link>
          </div>
        )}
        {state === "ready" && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <p className="text-sm text-[#9aa3bc]">Defina uma senha para entrar no EmpresTI.</p>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmar senha</Label>
              <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={pending} className="h-10 w-full">
              {pending ? "Salvando..." : "Definir senha"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
