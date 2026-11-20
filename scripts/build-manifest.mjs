import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GAMES_DIR = path.join(ROOT, "games");
const OUT_FILE = path.join(ROOT, "games-manifest.json");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const entries = fs.existsSync(GAMES_DIR)
  ? fs.readdirSync(GAMES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => d.name)
      .sort()
  : [];

const errors = [];
const games = [];

for (const slug of entries) {
  const dir = path.join(GAMES_DIR, slug);
  if (!SLUG_RE.test(slug)) {
    errors.push(`[${slug}] directory name must be lowercase kebab-case`);
    continue;
  }

  const requiredFiles = ["meta.json", "index.html", "e2e.spec.mjs"];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(dir, file))) {
      errors.push(`[${slug}] missing required file: games/${slug}/${file}`);
    }
  }

  const hasUnitTest = fs.readdirSync(dir).some((f) => /\.test\.(?:js|mjs|ts)$/.test(f));
  if (!hasUnitTest) {
    errors.push(`[${slug}] missing unit test file (e.g. games/${slug}/logic.test.js)`);
  }

  const metaPath = path.join(dir, "meta.json");
  if (!fs.existsSync(metaPath)) continue;

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (err) {
    errors.push(`[${slug}] invalid JSON in meta.json: ${err.message}`);
    continue;
  }

  if (meta.slug !== slug) {
    errors.push(`[${slug}] meta.json slug (${meta.slug}) must match directory name`);
  }
  for (const field of ["title", "tagline", "controls"]) {
    if (typeof meta[field] !== "string" || meta[field].trim().length === 0) {
      errors.push(`[${slug}] meta.json missing non-empty string field: ${field}`);
    }
  }
  if (!Array.isArray(meta.tags) || meta.tags.length === 0 || !meta.tags.every((t) => typeof t === "string" && t.trim())) {
    errors.push(`[${slug}] meta.json tags must be a non-empty array of strings`);
  }

  games.push({
    slug,
    title: meta.title,
    tagline: meta.tagline,
    controls: meta.controls,
    tags: meta.tags,
    author: typeof meta.author === "string" ? meta.author : "Hermes Factory",
    createdAt: typeof meta.createdAt === "string" ? meta.createdAt : "",
    path: `games/${slug}/index.html`,
  });
}

if (errors.length > 0) {
  console.error("Manifest validation failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

games.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") || a.slug.localeCompare(b.slug));
fs.writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), games }, null, 2) + "\n", "utf8");
console.log(`Generated games-manifest.json with ${games.length} game(s).`);
