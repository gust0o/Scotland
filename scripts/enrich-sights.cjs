// Hand-written 5-row info tables for the 26 Edinburgh sights. Keeps existing
// descrizione + curiosità; brings every info table to exactly 5 precise rows.
const fs = require("fs");
const c = JSON.parse(fs.readFileSync("src/content.json", "utf8"));
const I = {
  "es-castle": [["Tipo","Fortezza e museo"],["Ingresso","~£21,50 online (più in cassa)"],["Orari","9:30-18 estate, 9:30-17 inverno"],["Da non perdere","Gioielli della Corona, One O'Clock Gun"],["Consiglio","Biglietto online per saltare la coda"]],
  "es-royalmile": [["Tipo","Via storica"],["Ingresso","Gratis (passeggiata)"],["Durata","1-2 ore con le deviazioni"],["Da non perdere","I closes e i cortili nascosti"],["Quando","Mattina presto, prima della folla"]],
  "es-victoria": [["Tipo","Via panoramica & shopping"],["Ingresso","Gratis"],["Da non perdere","Victoria Terrace dall'alto"],["Come arrivare","Dal Grassmarket per Upper Bow"],["Quando","Luce del mattino per le foto"]],
  "es-dean": [["Tipo","Borgo storico sul fiume"],["Ingresso","Gratis"],["Da non perdere","Vista dal Water of Leith Footbridge"],["Come arrivare","A piedi da Bell's Brae"],["Durata","30-60 min con la passeggiata"]],
  "es-holyrood": [["Tipo","Palazzo reale"],["Ingresso","~£20 (audioguida inclusa)"],["Orari","9:30-18 estate, 9:30-16:30 inverno"],["Da non perdere","Appartamenti di Maria Stuart e l'abbazia"],["Quando","Chiuso per visite reali, verifica prima"]],
  "es-arthurs": [["Tipo","Vulcano spento, 251 m"],["Ingresso","Gratis"],["Durata","45 min di salita, 1,5-2 ore in tutto"],["Da non perdere","La vista a 360° dalla vetta"],["Quando","Giornate limpide; rocce scivolose se bagnate"]],
  "es-calton": [["Tipo","Collina-belvedere"],["Ingresso","Gratis (Nelson Monument a pagamento)"],["Da non perdere","National Monument e vista sulla Old Town"],["Durata","30-45 min"],["Quando","Al tramonto"]],
  "es-maryking": [["Tipo","Tour sotterraneo guidato"],["Ingresso","~£21 online"],["Durata","Circa 1 ora"],["Da non perdere","I vicoli murati del Seicento"],["Consiglio","Prenota prima; non per i più piccoli"]],
  "es-greyfriars": [["Tipo","Cimitero storico"],["Ingresso","Gratis"],["Da non perdere","Greyfriars Bobby e i mortsafe"],["Durata","30-45 min"],["Come arrivare","Su Candlemaker Row, vicino al museo"]],
  "es-camera": [["Tipo","Illusioni ottiche & camera oscura"],["Ingresso","~£22 adulti"],["Durata","1,5-2 ore"],["Da non perdere","La camera oscura sull'Outlook Tower"],["Quando","Ottima coi bambini o se piove"]],
  "es-dynamic": [["Tipo","Museo scientifico interattivo"],["Ingresso","~£21,50 adulti"],["Durata","2-2,5 ore"],["Da non perdere","Il planetario e gli ambienti immersivi"],["Come arrivare","Ai piedi dell'Arthur's Seat"]],
  "es-natmuseum": [["Tipo","Museo nazionale"],["Ingresso","Gratis (mostre a pagamento)"],["Orari","Tutti i giorni 10-17"],["Da non perdere","Dolly la pecora e la terrazza sul tetto"],["Durata","2-3 ore"]],
  "es-natgallery": [["Tipo","Galleria d'arte"],["Ingresso","Gratis (mostre a pagamento)"],["Orari","Tutti i giorni 10-17"],["Da non perdere","Tiziano, Vermeer, Van Gogh"],["Come arrivare","Nei Princes Street Gardens"]],
  "es-britannia": [["Tipo","Panfilo reale (museo)"],["Ingresso","~£21 (audioguida inclusa)"],["Durata","Circa 1,5 ore"],["Da non perdere","Gli appartamenti reali anni '50"],["Come arrivare","A Leith, via Ocean Terminal"]],
  "es-johnnie": [["Tipo","Esperienza whisky"],["Ingresso","~£30 (3 drink inclusi)"],["Durata","Circa 1,5 ore"],["Da non perdere","Il rooftop bar sul Castello"],["Consiglio","Prenota online in anticipo"]],
  "es-scottmonument": [["Tipo","Monumento panoramico"],["Ingresso","~£8 (ridotto £6)"],["Quando","Apr-Ott 10-16:30; Nov-Mar fino 15:30"],["Da non perdere","La salita ai livelli panoramici"],["Dove","East Princes Street Gardens"]],
  "es-gilescathedral": [["Tipo","Cattedrale"],["Ingresso","Donazione (consigliata £6-10)"],["Quando","Estate lun-ven 9-19, dom 13-17"],["Da non perdere","La Thistle Chapel e la torre a corona"],["Dove","High Street, sul Royal Mile"]],
  "es-scotchwhisky": [["Tipo","Esperienza whisky"],["Ingresso","Tour da ~£24"],["Quando","Aperto ogni giorno"],["Da non perdere","La collezione di 3.300 bottiglie"],["Dove","Castlehill, in cima al Royal Mile"]],
  "es-scottishnational": [["Tipo","Galleria di ritratti"],["Ingresso","Gratis"],["Quando","Tutti i giorni 10-17 (gio fino 19)"],["Da non perdere","La Great Hall e il fregio dorato"],["Dove","1 Queen Street, New Town"]],
  "es-scottishnational2": [["Tipo","Arte moderna"],["Ingresso","Gratis (alcune mostre a pagamento)"],["Quando","Tutti i giorni 10-17"],["Da non perdere","Lo studio di Paolozzi e il landform"],["Dove","Belford Road, sul Water of Leith"]],
  "es-surgeonshall": [["Tipo","Museo di chirurgia"],["Ingresso","~£10"],["Quando","Tutti i giorni 10-17 (ultimo 16:30)"],["Da non perdere","Burke & Hare e i preparati anatomici"],["Dove","Nicolson Street, Southside"]],
  "es-writersmuseum": [["Tipo","Casa-museo letteraria"],["Ingresso","Gratis"],["Quando","mer-dom 10-17 (stagionale)"],["Da non perdere","Cimeli di Burns, Scott e Stevenson"],["Dove","Lady Stair's Close, Lawnmarket"]],
  "es-nelsonmonument": [["Tipo","Torre panoramica"],["Ingresso","~£6"],["Quando","Estate 10-18, inverno fino 16"],["Da non perdere","La time ball e la vista a 360°"],["Dove","In cima a Calton Hill"]],
  "es-museummound": [["Tipo","Museo (denaro & banche)"],["Ingresso","Gratis"],["Quando","mar-ven 10-17, sab 13-17"],["Da non perdere","Un milione di sterline in banconote"],["Dove","The Mound, Bank of Scotland"]],
  "es-drneils": [["Tipo","Giardino"],["Ingresso","Gratis (offerta gradita)"],["Quando","Tutti i giorni dalle 10 al tramonto"],["Da non perdere","Il loch e la Thomson's Tower"],["Dove","Duddingston, sotto Arthur's Seat"]],
  "es-gladstonesland": [["Tipo","Casa storica (NTS)"],["Ingresso","A pagamento (gratis soci NTS)"],["Quando","Tutti i giorni 10-16"],["Da non perdere","I soffitti dipinti del 1620 e la gelateria"],["Dove","477B Lawnmarket, Royal Mile"]],
};
c.sights = c.sights || {};
let n = 0;
for (const id in I) { c.sights[id] = { ...(c.sights[id] || {}), info: I[id].map(([k, v]) => ({ k, v })) }; n++; }
fs.writeFileSync("src/content.json", JSON.stringify(c, null, 2) + "\n");
console.log("sights upgraded:", n);
