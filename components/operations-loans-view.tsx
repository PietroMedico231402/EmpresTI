"use client";

import { useState } from "react";

import { trpc } from "@/src/trpc/client";

type Filter = "ALL" | "ON_TIME" | "OVERDUE";

function dateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(value);
}

export function OperationsLoansView() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const utils = trpc.useUtils();
  const loans = trpc.operations.listOpenLoans.useQuery();
  const returnLoan = trpc.operations.returnLoan.useMutation({
    onSuccess: () => utils.operations.listOpenLoans.invalidate(),
  });

  if (loans.isLoading) return <p role="status" className="text-[#8a93b2]">Carregando empréstimos…</p>;
  if (loans.isError) return <p role="alert" className="rounded-xl border border-[#6b3038] p-6 text-[#e08a90]">Não foi possível carregar os empréstimos.</p>;

  const all = loans.data ?? [];
  const visible = all.filter((loan) => filter === "ALL" || (filter === "OVERDUE" ? loan.overdue : !loan.overdue));
  const overdue = all.filter((loan) => loan.overdue).length;

  return <section aria-labelledby="operations-loans-title" className="space-y-6">
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#5e6884]">Operações</p>
      <h1 id="operations-loans-title" className="text-2xl font-semibold">Empréstimos em aberto</h1>
      <p className="mt-2 text-[#8a93b2]">Acompanhe os itens retirados e registre devoluções no balcão.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Indicadores">
      <p className="rounded-xl border border-[#222c4a] bg-[#0b1128] p-4 text-sm text-[#b4c6f6]">Em aberto <strong className="ml-2 text-lg text-foreground">{all.length}</strong></p>
      <p className="rounded-xl border border-[#222c4a] bg-[#0b1128] p-4 text-sm text-[#e08a90]">Em atraso <strong className="ml-2 text-lg">{overdue}</strong></p>
    </div>
    <div className="flex gap-2" role="group" aria-label="Filtrar empréstimos">
      {([ ["ALL", "Todos"], ["ON_TIME", "Em prazo"], ["OVERDUE", "Em atraso"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className="rounded-full border border-[#222c4a] px-4 py-2 text-xs aria-pressed:border-[#5b7fe0] aria-pressed:bg-[#132663]">{label}</button>)}
    </div>
    {visible.length === 0 ? <p className="rounded-xl border border-dashed border-[#222c4a] p-8 text-center text-[#8a93b2]">Nenhum empréstimo em aberto neste filtro.</p> : <div className="overflow-x-auto rounded-xl border border-[#222c4a]">
      <table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#0b1128] text-xs text-[#8a93b2]"><tr><th className="p-4">Colaborador</th><th className="p-4">Equipamento</th><th className="p-4">Retirada</th><th className="p-4">Vencimento</th><th className="p-4">Ação</th></tr></thead><tbody>
        {visible.map((loan) => <tr key={loan.id} className="border-t border-[#222c4a]"><td className="p-4 font-medium">{loan.borrower}</td><td className="p-4 text-[#b4c6f6]">{loan.equipment} <span className="text-xs text-[#8a93b2]">· {loan.assetTag}</span></td><td className="p-4 text-[#8a93b2]">{dateTime(loan.borrowedAt)}</td><td className={loan.overdue ? "p-4 font-medium text-[#e08a90]" : "p-4 text-[#8a93b2]"}>{dateTime(loan.dueAt)}{loan.overdue ? " · Em atraso" : ""}</td><td className="p-4"><button type="button" disabled={returnLoan.isPending} onClick={() => returnLoan.mutate({ loanId: loan.id })} className="rounded-md border border-[#5b7fe0] px-3 py-2 text-xs text-[#b4c6f6] disabled:opacity-50">{returnLoan.isPending ? "Registrando…" : "Registrar devolução"}</button></td></tr>)}
      </tbody></table>
    </div>}
    {returnLoan.isError && <p role="alert" className="text-sm text-[#e08a90]">Não foi possível registrar a devolução. Atualize a página e tente novamente.</p>}
  </section>;
}
