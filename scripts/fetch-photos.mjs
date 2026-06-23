// Round 3 photo pipeline. Requires `upload.wikimedia.org` + `commons.wikimedia.org`
// in the environment egress allowlist. Run: `node scripts/fetch-photos.mjs`
// For each venue (src/photos.targets.json) it searches Wikimedia Commons, picks a
// FREELY-LICENSED image, downloads ~960px, encodes webp into public/img/<id>.webp,
// and records attribution into src/photos.json. Idempotent (skips existing).
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const UA = "TaccuinoScozia/1.0 (offline travel guide; contact: m1a1h2a@gmail.com)";
const FREE = /cc0|public domain|cc[ -]?by([ -]?sa)?|pdm|no restrictions/i;
const NONFREE = /fair use|non[- ]?free|all rights reserved|copyright/i;
const targets = JSON.parse(readFileSync("src/photos.targets.json", "utf-8"));
const photos = existsSync("src/photos.json") ? JSON.parse(readFileSync("src/photos.json", "utf-8")) : {};
mkdirSync("public/img", { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const getJSON = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
};

async function pick(query) {
  const api = "https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query" +
    "&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=" + encodeURIComponent(query) +
    "&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=960";
  const data = await getJSON(api);
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !ii.thumburl) continue;
    if (ii.mime && !/jpeg|png|webp/.test(ii.mime)) continue;
    const em = ii.extmetadata || {};
    const lic = strip(em.LicenseShortName?.value) || strip(em.License?.value);
    if (!lic || NONFREE.test(lic) || !FREE.test(lic)) continue;
    const artist = strip(em.Artist?.value) || "Wikimedia Commons";
    return { thumburl: ii.thumburl, credit: (artist + " · " + lic).slice(0, 120), source: ii.descriptionurl || p.title };
  }
  return null;
}

let done = 0, skip = 0, fail = 0;
const ids = Object.keys(targets);
for (const id of ids) {
  const out = "public/img/" + id + ".webp";
  if (existsSync(out) && photos[id]) { skip++; continue; }
  try {
    const hit = await pick(targets[id]);
    if (!hit) { console.warn("no free image:", id, targets[id]); fail++; await sleep(400); continue; }
    const r = await fetch(hit.thumburl, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error("img HTTP " + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    await sharp(buf).resize(960, 960, { fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
    photos[id] = { credit: hit.credit, source: hit.source };
    writeFileSync("src/photos.json", JSON.stringify(photos, null, 1));
    done++;
    console.log("✓", id, "→", hit.credit);
    await sleep(500);
  } catch (e) {
    console.warn("fail:", id, e.message); fail++; await sleep(600);
  }
}
console.log(`\nphotos: +${done} new · ${skip} skipped · ${fail} failed · total ${Object.keys(photos).length}/${ids.length}`);
