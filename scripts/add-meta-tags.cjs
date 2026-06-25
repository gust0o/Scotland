// Hand-written list-meta tags for the 42 venues that showed no meta line (Glasgow,
// neighbourhoods, experience places). Fixes the bare-row disparity. Merged by data.js.
const fs = require("fs");
const path = "src/content.json";
const c = JSON.parse(fs.readFileSync(path, "utf8"));

const GL = {
  "gl-0": "Museo · gratis", "gl-1": "West End · pub & vie", "gl-2": "Gotico · gratis",
  "gl-3": "Museo · gratis", "gl-4": "Museo · gratis", "gl-5": "Centro · piazza",
  "gl-6": "Whisky bar", "gl-7": "Ristorante · West End", "gl-8": "Live music",
  "gl-9": "Live & mercato", "gl-10": "Famiglie · a pagamento", "gl-11": "Arte moderna · gratis",
  "gl-12": "Museo · gratis", "gl-13": "Giardini · gratis", "gl-14": "Mackintosh · parco",
  "gl-15": "Eventi & arte", "gl-16": "Club · notte", "gl-17": "Arti & eventi",
  "gl-18": "Pub storico", "gl-19": "Vegano & dischi",
};
const NB = {
  "nb-leith": "Quartiere · gourmet", "nb-stockbridge": "Quartiere · chic",
  "nb-botanic": "Giardini · gratis", "nb-portobello": "Quartiere · mare",
  "nb-southside": "Quartiere · arte", "nb-craigmillar": "Castello · panorama",
  "nb-fountainbridge": "Canale · passeggiata",
};
const EX = {
  "exw-holyrood": "Whisky · in città", "exw-glenkinchie": "Whisky · ~30 min", "exw-edradour": "Whisky · ~2h",
  "exl-katrine": "Loch · ~1h30", "exl-ness": "Loch · ~3h+", "exl-glencoe": "Highlands · ~2h30", "exl-glenfinnan": "Harry Potter · ~4h",
  "exc-crail": "Costa Fife · ~1h30", "exc-stabbs": "Costa · ~1h",
  "exf-doune": "Outlander · ~1h", "exf-midhope": "Outlander · ~35 min", "exf-blackness": "Outlander · ~40 min",
  "exo-ghilliedhu": "Ceilidh · West End", "exo-tynecastle": "Calcio · Hearts", "exo-easterroad": "Calcio · Hibs",
};

c.glasgow = c.glasgow || {};
for (const id in GL) { c.glasgow[id] = { ...(c.glasgow[id] || {}), meta: GL[id] }; }
for (const n of c.neighborhoods) { if (NB[n.id]) n.meta = NB[n.id]; }
c.expPlaces = c.expPlaces || {};
for (const id in EX) { c.expPlaces[id] = { ...(c.expPlaces[id] || {}), meta: EX[id] }; }

fs.writeFileSync(path, JSON.stringify(c, null, 2) + "\n");
console.log("meta tags added: glasgow", Object.keys(GL).length, "· nb", Object.keys(NB).length, "· exp", Object.keys(EX).length);
