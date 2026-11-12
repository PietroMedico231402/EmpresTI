"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { equipmentImageUrl } from "@/src/lib/equipment-image";
import { trpc } from "@/src/trpc/client";

const statusLabel = { AVAILABLE: "Disponível", LOANED: "Emprestado", MAINTENANCE: "Em manutenção", RETIRED: "Inativo" } as const;
const statusStyle = {
  AVAILABLE: "border-[rgba(63,185,140,.35)] bg-[rgba(63,185,140,.12)] text-[#5fd3aa]",
  LOANED: "border-[#2b3450] bg-[#1a2340] text-[#9aa3bc]",
  MAINTENANCE: "border-[rgba(224,163,63,.35)] bg-[rgba(224,163,63,.12)] text-[#e8b961]",
  RETIRED: "border-[#2b3450] bg-[#1a2340] text-[#9aa3bc]",
} as const;

function iconFor(category: string) {
  const normalized = category.toLocaleLowerCase("pt-BR");
  if (normalized.includes("notebook")) return "laptop";
  if (normalized.includes("monitor")) return "monitor";
  if (normalized.includes("câmera") || normalized.includes("camera")) return "video-camera";
  if (normalized.includes("cabo")) return "usb";
  return "package";
}

export function CatalogView() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const query = trpc.catalog.list.useQuery({ search: searchParams.get("busca") || undefined, category: category || undefined, availability: availableOnly ? "AVAILABLE" : "ALL" });

  return <section aria-labelledby="catalog-title" className="flex max-w-6xl flex-col gap-[22px]">
    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#5e6884]">Colaborador</p><h1 id="catalog-title" className="text-2xl font-semibold tracking-[-.01em]">Catálogo de equipamentos</h1><p className="mt-2 text-[13px] text-[#8a93b2]">{query.data ? `${query.data.total} equipamentos · ${query.data.available} disponíveis agora` : "Escolha um item disponível para consultar seus detalhes."}</p></div>
    <section className="flex items-start gap-3 rounded-[10px] border border-[#25408f] bg-[linear-gradient(90deg,#0e1530,#0b1128)] p-4" aria-label="Regras de empréstimo"><i className="ph ph-info shrink-0 text-[17px] text-[#8aa6ee]" aria-hidden="true" /><div><h2 className="text-[13px] font-semibold">Regras de empréstimo</h2><p className="mt-1 text-[12.5px] leading-5 text-[#9aa3bc]">Até 5 itens em aberto. O prazo é de 14 dias úteis. Item em atraso bloqueia nova solicitação; manutenção não fica disponível.</p></div></section>
    <div className="flex flex-wrap items-center justify-between gap-4" aria-label="Filtros do catálogo">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria"><button type="button" onClick={() => setCategory("")} aria-pressed={!category} className="rounded-full border border-[#222c4a] px-3 py-[6px] text-xs aria-pressed:border-[#5b7fe0] aria-pressed:bg-[#132663]">Todos</button>
      {query.data?.categories.map((name) => <button key={name} type="button" onClick={() => setCategory(name)} aria-pressed={category === name} className="rounded-full border border-[#222c4a] px-3 py-[6px] text-xs aria-pressed:border-[#5b7fe0] aria-pressed:bg-[#132663]">{name}</button>)}</div>
      <label className="flex shrink-0 items-center gap-2 text-xs text-[#b4c6f6]"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> Somente disponíveis</label>
    </div>
    {query.isLoading && <p role="status" className="rounded-xl border border-[#222c4a] p-8 text-center text-[#8a93b2]">Carregando equipamentos…</p>}
    {query.isError && <p role="alert" className="rounded-xl border border-[#6b3038] p-8 text-center text-[#e08a90]">Não foi possível carregar o catálogo.</p>}
    {query.data && query.data.items.length === 0 && <p className="rounded-xl border border-dashed border-[#222c4a] p-10 text-center text-[#8a93b2]">Nenhum equipamento encontrado com estes filtros.</p>}
    {query.data && query.data.items.length > 0 && <ul className="grid grid-cols-3 gap-4" aria-label="Equipamentos">{query.data.items.map((item) => {
      const available = item.availability === "AVAILABLE";
      const imageUrl = equipmentImageUrl(item.assetTag);
      const content = <article className="flex min-h-[230px] flex-col gap-3 overflow-hidden rounded-xl border border-[#1f2949] bg-[#0e1530] transition-colors duration-[160ms] hover:border-[#3c5dbe]"><div className="relative flex h-28 items-center justify-center overflow-hidden bg-[#0b1128] text-[#8aa6ee]"><i className={`ph ph-${iconFor(item.category)} text-4xl`} aria-hidden="true" />{imageUrl && <img src={imageUrl} alt={`Foto de ${item.name}`} className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</div><div className="flex flex-1 flex-col gap-3 px-4 pb-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-semibold text-foreground">{item.name}</h2><p className="mt-1 text-xs text-[#7c86a2]">{item.category} · {item.assetTag}</p></div><span className={`shrink-0 rounded-full border px-[9px] py-[3px] text-[11px] font-semibold ${statusStyle[item.availability]}`}>{statusLabel[item.availability]}</span></div><p className="mt-auto text-xs text-[#5e6884]">{available ? "Solicitar empréstimo →" : <><i className="ph ph-map-pin" aria-hidden="true" /> {item.pickupLocation}</>}</p></div></article>;
      return <li key={item.id}>{available ? <Link href={`/catalogo/${encodeURIComponent(item.assetTag)}`} aria-label={`Ver ${item.name}, ${item.assetTag}`}>{content}</Link> : content}</li>;
    })}</ul>}
  </section>;
}
