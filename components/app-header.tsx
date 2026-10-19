"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const isDetail = pathname.startsWith("/catalogo/");
  const isNewEquipment = pathname === "/operacoes/equipamentos/novo";
  const isOperationsList = pathname === "/operacoes/emprestimos";
  const isMyLoans = pathname === "/meus-emprestimos";
  const showCount = pathname === "/catalogo" || isDetail;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-5 border-b border-[#1a2340] px-7">
      {isDetail || isNewEquipment ? (
        <nav aria-label="Caminho da página" className="flex min-w-0 items-center gap-[9px] text-xs">
          <Link href={isDetail ? "/catalogo" : "/operacoes/emprestimos"}>{isDetail ? "Catálogo" : "Operações"}</Link>
          <i className="ph ph-caret-right text-xs text-[#5e6884]" aria-hidden="true" />
          {isDetail ? (
            <>
              <Link href="/catalogo">Notebooks</Link>
              <i className="ph ph-caret-right text-xs text-[#5e6884]" aria-hidden="true" />
              <span aria-current="page" className="truncate text-foreground">PAT-1042</span>
            </>
          ) : (
            <span aria-current="page" className="truncate text-foreground">Cadastrar equipamento</span>
          )}
        </nav>
      ) : (
        <label className="flex h-9 w-full max-w-[420px] items-center gap-2 rounded-lg border border-[#222c4a] bg-[#0b1128] px-3 text-[#5e6884] focus-within:border-[#5b7fe0]">
          <i className="ph ph-magnifying-glass text-[17px]" aria-hidden="true" />
          <input
            type="search"
            aria-label={isOperationsList ? "Buscar empréstimos" : "Buscar equipamentos"}
            placeholder={isOperationsList ? "Buscar item ou colaborador" : "Buscar equipamentos"}
            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-[#5e6884]"
          />
        </label>
      )}

      <div className="flex shrink-0 items-center gap-4">
        {showCount && <span className="text-xs text-[#9aa3bc]">2 de 3 itens com você</span>}
        {isOperationsList && (
          <Link href="/operacoes/equipamentos/novo" className="flex h-[34px] items-center gap-2 rounded-lg border border-[#5b7fe0] px-[14px] text-xs font-semibold text-[#b4c6f6] hover:border-[#8aa6ee]">
            <i className="ph ph-plus" aria-hidden="true" /> Cadastrar equipamento
          </Link>
        )}
        {isMyLoans && (
          <Link href="/catalogo" className="flex h-[34px] items-center rounded-lg border border-[#5b7fe0] px-[14px] text-xs font-semibold text-[#b4c6f6] hover:border-[#8aa6ee]">Pegar emprestado</Link>
        )}
        {!isNewEquipment && (
          <button type="button" aria-label="Notificações" className="flex size-8 items-center justify-center rounded-lg text-[#8aa6ee] hover:bg-[#0e1530]">
            <i className="ph ph-bell text-[17px]" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
