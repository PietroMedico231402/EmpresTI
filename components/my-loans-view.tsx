"use client";

import { trpc } from "@/src/trpc/client";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(value);
}

function iconFor(category: string) {
  const value = category.toLocaleLowerCase("pt-BR");
  if (value.includes("notebook")) return "laptop";
  if (value.includes("monitor")) return "monitor";
  if (value.includes("câmera") || value.includes("camera")) return "video-camera";
  return "package";
}

export function MyLoansView() {
  const utils = trpc.useUtils();
  const loans = trpc.loan.listMine.useQuery();
  const returnLoan = trpc.loan.returnMine.useMutation({ onSuccess: () => utils.loan.listMine.invalidate() });

  if (loans.isLoading) return <p role="status" className="text-[#8a93b2]">Carregando seus empréstimos…</p>;
  if (loans.isError) return <p role="alert" className="rounded-xl border border-[#6b3038] p-6 text-[#e08a90]">Não foi possível carregar seus empréstimos.</p>;

  const items = loans.data ?? [];
  const overdue = items.some((loan) => loan.overdue);
  return <section aria-labelledby="my-loans-title" className="flex max-w-6xl flex-col gap-[22px]">
    <div className="flex items-end justify-between gap-6"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#5e6884]">Colaborador</p><h1 id="my-loans-title" className="text-2xl font-semibold tracking-[-.01em]">Comigo agora</h1><p className="mt-2 text-[13px] text-[#8a93b2]">{items.length} de 5 itens · {overdue ? "há item em atraso" : "nenhum em atraso"}</p></div><div className="w-[180px]" aria-label={`${items.length} de 5 itens em aberto`}><div className="flex gap-[5px]">{Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-[5px] flex-1 rounded-full ${index < items.length ? "bg-[#5b7fe0]" : "bg-[#222c4a]"}`} />)}</div></div></div>
    <section aria-label="Empréstimos em aberto" className="overflow-hidden rounded-xl border border-[#1a2340]">{items.length ? items.map((loan) => <article key={loan.id} className="flex items-center gap-[18px] border-b border-[#161d33] bg-[#0e1530] px-5 py-[18px] last:border-0"><span className="flex size-11 items-center justify-center rounded-[10px] bg-[#0b1128] text-xl text-[#8aa6ee]"><i className={`ph ph-${iconFor(loan.equipment.category)}`} aria-hidden="true" /></span><div className="min-w-0 flex-1"><h2 className="text-[15px] font-semibold text-foreground">{loan.equipment.name}</h2><p className="mt-1 text-xs text-[#7c86a2]">{loan.equipment.category} · {loan.equipment.assetTag}</p></div><p className={loan.overdue ? "text-xs font-semibold text-[#e08a90]" : "text-xs text-[#9aa3bc]"}>Devolver até {formatDate(loan.dueAt)}{loan.overdue ? " · Em atraso" : ""}</p><button type="button" disabled={returnLoan.isPending} onClick={() => returnLoan.mutate({ loanId: loan.id })} className="h-9 rounded-lg border border-[#2b3450] px-4 text-xs font-semibold text-[#d6e0fb] hover:border-[#5b7fe0] hover:bg-[rgba(91,127,224,.1)] disabled:opacity-50">{returnLoan.isPending ? "Devolvendo…" : "Devolver"}</button></article>) : <p className="bg-[#0e1530] px-5 py-8 text-[13px] text-[#8a93b2]">Você não está com nenhum equipamento.</p>}</section>
    {returnLoan.isError && <p role="alert" className="text-sm text-[#e08a90]">Não foi possível registrar a devolução. Atualize a página e tente novamente.</p>}
  </section>;
}
