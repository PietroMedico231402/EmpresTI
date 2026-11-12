import { afterEach, describe, expect, it } from "vitest";

import { equipmentImageUrl } from "./equipment-image";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
});

describe("URL pública da foto do equipamento", () => {
  it("usa o patrimônio como nome estável no bucket equipamentos", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co/";

    expect(equipmentImageUrl("TI-0001")).toBe("https://project.supabase.co/storage/v1/object/public/equipamentos/TI-0001.jpg");
  });

  it("não cria URL quando o endereço público não está configurado", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(equipmentImageUrl("TI-0001")).toBeNull();
  });
});
