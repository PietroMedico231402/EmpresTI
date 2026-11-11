import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="grid min-h-svh min-w-[920px] grid-cols-[236px_minmax(0,1fr)] bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-col">
        <AppHeader />
        <main id="conteudo" className="flex-1 px-7 py-8">{children}</main>
      </div>
    </div>
  );
}
