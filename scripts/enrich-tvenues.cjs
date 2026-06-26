const fs = require("fs");
const c = JSON.parse(fs.readFileSync("src/content.json", "utf8"));
const I = {
  "tv-dt-glasgow-0": [["Tipo","Museo d'arte e storia"],["Ingresso","Gratuito"],["Durata","2-3 ore"],["Da vedere","Il Cristo di Dalí e lo Spitfire"],["Da non perdere","Il recital d'organo (~13)"]],
  "tv-dt-glasgow-1": [["Tipo","Museo dei trasporti"],["Ingresso","Gratuito (Tall Ship a pagamento)"],["Durata","1-2 ore"],["Da vedere","Le strade ricostruite"],["Da non perdere","Il veliero Glenlee"]],
  "tv-dt-glasgow-2": [["Tipo","Cattedrale e necropoli"],["Ingresso","Gratuito"],["Durata","1-1,5 ore"],["Da vedere","La cripta di san Mungo"],["Da non perdere","La vista dalla Necropolis"]],
  "tv-dt-glasgow-3": [["Tipo","Sala da tè storica / design"],["Da ordinare","Afternoon tea"],["Da vedere","La Room de Luxe"],["Durata","Circa 1 ora"],["Zona","Sauchiehall Street"]],
  "tv-dt-glasgow-4": [["Tipo","Ristorante scozzese"],["Da ordinare","Cervo o brunch"],["Prezzo","££-£££"],["Prenotazione","Consigliata per cena"],["Zona","Ashton Lane, West End"]],
  "tv-dt-glasgow-5": [["Tipo","Pub irlandese"],["Da ordinare","Una Guinness"],["Prezzo","£-££"],["Da non perdere","Musica dal vivo"],["Zona","Ashton Lane"]],
  "tv-dt-glasgow-6": [["Tipo","Bar di birra artigianale"],["Da ordinare","Una craft beer"],["Prezzo","£-££"],["Da non perdere","Gli archi sul fiume Kelvin"],["Zona","Great Western Road"]],
  "tv-dt-stirling-0": [["Tipo","Castello reale"],["Ingresso","A pagamento (HES)"],["Durata","2-3 ore"],["Da vedere","Il Palazzo rinascimentale e la Great Hall"],["Consiglio","Biglietti online"]],
  "tv-dt-stirling-1": [["Tipo","Torre panoramica"],["Ingresso","A pagamento"],["Durata","1-1,5 ore"],["Da vedere","La spada di Wallace"],["Da non perdere","Vista sulla Forth Valley"]],
  "tv-dt-stirling-2": [["Tipo","Centro visitatori interattivo"],["Ingresso","A pagamento (NTS)"],["Durata","1-1,5 ore"],["Da vedere","La battle room in 3D"],["Consiglio","Prenota gli slot 3D"]],
  "tv-dt-stirling-3": [["Tipo","Pub storico con cucina (1787)"],["Da ordinare","Cucina da pub"],["Prezzo","££"],["Da non perdere","Vicino alla spianata del castello"],["Zona","Castle Wynd"]],
  "tv-dt-stirling-4": [["Tipo","Pub più antico di Stirling (1733)"],["Da ordinare","Una pinta"],["Prezzo","£"],["Da non perdere","Il camino e l'atmosfera"],["Zona","St Mary's Wynd"]],
  "tv-dt-stirling-5": [["Tipo","Whisky bar"],["Da ordinare","Un single malt"],["Prezzo","££"],["Specialità","Unico whisky bar di Stirling"],["Zona","Centro"]],
  "tv-dt-standrews-0": [["Tipo","Campo da golf storico"],["Ingresso","Gratis (passeggiata la domenica)"],["Da vedere","Lo Swilcan Bridge (18ª buca)"],["Da non perdere","La casa del golf"],["Quando","Domenica per passeggiare sul campo"]],
  "tv-dt-standrews-1": [["Tipo","Rovine medievali"],["Ingresso","Rovine gratis (torre a pagamento)"],["Durata","1 ora"],["Da vedere","La St Rule's Tower"],["Da non perdere","Vista dalla torre"]],
  "tv-dt-standrews-2": [["Tipo","Rovine di castello"],["Ingresso","A pagamento (HES)"],["Durata","Circa 1 ora"],["Da vedere","La bottle dungeon"],["Da non perdere","La mina e contromina"]],
  "tv-dt-standrews-3": [["Tipo","Gelateria storica (1908)"],["Da ordinare","Un gelato"],["Prezzo","£"],["Specialità","Oltre 100 gusti"],["Zona","South Street"]],
  "tv-dt-standrews-4": [["Tipo","Pub tradizionale (1874)"],["Da ordinare","Una cask ale"],["Prezzo","££"],["Da non perdere","Birre scozzesi a rotazione"],["Zona","South Street"]],
  "tv-dt-standrews-5": [["Tipo","Panificio-pasticceria (1919)"],["Da ordinare","Il fudge doughnut"],["Prezzo","£"],["Specialità","Oltre 400 specialità"],["Zona","Church Street"]],
  "tv-dt-lochlomond-0": [["Tipo","Centro visitatori e shopping"],["Ingresso","Libero (attrazioni a pagamento)"],["Da vedere","L'acquario SEA LIFE"],["Da non perdere","Il lungolago"],["Zona","Balloch"]],
  "tv-dt-lochlomond-1": [["Tipo","Parco e castello"],["Ingresso","Gratuito"],["Durata","1-2 ore"],["Da vedere","Il castello neogotico"],["Da non perdere","Vista sul lago"]],
  "tv-dt-lochlomond-2": [["Tipo","Crociera sul lago"],["Durata","Da 1 a 2 ore"],["Da vedere","Le isole e il Ben Lomond"],["Prezzo","A pagamento"],["Consiglio","Prenota in alta stagione"]],
  "tv-dt-lochlomond-3": [["Tipo","Villaggio storico"],["Ingresso","Gratis (passeggiata)"],["Durata","1-2 ore"],["Da vedere","I cottage e la spiaggia"],["Da non perdere","La vista dal molo"]],
  "tv-dt-lochlomond-4": [["Tipo","Bistro / ristorante"],["Da ordinare","Piatti scozzesi"],["Prezzo","££"],["Da non perdere","A due passi dal lago"],["Zona","Luss"]],
  "tv-dt-lochlomond-5": [["Tipo","Pub-locanda con cucina (1895)"],["Da ordinare","Cucina da pub"],["Prezzo","££"],["Da non perdere","Vicino alla stazione di Balloch"],["Zona","Balloch"]],
  "tv-dt-musselburgh-0": [["Tipo","Campo da golf storico (9 buche)"],["Da vedere","Tracciato dentro l'ippodromo"],["Prezzo","Green fee accessibile"],["Prenotazione","Consigliata per giocare"],["Specialità","Il più antico campo ancora in uso"]],
  "tv-dt-musselburgh-1": [["Tipo","Porto e spiaggia"],["Ingresso","Gratuito"],["Da vedere","Il porto seicentesco"],["Quando","Bella con la bassa marea e al tramonto"],["Da non perdere","Il tramonto sul Forth"]],
  "tv-dt-musselburgh-2": [["Tipo","Riserva naturale"],["Ingresso","Gratuito"],["Da vedere","I capanni di osservazione"],["Quando","Migratori in autunno-inverno"],["Da non perdere","Limicoli e anatre"]],
  "tv-dt-musselburgh-3": [["Tipo","Gelateria storica italiana (1908)"],["Da ordinare","Un gelato"],["Prezzo","£"],["Specialità","Ricetta immutata da generazioni"],["Zona","High Street"]],
  "tv-dt-musselburgh-4": [["Tipo","Fish & chips (dal 1974)"],["Da ordinare","Fish supper"],["Prezzo","£"],["Da non perdere","Vicino al porto di Fisherrow"],["Zona","North High Street"]],
  "tv-dt-musselburgh-5": [["Tipo","Pub di real ale (1858)"],["Da ordinare","Una real ale"],["Prezzo","£"],["Da vedere","Lo snug d'epoca"],["Specialità","Real ale a rotazione e rum"]],
  "tv-dt-nberwick-0": [["Tipo","Centro naturalistico"],["Da vedere","Telecamere dal vivo e gite in barca"],["Quando","Apr-fine estate per gli uccelli"],["Prezzo","A pagamento"],["Consiglio","Prenota le gite in barca"]],
  "tv-dt-nberwick-1": [["Tipo","Castello in rovina (HES)"],["Ingresso","A pagamento"],["Da vedere","La cortina in arenaria rossa"],["Quando","Cielo limpido per il panorama"],["Da non perdere","Vista sulla Bass Rock"]],
  "tv-dt-nberwick-2": [["Tipo","Collina panoramica (187 m)"],["Ingresso","Gratuito"],["Durata","1-1,5 ore A/R"],["Da vedere","La mascella di balena in vetta"],["Da non perdere","Panorama a 360°"]],
  "tv-dt-nberwick-3": [["Tipo","Torrefazione e caffetteria"],["Da ordinare","Specialty coffee"],["Prezzo","£"],["Da non perdere","L'ex falegnameria steampunk"],["Zona","Dietro il lungomare"]],
  "tv-dt-nberwick-4": [["Tipo","Pesce da asporto sul porto"],["Da ordinare","Aragosta o granchio"],["Prezzo","££"],["Quando","Stagionale, bella stagione"],["Da non perdere","Pescato del giorno sul molo"]],
  "tv-dt-nberwick-5": [["Tipo","Pub con cucina"],["Da ordinare","Fish & chips"],["Prezzo","££"],["Da non perdere","Cucina da pub sostanziosa"],["Zona","Centro"]],
  "tv-dt-falkirk-0": [["Tipo","Ascensore per barche"],["Prezzo","Tour a pagamento (area esterna gratis)"],["Durata","Tour ~1 ora"],["Da non perdere","La rotazione della ruota"],["Consiglio","Prenota il tour online"]],
  "tv-dt-falkirk-1": [["Tipo","Sculture monumentali (30 m)"],["Prezzo","Gratis (tour interno a pagamento)"],["Durata","Tour interno ~30 min"],["Da vedere","Le teste equine e il bacino"],["Da non perdere","L'illuminazione serale"]],
  "tv-dt-falkirk-2": [["Tipo","Parco e area ricreativa"],["Ingresso","Gratuito"],["Da vedere","Laguna e sentieri"],["Da non perdere","I Kelpies"],["Quando","Bel tempo"]],
  "tv-dt-falkirk-3": [["Tipo","Dimora storica e museo"],["Ingresso","Gratuito"],["Da vedere","La cucina georgiana"],["Da non perdere","Il museo di Falkirk e il parco"],["Quando","Di giorno"]],
  "tv-dt-falkirk-4": [["Tipo","Café-ristorante"],["Da ordinare","Brunch con vista"],["Prezzo","£-££"],["Da non perdere","Vetrate sulla Falkirk Wheel"],["Zona","Falkirk Wheel"]],
  "tv-dt-falkirk-5": [["Tipo","Hotel con pub e ristorante"],["Da ordinare","Cucina da pub scozzese"],["Prezzo","££"],["Da non perdere","Comoda sosta in visita"],["Zona","Falkirk"]],
  "tv-dt-queensferry-0": [["Tipo","Ponte ferroviario UNESCO (1890)"],["Ingresso","Gratis (vista)"],["Da vedere","Vista da Hawes Pier"],["Da non perdere","I rivetti rossi al tramonto"],["Lunghezza","Oltre 2,4 km"]],
  "tv-dt-queensferry-1": [["Tipo","Isola e abbazia medievale"],["Prezzo","Crociera + sbarco a pagamento"],["Durata","~3 ore con l'isola"],["Quando","Apr-ott"],["Consiglio","Prenota la barca"]],
  "tv-dt-queensferry-2": [["Tipo","Dimora storica privata"],["Da vedere","Interni Regency e cimeli napoleonici"],["Quando","Aperture limitate ai mesi estivi"],["Prezzo","A pagamento"],["Consiglio","Verifica le aperture"]],
  "tv-dt-queensferry-3": [["Tipo","Locanda-pub storico (XVII sec.)"],["Da ordinare","Cucina da pub"],["Prezzo","££"],["Da vedere","Vista sul Forth Bridge"],["Da non perdere","Citata da R.L. Stevenson"]],
  "tv-dt-queensferry-4": [["Tipo","Ristorante e bar sul lungomare"],["Da ordinare","Piatti di mare"],["Prezzo","££"],["Da vedere","Terrazza con vista sui ponti"],["Quando","Aperitivo al tramonto"]],
  "tv-dt-queensferry-5": [["Tipo","Locale di pesce sul lungomare"],["Da ordinare","Fish & chips"],["Prezzo","£-££"],["Da non perdere","Vista sull'estuario"],["Zona","South Queensferry"]],
};
let n = 0, miss = [];
for (const id in I) {
  const m = id.match(/^tv-(.+)-(\d+)$/);
  const trip = m[1], idx = +m[2];
  const arr = c.tripVenues && c.tripVenues[trip];
  if (arr && arr[idx]) { arr[idx].info = I[id].map(([k, v]) => ({ k, v })); n++; }
  else miss.push(id);
}
fs.writeFileSync("src/content.json", JSON.stringify(c, null, 2) + "\n");
console.log("trip-venues upgraded:", n, "| missed:", miss.join(",") || "none");
