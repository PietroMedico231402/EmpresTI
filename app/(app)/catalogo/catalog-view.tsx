"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/src/trpc/client";

const statusLabel = { AVAILABLE: "Disponível", LOANED: "Emprestado", MAINTENANCE: "Em manutenção", RETIRED: "Inativo" } as const;

export function CatalogView() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const query = trpc.catalog.list.useQuery({ search: searchParams.get("busca") || undefined, category: category || undefined, availability: availableOnly ? "AVAILABLE" : "ALL" });

  return <section aria-labelledby="catalog-title" className="space-y-6">
    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#5e6884]">Colaborador</p><h1 id="catalog-title" className="text-2xl font-semibold">Catálogo de equipamentos</h1><p className="mt-2 text-[#8a93b2]">Escolha um item disponível para consultar seus detalhes.</p></div>
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros do catálogo">
      <button type="button" onClick={() => setCategory("")} aria-pressed={!category} className="rounded-full border border-[#222c4a] px-4 py-2 text-xs aria-pressed:border-[#5b7fe0] aria-pressed:bg-[#132663]">Todos</button>
      {query.data?.categories.map((name) => <button key={name} type="button" onClick={() => setCategory(name)} aria-pressed={category === name} className="rounded-full border border-[#222c4a] px-4 py-2 text-xs aria-pressed:border-[#5b7fe0] aria-pressed:bg-[#132663]">{name}</button>)}
      <label className="ml-auto flex items-center gap-2 text-xs text-[#b4c6f6]"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> Somente disponíveis</label>
    </div>
    {query.isLoading && <p role="status" className="rounded-xl border border-[#222c4a] p-8 text-center text-[#8a93b2]">Carregando equipamentos…</p>}
    {query.isError && <p role="alert" className="rounded-xl border border-[#6b3038] p-8 text-center text-[#e08a90]">Não foi possível carregar o catálogo.</p>}
    {query.data && query.data.items.length === 0 && <p className="rounded-xl border border-dashed border-[#222c4a] p-10 text-center text-[#8a93b2]">Nenhum equipamento encontrado com estes filtros.</p>}
    {query.data && query.data.items.length > 0 && <ul className="grid grid-cols-3 gap-4">{query.data.items.map((item) => {
      const available = item.availability === "AVAILABLE";
      const content = <article className="h-full rounded-xl border border-[#222c4a] bg-[#0b1128] p-5 transition-colors hover:border-[#39476f]"><div className="mb-5 flex h-28 items-center justify-center rounded-lg bg-[#080c1a] text-[#5b7fe0]"><i className="ph ph-package text-5xl" aria-hidden="true" /></div><p className="text-[11px] uppercase tracking-wider text-[#5e6884]">{item.category} · {item.assetTag}</p><h2 className="mt-1 text-base font-semibold text-foreground">{item.name}</h2><p className="mt-3 text-xs text-[#8a93b2]"><i className="ph ph-map-pin" aria-hidden="true" /> {item.pickupLocation}</p><p className={`mt-4 text-xs font-semibold ${available ? "text-[#8dd6ad]" : "text-[#d8ad79]"}`}>{statusLabel[item.availability]}</p></article>;
      return <li key={item.id}>{available ? <Link href={`/catalogo/${encodeURIComponent(item.assetTag)}`} aria-label={`Ver ${item.name}, ${item.assetTag}`}>{content}</Link> : content}</li>;
    })}</ul>}
  </section>;
}
