import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <section className="w-full max-w-[420px] rounded-[14px] border border-[#222c4a] bg-[#0e1530] p-10">
        <div className="mb-10 flex items-center gap-[10px]">
          <span className="flex size-[34px] items-center justify-center rounded-lg border border-[#25408f] bg-[#001449] text-[#b4c6f6]"><i className="ph ph-package text-xl" aria-hidden="true" /></span>
          <span className="text-base font-semibold tracking-[.02em]">EmpresTI</span>
        </div>
        <h1 className="text-[22px] font-semibold">Entrar</h1>
        <p className="mt-3 text-[13px] leading-6 text-[#8a93b2]">A tela de login demonstrativa será implementada na próxima tarefa.</p>
        <Link href="/catalogo" className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg border border-[#5b7fe0] px-5 text-[13px] font-semibold text-[#b4c6f6] hover:border-[#8aa6ee]">
          Explorar a navegação <i className="ph ph-arrow-right" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
