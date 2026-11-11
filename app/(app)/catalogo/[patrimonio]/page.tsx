import { EquipmentDetail } from "./equipment-detail";

export default async function DetalhePage({ params }: { params: Promise<{ patrimonio: string }> }) {
  const { patrimonio } = await params;
  return <EquipmentDetail assetTag={decodeURIComponent(patrimonio)} />;
}
