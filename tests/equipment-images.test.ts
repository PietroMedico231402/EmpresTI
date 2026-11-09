import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

const skill = resolve(process.cwd(), ".agents/skills/imagens-equipamentos");
const imageTool = join(skill, "scripts/image.mjs");
const validator = join(skill, "scripts/validate.ps1");
const equipment = JSON.parse(readFileSync(join(skill, "references/equipamentos.json"), "utf8")) as Array<{
  patrimonio: string;
  nome: string;
  categoria: string;
  situacao: string;
  busca: string;
}>;
type ManifestRow = (typeof equipment)[number] & {
  pixabayId: number;
  sourcePage: string;
  photographer: string;
  photographerId: number;
  sha256: string;
  imageFile: string;
};
type ReviewRow = {
  patrimonio: string;
  pixabayId: number;
  sha256: string;
  reviewer: string;
  license: string;
  licenseUrl: string;
  semPessoa: boolean;
  semMarcaOuLogo: boolean;
  semTexto: boolean;
  semTelaComConteudo: boolean;
  fotoDistinta: boolean;
};

function runNode(action: string, input: Buffer) {
  return spawnSync(process.execPath, [imageTool, action], {
    encoding: "utf8",
    input: input.toString("base64"),
    maxBuffer: 10 * 1024 * 1024,
  });
}

describe("skill de fotos dos equipamentos", () => {
  it("test_ca_02_gera_jpeg_800x600_apos_download_e_recusa_origem_pequena", async () => {
    const source = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#456789" } })
      .png()
      .toBuffer();
    const prepared = runNode("resize", source);
    expect(prepared.status).toBe(0);
    const output = Buffer.from(prepared.stdout, "base64");
    expect(await sharp(output).metadata()).toMatchObject({ format: "jpeg", width: 800, height: 600 });

    const tooSmall = await sharp({ create: { width: 799, height: 600, channels: 3, background: "#456789" } })
      .png()
      .toBuffer();
    expect(runNode("resize", tooSmall).status).not.toBe(0);
  }, 120_000);

  it("test_ca_02_e_ca_04_exigem_revisao_e_fotos_unicas", async () => {
    const root = mkdtempSync(join(tmpdir(), "empres-ti-image-test-"));
    try {
      const manifest: ManifestRow[] = [];
      const review: ReviewRow[] = [];
      for (const [index, item] of equipment.entries()) {
        const bytes = await sharp({
          create: { width: 800, height: 600, channels: 3, background: { r: index * 19, g: 60, b: 90 } },
        }).jpeg().toBuffer();
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        writeFileSync(join(root, `${item.patrimonio}.jpg`), bytes);
        manifest.push({
          ...item,
          pixabayId: index + 100,
          sourcePage: `https://pixabay.com/photos/${index + 100}/`,
          photographer: `Fotógrafo ${index}`,
          photographerId: index + 200,
          sha256,
          imageFile: `${item.patrimonio}.jpg`,
        });
        review.push({
          patrimonio: item.patrimonio,
          pixabayId: index + 100,
          sha256,
          reviewer: "Revisora de teste",
          license: "Pixabay Content License",
          licenseUrl: "https://pixabay.com/service/terms/",
          semPessoa: true,
          semMarcaOuLogo: true,
          semTexto: true,
          semTelaComConteudo: true,
          fotoDistinta: true,
        });
      }
      const manifestPath = join(root, "manifest.json");
      const reviewPath = join(root, "review.json");
      const verify = () => spawnSync("pwsh", ["-NoProfile", "-File", validator, "-Action", "Verify", "-ReviewPath", reviewPath, "-ReviewRoot", root], {
        encoding: "utf8",
        timeout: 60_000,
      });
      const write = () => {
        writeFileSync(manifestPath, JSON.stringify(manifest));
        writeFileSync(reviewPath, JSON.stringify(review));
      };

      write();
      const approved = verify();
      expect(approved.status, approved.stderr).toBe(0);

      review[0].semPessoa = false;
      write();
      expect(verify().status).not.toBe(0);
      review[0].semPessoa = true;

      manifest[1].pixabayId = manifest[0].pixabayId;
      review[1].pixabayId = manifest[0].pixabayId;
      write();
      const repeatedId = verify();
      expect(repeatedId.status).not.toBe(0);
      expect(repeatedId.stderr).toContain("ID Pixabay duplicado");
      manifest[1].pixabayId = 101;
      review[1].pixabayId = 101;

      const secondPath = join(root, `${equipment[1].patrimonio}.jpg`);
      const originalSecond = readFileSync(secondPath);
      const originalHash = manifest[1].sha256;
      writeFileSync(secondPath, readFileSync(join(root, `${equipment[0].patrimonio}.jpg`)));
      manifest[1].sha256 = manifest[0].sha256;
      review[1].sha256 = manifest[0].sha256;
      write();
      const repeatedImage = verify();
      expect(repeatedImage.status).not.toBe(0);
      expect(repeatedImage.stderr).toContain("Foto final repetida por hash");

      writeFileSync(secondPath, originalSecond);
      manifest[1].sha256 = originalHash;
      review[1].sha256 = originalHash;
      const wrongSize = await sharp({
        create: { width: 799, height: 600, channels: 3, background: "#456789" },
      }).jpeg().toBuffer();
      writeFileSync(secondPath, wrongSize);
      const wrongHash = createHash("sha256").update(wrongSize).digest("hex");
      manifest[1].sha256 = wrongHash;
      review[1].sha256 = wrongHash;
      write();
      const invalidDimensions = verify();
      expect(invalidDimensions.status).not.toBe(0);
      expect(invalidDimensions.stderr).toContain("não é JPEG 800×600");
    } finally {
      if (!root.startsWith(`${tmpdir()}${sep}`)) throw new Error("Diretório de teste fora da pasta temporária.");
      rmSync(root, { recursive: true, force: true });
    }
  }, 120_000);
});
