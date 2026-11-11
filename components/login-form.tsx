"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) { setError("E-mail ou senha inválidos."); return; }
    router.push("/catalogo");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-xs font-normal text-[#9aa3bc]">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nome@empresa.com.br"
          required
          className="h-[42px] rounded-lg border-[#2b3450] bg-[#0b1128] px-3 text-[13px] text-foreground placeholder:text-[#5e6884] focus-visible:border-[#8aa6ee] focus-visible:ring-[#8aa6ee]/30"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-xs font-normal text-[#9aa3bc]">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          required
          className="h-[42px] rounded-lg border-[#2b3450] bg-[#0b1128] px-3 text-[13px] text-foreground placeholder:text-[#5e6884] focus-visible:border-[#8aa6ee] focus-visible:ring-[#8aa6ee]/30"
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        className="mt-2 h-11 w-full justify-between rounded-lg border-[#5b7fe0] bg-transparent px-5 text-[13px] font-semibold text-[#b4c6f6] hover:border-[#8aa6ee] hover:bg-[#0e1530] hover:text-[#eef2fe]"
      >
        Entrar <i className="ph ph-arrow-right text-base" aria-hidden="true" />
      </Button>
      {error && <p role="alert" className="text-xs text-[#f0a0a5]">{error}</p>}
    </form>
  );
}
