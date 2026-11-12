export function equipmentImageUrl(assetTag: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/equipamentos/${encodeURIComponent(assetTag)}.jpg`;
}
