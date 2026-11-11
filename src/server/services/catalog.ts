import type { PrismaClient } from "@/src/generated/prisma/client";

export type CatalogAvailability = "ALL" | "AVAILABLE" | "LOANED" | "MAINTENANCE" | "RETIRED";

function availabilityOf(item: { status: string; loans: { returnedAt: Date | null }[] }): Exclude<CatalogAvailability, "ALL"> {
  if (item.status === "MAINTENANCE" || item.status === "RETIRED") return item.status;
  return item.loans.some((loan) => loan.returnedAt === null) ? "LOANED" : "AVAILABLE";
}

export async function listCatalog(
  prisma: PrismaClient,
  tenantId: string,
  filters: { search?: string; category?: string; availability?: CatalogAvailability },
) {
  const [items, categories] = await Promise.all([
    prisma.equipment.findMany({
      where: {
        tenantId,
        ...(filters.category ? { category: { name: filters.category } } : {}),
        ...(filters.search ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { assetTag: { contains: filters.search, mode: "insensitive" as const } },
            { category: { name: { contains: filters.search, mode: "insensitive" as const } } },
          ],
        } : {}),
      },
      include: { category: true, loans: { where: { returnedAt: null }, select: { returnedAt: true } } },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.equipmentCategory.findMany({ where: { tenantId }, orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  const mapped = items.map((item) => ({
    id: item.id,
    name: item.name,
    assetTag: item.assetTag,
    category: item.category.name,
    pickupLocation: item.pickupLocation,
    availability: availabilityOf(item),
  }));
  const filtered = filters.availability && filters.availability !== "ALL"
    ? mapped.filter((item) => item.availability === filters.availability)
    : mapped;

  return {
    items: filtered,
    categories: categories.map((category) => category.name),
    total: mapped.length,
    available: mapped.filter((item) => item.availability === "AVAILABLE").length,
  };
}

export async function getCatalogItem(prisma: PrismaClient, tenantId: string, assetTag: string) {
  const item = await prisma.equipment.findFirst({
    where: { tenantId, assetTag },
    include: {
      category: true,
      loans: {
        orderBy: { borrowedAt: "desc" },
        take: 5,
        include: { borrower: { select: { displayName: true } } },
      },
    },
  });
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    assetTag: item.assetTag,
    serialNumber: item.serialNumber,
    category: item.category.name,
    pickupLocation: item.pickupLocation,
    notes: item.notes,
    availability: availabilityOf(item),
    history: item.loans.map((loan) => ({
      id: loan.id,
      borrower: loan.borrower.displayName,
      borrowedAt: loan.borrowedAt,
      dueAt: loan.dueAt,
      returnedAt: loan.returnedAt,
    })),
  };
}
