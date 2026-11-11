"use client";

import { useState } from "react";

type Loan = { assetTag: string; name: string; category: string; due: string; progress: number };

const initialLoans: Loan[] = [
  { assetTag: "PAT-1188", name: "ThinkPad T14", category: "Notebook", due: "18/nov", progress: 45 },
  { assetTag: "PAT-0871", name: "Dell UltraSharp 27\"", category: "Monitor", due: "25/nov", progress: 20 },
];

export function MyLoansPage() {
  const [loans, setLoans] = useState(initialLoans);

  return (
    <div className="flex max-w-6xl flex-col gap-[22px]" data-screen-label="04 Meus empréstimos">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-.01em] text-foreground">Comigo agora</h1>
          <p className="mt-2 text-[13px] text-[#8a93b2]">{loans.length} de 5 itens · nenhum em atraso</p>
        </div>
        <div className="w-[180px]" aria-label={`${loans.length} de 5 itens em aberto`}>
          <div className="flex gap-[5px]">{Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-[5px] flex-1 rounded-full ${index < loans.length ? "bg-[#5b7fe0]" : "bg-[#222c4a]"}`} />)}</div>
        </div>
      </div>

      <section aria-label="Empréstimos em aberto" className="overflow-hidden rounded-xl border border-[#1a2340]">
        {loans.length ? loans.map((loan) => (
          <article key={loan.assetTag} className="flex items-center gap-[18px] border-b border-[#161d33] bg-[#0e1530] px-5 py-[18px] last:border-0">
            <span className="flex size-11 items-center justify-center rounded-[10px] bg-[#0b1128] text-xl text-[#8aa6ee]"><i className={`ph ph-${loan.category === "Notebook" ? "laptop" : "monitor"}`} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1"><h2 className="text-[15px] font-semibold text-foreground">{loan.name}</h2><p className="mt-1 text-xs text-[#7c86a2]">{loan.category} · {loan.assetTag}</p></div>
            <div className="w-[180px]"><p className="text-xs text-[#9aa3bc]">Devolver até <span className="font-semibold text-[#b4c6f6]">{loan.due}</span></p><div className="mt-2 h-1 overflow-hidden rounded-full bg-[#222c4a]"><div className="h-full rounded-full bg-[#5b7fe0]" style={{ width: `${loan.progress}%` }} /></div></div>
            <button type="button" onClick={() => setLoans((items) => items.filter((item) => item.assetTag !== loan.assetTag))} className="h-9 rounded-lg border border-[#2b3450] px-4 text-xs font-semibold text-[#d6e0fb] hover:border-[#5b7fe0] hover:bg-[rgba(91,127,224,.1)]">Devolver</button>
          </article>
        )) : <p className="bg-[#0e1530] px-5 py-8 text-[13px] text-[#8a93b2]">Você não está com nenhum equipamento.</p>}
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#222c4a] to-transparent" aria-hidden="true" />
      <section aria-labelledby="history-title"><h2 id="history-title" className="text-[17px] font-semibold text-foreground">Histórico</h2><div className="mt-3 overflow-hidden rounded-xl border border-[#1a2340]"><div className="grid grid-cols-[1fr_150px_150px_130px] gap-4 bg-[#0b1128] px-[18px] py-3 text-[11px] uppercase tracking-[.08em] text-[#5e6884]"><span>Item</span><span>Retirada</span><span>Devolução</span><span>Situação</span></div><div className="grid grid-cols-[1fr_150px_150px_130px] gap-4 border-t border-[#161d33] bg-[#0e1530] px-[18px] py-[13px] text-[13px] text-[#9aa3bc]"><span>Dock USB-C Anker</span><span>01/out</span><span>11/out</span><span className="text-[#5fd3aa]">No prazo</span></div><div className="grid grid-cols-[1fr_150px_150px_130px] gap-4 border-t border-[#161d33] bg-[rgba(224,91,98,.05)] px-[18px] py-[13px] text-[13px] text-[#9aa3bc]"><span>Adaptador HDMI Belkin</span><span>02/set</span><span>20/set</span><span className="text-[#e08a90]">Com atraso</span></div></div></section>
    </div>
  );
}
