import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

import equipment from "../.agents/skills/imagens-equipamentos/references/equipamentos.json";

const email = "marcelo.grilo@institutojef.org.br";
const displayName = "Marcelo Grilo";
const tenantSlug = "suporte_ti";
const categoryByType: Record<string, string> = {
  notebook: "Notebook", monitor: "Monitor", cabo: "Cabo", camera: "Câmera",
};

type Credit = {
  patrimonio: string;
  pixabayId: number;
  sourcePage: string;
  photographer: string;
  license: string;
  licenseUrl: string;
  sha256: string;
  objectPath: string;
  reviewer: string;
};
type ApprovedImage = { path: string; bytes: Buffer; sha256: string };

function requireResult<T>(result: { data: T | null; error: { message: string } | null }, operation: string): T {
  if (result.error || result.data === null) throw new Error(`${operation} falhou.`);
  return result.data;
}

function allowMissing<T>(result: { data: T | null; error: { message: string } | null }, operation: string): T | null {
  if (result.error) throw new Error(`${operation} falhou.`);
  return result.data;
}

function isMissingStorageObject(error: { status?: number; statusCode?: string } | null): boolean {
  return !!error && String(error.statusCode ?? error.status ?? "") === "404";
}

function assertFixedReference() {
  if (equipment.length !== 12 || new Set(equipment.map((item) => item.patrimonio)).size !== 12) {
    throw new Error("A referência de equipamentos deve conter 12 patrimônios distintos.");
  }
  for (const item of equipment) {
    if (!categoryByType[item.categoria] || !["disponivel", "manutencao"].includes(item.situacao)) {
      throw new Error(`Dados fixos inválidos para ${item.patrimonio}.`);
    }
  }
}

export function assertOperatorTarget(target: "local" | "production", url: string): void {
  const parsed = new URL(url);
  const isLocal = ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
    && parsed.port === "54321" && parsed.protocol === "http:";
  if (target === "local" ? !isLocal : isLocal || parsed.protocol !== "https:") {
    throw new Error("A URL não corresponde ao ambiente selecionado.");
  }
}

export async function approvedImages(): Promise<ApprovedImage[]> {
  assertFixedReference();
  const root = resolve("supabase/images/equipamentos");
  const credits = JSON.parse(readFileSync(resolve("docs/equipment-image-credits.json"), "utf8")) as Credit[];
  if (credits.length !== 12 || new Set(credits.map((item) => item.pixabayId)).size !== 12) {
    throw new Error("O manifesto deve ter 12 IDs Pixabay distintos.");
  }
  const images: ApprovedImage[] = [];
  for (const item of equipment) {
    const matches = credits.filter((credit) => credit.patrimonio === item.patrimonio);
    if (matches.length !== 1) throw new Error(`Crédito ausente ou duplicado para ${item.patrimonio}.`);
    const credit = matches[0];
    const expectedPath = `${item.patrimonio}.jpg`;
    if (credit.objectPath !== expectedPath || !credit.reviewer || !credit.photographer
      || !credit.sourcePage.startsWith("https://pixabay.com/photos/")
      || !["Pixabay Content License", "CC0 1.0"].includes(credit.license)
      || credit.licenseUrl !== (credit.license === "CC0 1.0"
        ? "https://creativecommons.org/publicdomain/zero/1.0/"
        : "https://pixabay.com/service/terms/")
      || !/^[a-f0-9]{64}$/i.test(credit.sha256)) {
      throw new Error(`Crédito ou revisão incompleto para ${item.patrimonio}.`);
    }
    const bytes = readFileSync(resolve(root, expectedPath));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== credit.sha256) throw new Error(`Hash divergente para ${item.patrimonio}.`);
    const metadata = await sharp(bytes).metadata();
    if (metadata.format !== "jpeg" || metadata.width !== 800 || metadata.height !== 600) {
      throw new Error(`Foto fora do padrão JPEG 800×600: ${item.patrimonio}.`);
    }
    images.push({ path: expectedPath, bytes, sha256 });
  }
  if (new Set(images.map((item) => item.sha256)).size !== 12) throw new Error("Fotos finais repetidas.");
  return images;
}

export async function ensureEquipment(admin: SupabaseClient): Promise<string> {
  assertFixedReference();
  requireResult(await admin.from("tenants").upsert({ slug: tenantSlug, name: "Suporte TI" }, { onConflict: "slug" }).select("id").single(), "Tenant");
  const tenant = requireResult(await admin.from("tenants").select("id").eq("slug", tenantSlug).single(), "Consulta do tenant") as unknown as { id: string };
  if (!tenant) throw new Error("Tenant ausente após o upsert.");
  const tenantId = tenant.id as string;
  const requiredCategories = [...new Set(equipment.map((item) => categoryByType[item.categoria]))];
  for (const name of requiredCategories) {
    const found = allowMissing(await admin.from("equipment_categories").select("id").eq("tenant_id", tenantId).eq("name", name).maybeSingle(), "Consulta da categoria");
    if (!found) requireResult(await admin.from("equipment_categories").insert({ tenant_id: tenantId, name }).select("id").single(), "Criação da categoria");
  }
  const categories = requireResult(await admin.from("equipment_categories").select("id,name").eq("tenant_id", tenantId), "Categorias");
  const categoryIds = new Map(categories.map((item: { id: string; name: string }) => [item.name, item.id]));
  for (const item of equipment) {
    const categoryId = categoryIds.get(categoryByType[item.categoria]);
    if (!categoryId) throw new Error(`Categoria ausente para ${item.patrimonio}.`);
    requireResult(await admin.from("equipment").upsert({
      tenant_id: tenantId,
      asset_tag: item.patrimonio,
      category_id: categoryId,
      name: item.nome,
      pickup_location: "Help Desk",
      status: item.situacao === "manutencao" ? "MAINTENANCE" : "AVAILABLE",
    }, { onConflict: "tenant_id,asset_tag" }).select("id").single(), `Equipamento ${item.patrimonio}`);
  }
  const rows = requireResult(await admin.from("equipment").select("asset_tag,name,pickup_location,status,category_id").eq("tenant_id", tenantId), "Conferência dos equipamentos");
  if (rows.length !== 12) throw new Error("O tenant não possui exatamente 12 equipamentos.");
  for (const item of equipment) {
    const row = rows.find((candidate: { asset_tag: string }) => candidate.asset_tag === item.patrimonio);
    if (!row || row.name !== item.nome || row.pickup_location !== "Help Desk"
      || row.category_id !== categoryIds.get(categoryByType[item.categoria])
      || row.status !== (item.situacao === "manutencao" ? "MAINTENANCE" : "AVAILABLE")) {
      throw new Error(`Conferência falhou para ${item.patrimonio}.`);
    }
  }
  return tenantId;
}

export async function ensureIdentity(
  admin: SupabaseClient,
  login: SupabaseClient,
  input: { tenantId: string; email: string; displayName: string; password: string },
): Promise<string> {
  const matches: Array<{ id: string; email?: string }> = [];
  const pageSize = 1000;
  for (let page = 1; ; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (result.error) throw new Error("Não foi possível consultar Auth.");
    matches.push(...result.data.users.filter((user) => user.email?.toLowerCase() === input.email.toLowerCase()));
    if (result.data.users.length < pageSize) break;
  }
  if (matches.length > 1) throw new Error("Auth contém contas duplicadas para o e-mail.");
  let created = false;
  let membershipCreated = false;
  let userId = matches[0]?.id;
  if (!userId) {
    const result = await admin.auth.admin.createUser({
      email: input.email, password: input.password, email_confirm: true,
      user_metadata: { name: input.displayName },
    });
    if (result.error || !result.data.user) throw new Error("Não foi possível criar a conta no Auth.");
    userId = result.data.user.id;
    created = true;
  }
  try {
    let membership = allowMissing(await admin.from("memberships").select("id,role,display_name")
      .eq("tenant_id", input.tenantId).eq("user_id", userId).maybeSingle(), "Consulta da membership") as unknown as { id: string; role: string; display_name: string } | null;
    if (!membership) {
      membership = requireResult(await admin.from("memberships").insert({
        tenant_id: input.tenantId, user_id: userId, role: "COLLABORATOR", display_name: input.displayName,
      }).select("id,role,display_name").single(), "Criação da membership") as unknown as { id: string; role: string; display_name: string };
      membershipCreated = true;
    }
    if (!membership) throw new Error("Membership ausente após a criação.");
    if (membership.role !== "COLLABORATOR" || membership.display_name !== input.displayName) {
      throw new Error("Membership existente diverge do papel ou nome aprovados.");
    }
    const loans = await admin.from("loans").select("id", { count: "exact", head: true })
      .eq("tenant_id", input.tenantId).eq("borrower_membership_id", membership.id);
    if (loans.error || loans.count === null) throw new Error("Não foi possível conferir os empréstimos.");
    if (loans.count !== 0) throw new Error("A conta já possui empréstimos; operação interrompida.");
    const signedIn = await login.auth.signInWithPassword({ email: input.email, password: input.password });
    if (signedIn.error || signedIn.data.user?.id !== userId) {
      throw new Error("Login com a senha informada falhou.");
    }
    await login.auth.signOut();
    return membership.id as string;
  } catch (error) {
    if (membershipCreated) {
      await admin.from("memberships").delete().eq("tenant_id", input.tenantId).eq("user_id", userId);
    }
    if (created) {
      await admin.auth.admin.deleteUser(userId);
    }
    throw error;
  }
}

export async function ensureImages(admin: SupabaseClient, images: ApprovedImage[]): Promise<void> {
  const bucket = await admin.storage.getBucket("equipamentos");
  if (bucket.error) {
    if (!isMissingStorageObject(bucket.error)) throw new Error("Não foi possível consultar o bucket equipamentos.");
    const created = await admin.storage.createBucket("equipamentos", {
      public: true, allowedMimeTypes: ["image/jpeg"],
    });
    if (created.error) throw new Error("Não foi possível criar o bucket equipamentos.");
  } else if (!bucket.data?.public) {
    throw new Error("O bucket equipamentos existente não é público.");
  }
  for (const image of images) {
    const existing = await admin.storage.from("equipamentos").download(image.path);
    if (existing.error) {
      if (!isMissingStorageObject(existing.error)) throw new Error(`Não foi possível consultar ${image.path}.`);
      const uploaded = await admin.storage.from("equipamentos").upload(image.path, image.bytes, {
        contentType: "image/jpeg", upsert: false,
      });
      if (uploaded.error) throw new Error(`Não foi possível enviar ${image.path}.`);
    } else {
      const currentHash = createHash("sha256").update(Buffer.from(await existing.data.arrayBuffer())).digest("hex");
      if (currentHash !== image.sha256) throw new Error(`Objeto existente diverge: ${image.path}.`);
    }
    const checked = await admin.storage.from("equipamentos").download(image.path);
    if (checked.error || !checked.data) throw new Error(`Não foi possível verificar ${image.path}.`);
    const checkedHash = createHash("sha256").update(Buffer.from(await checked.data.arrayBuffer())).digest("hex");
    if (checkedHash !== image.sha256) throw new Error(`Hash remoto divergente: ${image.path}.`);
  }
}

async function main() {
  const target = process.argv[2];
  if (target !== "local" && target !== "production") throw new Error("Use local ou production.");
  const url = process.env.EMPRES_TI_OPERATOR_URL;
  const key = process.env.EMPRES_TI_OPERATOR_SERVICE_KEY;
  const password = process.env.EMPRES_TI_OPERATOR_PASSWORD;
  if (!url || !key || !password) throw new Error("Informe URL, chave e senha pelo prompt oculto do operador.");
  assertOperatorTarget(target, url);
  const images = target === "production" ? await approvedImages() : [];
  const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
  const admin = createClient(url, key, options);
  const login = createClient(url, key, options);
  const tenantId = await ensureEquipment(admin);
  await ensureIdentity(admin, login, { tenantId, email, displayName, password });
  if (target === "production") await ensureImages(admin, images);
  console.info(`${target}: 12 equipamentos, uma conta, uma membership, zero empréstimos${target === "production" ? ", 12 fotos verificadas" : ""}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "O provisionamento falhou.");
    process.exitCode = 1;
  });
}
