// Fill pass for venues the Round-3 Wikimedia pipeline couldn't cover (niche cafés/
// restaurants). Private, non-indexed site → we also accept CC-licensed images from
// Openverse (Flickr et al.) as a fallback, with a relevance check so we never paste an
// unrelated image. Wikimedia is tried first (accurate for landmarks). Attribution is
// still recorded into src/photos.json. Run: node scripts/fetch-photos-fill.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const UA = "TaccuinoScozia/1.0 (offline travel guide; contact: m1a1h2a@gmail.com)";
const FREE = /cc0|public domain|cc[ -]?by([ -]?sa)?|pdm|no restrictions/i;
const NONFREE = /fair use|non[- ]?free|all rights reserved|copyright/i;
const photos = existsSync("src/photos.json") ? JSON.parse(readFileSync("src/photos.json", "utf-8")) : {};
mkdirSync("public/img", { recursive: true });

// id -> { q: search query, kw: keyword that MUST appear in an Openverse hit to accept it }
const FILL = {
  "ea-timberyard": { q: "Timberyard Edinburgh", kw: "timberyard" },
  "ea-littlechartroom": { q: "The Little Chartroom Edinburgh", kw: "chartroom" },
  "ea-noto": { q: "Noto Edinburgh", kw: "noto" },
  "ea-scranscallie": { q: "The Scran and Scallie Stockbridge Edinburgh", kw: "scallie" },
  "ea-dishoomedinburgh": { q: "Dishoom Edinburgh", kw: "dishoom" },
  "ea-bowbar": { q: "The Bow Bar Victoria Street Edinburgh", kw: "bow bar" },
  "ea-lannanbakery": { q: "Lannan Bakery Edinburgh", kw: "lannan" },
  "ea-alandasgelato": { q: "Alandas Edinburgh", kw: "alanda" },
  "ea-cairngormcoffee": { q: "Cairngorm Coffee Edinburgh", kw: "cairngorm" },
  "lo-colazione-allpress": { q: "Allpress Espresso Shoreditch London", kw: "allpress" },
  "lo-colazione-friends": { q: "Friends of Ours Hoxton", kw: "friends of ours" },
  "lo-colazione-ozone": { q: "Ozone Coffee Roasters Shoreditch London", kw: "ozone" },
  "lo-spitalfields": { q: "Old Spitalfields Market London", kw: "spitalfields" },
  "lo-christ-church": { q: "Christ Church Spitalfields London", kw: "christ church" },
  "lo-boxpark": { q: "Boxpark Shoreditch London", kw: "boxpark" },
  "lo-redchurch": { q: "Redchurch Street Shoreditch London", kw: "redchurch" },
  "lo-ten-bells": { q: "The Ten Bells pub Spitalfields London", kw: "ten bells" },
  "lo-stpauls": { q: "St Paul's Cathedral London exterior", kw: "paul" },
  "lo-millennium": { q: "Millennium Bridge London Thames", kw: "millennium" },
  "lo-tate-modern": { q: "Tate Modern London building", kw: "tate" },
  "lo-gunpowderspitalfields": { q: "Gunpowder London restaurant", kw: "gunpowder" },
  "gl-6": { q: "Pot Still Glasgow", kw: "pot still" },
  "gl-19": { q: "Mono Glasgow", kw: "mono glasgow" },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const getJSON = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
};

async function wikimedia(query, kw) {
  const api = "https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query" +
    "&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=" + encodeURIComponent(query) +
    "&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=960";
  const data = await getJSON(api);
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  const need = (kw || "").toLowerCase();
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !ii.thumburl) continue;
    if (ii.mime && !/jpeg|png|webp/.test(ii.mime)) continue;
    const em = ii.extmetadata || {};
    const lic = strip(em.LicenseShortName?.value) || strip(em.License?.value);
    if (!lic || NONFREE.test(lic) || !FREE.test(lic)) continue;
    // Relevance gate: the file title (or category/description) must mention the venue,
    // else a generic search term like "pot still" matches an unrelated still-life painting.
    const hay = ((p.title || "") + " " + strip(em.ImageDescription?.value) + " " + strip(em.Categories?.value)).toLowerCase();
    if (need && !hay.includes(need)) continue;
    const artist = strip(em.Artist?.value) || "Wikimedia Commons";
    return { url: ii.thumburl, credit: (artist + " · " + lic).slice(0, 120), source: ii.descriptionurl || p.title };
  }
  return null;
}

async function openverse(query, kw) {
  const api = "https://api.openverse.org/v1/images/?mature=false&page_size=8&q=" + encodeURIComponent(query);
  const data = await getJSON(api);
  const results = data?.results || [];
  const need = kw.toLowerCase();
  for (const r of results) {
    const hay = ((r.title || "") + " " + (Array.isArray(r.tags) ? r.tags.map((t) => t.name).join(" ") : "") + " " + (r.foreign_landing_url || "")).toLowerCase();
    if (!hay.includes(need)) continue; // relevance gate — must mention the venue
    const url = r.url || r.thumbnail;
    if (!url) continue;
    const creator = r.creator || "Unknown";
    const lic = (r.license || "cc").toUpperCase() + (r.license_version ? " " + r.license_version : "");
    return { url, thumb: r.thumbnail, credit: (creator + " · " + lic + " · Openverse").slice(0, 120), source: r.foreign_landing_url || r.url };
  }
  return null;
}

async function download(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("img HTTP " + r.status);
  return Buffer.from(await r.arrayBuffer());
}

let done = 0, fail = 0;
const fills = [];
for (const id of Object.keys(FILL)) {
  const out = "public/img/" + id + ".webp";
  if (existsSync(out) && photos[id]) { continue; }
  const { q, kw } = FILL[id];
  try {
    let hit = await wikimedia(q, kw);
    let via = "wiki";
    if (!hit) { hit = await openverse(q, kw); via = "openverse"; }
    if (!hit) { console.warn("∅ no image:", id, q); fail++; await sleep(300); continue; }
    let buf;
    try { buf = await download(hit.url); }
    catch (e) { if (hit.thumb) buf = await download(hit.thumb); else throw e; }
    await sharp(buf).resize(960, 960, { fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
    photos[id] = { credit: hit.credit, source: hit.source };
    writeFileSync("src/photos.json", JSON.stringify(photos, null, 1));
    done++; fills.push(id);
    console.log("✓", id, "[" + via + "]", "→", hit.credit);
    await sleep(400);
  } catch (e) {
    console.warn("✗ fail:", id, e.message); fail++; await sleep(400);
  }
}
writeFileSync("scripts/.fill-result.json", JSON.stringify(fills));
console.log(`\nfill: +${done} new · ${fail} failed`);
