import React, { useState, useRef } from "react";

// Palette + label per kind, consistent with the rest of the app.
const KIND = {
  sight: { c: "#0E1542", l: "Visita" },
  eat: { c: "#E6482A", l: "Mangiare" },
  trip: { c: "#14C08C", l: "Gita in giornata" },
  tvenue: { c: "#0E8F6B", l: "In gita" },
  london: { c: "#FF2E7E", l: "Londra" },
  neighborhood: { c: "#0E1542", l: "Quartiere" },
  experience: { c: "#B6892B", l: "Esperienza" },
  glasgow: { c: "#14C08C", l: "Glasgow" },
};
export const kindColor = (k) => (KIND[k] || KIND.sight).c;
const fmtH = (x) => {
  const h = Math.floor(x);
  const m = Math.round((x - h) * 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
};
const durLabel = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return ((h ? h + "h " : "") + (m ? m + "'" : "")).trim() || (min + "'");
};
const firstSentence = (s, max = 116) => {
  if (!s) return "";
  const t = String(s).trim();
  const cut = t.search(/[.;]\s/);
  let out = cut > 30 && cut < max ? t.slice(0, cut + 1) : t;
  if (out.length > max) out = out.slice(0, max - 1).trimEnd() + "…";
  return out;
};

// Short metadata line (zone/tipo/durata/orari) for the 2-line summary rows.
export function metaText(d) {
  if (!d) return "";
  const bits = [];
  if (d.kind === "trip") {
    if (d.mode) bits.push(d.mode);
    if (d.train) bits.push(durLabel(d.train) + "/tratta");
    else if (d.area) bits.push(d.area);
  } else {
    if (d.tipo || d.cat) bits.push(d.tipo || d.cat);
    if (d.zone) bits.push(d.zone);
    if (d.dur) bits.push(durLabel(d.dur));
  }
  if (d.open) bits.push(fmtH(d.open[0]) + "–" + fmtH(d.open[1]));
  return bits.join(" · ");
}

// A tappable 2-line summary row reused across the content sections.
export function SummaryRow({ d, onOpen, isFav, onToggleFav, last }) {
  const c = kindColor(d.kind);
  const meta = metaText(d);
  const line = d.summary || firstSentence(d.note);
  return (
    <div
      onClick={() => onOpen(d)}
      style={{
        display: "flex", alignItems: "center", gap: 11, padding: "11px 4px", cursor: "pointer",
        borderBottom: last ? "none" : "1px solid rgba(122,112,84,.16)", WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ flex: "none", width: 4, alignSelf: "stretch", borderRadius: 4, background: c, opacity: 0.85 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontWeight: 900, fontSize: 14.5, color: "#17142C", letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
        </div>
        <div style={{ fontSize: 12, color: "#6B6450", fontWeight: 600, lineHeight: 1.35, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {meta ? <span style={{ color: c, fontWeight: 800 }}>{meta}</span> : null}
          {meta && line ? " — " : ""}{line}
        </div>
      </div>
      {onToggleFav && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(d.id); }}
          title="Preferito"
          style={{ flex: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 9, border: `1.5px solid ${isFav ? "#E0A92E" : "#d9cdaf"}`, background: isFav ? "#FFD23F" : "transparent", color: isFav ? "#17142C" : "#b3a784", fontSize: 15, fontWeight: 900 }}
        >★</button>
      )}
      <span style={{ flex: "none", color: "#b3a784", fontSize: 18, fontWeight: 900 }}>›</span>
    </div>
  );
}

const chip = (bg, fg) => ({ fontSize: 11.5, fontWeight: 800, color: fg, background: bg, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" });
// Compact rectangular category tag (legible at small sizes — replaces the old round pills).
const tag = (bg, fg) => ({ flex: "none", display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase", color: fg, background: bg, borderRadius: 7, padding: "4px 9px", lineHeight: 1, whiteSpace: "nowrap" });

// Full detail sheet, reused everywhere (sections, timeline taps, favourites, now-cards).
// onOpen(idOrObj) lets nested items (trip venues, experience places) open their own card.
export default function VenueDetail({ d, onClose, isFav, onToggleFav, tripVisit, onTripLess, onTripMore, onOpen }) {
  // Drag-down-to-dismiss: the grabber/hero can be dragged; past a threshold it closes.
  const [dragY, setDragY] = useState(0);
  const drag = useRef(null);
  // Day-trip: which Edinburgh station to show live times from (both serve these routes).
  const [station, setStation] = useState("Edinburgh Waverley");
  const onGrabDown = (e) => {
    drag.current = { y0: e.clientY };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) {}
  };
  const onGrabMove = (e) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.y0;
    setDragY(dy > 0 ? dy : dy * 0.25); // resist upward drag
  };
  const onGrabUp = () => {
    if (!drag.current) return;
    const dy = dragY;
    drag.current = null;
    if (dy > 110) onClose();
    else setDragY(0);
  };
  if (!d) return null;
  const adjustable = d.kind === "trip" && typeof tripVisit === "number" && onTripMore;
  const visitMin = adjustable ? tripVisit : d.visit;
  const k = KIND[d.kind] || KIND.sight;
  const c = k.c;
  const meta = [];
  if (d.tipo || d.cat) meta.push({ t: d.tipo || d.cat, bg: c, fg: "#fff" });
  if (d.zone) meta.push({ t: d.zone, bg: "#EFE7D6", fg: "#5b5644" });
  if (d.area) meta.push({ t: d.area, bg: "#EFE7D6", fg: "#5b5644" });
  if (d.dur && d.kind !== "trip") meta.push({ t: durLabel(d.dur), bg: "#EFE7D6", fg: "#5b5644" });
  if (d.open) meta.push({ t: "Aperto " + fmtH(d.open[0]) + "–" + fmtH(d.open[1]), bg: "#EFE7D6", fg: "#5b5644" });
  if (d.transferMin) meta.push({ t: "🚌 +" + durLabel(d.transferMin) + " transfer", bg: "#FFF3CC", fg: "#6a5410" });

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(8,11,32,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", background: "#F6F0E2", borderRadius: "20px 20px 0 0", boxShadow: "0 -10px 50px rgba(0,0,0,.45)", WebkitOverflowScrolling: "touch", paddingBottom: "calc(20px + env(safe-area-inset-bottom))", transform: dragY ? `translateY(${dragY}px)` : "none", transition: drag.current ? "none" : "transform .25s cubic-bezier(.22,1,.36,1)" }}
      >
        {/* Hero: photo when available, else a coloured placeholder band. Doubles as the drag handle. */}
        <div
          onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}
          style={{ position: "relative", height: 168, background: d.photo ? "#000" : `linear-gradient(135deg, ${c} 0%, #0E1542 100%)`, borderRadius: "20px 20px 0 0", overflow: "hidden", touchAction: "none", cursor: "grab" }}
        >
          {/* grabber */}
          <span style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 40, height: 4, borderRadius: 999, background: "rgba(255,255,255,.55)", zIndex: 2 }} />
          {d.photo && <img src={d.photo} alt={d.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          {d.photo && d.credit && <span style={{ position: "absolute", bottom: 4, left: 8, fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,.7)", textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>{d.credit}</span>}
          {!d.photo && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: 16 }}>
              <span style={{ position: "absolute", top: -20, right: 6, fontSize: 150, fontWeight: 900, color: "rgba(255,255,255,.08)", lineHeight: 1 }}>{(d.name || "?").slice(0, 1)}</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>{k.l}</span>
            </div>
          )}
          <button onClick={onClose} aria-label="Chiudi" style={{ position: "absolute", top: 12, right: 12, cursor: "pointer", width: 34, height: 34, borderRadius: 999, border: "none", background: "rgba(0,0,0,.4)", color: "#fff", fontSize: 17, fontWeight: 900, backdropFilter: "blur(4px)" }}>✕</button>
        </div>

        <div style={{ padding: "16px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: c }}>{d.where || k.l}</div>
              <h2 style={{ margin: "3px 0 0", fontSize: 25, fontWeight: 900, color: "#17142C", letterSpacing: "-.02em", lineHeight: 1.05 }}>{d.name}</h2>
            </div>
            {onToggleFav && (
              <button onClick={() => onToggleFav(d.id)} style={{ flex: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 900, color: isFav ? "#17142C" : "#7a7560", background: isFav ? "#FFD23F" : "transparent", border: `1.5px solid ${isFav ? "#E0A92E" : "#d9cdaf"}`, padding: "7px 12px", borderRadius: 999 }}>★ {isFav ? "Salvato" : "Salva"}</button>
            )}
          </div>

          {meta.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
              {meta.map((m, i) => <span key={i} style={chip(m.bg, m.fg)}>{m.t}</span>)}
            </div>
          )}

          {(d.descrizione || d.note) && <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.62, color: "#4f4a3a", fontWeight: 500 }}>{d.descrizione || d.note}</p>}

          {d.transferNote && (
            <div style={{ marginTop: 12, padding: "9px 12px", background: "#FFF3CC", border: "1px solid #E9D08A", borderRadius: 10, fontSize: 12.5, color: "#6a5410", fontWeight: 700 }}>
              🚌 {d.transferNote}
            </div>
          )}

          {d.ordina && (
            <div style={{ marginTop: 12, padding: "10px 13px", background: "#FBEDE9", borderRadius: 12, fontSize: 13, color: "#7d2417", fontWeight: 700 }}>
              <span style={{ fontWeight: 900 }}>Da ordinare:</span> {d.ordina}
            </div>
          )}

          {/* Trip: travel breakdown + nested venues */}
          {d.kind === "trip" && (
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
              <span style={chip("#DBF3E9", "#06382a")}>🚆 Andata {durLabel(d.train)}</span>
              {adjustable ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, ...chip("#DBF3E9", "#06382a") }}>
                  <button onClick={onTripLess} title="Meno tempo" style={{ cursor: "pointer", border: "none", background: "rgba(6,56,42,.15)", borderRadius: 6, width: 18, height: 18, fontWeight: 900, color: "#06382a", lineHeight: 1 }}>−</button>
                  Visita {durLabel(visitMin)}
                  <button onClick={onTripMore} title="Più tempo" style={{ cursor: "pointer", border: "none", background: "rgba(6,56,42,.15)", borderRadius: 6, width: 18, height: 18, fontWeight: 900, color: "#06382a", lineHeight: 1 }}>+</button>
                </span>
              ) : (
                <span style={chip("#DBF3E9", "#06382a")}>Visita {durLabel(visitMin)}</span>
              )}
              <span style={chip("#DBF3E9", "#06382a")}>🚆 Ritorno {durLabel(d.train)}</span>
              <span style={chip("#0E1542", "#fff")}>Totale {durLabel(visitMin + 2 * d.train)}</span>
            </div>
          )}

          {/* Day-trip: choose your Edinburgh departure station → live times to the destination */}
          {d.kind === "trip" && d.destQ && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560", marginBottom: 8 }}>Stazione di partenza · Edimburgo</div>
              <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
                {["Edinburgh Waverley", "Edinburgh Haymarket"].map((st) => {
                  const on = station === st;
                  return (
                    <button key={st} onClick={() => setStation(st)} style={{ flex: 1, cursor: "pointer", border: `1.5px solid ${on ? c : "#dcd2b8"}`, background: on ? c : "transparent", color: on ? "#fff" : "#5b5644", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontWeight: 900 }}>{st.replace("Edinburgh ", "")}</button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(station + " Station, Edinburgh")}&destination=${encodeURIComponent(d.destQ)}&travelmode=transit`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ flex: 1, textAlign: "center", fontSize: 12.5, fontWeight: 900, color: "#fff", textDecoration: "none", background: "#FF2E7E", padding: "9px 12px", borderRadius: 10 }}>Orari live da {station.replace("Edinburgh ", "")} ↗</a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station + " railway station")}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ flex: "none", fontSize: 12.5, fontWeight: 900, color: "#0E1542", textDecoration: "none", background: "#FFD23F", padding: "9px 12px", borderRadius: 10 }}>Mappa ↗</a>
              </div>
              <div style={{ marginTop: 8, fontSize: 11.5, color: "#6B6450", fontWeight: 600, lineHeight: 1.45 }}>Quasi tutti i treni per questa gita fermano a <strong>entrambe</strong> le stazioni: scegli la più comoda — Haymarket è utile se alloggi nel West End.</div>
            </div>
          )}

          {/* Trip transport options (real operators/lines, verified date + live links) */}
          {d.kind === "trip" && d.transport && Array.isArray(d.transport.options) && d.transport.options.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560", marginBottom: 8 }}>Come arrivare</div>
              {d.transport.options.map((o, i) => {
                const tc = o.mode === "Treno" ? "#0E1542" : o.mode === "Bus" ? "#14C08C" : "#111";
                const facts = [o.durata_min ? durLabel(o.durata_min) : "", o.frequenza, (o.primo || o.ultimo) ? ("prima " + (o.primo || "—") + " · ultima " + (o.ultimo || "—")) : "", o.costo, o.coperturaUber].filter(Boolean);
                return (
                  <div key={i} style={{ padding: "9px 0", borderTop: i ? "1px solid rgba(122,112,84,.16)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={chip(tc, "#fff")}>{o.mode}</span>
                      {(o.operatore || o.linea) && <span style={{ fontSize: 13, fontWeight: 800, color: "#17142C" }}>{[o.operatore, o.linea].filter(Boolean).join(" · ")}</span>}
                      {o.link && <a href={o.link} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 900, color: "#0E1542", textDecoration: "none", background: "#FFD23F", padding: "3px 9px", borderRadius: 8 }}>Orari ↗</a>}
                    </div>
                    {o.departures && o.departures.length > 0 && <div style={{ fontSize: 11.5, fontWeight: 700, color: "#5b5644", marginTop: 3, fontFamily: "'Spline Sans Mono',monospace" }}>{o.departures.join(" · ")}</div>}
                    {facts.length > 0 && <div style={{ fontSize: 12, color: "#6B6450", fontWeight: 600, lineHeight: 1.45, marginTop: 2 }}>{facts.join(" · ")}</div>}
                  </div>
                );
              })}
              <div style={{ marginTop: 9, padding: "8px 11px", background: "#FFF3CC", border: "1px solid #E9D08A", borderRadius: 10, fontSize: 11.5, color: "#6a5410", fontWeight: 600, lineHeight: 1.45 }}>
                ⚠ {d.transport.note ? d.transport.note + " " : ""}Dati verificati il {d.transport.verificato || "—"} — ricontrolla gli orari live prima di partire.
              </div>
            </div>
          )}

          {d.kind === "trip" && d.venues && d.venues.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560", marginBottom: 8 }}>Cosa vedere & dove mangiare</div>
              {d.venues.map((v, i) => {
                const eat = v.tipo === "mangiare";
                const clickable = !!(onOpen && v.id);
                return (
                  <div key={i} onClick={clickable ? () => onOpen(v.id) : undefined} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid rgba(122,112,84,.16)" : "none", cursor: clickable ? "pointer" : "default", WebkitTapHighlightColor: "transparent" }}>
                    <span style={tag(eat ? "#FBEDE9" : "#EEF0F8", eat ? "#E6482A" : "#0E1542")}>{eat ? "Mangiare" : "Vedere"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#17142C" }}>{v.name}</div>
                      {v.note && <div style={{ fontSize: 12, color: "#6B6450", fontWeight: 600, lineHeight: 1.45, marginTop: 1 }}>{v.note}</div>}
                    </div>
                    {v.maps && <a href={v.maps} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ flex: "none", fontSize: 11, fontWeight: 900, color: "#0E1542", textDecoration: "none", background: "#FFD23F", padding: "5px 10px", borderRadius: 8 }}>Maps</a>}
                    {clickable && <span style={{ flex: "none", color: "#b3a784", fontSize: 17, fontWeight: 900 }}>›</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Neighborhood: things to see */}
          {d.see && d.see.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 7 }}>
              {d.see.map((s, i) => <span key={i} style={chip("#EFE7D6", "#5b5644")}>{s}</span>)}
            </div>
          )}

          {/* Experience: places (each opens its own detail card) */}
          {d.places && d.places.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560", marginBottom: 8 }}>Cosa comprende</div>
              {d.places.map((p, i) => {
                const clickable = !!(onOpen && p.ref);
                return (
                  <div key={i} onClick={clickable ? () => onOpen(p.ref) : undefined} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 0", borderTop: i ? "1px solid rgba(122,112,84,.16)" : "none", cursor: clickable ? "pointer" : "default", WebkitTapHighlightColor: "transparent" }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: "#17142C" }}>{p.name}</span>
                    {p.maps && <a href={p.maps} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ flex: "none", fontSize: 11, fontWeight: 900, color: "#0E1542", textDecoration: "none", background: "#FFD23F", padding: "5px 10px", borderRadius: 8 }}>Maps ↗</a>}
                    {clickable && <span style={{ flex: "none", color: "#b3a784", fontSize: 17, fontWeight: 900 }}>›</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Optional enriched content (filled in later rounds) */}
          {d.curiosita && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560", marginBottom: 6 }}>Curiosità</div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#4f4a3a", fontWeight: 500 }}>{d.curiosita}</p>
            </div>
          )}
          {Array.isArray(d.info) && d.info.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560", marginBottom: 6 }}>Info utili</div>
              {d.info.map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, padding: "6px 0", borderTop: i ? "1px solid rgba(122,112,84,.16)" : "none" }}>
                  <span style={{ color: "#7a7560", fontWeight: 700 }}>{row.k}</span>
                  <span style={{ color: "#17142C", fontWeight: 800, textAlign: "right" }}>{row.v}</span>
                </div>
              ))}
            </div>
          )}

          {d.maps && (
            <a href={d.maps} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", marginTop: 18, background: "#FF2E7E", color: "#fff", fontWeight: 900, fontSize: 14, padding: "13px", borderRadius: 999, textDecoration: "none" }}>Apri in Google Maps ↗</a>
          )}
        </div>
      </div>
    </div>
  );
}
