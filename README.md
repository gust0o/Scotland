# Taccuino Scozia 2026

Guida da campo **offline-first** per un viaggio in Scozia (Londra → Edimburgo). Mobile-first, in italiano, pensata per essere installata sulla home screen e consultata **senza rete** (in aereo, in metro).

App **React 18 + Vite 6**, **PWA** installabile con service worker che pre-carica tutto lo shell.

## Cosa fa

- **Oggi** — sezione dinamica che cambia in base a data/ora: conto alla rovescia, giorno di partenza, atterraggio, giornate a destinazione (programma + meteo), rientro. Simulatore di data/ora con doppio tap sul badge in alto a sinistra.
- **Voli & Prenotazioni** — schede "biglietto di carta". I dati riservati (aeroporti, numeri volo, orari, PNR, hotel, PIN, parcheggio) **non sono nel codice**: restano vuoti finché non incolli il tuo JSON, e vivono solo in `localStorage` sul dispositivo.
- **Programma** — pianificatore a calendario con modalità consultazione/modifica; le gite sono contenitori; export/import e un template per farlo generare a un'AI (anonimizzato: passa solo finestre orarie generiche, mai numeri di volo o aeroporti).
- **Preferiti** — stella su qualsiasi luogo, con export/import.
- **Info pratiche** — meteo dei giorni del viaggio (Open-Meteo, on-demand, con fallback alle medie stagionali), valuta, trasporti, prese, emergenze.
- **Impostazioni** — scaffold JSON con segnaposto da copiare, compilare e reincollare; backup/ripristino su file.

## Privacy

- **I dati riservati non sono nel codice.** Vivono **solo in `localStorage`** su questo dispositivo; non c'è un server dell'app e l'app non li invia da nessuna parte.
- `localStorage` è isolato **per origine** (protocollo+host), non per percorso: l'origine è `https://gust0o.github.io`, quindi è condivisa con eventuali altri *project site* sotto lo stesso utente. Un dominio dedicato isolerebbe completamente i dati. Tienine conto e non pubblicare altri progetti non fidati sotto la stessa origine.
- **Chiamate di rete** della pagina, oltre al meteo:
  - **Meteo** → Open-Meteo, on-demand, riceve solo coordinate fisse di Londra/Edimburgo (nessun dato riservato).
  - **Font** → Google Fonts (Archivo + Spline Sans Mono): il caricamento dei font espone il tuo IP a Google.
  - **Hosting** → GitHub Pages registra gli indirizzi IP dei visitatori per motivi di sicurezza.
- **Il file di backup è in chiaro** e può contenere dati riservati: salvalo in una cartella privata/affidabile (se lo metti su iCloud/Drive finisce sui server di quel servizio).
- Il **template per l'AI** è anonimizzato: include solo finestre orarie generiche e il catalogo pubblico dei luoghi, mai numeri di volo, aeroporti, tratte o date.

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo
npm run build      # build di produzione in dist/
npm run preview    # anteprima della build
npm run generate-icons   # rigenera le icone PWA
```

## Stack

- React 18, Vite 6
- vite-plugin-pwa (manifest + service worker, precache dello shell, runtime cache dei Google Fonts)
- Tipografia: Archivo + Spline Sans Mono (Google Fonts)

## Licenza

MIT
