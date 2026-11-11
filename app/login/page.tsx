import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-svh min-w-[900px] grid-cols-[560px_minmax(0,1fr)] bg-background">
      <section className="flex min-h-svh flex-col justify-between bg-[linear-gradient(160deg,#001449_0%,#00102f_60%,#080c1a_100%)] px-14 py-12" aria-label="Apresentação do EmpresTI">
        <div className="flex items-center gap-[10px]">
          <span className="flex size-[34px] items-center justify-center rounded-lg border border-[#25408f] bg-[#001449] text-[#b4c6f6]">
            <i className="ph ph-package text-xl" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-[.02em] text-foreground">EmpresTI</span>
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <p className="text-[11px] uppercase tracking-[.1em] text-[#8aa6ee]">Empréstimo de equipamentos</p>
            <h2 className="max-w-[20ch] text-[34px] leading-[1.15] font-semibold tracking-[-.01em] text-foreground">Equipamentos disponíveis, empréstimos sob controle.</h2>
            <p className="max-w-[38ch] text-sm leading-6 text-[#93a0c6]">Consulte, solicite e acompanhe os itens de trabalho em um só lugar.</p>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-[#3c5dbe] to-transparent" aria-hidden="true" />
          <dl className="flex gap-10">
            <div className="flex flex-col gap-1">
              <dt className="order-2 text-xs text-[#93a0c6]">itens por pessoa</dt>
              <dd className="text-2xl font-semibold text-foreground">5</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="order-2 text-xs text-[#93a0c6]">dias úteis de prazo</dt>
              <dd className="text-2xl font-semibold text-foreground">14</dd>
            </div>
          </dl>
        </div>

        <p className="text-[11px] text-[#7c86a2]">Operações · v1</p>
      </section>

      <section className="flex min-h-svh items-center justify-center px-14 py-12" aria-labelledby="login-title">
        <div className="w-full max-w-[372px]">
          <h1 id="login-title" className="text-[22px] font-semibold tracking-[-.01em] text-foreground">Entrar</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#8a93b2]">Acesse o catálogo de equipamentos da equipe.</p>
          <LoginForm />
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-[#222c4a] to-transparent" aria-hidden="true" />
          <p className="mt-5 text-center text-xs leading-5 text-[#5e6884]">Acesso interno. Em caso de dificuldade, fale com Operações.</p>
        </div>
      </section>
    </main>
  );
}
