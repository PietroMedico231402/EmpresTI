import sharp from "sharp";

async function readStdin() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input.trim();
}

try {
  const [action, file] = process.argv.slice(2);
  if (action === "resize") {
    const input = Buffer.from(await readStdin(), "base64");
    const source = await sharp(input).metadata();
    if (!source.width || !source.height || source.width < 800 || source.height < 600) {
      throw new Error("A foto selecionada é menor que 800×600.");
    }
    const output = await sharp(input)
      .rotate()
      .resize(800, 600, { fit: "cover", position: "centre" })
      .jpeg({ quality: 85 })
      .toBuffer();
    const result = await sharp(output).metadata();
    if (result.format !== "jpeg" || result.width !== 800 || result.height !== 600) {
      throw new Error("A saída não é JPEG 800×600.");
    }
    process.stdout.write(output.toString("base64"));
  } else if (action === "inspect" && file) {
    const { format, width, height } = await sharp(file).metadata();
    process.stdout.write(JSON.stringify({ format, width, height }));
  } else {
    throw new Error("Ação inválida. Use resize ou inspect.");
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
