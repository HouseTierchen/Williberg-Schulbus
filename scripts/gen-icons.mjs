// Generiert PNG-Icons fuer die PWA aus public/wappen.svg
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const svgPath = path.join(root, "public", "wappen.svg");
const outDir = path.join(root, "public", "icons");

const targets = [
  { name: "icon-192.png", size: 192, padding: 18, bg: "#ffffff" },
  { name: "icon-512.png", size: 512, padding: 48, bg: "#ffffff" },
  // maskable: vollflaechiger Hintergrund mit Safe-Zone
  { name: "icon-maskable.png", size: 512, padding: 96, bg: "#0a5ea8" },
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const allExist = (
    await Promise.all(targets.map((t) => exists(path.join(outDir, t.name))))
  ).every(Boolean);
  if (allExist) return;

  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    console.warn(
      "[gen-icons] 'sharp' nicht installiert – ueberspringe Icon-Generierung (PWA bleibt mit SVG installierbar)."
    );
    return;
  }

  const svg = await fs.readFile(svgPath);

  for (const t of targets) {
    const inner = t.size - t.padding * 2;
    const fg = await sharp(svg, { density: 384 })
      .resize(inner, inner, { fit: "contain", background: t.bg })
      .png()
      .toBuffer();

    const out = path.join(outDir, t.name);
    await sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: t.bg,
      },
    })
      .composite([{ input: fg, top: t.padding, left: t.padding }])
      .png()
      .toFile(out);
    console.log("[gen-icons] geschrieben:", path.relative(root, out));
  }
}

main().catch((e) => {
  console.error("[gen-icons] Fehler:", e);
  process.exit(0); // nicht hart fehlschlagen
});
