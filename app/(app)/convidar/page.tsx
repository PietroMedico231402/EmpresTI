import { InviteForm } from "@/components/invite-form";

export default function InvitePage() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#8aa6ee]">Acesso interno</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Convidar colaborador</h1>
      <p className="mt-3 max-w-xl text-sm text-[#9aa3bc]">
        Envie um link para a pessoa definir a senha. O convite concede apenas o papel de colaborador.
      </p>
      <InviteForm />
    </section>
  );
}
