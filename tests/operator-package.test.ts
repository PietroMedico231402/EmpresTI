// @vitest-environment node

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { assertOperatorTarget, ensureImages } from "../scripts/operator-initial-data";

describe("pacote do operador", () => {
  it("test_ca_05_separa_supabase_local_da_publicacao_https", () => {
    expect(() => assertOperatorTarget("local", "http://127.0.0.1:54321")).not.toThrow();
    expect(() => assertOperatorTarget("local", "https://projeto.supabase.co")).toThrow();
    expect(() => assertOperatorTarget("production", "http://127.0.0.1:54321")).toThrow();
    expect(() => assertOperatorTarget("production", "http://projeto.supabase.co")).toThrow();
    expect(() => assertOperatorTarget("production", "https://projeto.supabase.co")).not.toThrow();
  });

  it("test_ca_04_ca_05_upload_idempotente_recusa_hash_divergente", async () => {
    const bytes = Buffer.from("imagem aprovada");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const objects = new Map<string, Buffer>();
    const upload = vi.fn(async (path: string, content: Buffer) => {
      if (objects.has(path)) return { data: null, error: { statusCode: "409" } };
      objects.set(path, content);
      return { data: { path }, error: null };
    });
    const download = async (path: string) => objects.has(path)
      ? { data: new Blob([new Uint8Array(objects.get(path)!)]), error: null }
      : { data: null, error: { statusCode: "404" } };
    const admin = {
      storage: {
        getBucket: async () => ({ data: { public: true }, error: null }),
        from: () => ({ download, upload }),
      },
    } as unknown as SupabaseClient;
    const image = { path: "TI-0001.jpg", bytes, sha256 };

    await ensureImages(admin, [image]);
    await ensureImages(admin, [image]);
    expect(objects.get(image.path)).toEqual(bytes);
    expect(upload).toHaveBeenCalledTimes(1);

    objects.set(image.path, Buffer.from("outro conteúdo"));
    await expect(ensureImages(admin, [image])).rejects.toThrow("Objeto existente diverge");
    expect(upload).toHaveBeenCalledTimes(1);
  });
});
