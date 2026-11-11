"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.get("email"), name: values.get("name") }),
      });
      const result = await response.json() as { message?: string };
      setError(!response.ok);
      setMessage(result.message ?? "Não foi possível enviar o convite.");
      if (response.ok) form.reset();
    } catch {
      setError(true);
      setMessage("Não foi possível enviar o convite. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-md flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="invite-name">Nome do colaborador</Label>
        <Input id="invite-name" name="name" minLength={2} maxLength={120} required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-email">E-mail</Label>
        <Input id="invite-email" name="email" type="email" maxLength={254} required autoComplete="email" />
      </div>
      {message && <p role={error ? "alert" : "status"} className={error ? "text-sm text-red-300" : "text-sm text-[#b4c6f6]"}>{message}</p>}
      <Button type="submit" disabled={pending} className="h-10 self-start px-5">
        {pending ? "Enviando..." : "Enviar convite"}
      </Button>
    </form>
  );
}
