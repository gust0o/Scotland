// Static content for Taccuino Scozia 2026.
// Everything here is public information (names, public addresses, Maps links).
// Nothing sensitive lives in code — reserved data (flights, hotels, PNR, parking)
// is supplied by the user via JSON and kept only in localStorage.

// The trip is 6 days with a fixed shape (1 notte Londra + 4 notti Edimburgo).
// NO real dates live in code — the calendar dates are derived at runtime from the
// `partenza` field in the reserved JSON (localStorage only). Days are referenced
// by a stable key (g0..g5); cityIdx 0 = Londra, 1 = Edimburgo (for weather/pool).
export const DAYS = [
  { key: "g0", cityIdx: 0, cityLabel: "Londra", role: "andata1" },
  { key: "g1", cityIdx: 1, cityLabel: "Londra → Edimburgo", role: "andata2" },
  { key: "g2", cityIdx: 1, cityLabel: "Edimburgo", role: "edi" },
  { key: "g3", cityIdx: 1, cityLabel: "Edimburgo", role: "edi" },
  { key: "g4", cityIdx: 1, cityLabel: "Edimburgo", role: "edi" },
  { key: "g5", cityIdx: 1, cityLabel: "Rientro", role: "rientro" },
];

// Which reserved flights belong to which day (by itinerary order).
export const FLIGHT_DAYS = { g0: [0], g1: [1], g5: [2, 3] };

// Enriched, zone-organised content (descriptions, neighbourhoods, venue details)
// drafted from the Lonely Planet source. Public information only.
import CONTENT from "./content.json";
export const ZONES_ORDER = CONTENT.zonesOrder;
export const AREAS_ORDER = CONTENT.areasOrder;

// Google Maps search URL for a query.
export const mapsUrl = (q) =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

const sights = [
  { id: "es-castle", name: "Edinburgh Castle", note: "Domina la città; arriva all'apertura", dur: 120, open: [9.5, 18], q: "Edinburgh Castle" },
  { id: "es-royalmile", name: "Royal Mile", note: "La spina dorsale della Old Town", dur: 60, q: "Royal Mile Edinburgh" },
  { id: "es-victoria", name: "Victoria St & Grassmarket", note: "La curva colorata + la piazza dei pub", dur: 45, q: "Victoria Street Edinburgh" },
  { id: "es-dean", name: "Dean Village", note: "Borgo sul Water of Leith, foto perfette", dur: 60, q: "Dean Village Edinburgh" },
  { id: "es-holyrood", name: "Palace of Holyroodhouse", note: "Residenza reale, fine della Royal Mile", dur: 90, open: [9.5, 18], q: "Palace of Holyroodhouse" },
  { id: "es-arthurs", name: "Arthur's Seat", note: "Vulcano spento, vista a 360°", dur: 150, q: "Arthur's Seat Edinburgh" },
  { id: "es-calton", name: "Calton Hill", note: "Monumenti + tramonto sulla città", dur: 45, q: "Calton Hill Edinburgh" },
  { id: "es-maryking", name: "Real Mary King's Close", note: "Vicoli sotterranei. Prenota.", dur: 75, open: [10, 21], q: "Real Mary King's Close" },
  { id: "es-greyfriars", name: "Greyfriars Kirkyard", note: "Cimitero + Bobby", dur: 40, q: "Greyfriars Kirkyard Edinburgh" },
  { id: "es-camera", name: "Camera Obscura", note: "Illusioni ottiche, divertente", dur: 75, open: [9, 19], q: "Camera Obscura Edinburgh" },
  { id: "es-dynamic", name: "Our Dynamic Earth", note: "Il pianeta in chiave interattiva", dur: 120, open: [10, 17.5], q: "Our Dynamic Earth Edinburgh" },
  { id: "es-natmuseum", name: "National Museum of Scotland", note: "Gratis, enorme, terrazza", dur: 120, open: [10, 17], q: "National Museum of Scotland" },
  { id: "es-natgallery", name: "Scottish National Gallery", note: "Gratis, sul Mound", dur: 75, open: [10, 17], q: "Scottish National Gallery" },
  { id: "es-britannia", name: "Royal Yacht Britannia", note: "A Leith, dentro Ocean Terminal", dur: 120, open: [9.5, 16], q: "Royal Yacht Britannia" },
  { id: "es-johnnie", name: "Johnnie Walker Princes St", note: "Whisky con vista, in centro", dur: 90, open: [10, 19], q: "Johnnie Walker Princes Street Edinburgh" },
];

const eats = [
  { id: "ea-oink", name: "Oink", cat: "Pranzo", note: "Panino di hog roast", dur: 30, open: [11, 17], q: "Oink Hog Roast Edinburgh" },
  { id: "ea-makars", name: "Makars Mash Bar", cat: "Cena", note: "Comfort food scozzese", dur: 75, open: [12, 22], q: "Makars Gourmet Mash Bar Edinburgh" },
  { id: "ea-witchery", name: "The Witchery", cat: "Cena", note: "Cena gotica, da occasione", dur: 120, open: [12, 23], q: "The Witchery by the Castle Edinburgh" },
  { id: "ea-ondine", name: "Ondine", cat: "Cena", note: "Pesce e ostriche", dur: 90, open: [12, 22], q: "Ondine Restaurant Edinburgh" },
  { id: "ea-angels", name: "Angels with Bagpipes", cat: "Cena", note: "Sulla Royal Mile, raffinato", dur: 90, open: [12, 22], q: "Angels with Bagpipes Edinburgh" },
  { id: "ea-marymilk", name: "Mary's Milk Bar", cat: "Dolce", note: "Gelato artigianale, Grassmarket", dur: 25, open: [11.5, 18], q: "Mary's Milk Bar Edinburgh" },
  { id: "ea-lovecrumbs", name: "Lovecrumbs", cat: "Dolce", note: "Torte e caffè", dur: 40, open: [10, 18], q: "Lovecrumbs Edinburgh" },
  { id: "ea-fishers", name: "Fishers · The Shore", cat: "Cena", note: "Pesce sul porto a Leith", dur: 90, open: [12, 22], q: "Fishers The Shore Leith Edinburgh" },
  { id: "ea-sandybells", name: "Sandy Bell's", cat: "Pub folk", note: "Musica folk dal vivo ogni sera", dur: 90, open: [12, 24], q: "Sandy Bell's Edinburgh" },
  { id: "ea-sheepheid", name: "Sheep Heid Inn", cat: "Pub", note: "Tra i pub più antichi, a Duddingston", dur: 90, open: [12, 23], q: "Sheep Heid Inn Edinburgh" },
  { id: "ea-cannyman", name: "Canny Man's", cat: "Whisky", note: "Storico, eccentrico, cimeli", dur: 90, open: [12, 23], q: "Canny Man's Edinburgh" },
];

// Day trips from Edinburgh. `train` = one-way travel (minutes), train-first where
// possible; `visit` = time on site. Total duration is computed (visit + 2×train).
const trips = [
  { id: "dt-glasgow", title: "Glasgow", train: 50, mode: "Treno", visit: 300, body: "Kelvingrove, West End e Ashton Lane, cattedrale e necropoli, Riverside Museum.", q: "Glasgow Scotland" },
  { id: "dt-stirling", title: "Stirling + Wallace Monument", train: 50, mode: "Treno", visit: 210, body: "Castle drammatico, National Wallace Monument, campo di Bannockburn.", q: "Stirling Castle" },
  { id: "dt-standrews", title: "St Andrews", train: 75, mode: "Treno + bus", visit: 240, body: "Old Course (culla del golf), West Sands, cattedrale e castello in rovina. Treno fino a Leuchars, poi bus.", q: "St Andrews Scotland" },
  { id: "dt-lochlomond", title: "Loch Lomond", train: 105, mode: "Treno (via Glasgow)", visit: 240, body: "Il migliore tra i laghi: la gita 'vera' se ne fai una. Treno fino a Balloch. Trossachs e Loch Katrine vicini.", q: "Loch Lomond Balloch" },
  { id: "dt-musselburgh", title: "Musselburgh", train: 20, mode: "Treno", visit: 120, body: "Fisherrow Harbour; The Volunteer Arms per il fish & chips. La gita corta perfetta.", q: "Musselburgh Scotland" },
  { id: "dt-nberwick", title: "North Berwick + Tantallon", train: 35, mode: "Treno", visit: 180, body: "Seabird Centre, Tantallon Castle a picco sul mare, Bass Rock.", q: "North Berwick" },
  { id: "dt-falkirk", title: "Falkirk · Kelpies", train: 30, mode: "Treno", visit: 180, body: "The Kelpies (teste di cavallo giganti) e la Falkirk Wheel.", q: "The Kelpies Falkirk" },
  { id: "dt-queensferry", title: "South Queensferry", train: 25, mode: "Treno (Dalmeny)", visit: 150, body: "I tre ponti sul Forth; battello per Inchcolm Abbey.", q: "South Queensferry" },
];

const LONDON_DEFAULT = [
  { id: "lo-truman", name: "Old Truman Brewery", note: "Cuore di Brick Lane, street art e mercatini", dur: 60, q: "Old Truman Brewery London" },
  { id: "lo-beigel", name: "Beigel Bake", cat: "H24", note: "Il salt beef bagel, aperto 24h", dur: 20, q: "Beigel Bake Brick Lane London" },
  { id: "lo-bricklane", name: "Brick Lane · street art", note: "Murales e negozi vintage tra le vie", dur: 45, q: "Brick Lane street art London" },
];
// London comes from the enriched content when available (evening + breakfast).
const london = (CONTENT.londonSpots && CONTENT.londonSpots.length ? CONTENT.londonSpots : LONDON_DEFAULT).map((l) => ({ ...l }));

const experiences = [
  { id: "ex-castelli", title: "Castelli & Storia", hi: "", body: "Dalle fortezze in città ai manieri a picco sul mare: mille anni di storia scozzese in pietra.", places: [
    { name: "Edinburgh Castle", q: "Edinburgh Castle" }, { name: "Stirling Castle", q: "Stirling Castle" }, { name: "Tantallon Castle", q: "Tantallon Castle North Berwick" }, { name: "Craigmillar Castle", q: "Craigmillar Castle Edinburgh" }, { name: "Linlithgow Palace", q: "Linlithgow Palace" } ] },
  { id: "ex-whisky", title: "Whisky", hi: "", body: "Distillerie ed esperienze in città e a breve distanza, dal blended ai single malt Lowland.", places: [
    { name: "Johnnie Walker Princes St", q: "Johnnie Walker Princes Street Edinburgh" }, { name: "Holyrood Distillery", q: "Holyrood Distillery Edinburgh" }, { name: "Scotch Whisky Experience", q: "Scotch Whisky Experience Edinburgh" }, { name: "Glenkinchie", q: "Glenkinchie Distillery" }, { name: "Edradour (Pitlochry)", q: "Edradour Distillery Pitlochry" } ] },
  { id: "ex-loch", title: "Loch & Highlands", hi: "Loch Lomond — il migliore tra i laghi", body: "Laghi e montagne: il più comodo è Loch Lomond; i grandi nomi delle Highlands sono più lontani.", places: [
    { name: "Loch Lomond (Balloch)", q: "Loch Lomond Balloch" }, { name: "Loch Katrine · Trossachs", q: "Loch Katrine Trossachs" }, { name: "Loch Ness", q: "Loch Ness" }, { name: "Glencoe", q: "Glencoe Scotland" }, { name: "Glenfinnan Viaduct", q: "Glenfinnan Viaduct" } ] },
  { id: "ex-costa", title: "Costa & Natura", hi: "", body: "Spiagge, scogliere e villaggi di pescatori lungo le due coste vicino a Edimburgo.", places: [
    { name: "North Berwick", q: "North Berwick" }, { name: "Bass Rock · Seabird Centre", q: "Scottish Seabird Centre North Berwick" }, { name: "East Neuk · Anstruther", q: "Anstruther Fife" }, { name: "Crail", q: "Crail Fife" }, { name: "St Abb's Head", q: "St Abb's Head" } ] },
  { id: "ex-cinema", title: "Misteri & Cinema", hi: "", body: "Cappelle esoteriche e i set di Outlander e non solo, tutti raggiungibili in giornata.", places: [
    { name: "Rosslyn Chapel", q: "Rosslyn Chapel" }, { name: "Doune Castle", q: "Doune Castle" }, { name: "Midhope (Lallybroch)", q: "Midhope Castle" }, { name: "Blackness Castle", q: "Blackness Castle" }, { name: "Linlithgow Palace", q: "Linlithgow Palace" } ] },
  { id: "ex-locali", title: "Locali & vita", hi: "", body: "La Scozia che si vive: musica, calcio e pesce freschissimo sul porto di Leith.", places: [
    { name: "Ceilidh · Ghillie Dhu", q: "Ghillie Dhu Edinburgh" }, { name: "Hearts · Tynecastle", q: "Tynecastle Park Edinburgh" }, { name: "Hibs · Easter Road", q: "Easter Road Stadium Edinburgh" }, { name: "Sandy Bell's (folk)", q: "Sandy Bell's Edinburgh" }, { name: "Seafood a Leith", q: "The Shore Leith Edinburgh" } ] },
];

// Enriched neighbourhoods (blurb + things to see) from CONTENT.
const neighborhoods = CONTENT.neighborhoods.map((n) => ({ ...n, maps: mapsUrl(n.q) }));

// Merge the enriched descriptions/zones into the base lists.
sights.forEach((s) => { const c = CONTENT.sights[s.id]; if (c) { s.note = c.note; s.zone = c.zone; } });
eats.forEach((e) => { const c = CONTENT.eats[e.id]; if (c) { e.note = c.note; e.zone = c.zone; e.tipo = c.tipo; e.ordina = c.ordina; } });
trips.forEach((t) => { const c = CONTENT.trips[t.id]; if (c) { t.body = c.note; t.area = c.area; } t.venues = (CONTENT.tripVenues && CONTENT.tripVenues[t.id]) || []; });

const glasgow = [
  { name: "Kelvingrove Art Gallery", note: "Museo gratuito e amatissimo, dai Dalí ai Spitfire. Tip: recital d'organo gratis verso le 13.", q: "Kelvingrove Art Gallery Glasgow" },
  { name: "Byres Rd & Ashton Lane", note: "Cuore del West End studentesco: Ashton Lane è un vicolo acciottolato di pub e bistrot. Tip: perfetto la sera.", q: "Ashton Lane Glasgow" },
  { name: "Cathedral & Necropolis", note: "Cattedrale gotica medievale e, dietro, una collina-cimitero vittoriana con vista sulla città. Tip: ingresso libero a entrambe.", q: "Glasgow Cathedral Necropolis" },
  { name: "Riverside Museum", note: "Museo dei trasporti firmato Zaha Hadid sul Clyde, con il veliero Tall Ship accanto. Tip: gratis, ottimo se piove.", q: "Riverside Museum Glasgow" },
  { name: "Burrell Collection", note: "Collezione eclettica (arazzi, Degas, arte cinese) in un edificio di vetro nel parco di Pollok. Tip: riaperta nel 2022, gratis.", q: "Burrell Collection Glasgow" },
  { name: "George Square & Merchant City", note: "La piazza monumentale e il quartiere mercantile di bar e ristoranti. Tip: base per girare il centro a piedi.", q: "George Square Glasgow" },
  { name: "The Pot Still", note: "Storico whisky bar con centinaia di etichette e pie fatte in casa. Tip: fatti consigliare un dram al bancone.", q: "The Pot Still Glasgow" },
  { name: "Ubiquitous Chip", note: "Istituzione del West End per la cucina scozzese moderna, in un cortile-giardino. Tip: brunch o pranzo più abbordabili della cena.", q: "Ubiquitous Chip Glasgow" },
].map((g) => ({ ...g, maps: mapsUrl(g.q) }));

// Build catalog (for the scheduler) and master index (for favorites).
function build() {
  const catalog = {};
  sights.forEach((s) => (catalog[s.id] = { id: s.id, name: s.name, dur: s.dur, open: s.open, kind: "sight", q: s.q, note: s.note }));
  eats.forEach((e) => (catalog[e.id] = { id: e.id, name: e.name, dur: e.dur, open: e.open, kind: "eat", q: e.q, note: e.note }));
  trips.forEach((t) => (catalog[t.id] = { id: t.id, name: t.title, dur: t.visit + 2 * t.train, baseVisit: t.visit, train: t.train, open: null, kind: "trip", q: t.q, note: t.body }));
  london.forEach((l) => (catalog[l.id] = { id: l.id, name: l.name, dur: l.dur, open: l.open, kind: l.cat ? "eat" : "sight", q: l.q, pool: "lon", note: l.note }));

  // Schedulable venues that belong to a day trip (appear when that trip is in a day).
  const master = {};
  const tripPools = {};
  trips.forEach((t) => {
    const vs = t.venues || [];
    tripPools[t.id] = vs.map((v, i) => {
      const id = "tv-" + t.id + "-" + i;
      catalog[id] = { id, name: v.name, dur: v.tipo === "mangiare" ? 60 : 90, open: null, kind: "tvenue", q: v.q, note: v.note, trip: t.id, tipo: v.tipo };
      master[id] = { name: v.name, where: "Gita · " + t.title, note: v.note, maps: mapsUrl(v.q) };
      return id;
    });
  });

  sights.forEach((s) => (master[s.id] = { name: s.name, where: "Edimburgo", note: s.note, maps: mapsUrl(s.q) }));
  eats.forEach((e) => (master[e.id] = { name: e.name, where: "Mangiare", note: e.note, maps: mapsUrl(e.q) }));
  trips.forEach((t) => (master[t.id] = { name: t.title, where: "Dintorni", note: t.body, maps: mapsUrl(t.q) }));
  london.forEach((l) => (master[l.id] = { name: l.name, where: "Londra", note: l.note, maps: mapsUrl(l.q) }));

  return {
    sights, eats, trips, london, experiences, neighborhoods, glasgow,
    catalog, master, tripPools,
    poolEdi: [...sights.map((s) => s.id), ...eats.map((e) => e.id), ...trips.map((t) => t.id)],
    poolLon: london.map((l) => l.id),
  };
}

let _data = null;
export function getData() {
  if (!_data) _data = build();
  return _data;
}

// Plan = favourites + per-day event lists. Each day (g0..g5) is a flat array of
// { id, start } where start is "HH:MM"; the calendar positions/size comes from
// the catalog duration. Keyed by day index, so no real dates live here.
// Ships EMPTY by default — no itinerary/schedule is baked into the public code;
// the user builds their own plan (or generates it via the AI template).
export function seedPlan() {
  return {
    favs: [],
    days: { g0: [], g1: [], g2: [], g3: [], g4: [], g5: [] },
  };
}

// JSON template the user copies, fills, and pastes back. Values are INVENTED
// placeholders (format hints, never real data) so a person — or an AI — can see
// exactly how to complete each field. `partenza` (formato AAAA-MM-GG) drives every
// date in the app and is the ONLY place a real date ever lives (localStorage only).
export function emptyScaffold() {
  const volo = (tratta) => ({
    tratta,
    // Aeroporti di questa tratta (codici IATA + città). Restano solo qui, in
    // localStorage: nel codice pubblico gli scali "di casa" sono segnaposto.
    da: "XXX",
    da_citta: "Città di partenza",
    a: "YYY",
    a_citta: "Città di arrivo",
    aeroporto: "Nome aeroporto",
    data: "Gio GG mmm",
    orario: "HH:MM",
    apertura_gate: "HH:MM",
    chiusura_gate: "HH:MM",
    atterraggio: "HH:MM",
    volo: "XX 0000",
    pnr: "ABC123",
  });
  const alloggio = (citta) => ({
    citta,
    nome: "Nome struttura",
    indirizzo: "Via e numero, CAP",
    conferma: "COD-00000",
    pin: "0000",
    tel: "+00 000 000 0000",
    maps: "https://maps.google.com/…",
    link: "https://… (prenotazione)",
    // Codici di accesso forniti dall'hotel (portone, stanza, cassetta chiavi…).
    // Possono essere più d'uno: aggiungi/togli oggetti { tipo, codice } liberamente.
    codici: [
      { tipo: "Portone", codice: "0000" },
      { tipo: "Stanza", codice: "0000" },
    ],
    // Altre note/istruzioni dell'hotel (self check-in, dove ritirare le chiavi…).
    istruzioni: "Note e istruzioni dell'hotel",
  });
  return {
    partenza: "AAAA-MM-GG",
    passeggero: "Nome Cognome",
    voli: [
      volo("1ª tratta — andata"),
      volo("2ª tratta — andata"),
      volo("3ª tratta — ritorno"),
      volo("4ª tratta — ritorno"),
    ],
    alloggi: [alloggio("Londra"), alloggio("Edimburgo")],
    parcheggio: {
      nome: "Nome parcheggio",
      prenotazione: "COD-00000",
      indirizzo: "Indirizzo",
      apertura: "HH:MM",
      chiusura: "HH:MM",
      note: "Es. navetta gratuita ogni 15'",
      maps: "https://…",
    },
    stansted: {
      biglietto: "Dove/come acquistare il biglietto",
      note: "Frequenza e durata del tragitto",
    },
  };
}
