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
// Bundled venue photos (id → { credit, source }); empty until the photo pipeline runs.
import PHOTOS from "./photos.json";
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
  { id: "es-johnnie", name: "Johnnie Walker Princes St", note: "Whisky con vista, in centro", dur: 90, open: [10, 19], q: "Johnnie Walker Princes Street Edinburgh" },  { id: "es-scottmonument", name: "Scott Monument", note: "Offre la migliore vista ravvicinata del cuore di Edimburgo dopo una salita breve ma scenografica.", dur: 45, open: [10, 16.5], q: "Scott Monument, East Princes Street Gardens, Edinburgh" },
  { id: "es-gilescathedral", name: "St Giles' Cathedral", note: "Capolavoro architettonico gratuito nel punto in cui si decise la storia religiosa scozzese.", dur: 45, open: [9, 17], q: "St Giles' Cathedral, High Street, Royal Mile, Edinburgh" },
  { id: "es-scotchwhisky", name: "The Scotch Whisky Experience", note: "Il modo migliore per capire il whisky scozzese in un'ora, anche per chi non è esperto.", dur: 75, open: [10, 18], q: "The Scotch Whisky Experience, Castlehill, Royal Mile, Edinburgh" },
  { id: "es-scottishnational", name: "Scottish National Portrait Gallery", note: "Unisce grande arte gratuita a un edificio mozzafiato, lontano dalla calca del Royal Mile.", dur: 90, open: [10, 17], q: "Scottish National Portrait Gallery, 1 Queen Street, Edinburgh" },
  { id: "es-scottishnational2", name: "Scottish National Gallery of Modern Art", note: "Arte di livello mondiale immersa nel verde, perfetta da abbinare a una passeggiata lungo il fiume.", dur: 90, open: [10, 17], q: "Scottish National Gallery of Modern Art, Belford Road, Edinburgh" },
  { id: "es-surgeonshall", name: "Surgeons' Hall Museums", note: "Affascinante e non per deboli di stomaco: una finestra unica sulla storia della medicina.", dur: 75, open: [10, 17], q: "Surgeons' Hall Museums, Nicolson Street, Edinburgh" },
  { id: "es-writersmuseum", name: "The Writers' Museum", note: "Gemma gratuita e tranquilla per chi ama i libri, a due passi dal Royal Mile.", dur: 40, open: [10, 17], q: "The Writers' Museum, Lady Stair's Close, Lawnmarket, Edinburgh" },
  { id: "es-nelsonmonument", name: "Nelson Monument", note: "La vista più iconica di Edimburgo, con Arthur's Seat e il Castello nello stesso colpo d'occhio.", dur: 40, open: [10, 18], q: "Nelson Monument, Calton Hill, Edinburgh" },
  { id: "es-museummound", name: "Museum on the Mound", note: "Gratis, curioso e quasi sempre vuoto: una pausa intelligente nel cuore della città.", dur: 45, open: [10, 17], q: "Museum on the Mound, The Mound, Edinburgh" },
  { id: "es-drneils", name: "Dr Neil's Garden", note: "Quiete assoluta e scorci da cartolina, perfetti dopo la salita di Arthur's Seat.", dur: 50, q: "Dr Neil's Garden, Old Church Lane, Duddingston, Edinburgh" },
  { id: "es-gladstonesland", name: "Gladstone's Land", note: "Tuffo autentico nella vita della Old Town secentesca, proprio sul Royal Mile.", dur: 50, open: [10, 16], q: "Gladstone's Land, 477B Lawnmarket, Royal Mile, Edinburgh" },

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
  { id: "ea-cannyman", name: "Canny Man's", cat: "Whisky", note: "Storico, eccentrico, cimeli", dur: 90, open: [12, 23], q: "Canny Man's Edinburgh" },  { id: "ea-timberyard", name: "Timberyard", cat: "Ristorante", note: "Un'esperienza gastronomica scozzese sostenibile e d'autore, tra le migliori della città.", dur: 150, open: [12, 23], q: "Timberyard, 10 Lady Lawson Street, Edinburgh" },
  { id: "ea-littlechartroom", name: "The Little Chartroom", cat: "Ristorante", note: "Cucina raffinata e personale in un ambiente intimo, lontano dai circuiti turistici.", dur: 120, open: [18, 20.5], q: "The Little Chartroom, 14 Bonnington Road, Edinburgh" },
  { id: "ea-noto", name: "Noto", cat: "Ristorante", note: "Piatti creativi e condivisibili a prezzi onesti, con il marchio Bib Gourmand.", dur: 90, open: [12, 21], q: "Noto, 47a Thistle Street, Edinburgh" },
  { id: "ea-scranscallie", name: "The Scran & Scallie", cat: "Gastropub", note: "Cibo da pub scozzese di alto livello firmato da uno chef stellato, in un quartiere autentico.", dur: 100, open: [12, 22], q: "The Scran and Scallie, 1 Comely Bank Road, Stockbridge, Edinburgh" },
  { id: "ea-dishoomedinburgh", name: "Dishoom Edinburgh", cat: "Ristorante", note: "Colazione cult e curry di qualità in un locale dall'atmosfera unica, con ingredienti scozzesi.", dur: 90, open: [8, 23], q: "Dishoom, 3a St Andrew Square, Edinburgh" },
  { id: "ea-bowbar", name: "The Bow Bar", cat: "Whisky bar", note: "Il pub tradizionale scozzese per eccellenza, amato dai locali per whisky e birre.", dur: 60, open: [12, 24], q: "The Bow Bar, 80 West Bow, Victoria Street, Edinburgh" },
  { id: "ea-devilsadvocate", name: "The Devil's Advocate", cat: "Whisky bar", note: "Un gioiello nascosto che unisce grandi whisky, cocktail premiati e cucina scozzese.", dur: 90, open: [12, 24], q: "The Devil's Advocate, 9 Advocate's Close, Edinburgh" },
  { id: "ea-bennetsbar", name: "Bennets Bar", cat: "Pub", note: "Uno degli interni di pub vittoriani più belli di Scozia, perfetto per un whisky pre-teatro.", dur: 60, open: [11, 24], q: "Bennets Bar, 8 Leven Street, Tollcross, Edinburgh" },
  { id: "ea-caferoyal", name: "The Café Royal", cat: "Pub e oyster bar", note: "Storia, atmosfera vittoriana e ostriche fresche in uno dei locali simbolo della città.", dur: 75, open: [11, 23], q: "Cafe Royal, 19 West Register Street, Edinburgh" },
  { id: "ea-pandasons", name: "Panda & Sons", cat: "Cocktail bar", note: "Uno speakeasy iconico con cocktail tra i migliori al mondo, dietro una porta segreta.", dur: 90, q: "Panda and Sons, 79 Queen Street, Edinburgh" },
  { id: "ea-lannanbakery", name: "Lannan Bakery", cat: "Pasticceria", note: "La pasticceria più chiacchierata di Edimburgo, con viennoiserie di livello internazionale.", dur: 30, open: [8, 15], q: "Lannan Bakery, 28 Hamilton Place, Stockbridge, Edinburgh" },
  { id: "ea-alandasgelato", name: "Alandas Gelato", cat: "Gelateria", note: "Gelato artigianale pluripremiato con ingredienti scozzesi, in posizione comodissima.", dur: 20, open: [11, 20], q: "Alandas Gelato, 1 Forrest Road, Edinburgh" },
  { id: "ea-cairngormcoffee", name: "Cairngorm Coffee", cat: "Caffè", note: "Uno dei migliori caffè di Edimburgo per chi cerca specialty coffee e un toast goloso.", dur: 40, open: [8, 17], q: "Cairngorm Coffee, 41a Frederick Street, Edinburgh" },

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
  { id: "dt-queensferry", title: "South Queensferry", train: 25, mode: "Treno (Dalmeny)", visit: 150, body: "I tre ponti sul Forth; battello per Inchcolm Abbey.", q: "South Queensferry" },  { id: "dt-linlithgow", title: "Linlithgow", train: 22, mode: "Treno", visit: 240, body: "Linlithgow Palace è il maestoso palazzo reale, oggi in rovina ma imponente, dove nacque Maria Stuarda nel 1542. Sorge sulle rive del Linlithgow Loch, accanto alla chiesa medievale di St Michael e a una passeggiata lungo il lago amata dalla gente del posto. Dalla stazione il palazzo è raggiungibile in pochi minuti a piedi. Una meta perfetta per chi vuole storia reale e tranquillità a meno di mezz'ora da Edimburgo.", q: "Linlithgow, Scotland" },
  { id: "dt-dunfermline", title: "Dunfermline", train: 35, mode: "Treno", visit: 270, body: "Dunfermline, raggiungibile attraversando in treno il celebre Forth Bridge, fu per secoli capitale del regno di Scozia. La Dunfermline Abbey & Palace custodisce la tomba di Robert the Bruce, mentre la moderna Carnegie Library and Galleries affaccia sul complesso medievale. A pochi passi si apre Pittencrieff Park, vasto parco donato alla città da Andrew Carnegie, con pavoni e sentieri nel verde. Una giornata che unisce re medievali, cultura e spazi aperti.", q: "Dunfermline, Scotland" },
  { id: "dt-rosslynchapel", title: "Rosslyn Chapel & Roslin", train: 50, mode: "Bus", visit: 150, body: "La Rosslyn Chapel, fondata nel 1446, è famosa per le sue sculture in pietra incredibilmente elaborate e per i misteri legati ai Templari e al Santo Graal, popolarizzati dal Codice Da Vinci. Si raggiunge con il bus Lothian 37 in circa un'ora, scendendo a pochi minuti a piedi dalla cappella. La visita prevede una fascia oraria di 90 minuti con un'introduzione guidata. Il vicino villaggio di Roslin e la valle del North Esk offrono belle passeggiate.", q: "Rosslyn Chapel, Roslin, Scotland" },
  { id: "dt-dunbar", title: "Dunbar", train: 25, mode: "Treno", visit: 240, body: "Dunbar è un vivace borgo di mare con due porti (Victoria e Cromwell) e i suggestivi ruderi del Dunbar Castle proprio all'imboccatura del porto. È la città natale di John Muir, padre dei parchi nazionali: la sua casa natale è oggi un museo gratuito sulla High Street. Intorno si estende il John Muir Country Park, con spiagge, dune e sentieri costieri. A soli 20-30 minuti di treno da Edimburgo, è una delle gite di mare più facili in assoluto.", q: "Dunbar, Scotland" },
  { id: "dt-peebles", title: "Peebles", train: 70, mode: "Bus", visit: 270, body: "Peebles è una raffinata cittadina dei Scottish Borders adagiata sulle rive del River Tweed, con una graziosa High Street piena di botteghe, caffè e gallerie d'arte. Si raggiunge con il bus diretto Borders Buses X62 dalla Edinburgh Bus Station in circa 1 ora e un quarto. Oltre alle passeggiate lungo il Tweed e ai monumenti come il Mercat Cross, nei dintorni ci sono la foresta di Glentress (mountain bike e sentieri) e il Dawyck Botanic Garden. Da non perdere il museo dedicato a John Buchan.", q: "Peebles, Scotland" },
  { id: "dt-culross", title: "Culross", train: 75, mode: "Treno + bus", visit: 210, body: "Culross è uno dei villaggi più belli e meglio conservati di Scozia, con vicoli acciottolati e case del Sei-Settecento color ocra. Il gioiello è il Culross Palace del National Trust for Scotland, con i suoi giardini all'antica. È celebre come set di Outlander, dove interpreta la cittadina di Cranesmuir. Si raggiunge con treno fino a Dunfermline (o Falkirk) e poi un bus locale: il viaggio richiede circa due ore a tratta, quindi conviene partire presto.", q: "Culross, Scotland" },
  { id: "dt-anstruthereast", title: "Anstruther & East Neuk", train: 145, mode: "Bus", visit: 240, body: "L'East Neuk di Fife è una collana di villaggi di pescatori dai porti ancora attivi: Anstruther, Pittenweem, St Monans e Crail, con case dai tetti rossi e vicoli sul mare. Anstruther, il più grande, è famoso per l'Anstruther Fish Bar, premiato come miglior friggitoria del Regno Unito e affacciato sul pittoresco porto. Si raggiunge col bus diretto Stagecoach X60, che impiega circa 2 ore e mezza a tratta: una gita lunga ma molto premiante. Dal porto partono in estate le gite in barca verso la Isle of May, regno di pulcinelle di mare.", q: "Anstruther, Scotland" },

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
    { name: "Edinburgh Castle", q: "Edinburgh Castle", ref: "es-castle" },
    { name: "Stirling Castle", q: "Stirling Castle", ref: "dt-stirling" },
    { name: "Tantallon Castle", q: "Tantallon Castle North Berwick", ref: "tv-dt-nberwick-1" },
    { name: "Craigmillar Castle", q: "Craigmillar Castle Edinburgh", ref: "nb-craigmillar" },
    { name: "Linlithgow Palace", q: "Linlithgow Palace", ref: "dt-linlithgow" } ] },
  { id: "ex-whisky", title: "Whisky", hi: "", body: "Distillerie ed esperienze in città e a breve distanza, dal blended ai single malt Lowland.", places: [
    { name: "Johnnie Walker Princes St", q: "Johnnie Walker Princes Street Edinburgh", ref: "es-johnnie" },
    { name: "Scotch Whisky Experience", q: "Scotch Whisky Experience Edinburgh", ref: "es-scotchwhisky" },
    { id: "exw-holyrood", name: "Holyrood Distillery", q: "Holyrood Distillery Edinburgh", note: "Distilleria di whisky e gin nel cuore di Edimburgo, vicino ad Arthur's Seat, con tour e degustazioni." },
    { id: "exw-glenkinchie", name: "Glenkinchie", q: "Glenkinchie Distillery", note: "La distilleria delle Lowlands più vicina a Edimburgo (~30 km): single malt leggero e floreale, tour e tasting." },
    { id: "exw-edradour", name: "Edradour (Pitlochry)", q: "Edradour Distillery Pitlochry", note: "Una delle distillerie più piccole e pittoresche di Scozia, a Pitlochry; una gita più lunga nelle Highlands." } ] },
  { id: "ex-loch", title: "Loch & Highlands", hi: "Loch Lomond — il migliore tra i laghi", body: "Laghi e montagne: il più comodo è Loch Lomond; i grandi nomi delle Highlands sono più lontani.", places: [
    { name: "Loch Lomond (Balloch)", q: "Loch Lomond Balloch", ref: "dt-lochlomond" },
    { id: "exl-katrine", name: "Loch Katrine · Trossachs", q: "Loch Katrine Trossachs", note: "Lago romantico nel cuore dei Trossachs, con un battello a vapore d'epoca; ispirò Sir Walter Scott." },
    { id: "exl-ness", name: "Loch Ness", q: "Loch Ness", note: "Il lago più famoso di Scozia, profondo e misterioso; molto lontano (Highlands), meglio con un tour di più giorni." },
    { id: "exl-glencoe", name: "Glencoe", q: "Glencoe Scotland", note: "La valle più spettacolare delle Highlands, tra montagne e cascate; lontana da Edimburgo, ideale in tour." },
    { id: "exl-glenfinnan", name: "Glenfinnan Viaduct", q: "Glenfinnan Viaduct", note: "Il viadotto del treno di Harry Potter (Jacobite Express); molto lontano, nelle Highlands occidentali." } ] },
  { id: "ex-costa", title: "Costa & Natura", hi: "", body: "Spiagge, scogliere e villaggi di pescatori lungo le due coste vicino a Edimburgo.", places: [
    { name: "North Berwick", q: "North Berwick", ref: "dt-nberwick" },
    { name: "Bass Rock · Seabird Centre", q: "Scottish Seabird Centre North Berwick", ref: "tv-dt-nberwick-0" },
    { name: "East Neuk · Anstruther", q: "Anstruther Fife", ref: "dt-anstruthereast" },
    { id: "exc-crail", name: "Crail", q: "Crail Fife", note: "Il più fotogenico villaggio di pescatori dell'East Neuk, con un porticciolo da cartolina." },
    { id: "exc-stabbs", name: "St Abb's Head", q: "St Abb's Head", note: "Riserva naturale a picco sul mare nei Borders: scogliere drammatiche e colonie di uccelli marini." } ] },
  { id: "ex-cinema", title: "Misteri & Cinema", hi: "", body: "Cappelle esoteriche e i set di Outlander e non solo, tutti raggiungibili in giornata.", places: [
    { name: "Rosslyn Chapel", q: "Rosslyn Chapel", ref: "dt-rosslynchapel" },
    { name: "Linlithgow Palace", q: "Linlithgow Palace", ref: "dt-linlithgow" },
    { id: "exf-doune", name: "Doune Castle", q: "Doune Castle", note: "Castello-set di Outlander, Game of Thrones e Monty Python, vicino a Stirling." },
    { id: "exf-midhope", name: "Midhope (Lallybroch)", q: "Midhope Castle", note: "La 'Lallybroch' di Outlander: torre fortificata nella tenuta di Hopetoun, vicino a South Queensferry." },
    { id: "exf-blackness", name: "Blackness Castle", q: "Blackness Castle", note: "Fortezza a forma di nave sul Forth, set di Outlander e Hamlet; vicino a Linlithgow." } ] },
  { id: "ex-locali", title: "Locali & vita", hi: "", body: "La Scozia che si vive: musica, calcio e pesce freschissimo sul porto di Leith.", places: [
    { name: "Sandy Bell's (folk)", q: "Sandy Bell's Edinburgh", ref: "ea-sandybells" },
    { name: "Seafood a Leith · The Shore", q: "The Shore Leith Edinburgh", ref: "nb-leith" },
    { id: "exo-ghilliedhu", name: "Ceilidh · Ghillie Dhu", q: "Ghillie Dhu Edinburgh", note: "Locale in una ex chiesa per serate di ceilidh, la danza tradizionale scozzese suonata dal vivo." },
    { id: "exo-tynecastle", name: "Hearts · Tynecastle", q: "Tynecastle Park Edinburgh", note: "Lo stadio dell'Heart of Midlothian, una delle due storiche squadre di calcio di Edimburgo." },
    { id: "exo-easterroad", name: "Hibs · Easter Road", q: "Easter Road Stadium Edinburgh", note: "Lo stadio dell'Hibernian, l'altra grande squadra di calcio della città." } ] },
];

// Enriched neighbourhoods (blurb + things to see) from CONTENT.
const neighborhoods = CONTENT.neighborhoods.map((n) => ({ ...n, maps: mapsUrl(n.q) }));

// Copy optional enriched fields (Round 2 content) onto a base object.
const enrich = (o, c) => {
  if (!c) return;
  if (c.summary) o.summary = c.summary;
  if (c.descrizione) o.descrizione = c.descrizione;
  if (c.curiosita) o.curiosita = c.curiosita;
  if (Array.isArray(c.info)) o.info = c.info;
  if (c.meta) o.meta = c.meta;
};

// Merge the enriched descriptions/zones into the base lists.
sights.forEach((s) => { const c = CONTENT.sights[s.id]; if (c) { s.note = c.note || s.note; s.zone = c.zone; enrich(s, c); } });
eats.forEach((e) => { const c = CONTENT.eats[e.id]; if (c) { e.note = c.note || e.note; e.zone = c.zone; e.tipo = c.tipo; e.ordina = c.ordina; enrich(e, c); } });
trips.forEach((t) => { const c = CONTENT.trips[t.id]; if (c) { t.body = c.note || t.body; t.area = c.area; t.transport = c.transport || t.transport; enrich(t, c); } t.venues = (CONTENT.tripVenues && CONTENT.tripVenues[t.id]) || []; });

const glasgow = [
  { name: "Kelvingrove Art Gallery", note: "Museo gratuito e amatissimo, dai Dalí ai Spitfire. Tip: recital d'organo gratis verso le 13.", q: "Kelvingrove Art Gallery Glasgow" },
  { name: "Byres Rd & Ashton Lane", note: "Cuore del West End studentesco: Ashton Lane è un vicolo acciottolato di pub e bistrot. Tip: perfetto la sera.", q: "Ashton Lane Glasgow" },
  { name: "Cathedral & Necropolis", note: "Cattedrale gotica medievale e, dietro, una collina-cimitero vittoriana con vista sulla città. Tip: ingresso libero a entrambe.", q: "Glasgow Cathedral Necropolis" },
  { name: "Riverside Museum", note: "Museo dei trasporti firmato Zaha Hadid sul Clyde, con il veliero Tall Ship accanto. Tip: gratis, ottimo se piove.", q: "Riverside Museum Glasgow" },
  { name: "Burrell Collection", note: "Collezione eclettica (arazzi, Degas, arte cinese) in un edificio di vetro nel parco di Pollok. Tip: riaperta nel 2022, gratis.", q: "Burrell Collection Glasgow" },
  { name: "George Square & Merchant City", note: "La piazza monumentale e il quartiere mercantile di bar e ristoranti. Tip: base per girare il centro a piedi.", q: "George Square Glasgow" },
  { name: "The Pot Still", note: "Storico whisky bar con centinaia di etichette e pie fatte in casa. Tip: fatti consigliare un dram al bancone.", q: "The Pot Still Glasgow" },
  { name: "Ubiquitous Chip", note: "Istituzione del West End per la cucina scozzese moderna, in un cortile-giardino. Tip: brunch o pranzo più abbordabili della cena.", q: "Ubiquitous Chip Glasgow" },
  { name: "King Tut's Wah Wah Hut", note: "Leggendario locale di musica dal vivo su St Vincent Street: qui nel 1993 furono scoperti gli Oasis. Tip: controlla il cartellone, concerti quasi ogni sera.", q: "King Tut's Wah Wah Hut Glasgow" },  { name: "Barrowland Ballroom & The Barras", note: "Esperienza autenticamente glaswegiana tra musica dal vivo e mercato di quartiere.", q: "Barrowland Ballroom Calton Glasgow" },
  { name: "Glasgow Science Centre", note: "Attrazione moderna e divertente che bilancia musei e cattedrali della città.", q: "Glasgow Science Centre Pacific Quay Glasgow" },
  { name: "Gallery of Modern Art (GoMA)", note: "Tappa veloce e gratuita in centro, con uno dei simboli più ironici della città.", q: "Gallery of Modern Art Royal Exchange Square Glasgow" },
  { name: "Hunterian Museum", note: "Unisce storia, scienza e l'atmosfera da Hogwarts del campus universitario.", q: "Hunterian Museum University of Glasgow" },
  { name: "Glasgow Botanic Gardens & Kibble Palace", note: "Pausa verde gratuita perfetta da abbinare a una passeggiata nel West End.", q: "Glasgow Botanic Gardens Great Western Road Glasgow" },
  { name: "House for an Art Lover", note: "Capolavoro mackintoshiano meno turistico, con un bel parco intorno.", q: "House for an Art Lover Bellahouston Park Glasgow" },
  { name: "SWG3", note: "Il volto contemporaneo e underground della scena culturale di Glasgow.", q: "SWG3 Eastvale Place Glasgow" },
  { name: "Sub Club", note: "Per chi ama la musica elettronica, è un pezzo di storia dei club ancora vivo.", q: "Sub Club Jamaica Street Glasgow" },
  { name: "Òran Mór", note: "Un'icona del West End che fonde architettura, teatro e vita notturna.", q: "Oran Mor Byres Road Glasgow" },
  { name: "The Horse Shoe Bar", note: "Pub tradizionale dal carattere genuino, perfetto per una pinta in centro.", q: "The Horse Shoe Bar Drury Street Glasgow" },
  { name: "Mono & Monorail Music", note: "Combinazione unica di buon cibo vegano, vinili e musica dal vivo.", q: "Mono Kings Court King Street Glasgow" },

].map((g, i) => ({ ...g, id: "gl-" + i, maps: mapsUrl(g.q) }));

// Enriched content for the lists that live in code (keyed by id in content.json).
const enrichById = (arr, table) => { if (!table) return; arr.forEach((o) => enrich(o, table[o.id])); };
enrichById(glasgow, CONTENT.glasgow);
enrichById(experiences, CONTENT.experiences);
// neighborhoods & london carry enriched fields directly via their content arrays;
// trip venues can carry them inside content.tripVenues[*][i].

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
      catalog[id] = { id, name: v.name, dur: v.tipo === "mangiare" ? 60 : 90, open: null, kind: "tvenue", q: v.q, note: v.note, trip: t.id, tipo: v.tipo, transferMin: v.transferMin || 0 };
      master[id] = { name: v.name, where: "Gita · " + t.title, note: v.note, maps: mapsUrl(v.q) };
      return id;
    });
  });

  sights.forEach((s) => (master[s.id] = { name: s.name, where: "Edimburgo", note: s.note, maps: mapsUrl(s.q) }));
  eats.forEach((e) => (master[e.id] = { name: e.name, where: "Mangiare", note: e.note, maps: mapsUrl(e.q) }));
  trips.forEach((t) => (master[t.id] = { name: t.title, where: "Dintorni", note: t.body, maps: mapsUrl(t.q) }));
  london.forEach((l) => (master[l.id] = { name: l.name, where: "Londra", note: l.note, maps: mapsUrl(l.q) }));
  // Every venue/activity is favoritable — no exceptions (Glasgow, neighbourhoods, themed experiences).
  glasgow.forEach((g) => (master[g.id] = { name: g.name, where: "Glasgow", note: g.note, maps: g.maps }));
  neighborhoods.forEach((n) => (master[n.id] = { name: n.name, where: "Quartiere · Edimburgo", note: n.blurb || "", maps: n.maps }));
  experiences.forEach((x) => (master[x.id] = { name: x.title, where: "Esperienza a tema", note: x.body || "", maps: mapsUrl((x.places && x.places[0] && x.places[0].q) || x.title) }));

  // Unified detail index (one normalized record per place), used by the shared
  // VenueDetail modal and the 2-line summary rows across the app. photo/curiosita/
  // info/transport are optional and filled in later content/photo/transport rounds.
  const details = {};
  const add = (o) => { details[o.id] = o; };
  // Spreadable enriched fields (Round 2): summary / descrizione / curiosita / info.
  const enr = (o) => ({ summary: o.summary || "", descrizione: o.descrizione || "", curiosita: o.curiosita || "", info: Array.isArray(o.info) ? o.info : [], meta: o.meta || "", photo: o.photo || "", credit: o.credit || "" });
  sights.forEach((s) => add({ id: s.id, name: s.name, kind: "sight", where: "Edimburgo", zone: s.zone || "", dur: s.dur, open: s.open || null, note: s.note, maps: mapsUrl(s.q), ...enr(s) }));
  eats.forEach((e) => add({ id: e.id, name: e.name, kind: "eat", where: "Mangiare a Edimburgo", zone: e.zone || "", tipo: e.tipo || e.cat || "", cat: e.cat || "", ordina: e.ordina || "", dur: e.dur, open: e.open || null, note: e.note, maps: mapsUrl(e.q), ...enr(e) }));
  trips.forEach((t) => add({ id: t.id, name: t.title, kind: "trip", where: "Gita in giornata", area: t.area || "", mode: t.mode || "", train: t.train, visit: t.visit, dur: t.visit + 2 * t.train, note: t.body, maps: mapsUrl(t.q), destQ: t.q, destName: t.title, transport: t.transport || null, venues: (t.venues || []).map((v, i) => ({ id: "tv-" + t.id + "-" + i, name: v.name, tipo: v.tipo, note: v.note, maps: mapsUrl(v.q) })), ...enr(t) }));
  trips.forEach((t) => (t.venues || []).forEach((v, i) => add({ id: "tv-" + t.id + "-" + i, name: v.name, kind: "tvenue", where: "In gita · " + t.title, tipo: v.tipo, dur: v.tipo === "mangiare" ? 60 : 90, note: v.note, maps: mapsUrl(v.q), trip: t.id, tripName: t.title, transferMin: v.transferMin || 0, transferNote: v.transferNote || "", ...enr(v) })));
  london.forEach((l) => add({ id: l.id, name: l.name, kind: "london", where: "Londra", zone: l.zone || "", cat: l.cat || "", tipo: l.cat || "", dur: l.dur, open: l.open || null, note: l.note, maps: mapsUrl(l.q), ...enr(l) }));
  neighborhoods.forEach((n) => add({ id: n.id, name: n.name, kind: "neighborhood", where: "Quartiere · Edimburgo", note: n.blurb, see: n.see || [], maps: n.maps, ...enr(n) }));
  glasgow.forEach((g) => add({ id: g.id, name: g.name, kind: "glasgow", where: "Glasgow", note: g.note, maps: g.maps, ...enr(g) }));
  // Each experience place is a real, favouritable venue. If it has `ref`, it points to an
  // existing venue (rich card); otherwise it's registered here as its own detail + master
  // entry (with a note + Maps + photo slot) so it looks and behaves like any other venue.
  experiences.forEach((x) => {
    const places = (x.places || []).map((p) => {
      const id = (p.ref && details[p.ref]) ? p.ref : p.id;
      if (!details[id]) {
        const maps = mapsUrl(p.q);
        // Synthetic place: enrich it to the same depth as every other venue (descrizione +
        // curiosità + info) from content.expPlaces, falling back to the inline note.
        const ec = (CONTENT.expPlaces && CONTENT.expPlaces[id]) || {};
        details[id] = { id, name: p.name, kind: "sight", where: "Esperienza · " + x.title, note: p.note || "", descrizione: ec.descrizione || p.note || "", curiosita: ec.curiosita || "", info: Array.isArray(ec.info) ? ec.info : [], meta: ec.meta || "", maps, photo: "", credit: "" };
        master[id] = { name: p.name, where: "Esperienza · " + x.title, note: p.note || "", maps };
      }
      return { name: p.name, maps: details[id].maps, ref: id };
    });
    add({ id: x.id, name: x.title, kind: "experience", where: "Esperienza a tema", hi: x.hi || "", note: x.body, places, maps: "", ...enr(x) });
  });

  // Apply bundled photos (Round 3): set photo + credit + source on each detail.
  Object.keys(PHOTOS).forEach((id) => {
    if (details[id]) { details[id].photo = "img/" + id + ".webp"; details[id].credit = PHOTOS[id].credit || ""; details[id].photoSource = PHOTOS[id].source || ""; }
  });

  return {
    sights, eats, trips, london, experiences, neighborhoods, glasgow,
    catalog, master, tripPools, details,
    poolEdi: [...sights.map((s) => s.id), ...eats.map((e) => e.id), ...trips.map((t) => t.id)],
    poolLon: london.map((l) => l.id),
  };
}

// Normalized detail record for any place id (or pass an object through unchanged).
export function venueDetail(idOrObj) {
  if (idOrObj && typeof idOrObj === "object") return idOrObj;
  return getData().details[idOrObj] || null;
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
export const DEFAULT_CHECKLIST = [
  "Carta d'identità/passaporto + carte (contactless)",
  "Adattatore UK tipo G + power bank",
  "Liquidi ≤100 ml in contenitori a norma",
  "Salva offline le mappe di Edimburgo e Londra",
  "Carica voli e alloggi in Impostazioni",
];

export function seedPlan() {
  return {
    favs: [],
    days: { g0: [], g1: [], g2: [], g3: [], g4: [], g5: [] },
    checklist: DEFAULT_CHECKLIST.map((t) => ({ t, done: false })),
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
    // Coordinate dell'alloggio (facoltative): servono solo per stimare i tempi/
    // mezzi/costo da e verso l'hotel — utile se è fuori dal centro. Incolla
    // "lat,lng" (es. "55.9321,-3.1042") o il link Maps con le coordinate.
    coord: "lat,lng",
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
