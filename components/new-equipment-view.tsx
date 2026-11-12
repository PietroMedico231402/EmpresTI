"use client";

import { type FormEvent, useState } from "react";

import { trpc } from "@/src/trpc/client";

const fieldClass = "mt-2 h-[42px] w-full rounded-lg border border-[#2b3450] bg-[#0b1128] px-3 text-[13px] text-foreground";

export function NewEquipmentView() {
  const [name, setName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pickupLocation, setPickupLocation] = useState("Help Desk");
  const [status, setStatus] = useState<"AVAILABLE" | "MAINTENANCE">("AVAILABLE");
  const [notes, setNotes] = useState("");
  const categories = trpc.operations.listCategories.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.operations.createEquipment.useMutation({
    onSuccess: () => {
      setName(""); setAssetTag(""); setNotes(""); setStatus("AVAILABLE");
      utils.catalog.list.invalidate();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate({ name, assetTag, categoryId, pickupLocation, status, notes: notes || undefined });
  }

  if (categories.isLoading) return <p role="status" className="text-[#8a93b2]">Carregando categorias…</p>;
  if (categories.isError) return <p role="alert" className="text-[#e08a90]">Não foi possível carregar as categorias.</p>;
  const items = categories.data ?? [];
  return <div className="grid max-w-6xl grid-cols-[minmax(0,1fr)_320px] gap-10">
    <section><p className="text-[11px] uppercase tracking-[.1em] text-[#5e6884]">Operações</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.01em]">Cadastrar equipamento</h1><p className="mt-2 text-[13px] text-[#8a93b2]">Adicione uma unidade física ao catálogo.</p>
      {items.length === 0 ? <p role="alert" className="mt-8 rounded-xl border border-[#6b3038] p-4 text-sm text-[#e08a90]">Não há categorias cadastradas neste tenant. Publique os dados iniciais antes de cadastrar equipamentos.</p> : <form className="mt-8 grid max-w-[620px] grid-cols-2 gap-[18px]" onSubmit={submit}>
        <label className="col-span-2 text-xs text-[#9aa3bc]">Nome<input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label>
        <label className="text-xs text-[#9aa3bc]">Patrimônio<input required value={assetTag} onChange={(event) => setAssetTag(event.target.value)} className={fieldClass} /></label>
        <label className="text-xs text-[#9aa3bc]">Categoria<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={fieldClass}><option value="" disabled>Selecione</option>{items.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="col-span-2 text-xs text-[#9aa3bc]">Local de retirada<input required value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} className={fieldClass} /></label>
        <fieldset className="col-span-2"><legend className="text-xs text-[#9aa3bc]">Situação inicial</legend><div className="mt-2 flex w-fit overflow-hidden rounded-lg border border-[#2b3450]"><button type="button" onClick={() => setStatus("AVAILABLE")} aria-pressed={status === "AVAILABLE"} className={`px-[18px] py-[9px] text-[13px] ${status === "AVAILABLE" ? "bg-[#132663] font-semibold text-[#d6e0fb]" : "text-[#9aa3bc]"}`}>Disponível</button><button type="button" onClick={() => setStatus("MAINTENANCE")} aria-pressed={status === "MAINTENANCE"} className={`border-l border-[#2b3450] px-[18px] py-[9px] text-[13px] ${status === "MAINTENANCE" ? "bg-[#132663] font-semibold text-[#d6e0fb]" : "text-[#9aa3bc]"}`}>Manutenção</button></div></fieldset>
        <label className="col-span-2 text-xs text-[#9aa3bc]">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 h-[88px] w-full resize-none rounded-lg border border-[#2b3450] bg-[#0b1128] p-3 text-[13px] text-foreground" /></label>
        <button disabled={create.isPending} type="submit" className="col-span-2 h-11 w-fit rounded-lg border border-[#5b7fe0] px-5 text-[13px] font-semibold text-[#b4c6f6] disabled:opacity-50">{create.isPending ? "Salvando…" : "Salvar equipamento"}</button>
        {create.isError && <p role="alert" className="col-span-2 text-sm text-[#e08a90]">{create.error.message}</p>}
        {create.isSuccess && <p role="status" className="col-span-2 text-sm text-[#5fd3aa]">Equipamento cadastrado.</p>}
      </form>}
    </section>
    <aside className="flex flex-col gap-4"><section aria-label="Prévia do equipamento" className="rounded-xl border border-[#1f2949] bg-[#0e1530] p-5"><p className="text-[11px] uppercase tracking-[.08em] text-[#5e6884]">Prévia no catálogo</p><div className="mt-4 rounded-[11px] border border-[#1f2949] bg-[#0b1128] p-4"><div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-[9px] bg-[#132663] text-xl text-[#8aa6ee]"><i className="ph ph-package" aria-hidden="true" /></span><span className={`rounded-full border px-[9px] py-[3px] text-[11px] font-semibold ${status === "AVAILABLE" ? "border-[rgba(63,185,140,.35)] text-[#5fd3aa]" : "border-[rgba(224,163,63,.35)] text-[#e8b961]"}`}>{status === "AVAILABLE" ? "Disponível" : "Manutenção"}</span></div><h2 className="mt-4 text-[15px] font-semibold">{name || "Sem nome"}</h2><p className="mt-1 text-xs text-[#7c86a2]">{items.find((item) => item.id === categoryId)?.name ?? "Categoria"} · {assetTag || "Sem patrimônio"}</p></div></section></aside>
  </div>;
}
