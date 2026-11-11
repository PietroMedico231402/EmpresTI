"use client";

import { useState } from "react";

const fieldClass = "mt-2 h-[42px] w-full rounded-lg border border-[#2b3450] bg-[#0b1128] px-3 text-[13px] text-foreground";

export function NewEquipmentPage() {
  const [name, setName] = useState("Monitor Dell 24\"");
  const [assetTag, setAssetTag] = useState("PAT-1205");
  const [category, setCategory] = useState("Monitores");
  const [status, setStatus] = useState<"Disponível" | "Manutenção">("Disponível");

  return <div className="grid max-w-6xl grid-cols-[minmax(0,1fr)_320px] gap-10" data-screen-label="06 Cadastrar equipamento">
    <section><p className="text-[11px] uppercase tracking-[.1em] text-[#5e6884]">Operações</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.01em] text-foreground">Cadastrar equipamento</h1><p className="mt-2 text-[13px] text-[#8a93b2]">Adicione uma unidade física ao catálogo.</p>
      <form className="mt-8 grid max-w-[620px] grid-cols-2 gap-[18px]" onSubmit={(event) => event.preventDefault()}>
        <label className="col-span-2 text-xs text-[#9aa3bc]">Nome<input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label>
        <label className="text-xs text-[#9aa3bc]">Patrimônio<input value={assetTag} onChange={(event) => setAssetTag(event.target.value)} className={fieldClass} /></label>
        <label className="text-xs text-[#9aa3bc]">Categoria<select value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}><option>Notebooks</option><option>Monitores</option><option>Acessórios</option><option>Câmeras</option></select></label>
        <fieldset className="col-span-2"><legend className="text-xs text-[#9aa3bc]">Situação inicial</legend><div className="mt-2 flex w-fit overflow-hidden rounded-lg border border-[#2b3450]"><button type="button" onClick={() => setStatus("Disponível")} aria-pressed={status === "Disponível"} className={`px-[18px] py-[9px] text-[13px] ${status === "Disponível" ? "bg-[#132663] font-semibold text-[#d6e0fb]" : "text-[#9aa3bc]"}`}>Disponível</button><button type="button" onClick={() => setStatus("Manutenção")} aria-pressed={status === "Manutenção"} className={`border-l border-[#2b3450] px-[18px] py-[9px] text-[13px] ${status === "Manutenção" ? "bg-[#132663] font-semibold text-[#d6e0fb]" : "text-[#9aa3bc]"}`}>Manutenção</button></div><p className="mt-2 text-[11.5px] text-[#5e6884]">Equipamentos em manutenção não aparecem como disponíveis no catálogo.</p></fieldset>
        <label className="col-span-2 text-xs text-[#9aa3bc]">Observações<textarea className="mt-2 h-[88px] w-full resize-none rounded-lg border border-[#2b3450] bg-[#0b1128] p-3 text-[13px] text-foreground" /></label>
        <button type="submit" className="col-span-2 h-11 w-fit rounded-lg border border-[#5b7fe0] px-5 text-[13px] font-semibold text-[#b4c6f6]">Salvar equipamento</button>
      </form>
    </section>
    <aside className="flex flex-col gap-4"><section aria-label="Prévia do equipamento" className="rounded-xl border border-[#1f2949] bg-[#0e1530] p-5"><p className="text-[11px] uppercase tracking-[.08em] text-[#5e6884]">Prévia no catálogo</p><div className="mt-4 rounded-[11px] border border-[#1f2949] bg-[#0b1128] p-4"><div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-[9px] bg-[#132663] text-xl text-[#8aa6ee]"><i className="ph ph-monitor" aria-hidden="true" /></span><span className={`rounded-full border px-[9px] py-[3px] text-[11px] font-semibold ${status === "Disponível" ? "border-[rgba(63,185,140,.35)] text-[#5fd3aa]" : "border-[rgba(224,163,63,.35)] text-[#e8b961]"}`}>{status}</span></div><h2 className="mt-4 text-[15px] font-semibold text-foreground">{name || "Sem nome"}</h2><p className="mt-1 text-xs text-[#7c86a2]">{category} · {assetTag || "Sem patrimônio"}</p></div></section><section className="rounded-xl border border-[#1f2949] bg-[#0e1530] p-5"><h2 className="text-[15px] font-semibold text-foreground">Últimos cadastros</h2><ul className="mt-4 flex flex-col gap-3 text-[13px] text-[#9aa3bc]"><li>MacBook Air 13&quot; M2 · PAT-1204</li><li>Projetor Epson X49 · PAT-0102</li></ul></section></aside>
  </div>;
}
