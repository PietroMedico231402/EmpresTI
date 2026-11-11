"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

const groups = [
  {
    label: "Colaborador",
    items: [
      { href: "/catalogo", label: "Catálogo", icon: "squares-four" },
      { href: "/meus-emprestimos", label: "Meus empréstimos", icon: "hand-arrow-down" },
    ],
  },
  {
    label: "Operações",
    items: [
      { href: "/operacoes/emprestimos", label: "Empréstimos em aberto", icon: "list-checks" },
      { href: "/operacoes/equipamentos/novo", label: "Cadastrar equipamento", icon: "plus-square" },
    ],
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const isOperations = pathname.startsWith("/operacoes");

  return (
    <aside className="sticky top-0 flex h-svh min-h-[620px] w-[236px] flex-col gap-[26px] border-r border-sidebar-border bg-sidebar px-[14px] py-[22px]">
      <Link href="/catalogo" className="flex items-center gap-[10px] px-2 text-foreground" aria-label="EmpresTI — Catálogo">
        <span className="flex size-7 items-center justify-center rounded-[7px] border border-[#25408f] bg-[#001449] text-[#b4c6f6]">
          <i className="ph ph-package text-base" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-[.02em]">EmpresTI</span>
      </Link>

      <nav aria-label="Navegação principal" className="flex flex-col gap-[18px]">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-[6px] text-[10px] uppercase tracking-[.12em] text-[#454e68]">{group.label}</p>
            <div className="flex flex-col gap-[3px]">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href === "/catalogo" && pathname.startsWith("/catalogo/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-9 items-center gap-[10px] rounded-lg px-[10px] py-[9px] text-[13px] text-[#9aa3bc] transition-colors duration-[120ms] ease-out hover:bg-[#0b1128] hover:text-foreground",
                      active && "bg-[#0e1530] text-foreground shadow-[inset_2px_0_0_#5b7fe0]",
                    )}
                  >
                    <i className={cn(active ? "ph-fill text-[#8aa6ee]" : "ph", `ph-${item.icon}`, "text-base")} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.href === "/meus-emprestimos" && (
                      <span className="ml-auto rounded-full bg-[#132663] px-[7px] py-[1px] text-[11px] font-semibold text-[#b4c6f6]">2</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-[10px] rounded-[10px] border border-sidebar-border bg-[#0b1128] p-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#132663] text-[11px] font-semibold text-[#b4c6f6]" aria-hidden="true">{isOperations ? "OP" : "CO"}</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{isOperations ? "Operações" : "Colaborador"}</p>
          <p className="truncate text-[11px] text-[#7c86a2]">{isOperations ? "Balcão · 2º andar" : "Conta demonstrativa"}</p>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
