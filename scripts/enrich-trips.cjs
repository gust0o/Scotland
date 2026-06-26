const fs = require("fs");
const c = JSON.parse(fs.readFileSync("src/content.json", "utf8"));
const I = {
  "dt-glasgow": [["Tipo","Città d'arte e cultura"],["Come arrivare","Treno ~50 min da Edimburgo"],["Durata","Giornata intera"],["Da vedere","Kelvingrove, Mackintosh, West End"],["Da non perdere","I musei gratuiti"]],
  "dt-stirling": [["Tipo","Città storica e castelli"],["Come arrivare","Treno ~50 min"],["Durata","Giornata intera"],["Da vedere","Castello e Wallace Monument"],["Da non perdere","Bannockburn"]],
  "dt-standrews": [["Tipo","Cittadina costiera e storica"],["Come arrivare","Treno a Leuchars + bus"],["Durata","Giornata intera"],["Da vedere","Old Course, cattedrale, castello"],["Da non perdere","West Sands"]],
  "dt-lochlomond": [["Tipo","Lago e parco nazionale"],["Come arrivare","Via Glasgow, treno a Balloch"],["Durata","Giornata intera"],["Da vedere","Crociera e villaggio di Luss"],["Da non perdere","I sentieri sul lago"]],
  "dt-musselburgh": [["Tipo","Cittadina costiera, gita facile"],["Come arrivare","Treno o bus ~20 min"],["Durata","Mezza giornata"],["Da vedere","Old Golf Course, Fisherrow"],["Da non perdere","Lagune di Levenhall"]],
  "dt-nberwick": [["Tipo","Cittadina balneare e natura"],["Come arrivare","Treno ~35 min"],["Durata","Giornata intera"],["Da vedere","Tantallon e North Berwick Law"],["Da non perdere","Bass Rock e gli uccelli marini"]],
  "dt-falkirk": [["Tipo","Ingegneria, arte e parchi"],["Come arrivare","Treno ~30-40 min"],["Durata","Mezza o intera giornata"],["Da vedere","Falkirk Wheel, Helix Park"],["Da non perdere","The Kelpies"]],
  "dt-queensferry": [["Tipo","Borgo costiero e ponti"],["Come arrivare","Treno ~15-25 min (Dalmeny)"],["Durata","Mezza o intera giornata"],["Da vedere","Forth Bridge, Dalmeny House"],["Da non perdere","La gita a Inchcolm"]],
  "dt-linlithgow": [["Tipo","Palazzo reale"],["Come arrivare","Treno ~20 min, a piedi dalla stazione"],["Ingresso","A pagamento (HES; -25% senza auto)"],["Da vedere","Linlithgow Palace e St Michael"],["Da non perdere","Il loch, culla di Maria Stuart"]],
  "dt-dunfermline": [["Tipo","Antica capitale di Scozia"],["Come arrivare","Treno ~35 min via Forth Bridge"],["Durata","Mezza giornata"],["Da vedere","Abbey & Palace, Pittencrieff Park"],["Da non perdere","La tomba di Robert the Bruce"]],
  "dt-rosslynchapel": [["Tipo","Cappella misteriosa"],["Come arrivare","Bus Lothian 37, ~1 ora"],["Visita","Fascia oraria di 90 min"],["Orari","Lun-sab dalle 9, dom dalle 12"],["Da non perdere","Le sculture e l'Apprentice Pillar"]],
  "dt-dunbar": [["Tipo","Borgo di mare"],["Come arrivare","Treno ~20-30 min, ogni ora"],["Da vedere","Dunbar Castle e i due porti"],["Gratis","John Muir's Birthplace"],["Natura","John Muir Country Park"]],
  "dt-peebles": [["Tipo","Cittadina dei Borders"],["Come arrivare","Bus X62 diretto, ~1h15"],["Da vedere","High Street e il River Tweed"],["Natura","Glentress, Dawyck Garden"],["Cultura","The John Buchan Story"]],
  "dt-culross": [["Tipo","Villaggio storico (Outlander)"],["Come arrivare","Treno + bus, ~2 ore a tratta"],["Da vedere","Culross Palace (NTS)"],["Da non perdere","I vicoli ocra e i giardini"],["Nota","Set di Outlander"]],
  "dt-anstruthereast": [["Tipo","Villaggi di pescatori"],["Come arrivare","Bus X60 diretto, ~2h25"],["Da mangiare","Anstruther Fish Bar"],["Da non perdere","Crail e i porti del East Neuk"],["In barca","Isle of May (pulcinelle) in estate"]],
};
c.trips = c.trips || {};
let n = 0;
for (const id in I) { c.trips[id] = { ...(c.trips[id] || {}), info: I[id].map(([k, v]) => ({ k, v })) }; n++; }
fs.writeFileSync("src/content.json", JSON.stringify(c, null, 2) + "\n");
console.log("trips upgraded:", n);
