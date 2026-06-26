const fs = require("fs");
const c = JSON.parse(fs.readFileSync("src/content.json", "utf8"));
const I = {
  "ea-oink": [["Cucina","Hog roast / street food"],["Da ordinare","Panino pulled pork + haggis"],["Prezzo","£"],["Zona","Old Town / Royal Mile"],["Quando","A pranzo, finché c'è il maiale"]],
  "ea-makars": [["Cucina","Scozzese / comfort food"],["Da ordinare","Mash con haggis"],["Prezzo","£"],["Zona","Old Town"],["Quando","Pranzo o cena informale"]],
  "ea-angels": [["Cucina","Scozzese contemporanea"],["Da ordinare","Salmone o cervo"],["Prezzo","££"],["Zona","Old Town / Royal Mile"],["Prenotazione","Consigliata la sera"]],
  "ea-lovecrumbs": [["Cucina","Caffè / torte"],["Da ordinare","Torta a strati del giorno"],["Prezzo","£"],["Zona","West Port"],["Quando","Colazione o pausa dolce"]],
  "ea-fishers": [["Cucina","Pesce / seafood"],["Da ordinare","Astice o seafood chowder"],["Prezzo","££"],["Zona","Leith / The Shore"],["Prenotazione","Consigliata"]],
  "ea-cannyman": [["Tipo","Whisky bar / pub"],["Da ordinare","Un single malt"],["Prezzo","££"],["Zona","Morningside"],["Quando","Sera, per un dram"]],
  "ea-timberyard": [["Cucina","Fine dining (1 stella Michelin)"],["Da ordinare","Menù degustazione"],["Prezzo","£££"],["Prenotazione","Necessaria, con anticipo"],["Zona","Old Town (Lady Lawson St)"]],
  "ea-littlechartroom": [["Cucina","Britannica moderna"],["Da ordinare","Menù degustazione stagionale"],["Prezzo","£££"],["Prenotazione","Necessaria"],["Zona","Bonnington Rd, Leith"]],
  "ea-noto": [["Cucina","Fusione asiatica · small plates"],["Da ordinare","Bao buns o anatra"],["Prezzo","££"],["Prenotazione","Consigliata"],["Zona","Thistle St, New Town"]],
  "ea-scranscallie": [["Cucina","Gastropub scozzese"],["Da ordinare","Fish pie"],["Prezzo","££"],["Prenotazione","Consigliata"],["Zona","Stockbridge"]],
  "ea-dishoomedinburgh": [["Cucina","Indiana (caffè di Bombay)"],["Da ordinare","Bacon Naan Roll, black daal"],["Prezzo","££"],["Prenotazione","Walk-in (gruppi 6+ su prenotazione)"],["Zona","St Andrew Sq, New Town"]],
  "ea-bowbar": [["Tipo","Whisky bar & real ale"],["Da ordinare","Una real ale o un dram"],["Prezzo","£"],["Specialità","Oltre 400 whisky"],["Zona","Victoria Street, Old Town"]],
  "ea-devilsadvocate": [["Tipo","Whisky bar & cucina"],["Da ordinare","Cocktail di stagione"],["Prezzo","££"],["Specialità","Oltre 300 whisky"],["Zona","Advocate's Close, Old Town"]],
  "ea-bennetsbar": [["Tipo","Pub storico (dal 1839)"],["Da ordinare","Un single malt"],["Prezzo","£"],["Specialità","Oltre 150 single malt"],["Zona","Tollcross, accanto al King's Theatre"]],
  "ea-caferoyal": [["Tipo","Pub & oyster bar (dal 1863)"],["Da ordinare","Ostriche"],["Prezzo","££"],["Specialità","Frutti di mare, interni vittoriani"],["Zona","West Register St, New Town"]],
  "ea-pandasons": [["Tipo","Speakeasy cocktail bar"],["Da ordinare","Cocktail d'autore"],["Prezzo","££"],["Specialità","Tecniche di congelamento"],["Zona","Queen Street, New Town"]],
  "ea-lannanbakery": [["Tipo","Pasticceria"],["Da ordinare","Viennoiserie, cardamom bun"],["Prezzo","£"],["Quando","Gio-dom, fino a esaurimento"],["Zona","Stockbridge"]],
  "ea-alandasgelato": [["Tipo","Gelateria"],["Da ordinare","Gelato al latte dell'East Lothian"],["Prezzo","£"],["Specialità","Latte scozzese + maestria italiana"],["Zona","Forrest Road, Old Town"]],
  "ea-cairngormcoffee": [["Tipo","Specialty coffee"],["Da ordinare","Grilled cheese + flat white"],["Prezzo","£"],["Specialità","Torrefazione propria"],["Zona","Frederick St, New Town"]],
};
c.eats = c.eats || {};
let n = 0;
for (const id in I) { c.eats[id] = { ...(c.eats[id] || {}), info: I[id].map(([k, v]) => ({ k, v })) }; n++; }
fs.writeFileSync("src/content.json", JSON.stringify(c, null, 2) + "\n");
console.log("eats upgraded:", n);
