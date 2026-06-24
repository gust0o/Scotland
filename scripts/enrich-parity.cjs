// One-shot: enrich the 17 under-detailed venues to match the rest (descrizione +
// curiosità + info). 15 synthetic experience places go into content.expPlaces (merged
// in data.js build()); 2 trip venues get an info[] added to their tripVenues entry.
const fs = require("fs");
const path = "src/content.json";
const c = JSON.parse(fs.readFileSync(path, "utf8"));

c.expPlaces = {
  "exw-holyrood": {
    descrizione: "La prima distilleria di whisky single malt tornata nel cuore di Edimburgo dopo quasi un secolo, aperta nel 2019 in un ex edificio ferroviario vittoriano ai piedi di Arthur's Seat. Produce sia whisky sia gin, con un approccio sperimentale su lieviti e orzi. I tour sono interattivi e ricchi di degustazioni, adatti anche ai principianti. È a pochi minuti a piedi dalla Royal Mile e da Holyrood Park.",
    curiosita: "È stata la prima distilleria di single malt a produrre di nuovo nel centro di Edimburgo dopo quasi 100 anni.",
    info: [{ k: "Tipo", v: "Whisky & gin" }, { k: "Dove", v: "St Leonard's, Edimburgo" }, { k: "Visita", v: "Tour con degustazione" }, { k: "Come arrivare", v: "A piedi dalla Royal Mile" }, { k: "Prezzo", v: "Tour a pagamento" }],
  },
  "exw-glenkinchie": {
    descrizione: "La distilleria di Lowland più vicina a Edimburgo, immersa nella campagna dell'East Lothian a circa mezz'ora dalla città. Conosciuta come 'The Edinburgh Malt', produce un single malt leggero, erbaceo e floreale, tipico dello stile Lowland. Il tour mostra alcuni degli alambicchi più grandi della Scozia e un museo storico della distillazione. Si raggiunge comodamente in auto o con i tour da Edimburgo.",
    curiosita: "Ha alcuni degli alambicchi più grandi di tutta la Scozia e custodisce un grande modello in scala di una distilleria degli anni '20.",
    info: [{ k: "Tipo", v: "Lowland single malt" }, { k: "Dove", v: "Pencaitland, East Lothian" }, { k: "Distanza", v: "~30 km da Edimburgo" }, { k: "Come arrivare", v: "Auto / tour" }, { k: "Prezzo", v: "Tour a pagamento" }],
  },
  "exw-edradour": {
    descrizione: "Una delle distillerie più piccole e pittoresche di Scozia, nascosta tra le colline della Perthshire vicino a Pitlochry. Per decenni è stata la più piccola del Paese, con una produzione quasi artigianale gestita da pochissime persone. I suoi single malt sono ricchi e corposi, alcuni maturati in botti da Sherry. È la gita più lunga di questo gruppo: si è già nelle Highlands meridionali, a circa due ore da Edimburgo.",
    curiosita: "Per oltre 150 anni è stata la distilleria più piccola della Scozia, gestita da appena tre persone.",
    info: [{ k: "Tipo", v: "Highland single malt" }, { k: "Dove", v: "Pitlochry, Perthshire" }, { k: "Distanza", v: "~2 h da Edimburgo" }, { k: "Come arrivare", v: "Auto / treno a Pitlochry" }, { k: "Prezzo", v: "Tour a pagamento" }],
  },
  "exl-katrine": {
    descrizione: "Un lago romantico nel cuore dei Trossachs, dentro il parco nazionale del Loch Lomond. Le sue acque limpide si attraversano a bordo del 'Sir Walter Scott', un battello a vapore d'epoca ancora in servizio. Il paesaggio di boschi e colline ispirò il poema 'La donna del lago' di Walter Scott. È raggiungibile in circa un'ora e mezza/due ore da Edimburgo, ideale per chi cerca natura senza spingersi nelle Highlands profonde.",
    curiosita: "Il lago rifornisce d'acqua potabile gran parte di Glasgow da oltre 150 anni, tramite un acquedotto vittoriano.",
    info: [{ k: "Dove", v: "Trossachs, Loch Lomond NP" }, { k: "Distanza", v: "~1h30–2h da Edimburgo" }, { k: "Da non perdere", v: "Battello a vapore Sir Walter Scott" }, { k: "Come arrivare", v: "Auto / tour" }, { k: "Quando", v: "Primavera–autunno" }],
  },
  "exl-ness": {
    descrizione: "Il lago più famoso di Scozia, lungo e profondissimo, incastonato nella Great Glen vicino a Inverness. Le sue acque scure alimentano da secoli la leggenda di Nessie, il mostro del lago. Sulle rive sorgono le rovine suggestive del castello di Urquhart. È molto lontano da Edimburgo (oltre tre ore): conviene visitarlo con un tour in giornata lungo o un viaggio di più giorni nelle Highlands.",
    curiosita: "Loch Ness contiene più acqua dolce di tutti i laghi di Inghilterra e Galles messi insieme.",
    info: [{ k: "Dove", v: "Great Glen, vicino a Inverness" }, { k: "Distanza", v: "~3–3h30 da Edimburgo" }, { k: "Da non perdere", v: "Castello di Urquhart" }, { k: "Come arrivare", v: "Tour in giornata / più giorni" }, { k: "Quando", v: "Tutto l'anno" }],
  },
  "exl-glencoe": {
    descrizione: "La valle più spettacolare delle Highlands: una gola glaciale tra montagne imponenti, cascate e brughiere. Il profilo drammatico delle 'Three Sisters' è una delle viste più iconiche della Scozia. Glencoe è anche un luogo carico di storia, teatro del tragico massacro del 1692. È lontana da Edimburgo (circa 2h30–3h): perfetta come tappa di un tour delle Highlands, magari verso Fort William.",
    curiosita: "Glencoe è comparsa in film come Skyfall e Harry Potter, e custodisce il ricordo del massacro dei MacDonald del 1692.",
    info: [{ k: "Dove", v: "Highlands occidentali" }, { k: "Distanza", v: "~2h30–3h da Edimburgo" }, { k: "Da non perdere", v: "Le Three Sisters" }, { k: "Come arrivare", v: "Auto / tour Highlands" }, { k: "Quando", v: "Tutto l'anno (meglio sereno)" }],
  },
  "exl-glenfinnan": {
    descrizione: "Il viadotto ferroviario curvo reso celebre dal treno di Harry Potter, l'Hogwarts Express. Si trova in una posizione spettacolare sopra il Loch Shiel, vicino a Fort William, nelle Highlands occidentali. In estate vi transita il treno a vapore Jacobite, uno spettacolo molto fotografato. È molto lontano da Edimburgo (circa 4 ore): è una meta da viaggio dedicato o tour di più giorni.",
    curiosita: "Il treno a vapore Jacobite che attraversa il viadotto è lo stesso usato come Hogwarts Express nei film di Harry Potter.",
    info: [{ k: "Dove", v: "Vicino a Fort William" }, { k: "Distanza", v: "~4 h da Edimburgo" }, { k: "Da non perdere", v: "Il treno a vapore Jacobite" }, { k: "Come arrivare", v: "Auto / tour più giorni" }, { k: "Quando", v: "Estate (per il treno)" }],
  },
  "exc-crail": {
    descrizione: "Il più fotogenico villaggio di pescatori dell'East Neuk di Fife, con un porticciolo da cartolina racchiuso tra case di pietra. Le viuzze e il molo hanno ispirato generazioni di pittori e fotografi. Sul porto si gustano aragoste e granchi appena pescati. Si raggiunge in circa un'ora e mezza da Edimburgo, lungo la bella costa della Fife.",
    curiosita: "Il porticciolo di Crail è uno dei soggetti più dipinti e fotografati di tutta la Scozia.",
    info: [{ k: "Dove", v: "East Neuk, Fife" }, { k: "Distanza", v: "~1h30 da Edimburgo" }, { k: "Da non perdere", v: "Il porticciolo; aragosta sul molo" }, { k: "Come arrivare", v: "Auto / bus" }, { k: "Quando", v: "Primavera–autunno" }],
  },
  "exc-stabbs": {
    descrizione: "Una riserva naturale a picco sul Mare del Nord nei Borders, fatta di scogliere drammatiche e sentieri sul ciglio del mare. In primavera ed estate le falesie ospitano grandi colonie di uccelli marini, tra urie, gazze marine e gabbiani. Il piccolo villaggio di St Abbs accanto è un porticciolo pittoresco. È a circa un'ora/un'ora e mezza da Edimburgo lungo la costa sud-orientale.",
    curiosita: "Il villaggio di St Abbs è stato usato come 'Nuova Asgard' nel film Avengers: Endgame.",
    info: [{ k: "Dove", v: "Berwickshire, Borders" }, { k: "Distanza", v: "~1h–1h30 da Edimburgo" }, { k: "Da non perdere", v: "Scogliere e colonie di uccelli" }, { k: "Come arrivare", v: "Auto" }, { k: "Quando", v: "Primavera–estate (uccelli)" }],
  },
  "exf-doune": {
    descrizione: "Un castello medievale straordinariamente conservato vicino a Stirling, famoso più per cinema e TV che per la sua storia. È stato set di Monty Python e il Sacro Graal, di Outlander (come Castello Leoch) e del pilot di Game of Thrones (Grande Inverno). Costruito a fine Trecento per Robert Stewart, duca di Albany, conserva una grande sala e cucine imponenti. Si raggiunge in circa un'ora da Edimburgo.",
    curiosita: "L'audioguida del castello è narrata da Terry Jones dei Monty Python e da un membro del cast di Outlander.",
    info: [{ k: "Dove", v: "Vicino a Stirling" }, { k: "Distanza", v: "~1 h da Edimburgo" }, { k: "Set di", v: "Outlander, Monty Python, GoT" }, { k: "Ingresso", v: "A pagamento (HES)" }, { k: "Come arrivare", v: "Auto / bus + treno" }],
  },
  "exf-midhope": {
    descrizione: "Una torre fortificata del Cinquecento nella tenuta di Hopetoun, vicino a South Queensferry. Per i fan di Outlander è 'Lallybroch', la casa di famiglia dei Fraser (Broch Tuarach). Si visita solo dall'esterno, ma il fascino della torre solitaria nella campagna ripaga il breve percorso. È a circa mezz'ora/quaranta minuti da Edimburgo, facilmente abbinabile a una gita verso Linlithgow o il Forth.",
    curiosita: "In Outlander è la casa natale di Jamie Fraser: i fan arrivano da tutto il mondo per fotografarne l'ingresso.",
    info: [{ k: "Dove", v: "Tenuta di Hopetoun" }, { k: "Distanza", v: "~30–40 min da Edimburgo" }, { k: "Set di", v: "Outlander (Lallybroch)" }, { k: "Visita", v: "Solo esterno" }, { k: "Come arrivare", v: "Auto" }],
  },
  "exf-blackness": {
    descrizione: "Una fortezza di pietra protesa sul Firth of Forth, soprannominata 'la nave che non salpò mai' per la sua sagoma allungata. Il profilo massiccio sull'acqua ne fa uno dei castelli più scenografici di Scozia. È stato set di Outlander (come Fort William), dell'Hamlet di Zeffirelli e di Outlaw King. Si trova vicino a Linlithgow, a circa quaranta minuti da Edimburgo.",
    curiosita: "La forma allungata sull'acqua le è valsa il soprannome di 'the ship that never sailed', la nave che non salpò mai.",
    info: [{ k: "Dove", v: "Vicino a Linlithgow" }, { k: "Distanza", v: "~40 min da Edimburgo" }, { k: "Set di", v: "Outlander, Outlaw King" }, { k: "Ingresso", v: "A pagamento (HES)" }, { k: "Come arrivare", v: "Auto / treno + taxi" }],
  },
  "exo-ghilliedhu": {
    descrizione: "Un grande locale nel West End di Edimburgo, ricavato in un'ex chiesa dalle volte di legno. È uno dei posti migliori in città per vivere un ceilidh, la danza tradizionale scozzese suonata dal vivo. La band guida i passi anche dei principianti, tra giri, balli di gruppo e tanta birra. È a due passi da Princes Street, perfetto per una serata folk autentica.",
    curiosita: "A un ceilidh non serve saper ballare: un 'caller' spiega ogni passo prima della danza, e ci si lancia tutti insieme.",
    info: [{ k: "Dove", v: "Rutland Place, West End" }, { k: "Cosa", v: "Ceilidh dal vivo" }, { k: "Quando", v: "Sera (serate dedicate)" }, { k: "Come arrivare", v: "A piedi dal centro" }, { k: "Prezzo", v: "Ingresso/serata variabile" }],
  },
  "exo-tynecastle": {
    descrizione: "Lo stadio dell'Heart of Midlothian, una delle due storiche squadre di calcio di Edimburgo, nel quartiere di Gorgie. La curva maroon dei tifosi crea un'atmosfera intensa nei giorni di partita. Si può assistere a un match della Scottish Premiership o visitare lo stadio con un tour. È a ovest del centro, raggiungibile in pochi minuti di bus o tram più una breve passeggiata.",
    curiosita: "Hearts e Hibs danno vita al derby di Edimburgo, una delle rivalità calcistiche più antiche del mondo.",
    info: [{ k: "Squadra", v: "Heart of Midlothian (Hearts)" }, { k: "Dove", v: "Gorgie, Edimburgo" }, { k: "Cosa", v: "Partite / tour stadio" }, { k: "Come arrivare", v: "Bus / tram + a piedi" }, { k: "Colori", v: "Maroon" }],
  },
  "exo-easterroad": {
    descrizione: "Lo stadio dell'Hibernian, l'altra grande squadra di calcio di Edimburgo, nel quartiere di Leith. I tifosi 'Hibees' riempiono le tribune verdi e bianche di cori e passione. Si può vivere una partita della Scottish Premiership o scoprire la storia del club. È a nord-est del centro, comodo da abbinare a una passeggiata a Leith.",
    curiosita: "L'inno dei tifosi dell'Hibs è 'Sunshine on Leith' dei Proclaimers, diventato anche un film.",
    info: [{ k: "Squadra", v: "Hibernian (Hibs)" }, { k: "Dove", v: "Leith, Edimburgo" }, { k: "Cosa", v: "Partite / storia del club" }, { k: "Come arrivare", v: "Bus + a piedi" }, { k: "Colori", v: "Verde e bianco" }],
  },
};

// Two trip venues already have descrizione + curiosità — just add an info[].
c.tripVenues["dt-standrews"][6].info = [
  { k: "Dove", v: "St Andrews, Fife" }, { k: "Accesso", v: "Libero, sempre aperta" }, { k: "Da non perdere", v: "Vista sull'Old Course" }, { k: "Famosa per", v: "'Momenti di gloria'" }, { k: "Come arrivare", v: "A piedi dal centro" },
];
c.tripVenues["dt-lochlomond"][6].info = [
  { k: "Tipo", v: "Highland single malt" }, { k: "Dove", v: "Dumgoyne, a nord di Glasgow" }, { k: "Visita", v: "Tour + degustazione" }, { k: "Come arrivare", v: "Auto / tour" }, { k: "Prezzo", v: "Tour a pagamento" },
];

fs.writeFileSync(path, JSON.stringify(c, null, 2) + "\n");
console.log("content.json updated: +expPlaces(" + Object.keys(c.expPlaces).length + "), +2 tripVenue info");
