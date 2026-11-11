"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return <button type="button" onClick={async () => { await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }} className="mt-1 text-[11px] text-[#7c86a2] hover:text-[#b4c6f6]">Sair</button>;
}
