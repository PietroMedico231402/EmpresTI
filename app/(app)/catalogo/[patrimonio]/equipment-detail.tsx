"use client";

import Link from "next/link";
import { equipmentImageUrl } from "@/src/lib/equipment-image";
import { trpc } from "@/src/trpc/client";

const statusLabel = { AVAILABLE: "Disponível", LOANED: "Emprestado", MAINTENANCE: "Em manutenção", RETIRED: "Inativo" } as const;

export function EquipmentDetail({ assetTag }: { assetTag: string }) {
  const query = trpc.catalog.detail.useQuery({ assetTag });
  if (query.isLoading) return <p role="status" className="p-8 text-[#8a93b2]">Carregando equipamento…</p>;
  if (query.isError || !query.data) return <div className="space-y-4 rounded-xl border border-[#6b3038] p-8"><p role="alert" className="text-[#e08a90]">Equipamento não encontrado.</p><Link href="/catalogo">Voltar ao catálogo</Link></div>;
  const item = query.data;
  const imageUrl = equipmentImageUrl(item.assetTag);
  return <section aria-labelledby="equipment-title" className="grid grid-cols-[minmax(0,1fr)_280px] gap-6">
    <div className="space-y-6"><div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl border border-[#222c4a] bg-[#0b1128] text-[#5b7fe0]"><i className="ph ph-package text-8xl" aria-hidden="true" />{imageUrl && <img src={imageUrl} alt={`Foto de ${item.name}`} className="absolute inset-0 size-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</div><div><p className="text-[11px] uppercase tracking-wider text-[#5e6884]">{item.category} · {item.assetTag}</p><h1 id="equipment-title" className="mt-2 text-2xl font-semibold">{item.name}</h1>{item.notes && <p className="mt-3 text-[#8a93b2]">{item.notes}</p>}</div>
      <div className="rounded-xl border border-[#222c4a] p-5"><h2 className="font-semibold">Histórico recente</h2>{item.history.length === 0 ? <p className="mt-3 text-sm text-[#8a93b2]">Este equipamento ainda não possui empréstimos.</p> : <ul className="mt-3 divide-y divide-[#1a2340]">{item.history.map((loan) => <li key={loan.id} className="py-3 text-sm"><span className="font-medium">{loan.borrower}</span><span className="ml-2 text-[#8a93b2]">{new Date(loan.borrowedAt).toLocaleDateString("pt-BR")} · {loan.returnedAt ? "Devolvido" : "Em aberto"}</span></li>)}</ul>}</div>
    </div>
    <aside className="h-fit rounded-xl border border-[#222c4a] bg-[#0b1128] p-5"><p className={`text-sm font-semibold ${item.availability === "AVAILABLE" ? "text-[#8dd6ad]" : "text-[#d8ad79]"}`}>{statusLabel[item.availability]}</p><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-[#5e6884]">Local de retirada</dt><dd className="mt-1">{item.pickupLocation}</dd></div><div><dt className="text-xs text-[#5e6884]">Número de série</dt><dd className="mt-1">{item.serialNumber || "Não informado"}</dd></div></dl>{item.availability !== "AVAILABLE" && <p className="mt-5 rounded-lg bg-[#201a18] p-3 text-xs text-[#d8ad79]">Este equipamento não pode ser solicitado no momento.</p>}</aside>
  </section>;
}
