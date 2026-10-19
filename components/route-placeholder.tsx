type RoutePlaceholderProps = {
  title: string;
  description: string;
  section: string;
};

export function RoutePlaceholder({ title, description, section }: RoutePlaceholderProps) {
  return (
    <div className="flex max-w-4xl flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[.1em] text-[#5e6884]">{section}</p>
        <h1 className="text-2xl font-semibold tracking-[-.01em] text-foreground">{title}</h1>
        <p className="text-[13px] text-[#8a93b2]">{description}</p>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[#222c4a] to-transparent" aria-hidden="true" />
      <section className="rounded-xl border border-[#1f2949] bg-[#0e1530] px-6 py-8" aria-label="Estado da tela">
        <p className="text-sm font-semibold text-foreground">Interface em preparação</p>
        <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#8a93b2]">Esta rota já está disponível para validar a navegação. O conteúdo desta tela será incluído na tarefa correspondente da interface demonstrativa.</p>
      </section>
    </div>
  );
}
