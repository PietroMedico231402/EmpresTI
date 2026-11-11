export type EquipmentStatus = "AVAILABLE" | "LOANED" | "MAINTENANCE";

export type DemoEquipment = {
  assetTag: string;
  name: string;
  category: "Notebooks" | "Monitores" | "Acessórios" | "Câmeras";
  status: EquipmentStatus;
  loanedTo?: string;
  expectedReturn?: string;
  maintenanceNote?: string;
};

export const demoEquipment: readonly DemoEquipment[] = [
  { assetTag: "PAT-1042", name: "MacBook Pro 14\"", category: "Notebooks", status: "AVAILABLE" },
  { assetTag: "PAT-1188", name: "ThinkPad T14", category: "Notebooks", status: "LOANED", loanedTo: "Rafael Lima", expectedReturn: "18/nov" },
  { assetTag: "PAT-0871", name: "Dell UltraSharp 27\"", category: "Monitores", status: "AVAILABLE" },
  { assetTag: "PAT-0910", name: "LG UltraFine 24\"", category: "Monitores", status: "MAINTENANCE", maintenanceNote: "Aguardando assistência" },
  { assetTag: "PAT-0233", name: "Sony A7 III", category: "Câmeras", status: "LOANED", loanedTo: "Camila Duarte", expectedReturn: "12/nov" },
  { assetTag: "PAT-0455", name: "Dock USB-C Anker", category: "Acessórios", status: "MAINTENANCE", maintenanceNote: "Revisão de portas" },
];

export const demoCategories = ["Todos", "Notebooks", "Monitores", "Acessórios", "Câmeras"] as const;
export type DemoCategory = (typeof demoCategories)[number];
