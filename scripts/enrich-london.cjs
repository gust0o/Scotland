const fs = require("fs");
const c = JSON.parse(fs.readFileSync("src/content.json", "utf8"));
const I = {
  "lo-colazione-allpress": [["Cosa","Caffetteria e torrefazione"],["Da ordinare","Flat white"],["Prezzo","£"],["Zona","Redchurch Street, Shoreditch"],["Quando","Colazione, prima del volo"]],
  "lo-colazione-friends": [["Cosa","Brunch e caffetteria"],["Da ordinare","Avocado toast, uova"],["Prezzo","£"],["Zona","Hoxton / Old Street"],["Quando","Mattina, brunch"]],
  "lo-colazione-ozone": [["Cosa","Torrefazione e colazione"],["Da ordinare","Espresso + brunch"],["Prezzo","£"],["Zona","Leonard Street, Shoreditch"],["Quando","Colazione"]],
  "lo-beigel": [["Cosa","Bagel da asporto"],["Da ordinare","Salt beef bagel"],["Prezzo","£ economico"],["Orari","Aperto 24 ore"],["Zona","Brick Lane"]],
  "lo-bricklane": [["Cosa","Via di street art e mercati"],["Da non perdere","Street art e curry house"],["Prezzo","Gratis (passeggiata)"],["Zona","East End / Shoreditch"],["Quando","Sera e domenica"]],
  "lo-truman": [["Cosa","Hub creativo ed eventi"],["Da non perdere","Mercatini e street food"],["Prezzo","Gratis (ingresso)"],["Zona","Brick Lane"],["Quando","Weekend per i mercatini"]],
  "lo-spitalfields": [["Cosa","Mercato coperto e street food"],["Da non perdere","La struttura vittoriana"],["Prezzo","Gratis (ingresso)"],["Zona","Spitalfields"],["Quando","Sera per una cena informale"]],
  "lo-christ-church": [["Cosa","Chiesa barocca di Hawksmoor"],["Da non perdere","L'alta guglia bianca"],["Prezzo","Gratis"],["Zona","Commercial Street, Spitalfields"],["Quando","Sera, facciata illuminata"]],
  "lo-boxpark": [["Cosa","Street food in container"],["Da non perdere","Il 'pop-up mall' di container"],["Prezzo","£-££"],["Zona","Shoreditch High Street"],["Quando","Sera, prima cena"]],
  "lo-redchurch": [["Cosa","Via di boutique e gallerie"],["Da non perdere","Concept store e street art"],["Prezzo","Gratis (passeggiata)"],["Zona","Shoreditch"],["Quando","Sera, passeggiata"]],
  "lo-ten-bells": [["Cosa","Pub storico vittoriano"],["Da ordinare","Una pinta"],["Prezzo","££"],["Zona","Commercial Street, Spitalfields"],["Quando","Sera"]],
  "lo-stpauls": [["Cosa","Cattedrale di Wren"],["Da non perdere","La cupola e la Whispering Gallery"],["Prezzo","A pagamento (~£27)"],["Orari","Visite lun-sab dalle 8:30"],["Come arrivare","Tube St Paul's; ~10 min da Liverpool St"]],
  "lo-millennium": [["Cosa","Ponte pedonale sul Tamigi"],["Da non perdere","Vista su St Paul's e Tate"],["Prezzo","Gratis"],["Zona","Tra St Paul's e South Bank"],["Quando","Sera, vista sul fiume"]],
  "lo-tate-modern": [["Cosa","Museo d'arte moderna"],["Da non perdere","La Turbine Hall e la terrazza"],["Prezzo","Collezione gratis; mostre a pagamento"],["Orari","10-18; ven-sab fino 21"],["Zona","Bankside, South Bank"]],
  "lo-dishoomshoreditch": [["Cucina","Indiana (caffè di Bombay)"],["Da ordinare","Naan roll, black daal"],["Prezzo","~£25-35"],["Quando","Sera ideale verso le 18"],["Come arrivare","5 min a piedi dall'hotel"]],
  "lo-smokinggoat": [["Cucina","Thai alla brace"],["Da ordinare","Fish sauce wings"],["Prezzo","~£25-30"],["Quando","Lun-sab 12-23"],["Come arrivare","Adiacente a Shoreditch High St"]],
  "lo-gunpowderspitalfields": [["Cucina","Indiana casalinga (small plates)"],["Da ordinare","Granchio, agnello"],["Prezzo","~£30-40"],["Quando","Lun-sab; domenica chiuso"],["Come arrivare","8 min a piedi, vicino Spitalfields"]],
  "lo-tayyabs": [["Cucina","Punjabi (dal 1972)"],["Da ordinare","Lamb chops grigliati"],["Prezzo","~£20 economico"],["Quando","Tutti i giorni 12-23:30"],["Come arrivare","Vicino Whitechapel, 12 min da Brick Lane"]],
  "lo-sundayupmarket": [["Cosa","Mercato street food & vintage"],["Da non perdere","Street food da tutto il mondo"],["Prezzo","Gratis (street food £6-10)"],["Quando","Domenica 10-18"],["Come arrivare","Su Brick Lane, 8 min a piedi"]],
  "lo-columbiaroad": [["Cosa","Mercato dei fiori"],["Da non perdere","I venditori in stile cockney"],["Prezzo","Gratis (ingresso)"],["Quando","Solo domenica 8-15"],["Come arrivare","12-15 min a piedi da Shoreditch"]],
  "lo-queenhoxton": [["Tipo","Bar & rooftop"],["Da ordinare","Cocktail"],["Prezzo","Cocktail ~£12-14"],["Quando","Rooftop pomeriggio-sera"],["Come arrivare","5 min a piedi dall'hotel"]],
  "lo-oldblue": [["Tipo","Pub & live music"],["Da ordinare","Una pinta"],["Prezzo","Pinta ~£6-7"],["Quando","Dalle 12; weekend fino alle 2"],["Come arrivare","3 min a piedi dall'hotel"]],
  "lo-skygarden": [["Cosa","Giardino panoramico (Walkie Talkie)"],["Da non perdere","Vista a 360° sulla City"],["Prezzo","Gratis (prenotazione)"],["Quando","Prenota online ~3 settimane prima"],["Come arrivare","Verso Monument, ~15 min"]],
  "lo-leadenhallmarket": [["Cosa","Mercato coperto vittoriano"],["Da non perdere","Tetto verde e oro (set di Harry Potter)"],["Prezzo","Gratis (ingresso)"],["Quando","Galleria sempre aperta; negozi nei feriali"],["Come arrivare","Tube Monument/Bank, ~4 min"]],
};
let n = 0;
for (const s of c.londonSpots) { if (I[s.id]) { s.info = I[s.id].map(([k, v]) => ({ k, v })); n++; } }
fs.writeFileSync("src/content.json", JSON.stringify(c, null, 2) + "\n");
console.log("london upgraded:", n);
