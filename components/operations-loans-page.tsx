"use client";

import { useState } from "react";

type OpenLoan = { id: number; person: string; item: string; pickup: string; due: string; status: "Em prazo" | "Em atraso" };

const initialLoans: OpenLoan[] = [
  { id: 1, person: "Marina Alves", item: "ThinkPad T14", pickup: "04/nov", due: "18/nov", status: "Em prazo" },
  { id: 2, person: "Rafael Lima", item: "Dell UltraSharp 27\"", pickup: "05/nov", due: "19/nov", status: "Em prazo" },
  { id: 3, person: "Camila Duarte", item: "Sony A7 III", pickup: "22/out", due: "05/nov", status: "Em atraso" },
  { id: 4, person: "Tiago Menezes", item: "Projetor Epson X49", pickup: "21/out", due: "04/nov", status: "Em atraso" },
  { id: 5, person: "Ana Sato", item: "Dock USB-C Anker", pickup: "08/nov", due: "22/nov", status: "Em prazo" },
  { id: 6, person: "Bruno Kato", item: "MacBook Air 13\" M2", pickup: "09/nov", due: "23/nov", status: "Em prazo" },
  { id: 7, person: "Helena Prado", item: "Adaptador HDMI Belkin", pickup: "19/out", due: "02/nov", status: "Em atraso" },
];

export function OperationsLoansPage() {
  const [loans, setLoans] = useState(initialLoans);
  const [filter, setFilter] = useState<"Todos" | "Em prazo" | "Em atraso">("Todos");
  const filtered = loans.filter((loan) => filter === "Todos" || loan.status === filter);
  const late = loans.filter((loan) => loan.status === "Em atraso").length;

  return <div className="flex max-w-6xl flex-col gap-[22px]" data-screen-label="05 Operações">
    <div><p className="text-[11px] uppercase tracking-[.1em] text-[#5e6884]">Operações</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.01em] text-foreground">Empréstimos em aberto</h1></div>
    <div className="grid grid-cols-4 gap-[14px]" aria-label="Indicadores">
      {[["Em aberto", loans.length, "#e6eaf6"], ["Em atraso", late, "#f0a0a5"], ["Vencem hoje", 1, "#e8b961"], ["Devolvidos hoje", 4, "#5fd3aa"]].map(([label, value, color]) => <section key={String(label)} className="rounded-[11px] border border-[#1f2949] bg-[#0e1530] px-[18px] py-4"><p className="text-[11px] uppercase tracking-[.08em] text-[#5e6884]">{label}</p><p className="mt-2 text-[26px] font-semibold" style={{ color: String(color) }}>{value}</p></section>)}
    </div>
    <div className="flex gap-2" role="group" aria-label="Filtrar empréstimos">{(["Todos", "Em prazo", "Em atraso"] as const).map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-[6px] text-xs ${filter === item ? "border-[#25408f] bg-[#132663] text-[#d6e0fb]" : "border-[#222c4a] text-[#9aa3bc]"}`}>{item}</button>)}</div>
    <section className="overflow-hidden rounded-xl border border-[#1a2340]" aria-label="Tabela de empréstimos">
      <div className="grid grid-cols-[1.3fr_1.1fr_120px_120px_150px_110px] gap-4 bg-[#0b1128] px-[18px] py-3 text-[11px] uppercase tracking-[.08em] text-[#5e6884]"><span>Colaborador</span><span>Equipamento</span><span>Retirada</span><span>Prazo</span><span>Situação</span><span>Ação</span></div>
      {filtered.map((loan) => <div key={loan.id} className={`grid grid-cols-[1.3fr_1.1fr_120px_120px_150px_110px] items-center gap-4 border-t border-[#161d33] px-[18px] py-[13px] text-[13px] ${loan.status === "Em atraso" ? "bg-[rgba(224,91,98,.05)]" : "bg-[#0e1530]"}`}><span className="font-semibold text-foreground">{loan.person}</span><span className="text-[#9aa3bc]">{loan.item}</span><span className="text-[#9aa3bc]">{loan.pickup}</span><span className="text-[#9aa3bc]">{loan.due}</span><span className={loan.status === "Em atraso" ? "font-semibold text-[#e08a90]" : "text-[#5fd3aa]"}>{loan.status}</span><button type="button" onClick={() => setLoans((items) => items.filter((item) => item.id !== loan.id))} className="h-[30px] rounded-[7px] border border-[#2b3450] px-2 text-xs font-semibold text-[#d6e0fb] hover:border-[#5b7fe0]">Devolver</button></div>)}
    </section>
    <nav aria-label="Paginação" className="flex items-center justify-end gap-2"><button type="button" className="rounded-[7px] border border-[#25408f] bg-[#132663] px-3 py-1 text-xs text-[#d6e0fb]" aria-current="page">1</button><button type="button" className="rounded-[7px] border border-[#222c4a] px-3 py-1 text-xs text-[#9aa3bc]">2</button></nav>
  </div>;
}
