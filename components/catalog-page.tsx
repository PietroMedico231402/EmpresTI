"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { demoCategories, demoEquipment, type DemoCategory, type DemoEquipment } from "@/lib/demo-data";

const statusStyle = {
  AVAILABLE: "border-[rgba(63,185,140,.35)] bg-[rgba(63,185,140,.12)] text-[#5fd3aa]",
  LOANED: "border-[#2b3450] bg-[#1a2340] text-[#9aa3bc]",
  MAINTENANCE: "border-[rgba(224,163,63,.35)] bg-[rgba(224,163,63,.12)] text-[#e8b961]",
} as const;

const statusText = {
  AVAILABLE: "Disponível",
  LOANED: "Emprestado",
  MAINTENANCE: "Manutenção",
} as const;

const iconByCategory = {
  Notebooks: "laptop",
  Monitores: "monitor",
  Acessórios: "usb",
  Câmeras: "video-camera",
} as const;

function EquipmentCard({ equipment }: { equipment: DemoEquipment }) {
  const body = (
    <article className="flex min-h-[178px] flex-col gap-3 rounded-xl border border-[#1f2949] bg-[#0e1530] p-4 transition-colors duration-[160ms] hover:border-[#3c5dbe]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-[9px] bg-[#0b1128] text-xl text-[#8aa6ee]">
          <i className={`ph ph-${iconByCategory[equipment.category]}`} aria-hidden="true" />
        </span>
        <span className={`rounded-full border px-[9px] py-[3px] text-[11px] font-semibold ${statusStyle[equipment.status]}`}>{statusText[equipment.status]}</span>
      </div>
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{equipment.name}</h2>
        <p className="mt-1 text-xs text-[#7c86a2]">{equipment.category} · {equipment.assetTag}</p>
      </div>
      <p className="mt-auto text-xs text-[#5e6884]">
        {equipment.status === "AVAILABLE" && "Solicitar empréstimo →"}
        {equipment.status === "LOANED" && `Com ${equipment.loanedTo} · devolve ${equipment.expectedReturn}`}
        {equipment.status === "MAINTENANCE" && equipment.maintenanceNote}
      </p>
    </article>
  );

  return equipment.status === "AVAILABLE" ? (
    <Link href={`/catalogo/${equipment.assetTag}`} aria-label={`Ver ${equipment.name}, ${equipment.assetTag}`} className="rounded-xl focus-visible:outline-none">
      {body}
    </Link>
  ) : body;
}

export function CatalogPage() {
  const [category, setCategory] = useState<DemoCategory>("Todos");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const equipment = useMemo(() => demoEquipment.filter((item) => {
    const matchesCategory = category === "Todos" || item.category === category;
    return matchesCategory && (!onlyAvailable || item.status === "AVAILABLE");
  }), [category, onlyAvailable]);

  return (
    <div className="flex max-w-6xl flex-col gap-[22px]" data-screen-label="02 Catálogo">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-.01em] text-foreground">Catálogo</h1>
        <p className="mt-2 text-[13px] text-[#8a93b2]">{demoEquipment.length} equipamentos · {demoEquipment.filter((item) => item.status === "AVAILABLE").length} disponíveis agora</p>
      </div>

      <section className="flex items-start gap-3 rounded-[10px] border border-[#25408f] bg-[linear-gradient(90deg,#0e1530,#0b1128)] p-4" aria-label="Regras de empréstimo">
        <i className="ph ph-info shrink-0 text-[17px] text-[#8aa6ee]" aria-hidden="true" />
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">Regras de empréstimo</h2>
          <p className="mt-1 text-[12.5px] leading-5 text-[#9aa3bc]">Até 5 itens em aberto. O prazo é de 14 dias úteis. Item em atraso bloqueia nova solicitação; manutenção não fica disponível.</p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
          {demoCategories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`rounded-full border px-3 py-[6px] text-xs transition-colors ${category === item ? "border-[#25408f] bg-[#132663] text-[#d6e0fb]" : "border-[#222c4a] text-[#9aa3bc] hover:border-[#5b7fe0]"}`}>
              {item}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setOnlyAvailable((value) => !value)} aria-pressed={onlyAvailable} className={`shrink-0 rounded-full border px-3 py-[6px] text-xs ${onlyAvailable ? "border-[#25408f] bg-[#132663] text-[#d6e0fb]" : "border-[#222c4a] text-[#9aa3bc]"}`}>
          Só disponíveis
        </button>
      </div>

      {equipment.length ? (
        <div className="grid grid-cols-3 gap-4" aria-label="Equipamentos">
          {equipment.map((item) => <EquipmentCard key={item.assetTag} equipment={item} />)}
        </div>
      ) : <p className="rounded-xl border border-[#1f2949] bg-[#0e1530] p-6 text-[13px] text-[#8a93b2]">Nenhum equipamento corresponde aos filtros.</p>}
    </div>
  );
}
