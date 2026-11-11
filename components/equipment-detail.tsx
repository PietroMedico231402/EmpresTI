"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { demoEquipment } from "@/lib/demo-data";

const equipment = demoEquipment.find((item) => item.assetTag === "PAT-1042")!;

export function EquipmentDetail() {
  const router = useRouter();

  return (
    <div className="grid max-w-6xl grid-cols-[minmax(0,1fr)_356px] gap-8" data-screen-label="03 Detalhe do item">
      <section className="flex min-w-0 flex-col gap-5">
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-[#1f2949] bg-[radial-gradient(120%_120%_at_20%_0%,#132663_0%,#0b1128_60%)] text-[#8aa6ee]">
          <i className="ph ph-laptop text-[64px]" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-[-.01em] text-foreground">{equipment.name}</h1>
          <span className="rounded-full border border-[rgba(63,185,140,.35)] bg-[rgba(63,185,140,.12)] px-[9px] py-[3px] text-[11px] font-semibold text-[#5fd3aa]">Disponível</span>
        </div>
        <p className="max-w-[60ch] text-[13px] leading-6 text-[#8a93b2]">Notebook para trabalho móvel, com tela de 14 polegadas e carregador incluso. A retirada é feita no Help Desk.</p>
        <div className="h-px bg-gradient-to-r from-transparent via-[#222c4a] to-transparent" aria-hidden="true" />
        <dl className="grid grid-cols-4 gap-5">
          <div><dt className="text-[11px] uppercase tracking-[.08em] text-[#5e6884]">Categoria</dt><dd className="mt-2 text-[13px] text-foreground">{equipment.category}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-[.08em] text-[#5e6884]">Patrimônio</dt><dd className="mt-2 text-[13px] text-foreground">{equipment.assetTag}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-[.08em] text-[#5e6884]">Local</dt><dd className="mt-2 text-[13px] text-foreground">Help Desk</dd></div>
          <div><dt className="text-[11px] uppercase tracking-[.08em] text-[#5e6884]">Última devolução</dt><dd className="mt-2 text-[13px] text-foreground">04/nov</dd></div>
        </dl>
        <section aria-labelledby="history-title">
          <h2 id="history-title" className="text-[17px] font-semibold text-foreground">Histórico</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#1a2340]">
            <div className="grid grid-cols-[120px_1fr_140px] gap-4 bg-[#0b1128] px-[18px] py-3 text-[11px] uppercase tracking-[.08em] text-[#5e6884]"><span>Data</span><span>Evento</span><span>Resultado</span></div>
            <div className="grid grid-cols-[120px_1fr_140px] gap-4 border-t border-[#161d33] px-[18px] py-[13px] text-[13px] text-[#9aa3bc]"><span>04/nov</span><span>Devolução registrada</span><span>Em ordem</span></div>
          </div>
        </section>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border border-[#1f2949] bg-[#0e1530] p-5">
          <h2 className="text-[17px] font-semibold text-foreground">Solicitar empréstimo</h2>
          <dl className="mt-5 flex flex-col gap-4 text-[13px]">
            <div className="flex justify-between gap-3"><dt className="text-[#8a93b2]">Retirada</dt><dd className="text-foreground">Help Desk</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#8a93b2]">Prazo padrão</dt><dd className="text-foreground">14 dias úteis</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#8a93b2]">Devolver até</dt><dd className="font-semibold text-[#b4c6f6]">02/dez</dd></div>
          </dl>
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="mt-6 flex h-11 w-full items-center justify-between rounded-lg border border-[#5b7fe0] px-5 text-[13px] font-semibold text-[#b4c6f6] hover:bg-[rgba(91,127,224,.12)]">Solicitar empréstimo <i className="ph ph-arrow-right text-base" aria-hidden="true" /></button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="max-w-[432px] gap-5 rounded-[14px] border border-[#454e68] bg-[#0e1530] p-6 shadow-[0_18px_44px_rgba(0,0,0,.7)]">
              <DialogHeader>
                <DialogTitle className="text-[19px] font-semibold text-foreground">Confirmar solicitação</DialogTitle>
                <DialogDescription className="text-[13.5px] leading-6 text-[#8a93b2]">Você vai solicitar {equipment.name}.</DialogDescription>
              </DialogHeader>
              <div className="rounded-[9px] border border-[#1a2340] bg-[#0b1128] px-[14px] py-3 text-[12.5px] text-[#9aa3bc]">Devolução até 02/dez, no fim do dia. Você ficará com 3 de 5 itens.</div>
              <DialogFooter className="-mx-6 -mb-6 border-[#1a2340] bg-transparent p-6">
                <DialogClose asChild><button type="button" className="h-[38px] rounded-lg border border-[#2b3450] px-4 text-[13px] text-[#9aa3bc]">Cancelar</button></DialogClose>
                <button type="button" onClick={() => router.push("/meus-emprestimos")} className="h-[38px] rounded-lg border border-[#5b7fe0] bg-[rgba(91,127,224,.12)] px-4 text-[13px] font-semibold text-[#d6e0fb]">Confirmar solicitação</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <p className="mt-3 text-[11.5px] leading-5 text-[#5e6884]">Retire o item com a equipe de Operações.</p>
        </section>
        <section className="rounded-xl border border-[#1f2949] bg-[#0e1530] p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Seus itens</h2>
          <p className="mt-2 text-[13px] text-[#9aa3bc]">2 de 5 itens · nenhum em atraso</p>
          <div className="mt-4 flex gap-[5px]" aria-label="2 de 5 itens em aberto">
            {[true, true, false, false, false].map((filled, index) => <span key={index} className={`h-[5px] flex-1 rounded-full ${filled ? "bg-[#5b7fe0]" : "bg-[#222c4a]"}`} />)}
          </div>
        </section>
      </aside>
    </div>
  );
}
