import { redirect } from "next/navigation";

import { signOut } from "./actions";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";
import { hasInitialMembership } from "@/lib/supabase/membership";

export default async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !await hasInitialMembership(supabase, user.id)) redirect("/login");

  return (
    <div className="grid min-h-svh min-w-[920px] grid-cols-[236px_minmax(0,1fr)] bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-col">
        <AppHeader />
        <main id="conteudo" className="flex-1 px-7 py-8">{children}</main>
        <form action={signOut} className="px-7 pb-6">
          <button type="submit" className="text-xs text-[#9aa3bc] hover:text-foreground">Sair</button>
        </form>
      </div>
    </div>
  );
}
