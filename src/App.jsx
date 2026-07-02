import React, { useState } from "react";
import {
  DAYS,
  FLIGHT_DAYS,
  ZONES_ORDER,
  AREAS_ORDER,
  mapsUrl,
  getData,
  venueDetail,
  seedPlan,
  emptyScaffold,
  DEFAULT_CHECKLIST,
} from "./data.js";
import { LogoMark, PlaneIcon, BedIcon, CutleryIcon, TimelineIcon } from "./icons.jsx";
import { BarIcon } from "./barIcons.jsx";
import VenueDetail, { SummaryRow } from "./VenueDetail.jsx";
import DayTimeline from "./DayTimeline.jsx";
import { coordForEvent, travelLeg, parseCoord, HUB, TRANSIT, STATION_META, STATION_DWELL } from "./geo.js";
const MONO = "'Spline Sans Mono',monospace";
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
// Primary destinations for the fixed bottom tab bar (ids + scroll-spy order).
const NAV_TABS = ["sNow", "s01", "s02", "sPlan", "sFav"];
// Every section the scroll-spy tracks, in document order (primary + overflow).
const ALL_SECTIONS = ["sNow", "s01", "s02", "sPlan", "s08", "s03", "s04", "s07", "s06", "s05", "sFav", "s09", "sSet"];
const MESI_LONG = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
// Drop shadow whose offset reacts to device tilt via --sx/--sy (0 when flat),
// plus a faint rim of light on the lit edge + a hairline inner edge.
// Neumorphic card depth, all keyed to one top-left light:
//  - a soft, two-step drop shadow offset toward the bottom-right (away from light);
//  - a dual-tone bevel that follows the exact rounded shape — lit top-left edge,
//    shaded bottom-right edge — so the card reads as gently extruded paper.
const tiltShadow = (y, blur, spread, a) =>
  `calc(var(--sx) * 1px) calc(${y}px + var(--sy) * 1px) ${blur}px ${spread}px rgba(18,14,38,${a}),` +
  ` calc(var(--sx) * 0.4px) calc(${(y * 0.4).toFixed(1)}px + var(--sy) * 0.4px) ${Math.round(blur / 2)}px ${spread}px rgba(18,14,38,${(a * 0.45).toFixed(2)}),` +
  ` inset 1px 1px 0 rgba(255,255,255,0.55),` +
  ` inset -1px -1px 0 rgba(78,66,42,0.14),` +
  ` inset 0 0 0 1px rgba(120,108,78,0.05)`;

// Flight legs with public transfer estimates and August-peak airport buffers.
// secMin = terminal→gate (check-in/walk + security queue); toMin/fromMin = transfer.
const LEGS = [
  // Home/layover endpoints carry NO real airport in the public code — they show
  // neutral placeholders until the user supplies da/a (+città) in the reserved JSON
  // (localStorage only). Destinations (STN/London, EDI/Edinburgh) stay, since the
  // guide is openly about that trip. fromCode/fromCity/toCode/toCity are overridden
  // per-leg from reserved data in the flights map below.
  { fromCode: "•••", fromCity: "Partenza", toCode: "STN", toCity: "Stansted", tag: "Andata", tagBg: "#FF2E7E", arrow: "#FF2E7E", toMin: 40, toLabel: "→ aeroporto di partenza", secMin: 55, fromMin: 47, fromLabel: "Stansted Express → Londra" },
  { fromCode: "STN", fromCity: "Stansted", toCode: "EDI", toCity: "Edimburgo", tag: "", tagBg: "#14C08C", arrow: "#14C08C", toMin: 47, toLabel: "Stansted Express → aeroporto", board: "tx-liverpoolst", secMin: 80, fromMin: 25, fromLabel: "Tram → Haymarket" },
  { fromCode: "EDI", fromCity: "Edimburgo", toCode: "•••", toCity: "Scalo", tag: "Rientro", tagBg: "#FF2E7E", arrow: "#FF2E7E", toMin: 25, toLabel: "Tram → aeroporto Edimburgo", secMin: 70, fromMin: 0, fromLabel: "" },
  { fromCode: "•••", fromCity: "Scalo", toCode: "•••", toCity: "Arrivo", tag: "Scalo", tagBg: "#0E1542", arrow: "#14C08C", toMin: 0, toLabel: "", secMin: 0, fromMin: 30, fromLabel: "→ destinazione finale" },
];

/* Extra layers of a realistic paper card, on top of the fibre (::before) and the
   gated screen sheen (::after) from index.css. Both layers use border-radius:inherit
   only (no hard masks), so they follow the card's exact shape and never leave a
   rectangular edge:
   - a gentle DIFFUSE body-shading (soft-light) for a sense of light direction;
   - the paper FIBRE inside the reflection (screen), faded in with --sheen so the
     flare carries visible tooth without texturing the card at rest. */
function Overlays() {
  return (
    <>
      {/* Diffuse body shading — subtle, follows the shape. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: "inherit",
          background: `radial-gradient(170% 150% at var(--lx) var(--ly), rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.07) 100%)`,
          mixBlendMode: "soft-light",
        }}
      />
      {/* Fibre inside the reflection — only visible as the sheen flares. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: "inherit",
          zIndex: 4,
          backgroundImage: "var(--grain)",
          backgroundSize: "84px 84px",
          opacity: "calc(var(--sheen) * 0.55)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}

// A "perforation" cut line (the ticket tear) with a 2-tone embossed relief so the
// dashes catch the light and read as an actual indentation, plus optional round
// notches punched in the card edges (painted with the section's background color).
function Perforation({ notch = 0, notchColor = "#0E1542", weight = 2 }) {
  // Debossed cut line. The relief is applied with drop-shadow on the dashed border,
  // so it follows EACH dash (transparent gaps cast nothing) instead of running as a
  // continuous shadow line. Light from top-left: dark above, light below.
  const dash = {
    flex: 1,
    borderTop: `${weight}px dashed #CBBF9F`,
    filter:
      "drop-shadow(0 1px 0 rgba(255,255,255,0.6)) drop-shadow(0 -0.5px 0 rgba(78,66,42,0.18))",
  };
  // Sits above the paper sheen (z-index 4) so the reflection never spills over the
  // notch / cut — the notch reads as a real concavity in the card silhouette.
  const root = { position: "relative", zIndex: 6, display: "flex", alignItems: "center" };
  if (!notch) return <div style={root}><div style={dash} /></div>;
  // Punched hole: inner shadow on the top-left, faint inner light on the bottom-right.
  const dot = { width: notch, height: notch, borderRadius: "50%", background: notchColor, boxShadow: "inset 1.5px 1.5px 2.5px rgba(0,0,0,0.22), inset -1px -1px 1.5px rgba(255,255,255,0.1)" };
  return (
    <div style={root}>
      <div style={{ ...dot, marginLeft: -notch / 2 }} />
      <div style={dash} />
      <div style={{ ...dot, marginRight: -notch / 2 }} />
    </div>
  );
}

// Progressive-enhancement glass. Only Chromium/Blink actually renders an SVG
// displacement map fed into backdrop-filter — that's the "viral" refractive glass.
// WebKit (Safari, and EVERY browser on iOS) silently ignores feDisplacementMap in
// backdrop-filter; worse, it can drop the whole declaration. So we detect Blink in JS
// and only ever emit the url() filter there — WebKit never sees it and keeps the
// proven blur-glass byte-for-byte. Guarded for SSR (smoke test has no navigator).
//   vendor === 'Google Inc.'  -> Blink (Chrome/Edge/Opera/Brave); Safari is 'Apple…', Firefox is ''.
//   CriOS/FxiOS/EdgiOS        -> Chrome/Firefox/Edge ON iOS, which are WebKit underneath (exclude).
const GLASS_REFRACTION = (() => {
  try {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return navigator.vendor === "Google Inc." && !/CriOS|FxiOS|EdgiOS/.test(ua);
  } catch { return false; }
})();

// Floating "liquid glass" bottom tab bar (detached from the screen edges).
// 5 primary destinations + a "More" popup; it compacts (icon-only) while scrolling.
function BottomNav({ active, moreOpen, onToggleMore, onClose, extra, compact, onExpand }) {
  const tabs = [
    { id: "sNow", label: "Oggi", icon: "oggi" },
    { id: "s01", label: "Voli", icon: "voli" },
    { id: "s02", label: "Alloggi", icon: "hotel" },
    { id: "sPlan", label: "Piano", icon: "planner" },
    { id: "sFav", label: "Preferiti", icon: "preferit" },
  ];
  const moreActive = moreOpen || extra.some((e) => e.href === "#" + active);
  const lbl = (on) => ({ fontSize: 10, fontWeight: on ? 900 : 700, letterSpacing: "-.01em", maxHeight: compact ? 0 : 14, opacity: compact ? 0 : 1, overflow: "hidden", transition: "max-height .25s, opacity .2s" });
  // Each tab collapses to zero width when compact so the bar contracts to a ball.
  const slot = (visible) => ({
    flex: visible ? 1 : "0 0 0px", maxWidth: visible ? 140 : 0,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
    opacity: visible ? 1 : 0, overflow: "hidden", pointerEvents: visible ? "auto" : "none",
    textDecoration: "none", border: "none", background: "transparent", cursor: "pointer", WebkitTapHighlightColor: "transparent",
    transition: "flex .3s cubic-bezier(.22,1,.36,1), max-width .3s cubic-bezier(.22,1,.36,1), opacity .22s",
  });
  // Native-iOS selection: NO background blob. The active tab is carried purely by the
  // accent tint + heavier label (colour is set on the <a>/<button> below, which also
  // overrides any :visited link colour). This removes the ambiguous "circle or square?"
  // yellow shape the user disliked. capsule() is now just layout.
  const capsule = () => ({
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: compact ? 0 : 3, padding: compact ? 0 : "5px 10px 4px", borderRadius: 12,
  });
  const tabColor = (on) => (on ? "#FFD23F" : "rgba(235,235,245,0.62)");
  // Two glass recipes. WebKit/iOS keep today's proven frosted blur; Blink also bends
  // the backdrop through the SVG lens (url(#liquidGlass)) — the real refractive glass.
  // On Blink we drop the frost to a hair so the refraction stays visible, and lighten
  // the tint so there's something to refract.
  // Thin, dark, genuinely translucent glass — content reads through it (not a milky slab).
  const glassBg = GLASS_REFRACTION
    ? "linear-gradient(180deg, rgba(40,42,66,0.26) 0%, rgba(14,16,30,0.42) 100%)"
    : "linear-gradient(180deg, rgba(24,26,46,0.58) 0%, rgba(14,16,32,0.62) 100%)";
  const glassFilter = GLASS_REFRACTION
    ? "url(#liquidGlass) blur(2px) saturate(170%) brightness(1.06)"
    : "blur(20px) saturate(180%)";
  const glassPerf = GLASS_REFRACTION ? { isolation: "isolate", willChange: "backdrop-filter" } : null;
  return (
    <>
      {/* Popup menu with everything that doesn't fit in the bar */}
      {moreOpen && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(8,11,32,0.5)" }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", paddingBottom: "calc(86px + env(safe-area-inset-bottom))" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480 }}>
              <div style={{ margin: "0 14px", background: "rgba(23,20,54,0.82)", backdropFilter: "blur(22px) saturate(180%)", WebkitBackdropFilter: "blur(22px) saturate(180%)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 22, padding: 8, boxShadow: "0 18px 44px rgba(0,0,0,0.5)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#9aa2d4", padding: "8px 12px 6px" }}>Altre sezioni</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {extra.map((e) => {
                    const on = e.href === "#" + active;
                    return (
                      <a key={e.href} href={e.href} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", borderRadius: 12, textDecoration: "none", background: on ? "rgba(255,210,63,0.16)" : "rgba(255,255,255,0.05)", color: on ? "#FFD23F" : "#fff", fontSize: 13.5, fontWeight: 800 }}>
                        {e.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Refractive lens — only mounted on Blink, where backdrop-filter: url() actually
          bends the backdrop. feTurbulence makes noise, feGaussianBlur softens it into a
          molten field, feDisplacementMap shifts the backdrop by it. Tuned small (scale 26,
          low frequency) for a ~58px pill so icons/labels behind it don't tear. */}
      {GLASS_REFRACTION && (
        <svg aria-hidden width="0" height="0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}>
          <filter id="liquidGlass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.011" numOctaves="2" seed="92" stitchTiles="stitch" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="26" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <nav style={{ position: "fixed", left: 0, right: 0, bottom: "calc(env(safe-area-inset-bottom) + 12px)", zIndex: 90, display: "flex", justifyContent: compact ? "flex-end" : "center", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: compact ? 0 : 3, background: glassBg, backdropFilter: glassFilter, WebkitBackdropFilter: glassFilter, ...glassPerf, border: "0.5px solid rgba(255,255,255,0.12)", boxShadow: "0 10px 34px rgba(0,0,0,0.42), inset 0 0.6px 0 rgba(255,255,255,0.28)", width: compact ? 56 : "100%", height: compact ? 56 : "auto", maxWidth: compact ? 56 : 430, margin: compact ? "0 16px 0 0" : "0 12px", padding: compact ? 0 : "6px 8px", borderRadius: 999, overflow: "hidden", transition: "width .32s cubic-bezier(.22,1,.36,1), height .32s cubic-bezier(.22,1,.36,1), padding .3s, margin .3s, gap .3s" }}>
          {/* specular sheen across the top — the liquid-glass highlight (subtle) */}
          <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 55%)" }} />
          {tabs.map((t) => {
            const on = !moreOpen && t.id === active;
            const visible = !compact || on;
            return (
              <a key={t.id} href={"#" + t.id} onClick={(e) => { if (compact) { e.preventDefault(); onExpand(); } else { onClose(); } }} style={{ ...slot(visible), color: tabColor(on), WebkitTextFillColor: tabColor(on) }}>
                <span style={capsule()}>
                  <BarIcon name={t.icon} size={22} />
                  <span style={lbl(on)}>{t.label}</span>
                </span>
              </a>
            );
          })}
          {(() => {
            const visible = !compact || moreActive;
            return (
              <button onClick={() => { if (compact) onExpand(); else onToggleMore(); }} style={{ ...slot(visible), color: tabColor(moreActive), WebkitTextFillColor: tabColor(moreActive) }}>
                <span style={capsule()}>
                  <BarIcon name="ellipsis" size={22} />
                  <span style={lbl(moreActive)}>Altro</span>
                </span>
              </button>
            );
          })()}
        </div>
      </nav>
    </>
  );
}

// Collapsible settings panel — header (tap to expand) + body shown only when open,
// so Impostazioni never shows every control at once.
function Collapsible({ open, onToggle, title, sub, children }) {
  return (
    <div style={{ background: "#211d3e", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 15px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#fff" }}>{title}</span>
          {sub && <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9d98c4", marginTop: 2 }}>{sub}</span>}
        </span>
        <span style={{ flex: "none", color: "#FFD23F", fontSize: 15, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</span>
      </button>
      {open && <div style={{ padding: "0 15px 15px" }}>{children}</div>}
    </div>
  );
}

// Interactive trip checklist — checkable, collapsible and editable. Items live in
// the plan (and travel inside the same programme JSON), so they sync via backup/import.
function Checklist({ items, onToggle, onAdd, onEdit, onRemove }) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const done = items.filter((i) => i.done).length;
  const add = () => { onAdd(text); setText(""); };
  return (
    <div style={{ background: "#0E1542", borderRadius: 16, marginTop: 4, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px" }}>
        <button onClick={() => setOpen(!open)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#FFD23F" }}>Checklist</span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#9aa2d4", background: "rgba(255,255,255,.08)", borderRadius: 999, padding: "2px 9px" }}>{done}/{items.length}</span>
          <span style={{ marginLeft: "auto", color: "#9aa2d4", fontSize: 14, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</span>
        </button>
        <button onClick={() => setEditing(!editing)} style={{ flex: "none", fontSize: 11, fontWeight: 900, color: editing ? "#0E1542" : "#FFD23F", background: editing ? "#FFD23F" : "rgba(255,210,63,.14)", border: "none", borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}>{editing ? "Fine ✓" : "Modifica"}</button>
      </div>
      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 2px", borderTop: i ? "1px solid rgba(255,255,255,.07)" : "none" }}>
              {!editing && (
                <button onClick={() => onToggle(i)} style={{ flex: "none", width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${it.done ? "#14C08C" : "#3a4170"}`, background: it.done ? "#14C08C" : "transparent", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{it.done ? "✓" : ""}</button>
              )}
              {editing ? (
                <input value={it.t} onChange={(e) => onEdit(i, e.target.value)} style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "#fff", background: "#15122b", border: "1px solid #3a3560", borderRadius: 8, padding: "7px 9px" }} />
              ) : (
                <span onClick={() => onToggle(i)} style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: it.done ? "#7a83b8" : "#fff", textDecoration: it.done ? "line-through" : "none", cursor: "pointer", lineHeight: 1.4 }}>{it.t}</span>
              )}
              {editing && <button onClick={() => onRemove(i)} aria-label="Rimuovi" style={{ flex: "none", color: "#ff8f7d", background: "transparent", border: "none", fontSize: 18, fontWeight: 900, cursor: "pointer", lineHeight: 1 }}>×</button>}
            </div>
          ))}
          {editing && (
            <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Aggiungi una voce…" style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#fff", background: "#15122b", border: "1px solid #3a3560", borderRadius: 8, padding: "8px 10px" }} />
              <button onClick={add} style={{ flex: "none", fontSize: 16, fontWeight: 900, color: "#0E1542", background: "#FFD23F", border: "none", borderRadius: 8, padding: "0 15px", cursor: "pointer" }}>+</button>
            </div>
          )}
          {items.length === 0 && !editing && <div style={{ fontSize: 12.5, color: "#9aa2d4", fontWeight: 600, padding: "4px 2px" }}>Nessuna voce. Tocca « Modifica » per aggiungerne.</div>}
        </div>
      )}
    </div>
  );
}

// Best-effort OS + browser sniff (UA-based) to tailor the "install as app"
// instructions. SSR-safe: returns a generic shape when navigator is absent.
function detectPlatform() {
  if (typeof navigator === "undefined") return { os: "", browser: "il browser", kind: "generic" };
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const win = /Windows/.test(ua);
  const mac = /Macintosh/.test(ua) && !iOS;
  const edge = /Edg\//.test(ua);
  const samsung = /SamsungBrowser/.test(ua);
  const firefox = /Firefox\/|FxiOS/.test(ua);
  const criOS = /CriOS/.test(ua);
  const chromium = /Chrome\//.test(ua) && !edge && !samsung;
  const os = iOS ? "iPhone / iPad" : android ? "Android" : win ? "Windows" : mac ? "Mac" : "";
  let browser = iOS ? "Safari" : "il browser";
  if (edge) browser = "Edge"; else if (samsung) browser = "Samsung Internet"; else if (criOS) browser = "Chrome"; else if (firefox) browser = "Firefox"; else if (chromium) browser = "Chrome";
  let kind = "generic";
  if (iOS) kind = criOS || firefox ? "ios-other" : "ios-safari";
  else if (android) kind = "android";
  else if (win || mac) kind = firefox ? "desktop-firefox" : "desktop";
  return { os, browser, kind, iOS, android };
}

// Tailored, numbered steps for adding the app to the home screen / installing it.
function installSteps(kind) {
  switch (kind) {
    case "ios-safari":
      return ["Tocca l’icona Condividi (il quadrato con la freccia ↑) nella barra in basso.", "Scorri e scegli « Aggiungi a Home ».", "Tocca « Aggiungi »: l’icona del Taccuino comparirà come un’app."];
    case "ios-other":
      return ["Apri il menu del browser e tocca « Aggiungi a Home » (Add to Home Screen).", "Conferma per creare l’icona.", "Suggerimento: in Safari l’installazione è ancora più semplice."];
    case "android":
      return ["Tocca il menu ⋮ in alto a destra.", "Scegli « Installa app » (o « Aggiungi a schermata Home »).", "Conferma: l’icona finisce tra le tue app."];
    case "desktop":
      return ["Clicca l’icona « Installa » (uno schermo con ↓) nella barra degli indirizzi.", "In alternativa: menu ⋮ → « Installa Taccuino Scozia… ».", "L’app si apre in una sua finestra dedicata."];
    case "desktop-firefox":
      return ["Firefox su desktop non installa le web app.", "Salva la pagina nei preferiti (Ctrl/Cmd + D) per ritrovarla al volo.", "Su telefono, aggiungila alla schermata Home dal menu del browser."];
    default:
      return ["Apri il menu del tuo browser.", "Cerca « Installa app » o « Aggiungi a schermata Home ».", "Conferma per creare l’icona."];
  }
}

// "Use it as an app" invitation. Shows the native install button when the
// browser offers one (Chromium), otherwise the right manual steps for the
// detected OS/browser. Renders nothing once the app is already installed.
function InstallCard({ platform, canPrompt, onInstall, compact }) {
  const steps = installSteps(platform.kind);
  const detected = platform.os ? platform.os + " · " + platform.browser : "";
  const btn = { cursor: "pointer", border: "none", borderRadius: 999, fontWeight: 900, fontSize: 14, padding: "11px 18px", background: "#FFD23F", color: "#0E1542" };
  return (
    <div style={{ background: "#0E1542", borderRadius: 18, padding: compact ? "14px 15px" : "17px 16px 18px", marginBottom: compact ? 0 : 12, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "#14C08C", borderRadius: "50%", opacity: 0.22 }} />
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: "#2BE3A8" }}>Usala come un’app</div>
        <div style={{ fontWeight: 900, fontSize: compact ? 17 : 20, color: "#fff", margin: "3px 0 5px" }}>📲 Installa il Taccuino</div>
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#C2C9EC", fontWeight: 600, lineHeight: 1.5 }}>Si apre a tutto schermo, parte con un tocco e <strong style={{ color: "#fff" }}>funziona offline</strong> — perfetta in aereo o senza rete. {detected && <span style={{ color: "#8089b8" }}>Rilevato: {detected}.</span>}</p>
        {canPrompt ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
            <button onClick={onInstall} style={btn}>⇩ Installa ora</button>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#8089b8" }}>un tocco, ci pensa il browser</span>
          </div>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {steps.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flex: "none", width: 21, height: 21, borderRadius: 999, background: "#FFD23F", color: "#0E1542", fontWeight: 900, fontSize: 11.5, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, color: "#EAEDF9", fontWeight: 600, lineHeight: 1.45 }}>{s}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// First-run guide (shown in "Oggi" until a partenza date is loaded): explains how the
// app works and lets the user download the config JSON to fill in and re-import.
function Onboarding({ onDownload, onCopy, msg, jsonText, onJsonInput, onSave, onFile, onPaste, feedback, installCard }) {
  const step = (n, title, body, action, last) => (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: "#0E1542", color: "#FFD23F", fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        {!last && <span style={{ flex: 1, width: 2, background: "#E1D7BF", marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 16 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: "#17142C" }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "#5b5644", fontWeight: 600, lineHeight: 1.5, marginTop: 3 }}>{body}</div>
        {action && <div style={{ marginTop: 10 }}>{action}</div>}
      </div>
    </div>
  );
  const btn = (bg, fg) => ({ cursor: "pointer", display: "inline-block", fontSize: 13, fontWeight: 900, color: fg, background: bg, border: "none", padding: "10px 15px", borderRadius: 999, textDecoration: "none" });
  const feat = (t) => (
    <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 13, lineHeight: 1.5, fontWeight: 600, color: "#5b5644" }}>
      <span style={{ flex: "none", color: "#14C08C", fontWeight: 900 }}>✓</span><span>{t}</span>
    </div>
  );
  // Keep first run uncluttered: the JSON config (only for who has bookings) is
  // tucked behind a disclosure, auto-opened once there's something to report.
  const [cfgOpen, setCfgOpen] = useState(false);
  const configOpen = cfgOpen || !!feedback || !!(jsonText && jsonText.trim());
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF2E7E", animation: "scoziaPulse 1.8s ease-in-out infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", color: "#17142C" }}>Primo avvio</span>
      </div>
      <h2 style={{ fontWeight: 900, fontSize: 30, lineHeight: 1.02, margin: "0 0 3px", color: "#0E1542", letterSpacing: "-0.02em" }}>Benvenuto nel Taccuino</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 600, color: "#6B6450", lineHeight: 1.5 }}>La tua guida da campo <strong style={{ color: "#17142C" }}>offline</strong> per il viaggio Londra → Edimburgo. Funziona senza rete e i tuoi dati restano <strong style={{ color: "#17142C" }}>solo su questo dispositivo</strong>.</p>

      {/* Install-as-app invitation (first thing a new visitor should do) */}
      {installCard}

      {/* How it works — for everyone, shown before the (optional) data config */}
      <div style={{ background: "#F6F0E2", borderRadius: 18, padding: "16px 16px 18px", marginBottom: 12, border: "1.5px solid #E1D7BF" }}>
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: "#9a7a14" }}>Come funziona</div>
        <div style={{ marginTop: 8 }}>
          {feat("Esplora le sezioni: Edimburgo, Mangiare & locali, Esperienze, Dintorni & gite, Glasgow, Londra.")}
          {feat("Salva i preferiti con la ★ su qualsiasi luogo o attività.")}
          {feat("Costruisci il Programma giorno per giorno — trascinando le tappe, anche con l'aiuto di un'AI.")}
          {feat("Tutto è consultabile offline: in aereo, in metro o senza rete.")}
          {feat("Nessun account e nessun server: i dati riservati restano sul tuo dispositivo.")}
        </div>
      </div>

      {/* Config card — optional, behind a disclosure (only who has bookings) */}
      <div style={{ background: "#F6F0E2", borderRadius: 18, padding: configOpen ? "16px 16px 18px" : "4px 6px", marginBottom: 4, border: "1.5px solid #E1D7BF" }}>
        <button onClick={() => setCfgOpen((o) => !o)} style={{ cursor: "pointer", width: "100%", background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", textAlign: "left" }}>
          <span style={{ flex: "none", fontSize: 18 }} aria-hidden>🧳</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 900, fontSize: 15, color: "#17142C" }}>Ho le mie prenotazioni</span>
            <span style={{ display: "block", fontSize: 12, color: "#6B6450", fontWeight: 600 }}>Carica voli, alloggi e date per attivare « Oggi », meteo e conto alla rovescia</span>
          </span>
          <span style={{ flex: "none", fontSize: 13, fontWeight: 900, color: "#9a7a14" }}>{configOpen ? "▾" : "▸"}</span>
        </button>
        {configOpen && (
        <div style={{ padding: "6px 10px 4px" }}>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#5b5644", fontWeight: 600, lineHeight: 1.5 }}>Ti serve un file JSON con i tuoi voli, alloggi e date. Prendi il modello con <strong style={{ color: "#17142C" }}>uno</strong> dei due metodi qui sotto, riempilo e importalo.</p>
        {step(1, "Prendi e riempi il modello",
          <>Stesso file, due strade: scegli quella che preferisci.</>,
          <div style={{ display: "grid", gap: 13 }}>
            <div>
              <button onClick={onCopy} style={btn("#14C08C", "#fff")}>✨ Fallo fare a un'AI · Copia</button>
              <div style={{ fontSize: 11.5, color: "#6B6450", fontWeight: 600, lineHeight: 1.45, marginTop: 6 }}>Incollalo in ChatGPT o Claude con le tue prenotazioni e chiedi di riempirlo. <strong style={{ color: "#17142C" }}>Il modo più veloce.</strong></div>
            </div>
            <div>
              <button onClick={onDownload} style={btn("#FFD23F", "#0E1542")}>✎ Compila a mano · Scarica .json</button>
              <div style={{ fontSize: 11.5, color: "#6B6450", fontWeight: 600, lineHeight: 1.45, marginTop: 6 }}>Apri il file e sostituisci i segnaposto d'esempio con i tuoi dati.</div>
            </div>
          </div>)}
        {step(2, "Carica e parti",
          <>Hai il JSON compilato? Caricalo qui — si attivano conto alla rovescia, « Oggi », meteo e programma.</>,
          <div style={{ display: "grid", gap: 9 }}>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <label style={{ ...btn("#14C08C", "#fff"), cursor: "pointer" }}>📁 Carica file
                <input type="file" accept=".json,application/json,text/json,text/plain,application/octet-stream" onChange={onFile} style={{ display: "none" }} />
              </label>
              <button onClick={onPaste} style={btn("rgba(14,21,66,.09)", "#0E1542")}>📋 Incolla</button>
            </div>
            <textarea value={jsonText || ""} onChange={onJsonInput} placeholder="…oppure incolla qui il JSON compilato" style={{ width: "100%", minHeight: 92, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5, color: "#17142C", background: "#fff", border: "1.5px solid #E1D7BF", borderRadius: 12, padding: 10, resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
            <button onClick={onSave} style={{ ...btn("#FFD23F", "#0E1542"), display: "block", width: "100%", textAlign: "center" }}>Salva dati e parti</button>
            {feedback && <div style={{ fontSize: 12, fontWeight: 800, color: feedback.ok ? "#0E3A2A" : "#fff", background: feedback.ok ? "#9BE8C8" : "#E6482A", padding: "9px 11px", borderRadius: 10, lineHeight: 1.45 }}>{feedback.msg}</div>}
          </div>,
          true)}
        {msg && <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#FFE9A8", padding: "10px 12px", borderRadius: 10 }}>{msg}</div>}
        </div>
        )}
      </div>
    </div>
  );
}

export default class App extends React.Component {
  static defaultProps = {
    coverVariant: "Manifesto",
    showWeather: true,
  };

  state = {
    reserved: null,
    plan: null,
    sim: null,
    jsonText: "",
    favText: "",
    planText: "",
    feedback: null,
    copyMsg: "",
    toast: null, // { msg, ok } transient confirmation, auto-dismissed
    favCopyMsg: "",
    favImpMsg: "",
    planCopyMsg: "",
    planImpMsg: "",
    planTplMsg: "",
    backupMsg: "",
    open: {},
    dayOpen: {},
    dupWarn: "",
    pickerFor: null,
    pickerQuery: "",
    pickerCat: "",
    pickerHood: "", // city neighbourhood filter (Old Town, Leith, Shoreditch…)
    pickerArea: "", // day-trip geographic-area filter (Fife, Glasgow, East Lothian…)
    forecast: null,
    wxErr: null,
    coverVar: null,
    lightOn: false,
    simOpen: false,
    navActive: "sNow",
    moreOpen: false,
    detail: null,
    detailList: [], // sibling ids for swipe-to-next/prev inside the open detail
    detailStack: [], // parent cards below the visible one (back-navigation)
    editDays: {},
    navCompact: false,
    setOpen: {},
    installEvt: null, // deferred beforeinstallprompt (Chromium: Android/desktop)
    installed: false, // running as an installed PWA (standalone)
    updateInfo: { checking: false, latest: null, available: false, checkedOnce: false },
  };

  componentDidMount() {
    // PWA install: capture the native prompt where the browser offers it, and
    // detect whether we're already running as an installed app.
    try {
      const standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
      if (standalone) this.setState({ installed: true });
    } catch (e) {}
    this._onBIP = (e) => { e.preventDefault(); this.setState({ installEvt: e }); };
    this._onInstalled = () => this.setState({ installed: true, installEvt: null });
    window.addEventListener("beforeinstallprompt", this._onBIP);
    window.addEventListener("appinstalled", this._onInstalled);
    this.checkForUpdate(false);
    const ld = (k) => {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : null;
      } catch (e) {
        return null;
      }
    };
    let sim = null;
    try {
      sim = localStorage.getItem("scozia_sim_v2") || null;
    } catch (e) {}
    // Migrate any old slot-based plan (date keys) to the new day-index event model.
    const loaded = ld("scozia_plan_v2");
    const isNew = loaded && loaded.days && Object.keys(loaded.days).some((k) => /^g[0-5]$/.test(k));
    let plan;
    if (isNew) {
      plan = loaded;
    } else {
      plan = seedPlan();
      if (loaded && Array.isArray(loaded.favs)) plan.favs = loaded.favs;
    }
    // Older saved plans predate the checklist — seed it so it's always editable.
    if (plan && !Array.isArray(plan.checklist)) plan.checklist = seedPlan().checklist;
    this.setState({
      reserved: ld("scozia_riservato_v2"),
      plan,
      forecast: ld("scozia_meteo_v2"),
      sim,
      coverVar: this.props.coverVariant ?? "Manifesto",
    });
  }

  componentWillUnmount() {
    window.removeEventListener("deviceorientation", this.onTilt, true);
    window.removeEventListener("scroll", this.schedulePaint, true);
    window.removeEventListener("resize", this.schedulePaint);
    if (this._onBIP) window.removeEventListener("beforeinstallprompt", this._onBIP);
    if (this._onInstalled) window.removeEventListener("appinstalled", this._onInstalled);
  }

  // Fire the browser's native install prompt (Chromium only; captured above).
  promptInstall = async () => {
    const e = this.state.installEvt;
    if (!e) return;
    try { e.prompt(); await e.userChoice; } catch (err) {}
    this.setState({ installEvt: null });
  };

  componentDidUpdate() {
    // positions shift when sections open/close or data loads
    this.schedulePaint();
  }

  // ---------- light ----------
  // Tilt is stored, not applied directly: paintLight() combines the device tilt
  // with EACH card's position on screen, so a card near the top reflects the
  // (fixed, environment) light differently from one lower down.
  tiltG = 0;
  tiltB = 35;
  setRoot = (el) => {
    this.rootEl = el;
    if (el) {
      window.addEventListener("scroll", this.schedulePaint, true);
      window.addEventListener("resize", this.schedulePaint);
      this.schedulePaint();
    }
  };
  schedulePaint = () => {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      this.paintLight();
    });
  };
  paintLight = () => {
    const root = this.rootEl;
    if (!root) return;
    const vh = window.innerHeight || 1;
    const gN = (this.tiltG || 0) / 45; // -1..1 left/right
    const bN = ((this.tiltB == null ? 35 : this.tiltB) - 35) / 60; // up/down
    const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
    // Global drop-shadow shifts opposite the light.
    root.style.setProperty("--sx", (-gN * 15).toFixed(2));
    root.style.setProperty("--sy", (bN * 11).toFixed(2));
    // The reflection only flares when the card is tilted to catch the light — like
    // a real ticket. Near flat it stays faint so the print is fully legible.
    const tiltMag = Math.min(1, Math.hypot(gN, bN));
    // Quadratic ramp: faint at rest (legible), flares only when tilted to catch the
    // light. Capped below full so the dark ink never washes out.
    const sheen = clamp(0.06 + tiltMag * tiltMag * 0.58, 0.06, 0.6);
    root.style.setProperty("--sheen", sheen.toFixed(3));
    root.querySelectorAll(".paper").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const screenPos = clamp((r.top + r.height / 2) / vh, 0, 1); // 0 top → 1 bottom
      // One light: its position on the card depends on where the card sits on the
      // screen (top vs bottom differ) plus device tilt.
      const lx = clamp(30 + gN * 45, -15, 115);
      const ly = clamp(20 + screenPos * 60 + bN * 24, -15, 115);
      el.style.setProperty("--lx", lx.toFixed(1) + "%");
      el.style.setProperty("--ly", ly.toFixed(1) + "%");
    });
    // Scroll-spy for the bottom tab bar: the last primary section whose top has
    // passed the line under the header is the active one.
    let active = this.state.navActive;
    for (const id of ALL_SECTIONS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 140) active = id;
    }
    if (active !== this.state.navActive) this.setState({ navActive: active });
    // Floating bar shrinks while scrolling down, expands near the top / scrolling up.
    const sy = window.scrollY || document.documentElement.scrollTop || 0;
    const last = this._lastScrollY == null ? sy : this._lastScrollY;
    let compact = this.state.navCompact;
    if (sy < 80) compact = false;
    else if (sy > last + 8) compact = true;
    else if (sy < last - 8) compact = false;
    this._lastScrollY = sy;
    if (compact !== this.state.navCompact) this.setState({ navCompact: compact });
  };
  enableLight = () => {
    const DOE = window.DeviceOrientationEvent;
    const attach = () => {
      window.addEventListener("deviceorientation", this.onTilt, true);
      this.setState({ lightOn: true });
    };
    if (DOE && typeof DOE.requestPermission === "function") {
      DOE.requestPermission()
        .then((p) => {
          if (p === "granted") attach();
        })
        .catch(() => {});
    } else if (DOE) {
      attach();
    } else {
      this.setState({ lightOn: true });
    }
  };
  onTilt = (e) => {
    this.tiltG = Math.max(-45, Math.min(45, e.gamma || 0));
    this.tiltB = Math.max(-90, Math.min(90, e.beta || 0));
    this.schedulePaint();
  };

  // ---------- helpers ----------
  M(q) {
    return mapsUrl(q);
  }
  iso(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }
  nowDate() {
    return this.state.sim ? new Date(this.state.sim) : new Date();
  }
  // ---------- dates (derived only from reserved `partenza`; none hardcoded) ----------
  tripStart() {
    const R = this.effReserved();
    const p = R && R.partenza;
    return p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null;
  }
  dateForIdx(i) {
    const s = this.tripStart();
    if (!s) return null;
    const d = new Date(s + "T12:00:00");
    d.setDate(d.getDate() + i);
    return this.iso(d);
  }
  tripDates() {
    if (!this.tripStart()) return null;
    return DAYS.map((_, i) => this.dateForIdx(i));
  }
  prettyDate(iso, withDow) {
    const d = new Date(iso + "T12:00:00");
    const dow = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][d.getDay()];
    return (withDow ? dow + " " : "") + d.getDate() + " " + MESI[d.getMonth()];
  }
  rangeLong() {
    const dates = this.tripDates();
    if (!dates) return "Date in Impostazioni";
    const a = new Date(dates[0] + "T12:00:00"), b = new Date(dates[5] + "T12:00:00");
    return a.getDate() + " – " + b.getDate() + " " + MESI_LONG[b.getMonth()] + " " + b.getFullYear();
  }
  rangeShort() {
    const dates = this.tripDates();
    if (!dates) return "DATE";
    const a = new Date(dates[0] + "T12:00:00"), b = new Date(dates[5] + "T12:00:00");
    return a.getDate() + "–" + b.getDate() + " " + MESI[b.getMonth()].toUpperCase();
  }
  parseMin(s) {
    if (!s) return null;
    const m = String(s).match(/(\d{1,2}):(\d{2})/);
    return m ? +m[1] * 60 + +m[2] : null;
  }
  hhmm(min) {
    return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(Math.round(min % 60)).padStart(2, "0");
  }
  // Back-plan a flight from its reserved times + leg estimates. Security finishes a
  // little AFTER the gate opens (you're then at the gate until takeoff), never past
  // gate close. `accessMin` = extra time before the transfer (e.g. hotel→station walk).
  flightPlan(f, leg, accessMin = 0) {
    const dep = this.parseMin(f && f.orario);
    if (dep == null) return null;
    const gateOpen = this.parseMin(f && f.apertura_gate) != null ? this.parseMin(f.apertura_gate) : dep - 40;
    const gateClose = this.parseMin(f && f.chiusura_gate) != null ? this.parseMin(f.chiusura_gate) : dep - 15;
    const secMin = (leg && leg.secMin) || 0;
    let secEnd = gateOpen;
    if (secMin > 0) secEnd = Math.max(gateOpen, Math.min(gateOpen + 12, gateClose - 5));
    const secStart = secEnd - secMin;
    const toMin = (leg && leg.toMin) || 0;
    const leaveBy = secStart - toMin - accessMin;
    return { dep, gateOpen, gateClose, secMin, secStart, secEnd, toMin, leaveBy };
  }
  durLabel(min) {
    if (!min) return "—";
    const h = Math.floor(min / 60),
      m = min % 60;
    if (min >= 240) {
      const v = Math.round((min / 60) * 10) / 10;
      return (v % 1 ? v.toFixed(1) : v) + "h";
    }
    return ((h ? h + "h " : "") + (m ? m + "′" : "")).trim() || "—";
  }
  fmtH(d) {
    const h = Math.floor(d),
      m = Math.round((d - h) * 60);
    return String(h).padStart(2, "0") + (m ? ":" + String(m).padStart(2, "0") : ":00");
  }
  toggle(id) {
    this.setState((s) => ({ open: { ...s.open, [id]: !s.open[id] } }));
  }
  // One transient toast for quick confirmations (copy / download / save), so
  // feedback is consistent instead of scattered inline messages.
  showToast = (msg, ok = true) => {
    this.setState({ toast: { msg, ok } });
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.setState({ toast: null }), 2600);
  };

  // Version check: fetch the just-deployed version.json (no-store, so it
  // never comes from the HTTP cache or the service worker — .json isn't in
  // its precache list) and compare against __APP_VERSION__ baked into THIS
  // running bundle at build time. `manual` just controls whether we surface
  // a toast for a "you're already up to date" result (silent on mount).
  checkForUpdate = (manual) => {
    this.setState((s) => ({ updateInfo: { ...s.updateInfo, checking: true } }));
    fetch("./version.json?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const available = !!(data && data.version && data.version !== __APP_VERSION__);
        this.setState({ updateInfo: { checking: false, latest: data && data.version, available, checkedOnce: true } });
        if (manual) this.showToast(available ? "Nuova versione disponibile ✨" : "Sei già aggiornato ✓", true);
      })
      .catch(() => {
        this.setState((s) => ({ updateInfo: { ...s.updateInfo, checking: false, checkedOnce: true } }));
        if (manual) this.showToast("Impossibile controllare (sei offline?)", false);
      });
  };
  // Clears only the app's own build cache (CacheStorage + service worker
  // registration) so the next load fetches the new build fresh — never
  // touches localStorage, so il programma, i preferiti e i dati riservati
  // restano intatti.
  applyUpdate = async () => {
    this.showToast("Aggiornamento in corso…", true);
    try {
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } finally {
      window.location.reload();
    }
  };

  copyText(t, cb) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(cb, () => this._fallbackCopy(t, cb));
        return;
      }
    } catch (e) {}
    this._fallbackCopy(t, cb);
  }
  _fallbackCopy(t, cb) {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      cb();
    } catch (e) {
      cb();
    }
  }

  // ---------- reserved ----------
  // No data lives in code: the app starts empty and is populated only from the
  // JSON the user pastes (saved to localStorage). Until then, cards stay locked.
  effReserved() {
    return this.state.reserved;
  }

  // ---------- plan mutation ----------
  planMut(fn) {
    const p = JSON.parse(JSON.stringify(this.state.plan || seedPlan()));
    fn(p);
    try {
      localStorage.setItem("scozia_plan_v2", JSON.stringify(p));
    } catch (e) {}
    this.setState({ plan: p });
  }
  // Day = flat array of { id, dur? }. Order in the array IS the chronological
  // order — there's no independent start time to fall out of sync with it.
  // (Older saves may still carry a legacy `start`, only used once as a
  // one-time sort seed — see dayEntries.)
  ensureDay(p, key) {
    if (!p.days) p.days = {};
    if (!Array.isArray(p.days[key])) p.days[key] = [];
  }
  dayEntries(key) {
    const p = this.state.plan;
    const raw = (p && p.days && Array.isArray(p.days[key]) && p.days[key]) || [];
    // Legacy migration: plans saved before the sequential model stored an
    // explicit clock time per entry. Sort by that ONCE (stable, so entries
    // without one keep their relative array position) so an old plan opens
    // in the order it already displayed — from here on, order comes purely
    // from the array (drag-to-reorder splices it directly).
    if (!raw.some((en) => en.start != null)) return raw;
    return raw.slice().sort((a, b) => {
      const pa = this.parseMin(a.start), pb = this.parseMin(b.start);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pa - pb;
    });
  }
  // When the day begins — "parti dall'hotel alle…". Everything after this is
  // derived: entry 0 starts here (+ its lead, e.g. the walk to the station),
  // every next entry starts when the previous one ends + the travel gap.
  dayStartOf(key) {
    const p = this.state.plan;
    const v = p && p.dayStart && p.dayStart[key];
    const m = v != null ? this.parseMin(v) : null;
    return m != null ? m : 9 * 60;
  }
  setDayStart(key, hhmm) {
    this.planMut((p) => {
      if (!p.dayStart) p.dayStart = {};
      p.dayStart[key] = hhmm;
    });
  }
  addEntry(key, id) {
    const D = getData();
    // Duplicate across days: warn, but add anyway (you might want to go back).
    // Hotels and transport hubs are expected in many days, so they never warn.
    const isNode = id === "hotel" || /^hotel\d+$/.test(id) || /^tx-/.test(id);
    let dupKey = null;
    const days = this.state.plan && this.state.plan.days;
    if (days && !isNode) for (const k in days) { if (k !== key && Array.isArray(days[k]) && days[k].some((e) => e.id === id)) { dupKey = k; break; } }
    this.planMut((p) => {
      this.ensureDay(p, key);
      p.days[key].push({ id }); // appended at the end — the new last tappa
    });
    this.setState({ pickerFor: null });
    if (dupKey) {
      const a = D.catalog[id];
      this.setState({ dupWarn: "“" + (a ? a.name : "Attività") + "” è già in un altro giorno — aggiunta comunque." });
      clearTimeout(this._dupT);
      this._dupT = setTimeout(() => this.setState({ dupWarn: "" }), 4000);
    }
  }
  removeEntry(key, idx) {
    this.planMut((p) => {
      this.ensureDay(p, key);
      p.days[key].splice(idx, 1);
    });
  }
  reorderDay(key, fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    this.planMut((p) => {
      this.ensureDay(p, key);
      const arr = p.days[key];
      if (!arr[fromIdx]) return;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(Math.max(0, Math.min(arr.length, toIdx)), 0, item);
    });
  }
  // ---------- sequential scheduling (shared with the render's leg rules) ----------
  // A day is an ORDERED list, not a canvas: the only thing you ever set by
  // hand is the day's own start time and each tappa's own duration. Every
  // start time in between is always derived — previous tappa's end + the
  // real travel gap — so reordering (drag ⠿) or lengthening a stay (drag the
  // resize handle) can never produce an overlap or a stray gap: there's no
  // independent position left to disagree with reality.
  //
  // Resolve an entry id's travel coordinate + kind/tripId — the same rules the
  // render uses to build each event's `.coord`, but standalone, so it can run
  // outside the render's own context (e.g. for the lightweight home-screen
  // previews in planCardFor/nowNextCard).
  entryGeo(key, id, dd) {
    if (id === "hotel" || /^hotel\d+$/.test(id)) {
      const alloggi = ((this.effReserved() || {}).alloggi) || [];
      const nightHotel = alloggi[dd.cityIdx] || null;
      const al = id === "hotel" ? nightHotel : alloggi[parseInt(id.slice(5), 10)] || null;
      return { id, kind: "hotel", tripId: "", coord: al ? (parseCoord(al.coord) || parseCoord(al.maps)) : null };
    }
    if (/^tx-/.test(id)) {
      const tx = TRANSIT[id];
      return { id, kind: "transit", tripId: "", coord: tx ? tx.coord : null };
    }
    const a = getData().catalog[id];
    if (!a) return { id, kind: "sight", tripId: "", coord: null };
    return { id, kind: a.kind, tripId: a.trip || "", coord: coordForEvent(a) };
  }
  // Generic fallback gap: a straight travelLeg between two coordinates, no
  // kind-specific rules — used for any adjacency the render's own curated
  // legs (Andata/Ritorno, local hops, tvenue chains…) don't already cover,
  // and by the lightweight previews below. 0 (immediately after) when no
  // coordinate is known, rather than inventing a number.
  gapMinutesBetween(prevGeo, curGeo) {
    if (!prevGeo || !curGeo || !prevGeo.coord || !curGeo.coord) return 0;
    const leg = travelLeg(prevGeo.coord, curGeo.coord);
    return leg && leg.pick ? leg.pick.min : 0;
  }
  // On-screen duration for an entry (mirrors the render's own dur resolution).
  entryDuration(id, en) {
    if (id === "hotel" || /^hotel\d+$/.test(id)) return (en && en.dur != null) ? en.dur : 20;
    if (/^tx-/.test(id)) return (en && en.dur != null) ? en.dur : 10;
    const a = getData().catalog[id];
    if (!a) return (en && en.dur != null) ? en.dur : 60;
    const base = a.kind === "trip" ? this.tripVisitOf(id, a.baseVisit || a.dur) : (a.dur || 60);
    return (en && en.dur != null) ? en.dur : base;
  }
  // Lightweight schedule for the home-screen previews (planCardFor/nowNextCard)
  // — same sequential-cascade idea as the main render, but generic gaps only
  // (no curated Andata/Ritorno text, that's not shown there anyway).
  sequentialStarts(key) {
    const dd = DAYS.find((d) => d.key === key);
    if (!dd) return [];
    const D = getData();
    const entries = this.dayEntries(key);
    // A gita with venues attached carries zero weight of its own — same as
    // the main render, its venues are what actually take up the time.
    const tripsWithVenues = new Set(
      entries.filter((en) => { const a = D.catalog[en.id]; return a && a.kind === "tvenue"; })
        .map((en) => D.catalog[en.id].trip),
    );
    let running = this.dayStartOf(key);
    let prevGeo = null;
    return entries.map((en) => {
      const geo = this.entryGeo(key, en.id, dd);
      const gap = prevGeo ? this.gapMinutesBetween(prevGeo, geo) : 0;
      const dur = (geo.kind === "trip" && tripsWithVenues.has(en.id)) ? 0 : this.entryDuration(en.id, en);
      const start = running + gap;
      running = start + dur;
      prevGeo = geo;
      return { id: en.id, startMin: start, dur };
    });
  }
  setDur(key, idx, min) {
    const newDur = Math.max(15, Math.min(600, Math.round(min)));
    this.planMut((p) => {
      this.ensureDay(p, key);
      if (p.days[key][idx]) p.days[key][idx].dur = newDur;
    });
  }
  // Per-leg transport override: tap a connector to switch a•piedi ↔ bus ↔ Uber.
  legModeOf(key, idx) {
    const p = this.state.plan;
    return (p && p.legMode && p.legMode[key] && p.legMode[key][idx]) || null;
  }
  setLegMode(key, idx, mode) {
    this.planMut((p) => {
      if (!p.legMode) p.legMode = {};
      if (!p.legMode[key]) p.legMode[key] = {};
      if (p.legMode[key][idx] === mode) delete p.legMode[key][idx];
      else p.legMode[key][idx] = mode;
    });
  }
  toggleDay(key) {
    this.setState((s) => ({ dayOpen: { ...s.dayOpen, [key]: !s.dayOpen[key] } }));
  }
  // Extensible day-trip "visita" duration (minutes), persisted per trip.
  tripVisitOf(id, base) {
    const p = this.state.plan;
    return p && p.tripVisit && p.tripVisit[id] != null ? p.tripVisit[id] : base;
  }
  setTripVisit(id, base, delta) {
    this.planMut((p) => {
      if (!p.tripVisit) p.tripVisit = {};
      const cur = p.tripVisit[id] != null ? p.tripVisit[id] : base;
      p.tripVisit[id] = Math.max(60, Math.min(600, cur + delta));
    });
  }
  toggleFav(id) {
    this.planMut((p) => {
      if (!p.favs) p.favs = [];
      const i = p.favs.indexOf(id);
      if (i < 0) p.favs.push(id);
      else p.favs.splice(i, 1);
    });
  }
  // ---------- checklist (lives in the plan; same JSON as the programme) ----------
  ensureChecklist(p) { if (!Array.isArray(p.checklist)) p.checklist = DEFAULT_CHECKLIST.map((t) => ({ t, done: false })); }
  toggleCheck = (i) => this.planMut((p) => { this.ensureChecklist(p); if (p.checklist[i]) p.checklist[i].done = !p.checklist[i].done; });
  addCheck = (t) => { const tx = (t || "").trim(); if (!tx) return; this.planMut((p) => { this.ensureChecklist(p); p.checklist.push({ t: tx, done: false }); }); };
  editCheck = (i, t) => this.planMut((p) => { this.ensureChecklist(p); if (p.checklist[i]) p.checklist[i].t = t; });
  removeCheck = (i) => this.planMut((p) => { this.ensureChecklist(p); p.checklist.splice(i, 1); });
  // ---------- unified venue detail (navigation stack) ----------
  // `detail`/`detailList` = the visible (top) card + its swipe siblings. `detailStack`
  // holds the parent cards below it, so opening a venue from inside a trip/experience
  // pushes a level and closing it returns to the parent instead of dismissing the lot.
  // `list` is the ordered sibling ids so the card can be swiped left/right.
  openDetail = (idOrObj, list) => {
    const d = venueDetail(idOrObj);
    const detailList = Array.isArray(list) && list.length ? list : (d && d.id ? [d.id] : []);
    this.setState({ detail: d, detailList, detailStack: [], moreOpen: false }); // fresh context
  };
  // Open a child card ON TOP of the current one (from a nested item inside a card).
  pushDetail = (idOrObj, list) => {
    const d = venueDetail(idOrObj);
    if (!d) return;
    this.setState((s) => {
      if (!s.detail) return { detail: d, detailList: (Array.isArray(list) && list.length ? list : (d.id ? [d.id] : [])), detailStack: [] };
      const detailList = Array.isArray(list) && list.length ? list : (d.id ? [d.id] : []);
      return { detail: d, detailList, detailStack: [...s.detailStack, { detail: s.detail, list: s.detailList }] };
    });
  };
  // Back one level: pop the parent card; at the root this closes the sheet.
  popDetail = () => this.setState((s) => {
    const st = (s.detailStack || []).slice();
    const parent = st.pop();
    if (parent) return { detail: parent.detail, detailList: parent.list || [], detailStack: st };
    return { detail: null, detailList: [], detailStack: [] };
  });
  // Dismiss the whole sheet (✕ / tap outside), regardless of depth.
  closeDetail = () => this.setState({ detail: null, detailList: [], detailStack: [] });
  // Move to the adjacent venue within the current swipe list (dir = -1 prev, +1 next).
  swipeDetail = (dir) => {
    const { detail, detailList } = this.state;
    if (!detail || !Array.isArray(detailList)) return;
    const i = detailList.indexOf(detail.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= detailList.length) return;
    const nd = venueDetail(detailList[j]);
    if (nd) this.setState({ detail: nd });
  };
  toggleEditDay = (key) => this.setState((s) => ({ editDays: { ...s.editDays, [key]: !s.editDays[key] } }));
  toggleSet = (k) => this.setState((s) => ({ setOpen: { ...s.setOpen, [k]: !s.setOpen[k] } }));

  // ---------- weather ----------
  wmo(c) {
    const m = { 0: "Sereno", 1: "Quasi sereno", 2: "Poco nuvoloso", 3: "Coperto", 45: "Nebbia", 48: "Nebbia", 51: "Pioviggine", 53: "Pioviggine", 55: "Pioviggine", 61: "Pioggia debole", 63: "Pioggia", 65: "Pioggia forte", 80: "Rovesci", 81: "Rovesci", 82: "Rovesci forti", 95: "Temporale", 96: "Temporale" };
    return m[c] || "Variabile";
  }
  cond(c) {
    if (c === 0 || c === 1) return "sun";
    if (c >= 95) return "storm";
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
    return "cloud";
  }
  condStyle(k) {
    const m = {
      sun: { condBg: "#FFD23F", condFg: "#5a4400" },
      cloud: { condBg: "#D6DEEC", condFg: "#2b3550" },
      rain: { condBg: "#BBD6F5", condFg: "#1c3a63" },
      storm: { condBg: "#C9C2F0", condFg: "#2e2470" },
    };
    return m[k] || m.cloud;
  }
  cityOf(idx) {
    return DAYS[idx] && DAYS[idx].cityIdx === 0
      ? { label: "Londra", lat: 51.5072, lon: -0.1276 }
      : { label: "Edimburgo", lat: 55.9533, lon: -3.1883 };
  }
  seasonal(idx) {
    return DAYS[idx] && DAYS[idx].cityIdx === 0
      ? { hi: 23, lo: 15, desc: "Variabile", cond: "cloud" }
      : { hi: 19, lo: 11, desc: "Variabile, rovesci", cond: "rain" };
  }
  dayWeather(idx) {
    const f = this.state.forecast;
    const date = this.dateForIdx(idx);
    if (date && f && f.byDate && f.byDate[date]) {
      const d = f.byDate[date];
      return { hi: d.hi, lo: d.lo, desc: d.desc, cond: d.cond, estimate: false };
    }
    const s = this.seasonal(idx);
    return { ...s, estimate: true };
  }
  fetchWeather = async () => {
    const dates = this.tripDates();
    if (!dates) {
      this.setState({ wxErr: "Imposta la data di partenza in Impostazioni per il meteo dei giorni del viaggio." });
      return;
    }
    this.setState({ wxErr: null });
    try {
      const call = async (lat, lon) => {
        const r = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=" +
            lat +
            "&longitude=" +
            lon +
            "&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe/London&forecast_days=16"
        );
        if (!r.ok) throw new Error("net");
        return r.json();
      };
      const edi = await call(55.9533, -3.1883);
      let lon = null;
      try {
        lon = await call(51.5072, -0.1276);
      } catch (e) {}
      const byDate = {};
      const add = (src, date, asLon) => {
        if (!src || !src.daily) return;
        const i = src.daily.time.indexOf(date);
        if (i < 0) return;
        const code = src.daily.weather_code[i];
        byDate[date] = {
          hi: Math.round(src.daily.temperature_2m_max[i]),
          lo: Math.round(src.daily.temperature_2m_min[i]),
          desc: this.wmo(code),
          cond: this.cond(code),
          city: asLon ? "Londra" : "Edimburgo",
        };
      };
      DAYS.forEach((d, i) => {
        const date = dates[i];
        if (d.cityIdx === 0) add(lon || edi, date, !!lon);
        else add(edi, date, false);
      });
      const got = Object.keys(byDate).length;
      const fc = {
        byDate,
        when: new Date().toLocaleString("it-IT", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      try {
        localStorage.setItem("scozia_meteo_v2", JSON.stringify(fc));
      } catch (e) {}
      this.setState({
        forecast: fc,
        wxErr: got
          ? null
          : "Previsioni live disponibili da ~16 giorni prima della partenza. Per ora medie stagionali.",
      });
    } catch (e) {
      this.setState({ wxErr: "Meteo non disponibile (serve la rete). Riprova online." });
    }
  };

  // ---------- json / fav io ----------
  onJsonInput = (e) => this.setState({ jsonText: e.target.value });
  copyEmpty = () =>
    this.copyText(JSON.stringify(emptyScaffold(), null, 2), () =>
      this.showToast("Modello copiato ✓ — incollalo a un'AI o compilalo")
    );
  // Download the config template as a file the user can open, fill in, and re-import.
  downloadEmpty = () => {
    this.downloadText("scozia-configurazione.json", JSON.stringify(emptyScaffold(), null, 2));
    this.showToast("Configurazione scaricata ✓");
  };
  copyCurrent = () => {
    const r = this.effReserved() || emptyScaffold();
    this.copyText(JSON.stringify(r, null, 2), () =>
      this.showToast("JSON attuale copiato ✓")
    );
  };
  fillFromCurrent = () => {
    const r = this.effReserved() || emptyScaffold();
    this.setState({ jsonText: JSON.stringify(r, null, 2), copyMsg: "" });
  };
  // Import reserved-data JSON (or a full backup) from arbitrary text — shared by the
  // paste box, the "Salva dati" button, the file picker and the clipboard button.
  importReservedText = (raw) => {
    const t = (raw || "").trim();
    if (!t) {
      this.setState({ feedback: { ok: false, msg: "Incolla prima il JSON nel riquadro." } });
      return;
    }
    let data;
    try {
      data = JSON.parse(t);
    } catch (err) {
      this.setState({ feedback: { ok: false, msg: "JSON non valido — controlla virgole e parentesi." } });
      return;
    }
    // Accept either the reserved-data JSON or a FULL backup file pasted here (has
    // riservato/preferiti/programma) — a reliable import path that needs no file picker.
    const isBackup = !!(data && (data.riservato || data.programma || Array.isArray(data.preferiti)));
    const src = isBackup && data.riservato ? data.riservato : data;
    const clean = {
      partenza: typeof src.partenza === "string" ? src.partenza.trim() : "",
      passeggero: src.passeggero || "",
      voli: Array.isArray(src.voli) ? src.voli : [],
      alloggi: Array.isArray(src.alloggi) ? src.alloggi : [],
      parcheggio: src.parcheggio || {},
      stansted: src.stansted || {},
    };
    try {
      localStorage.setItem("scozia_riservato_v2", JSON.stringify(clean));
    } catch (e) {}
    let extra = "";
    if (isBackup) {
      this.planMut((p) => {
        if (Array.isArray(data.preferiti)) { p.favs = data.preferiti.filter((x) => typeof x === "string"); extra += ", " + p.favs.length + " preferiti"; }
        const prog = data.programma;
        if (prog && prog.days) { p.days = prog.days; if (prog.tripVisit) p.tripVisit = prog.tripVisit; if (Array.isArray(prog.checklist)) p.checklist = prog.checklist; extra += ", programma"; }
      });
    }
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(clean.partenza);
    const msg = (isBackup ? "✓ Backup importato: " : "✓ Caricati: ") + clean.voli.length + " voli, " + clean.alloggi.length + " alloggi" + extra +
      (dateOk ? " · partenza " + clean.partenza : " · ⚠ aggiungi « partenza » (AAAA-MM-GG) per attivare le date");
    this.setState({ reserved: clean, feedback: { ok: true, msg } });
    this.showToast(dateOk ? "Dati salvati ✓ — buon viaggio!" : "Dati salvati ✓ — aggiungi « partenza »", dateOk);
  };
  saveReserved = () => this.importReservedText(this.state.jsonText);
  // Load a filled .json (reserved scaffold OR full backup) straight from a file.
  importConfigFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.importReservedText(String(reader.result).replace(/^﻿/, ""));
    reader.onerror = () => this.setState({ feedback: { ok: false, msg: "Impossibile leggere il file." } });
    reader.readAsText(file);
    e.target.value = "";
  };
  // One-tap paste from the clipboard, then import. Falls back to the box if blocked.
  pasteFromClipboard = async () => {
    try {
      const t = navigator.clipboard && (await navigator.clipboard.readText());
      if (!t || !t.trim()) { this.setState({ feedback: { ok: false, msg: "Appunti vuoti — incolla il JSON nel riquadro qui sotto." } }); return; }
      this.setState({ jsonText: t });
      this.importReservedText(t);
    } catch (err) {
      this.setState({ feedback: { ok: false, msg: "Incolla a mano nel riquadro qui sotto, poi « Salva dati »." } });
    }
  };
  clearReserved = () => {
    try {
      localStorage.removeItem("scozia_riservato_v2");
    } catch (e) {}
    this.setState({
      reserved: null,
      jsonText: "",
      feedback: { ok: true, msg: "Dati riservati cancellati da questo dispositivo." },
    });
  };
  exportFavs = () => {
    const favs = (this.state.plan && this.state.plan.favs) || [];
    this.copyText(JSON.stringify({ preferiti: favs }, null, 2), () =>
      this.showToast("Preferiti copiati ✓ (" + favs.length + ")")
    );
  };
  onFavInput = (e) => this.setState({ favText: e.target.value });
  importFavs = () => {
    const t = (this.state.favText || "").trim();
    if (!t) {
      this.setState({ favImpMsg: "Incolla prima la lista." });
      return;
    }
    try {
      const d = JSON.parse(t);
      const arr = Array.isArray(d) ? d : Array.isArray(d.preferiti) ? d.preferiti : null;
      if (!arr) throw new Error();
      this.planMut((p) => {
        p.favs = arr.filter((x) => typeof x === "string");
      });
      this.setState({ favImpMsg: "✓ Importati " + arr.length + " preferiti." });
    } catch (e) {
      this.setState({ favImpMsg: "Lista non valida." });
    }
  };
  // ---------- programma (timeline) export / import ----------
  exportPlan = () => {
    const p = this.state.plan || seedPlan();
    const out = { programma: { days: p.days || {}, tripVisit: p.tripVisit || {}, checklist: p.checklist || [] } };
    const n = Object.values(out.programma.days).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0);
    this.copyText(JSON.stringify(out, null, 2), () => this.showToast("Programma copiato ✓ (" + n + " attività)"));
  };
  onPlanInput = (e) => this.setState({ planText: e.target.value });
  importPlan = () => {
    const t = (this.state.planText || "").trim();
    if (!t) { this.setState({ planImpMsg: "Incolla prima il programma." }); return; }
    try {
      const d = JSON.parse(t);
      const prog = d.programma || d;
      if (!prog || typeof prog !== "object" || !prog.days || typeof prog.days !== "object") throw new Error();
      this.planMut((p) => { p.days = prog.days; if (prog.tripVisit) p.tripVisit = prog.tripVisit; if (Array.isArray(prog.checklist)) p.checklist = prog.checklist; });
      const n = Object.values(prog.days).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0);
      this.setState({ planImpMsg: "✓ Programma importato (" + n + " attività)." });
    } catch (e) {
      this.setState({ planImpMsg: "Programma non valido." });
    }
  };

  // ---------- programma · template per l'AI ----------
  // Builds a single document an AI can read: the FIXED points (flights + transfers)
  // per day, the full catalogue of mapped venues it may insert, and the editable
  // `programma.days`. Extra keys are ignored by importPlan, so the AI can return the
  // whole object and the user pastes it back.
  planTemplateObj() {
    const D = getData();
    const R = this.effReserved();
    const kindIt = { sight: "visita", eat: "mangiare", trip: "gita", tvenue: "in gita" };
    const ven = (a) => {
      const o = { id: a.id, nome: a.name, tipo: kindIt[a.kind] || a.kind, durata_min: a.dur };
      if (a.open) o.orari = a.open[0] + ":00–" + a.open[1] + ":00";
      return o;
    };
    const edimburgo = [...D.sights.map((s) => ven(D.catalog[s.id])), ...D.eats.map((e) => ven(D.catalog[e.id]))];
    const londra = D.london.map((l) => ven(D.catalog[l.id]));
    const gite = D.trips.map((t) => {
      const c = D.catalog[t.id];
      return { id: t.id, nome: t.title, durata_totale_min: c.dur, treno_andata_min: c.train, visita_min: c.baseVisit, venue_della_gita: (D.tripPools[t.id] || []).map((id) => ven(D.catalog[id])) };
    });
    // Fixed points are ANONYMIZED: only generic busy windows (start/end), never the
    // flight number, airports, route or real date. The window is derived from the
    // reserved times + transfer estimates, then released — nothing identifying leaves.
    const clampMin = (m) => Math.max(0, Math.min(1439, Math.round(m)));
    const giorni = DAYS.map((dd, i) => {
      const punti = [];
      (FLIGHT_DAYS[dd.key] || []).forEach((fi) => {
        const v = R && R.voli ? R.voli[fi] : null;
        const leg = LEGS[fi] || {};
        const dep = v ? this.parseMin(v.orario) : null;
        if (dep == null) {
          punti.push({ tipo: "viaggio", nota: "giorno di volo — lascia libero il tempo per gli spostamenti" });
          return;
        }
        const arr = v ? this.parseMin(v.atterraggio) : null;
        const start = clampMin(dep - (leg.secMin || 0) - (leg.toMin || 0) - 30);
        const end = clampMin((arr != null ? arr : dep + 120) + 20 + (leg.fromMin || 0));
        punti.push({ tipo: "viaggio", start: this.hhmm(start), end: this.hhmm(end) });
      });
      return { key: dd.key, citta: dd.cityLabel, ruolo: dd.role, punti_fissi: punti };
    });
    const istruzioni = [
      "Sei un assistente che pianifica le giornate di un viaggio Londra→Edimburgo.",
      "Compila l'oggetto 'programma.days': per ogni giorno (g0..g5) una lista di attività { \"id\", \"start\" }, con start = orario di inizio \"HH:MM\" (24h). La durata è automatica (vedi 'durata_min'): non indicare la fine.",
      "Usa SOLO gli 'id' elencati in 'venue_disponibili'. Non inventare id.",
      "I 'punti_fissi' sono finestre già occupate (start–end): non programmare nulla in quegli intervalli e, nei giorni con un blocco 'viaggio', lascia margine prima e dopo.",
      "Giorni: g0 = arrivo a Londra (solo sera); g1 = mattina ancora a Londra (colazione) poi trasferimento a Edimburgo; g2,g3,g4 = giornate intere a Edimburgo; g5 = rientro (si lascia l'alloggio ~08:00).",
      "g0 e g1-mattina: usa SOLO venue di 'londra'. Dal pomeriggio di g1 fino a g5: usa 'edimburgo' o 'gite'.",
      "Per una venue 'in gita' (id che inizia con 'tv-'): aggiungi PRIMA la gita corrispondente nello stesso giorno, poi le sue venue.",
      "Orari realistici: rispetta gli 'orari' di apertura quando presenti, prevedi pranzo (~13:00) e cena (~19:30–20:00), max ~3–4 attività piene al giorno.",
      "Restituisci l'INTERO oggetto con 'programma' aggiornato (le altre chiavi possono restare invariate), poi reimportalo con « Importa programma ».",
    ];
    const p = this.state.plan || seedPlan();
    return { _istruzioni: istruzioni, giorni, venue_disponibili: { edimburgo, londra, gite }, programma: { days: p.days || {}, tripVisit: p.tripVisit || {} } };
  }
  exportPlanTemplate = () => {
    this.copyText(JSON.stringify(this.planTemplateObj(), null, 2), () => this.showToast("Template AI copiato ✓ — incollalo a Claude"));
  };
  downloadPlanTemplate = () => {
    this.downloadText("scozia-programma-template.json", JSON.stringify(this.planTemplateObj(), null, 2));
    this.showToast("Template scaricato ✓");
  };

  // ---------- file IO (download + import) for folder sync ----------
  downloadText(filename, text) {
    try {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    } catch (e) {}
  }
  backupObj() {
    const p = this.state.plan;
    return {
      _app: "Taccuino Scozia 2026", _v: 2, _esportato: new Date().toISOString(),
      riservato: this.effReserved() || null,
      preferiti: (p && p.favs) || [],
      programma: p ? { days: p.days || {}, tripVisit: p.tripVisit || {}, checklist: p.checklist || [] } : { days: {} },
    };
  }
  downloadBackup = () => {
    this.downloadText("scozia-backup.json", JSON.stringify(this.backupObj(), null, 2));
    this.showToast("Backup scaricato ✓");
  };
  importBackupFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(String(reader.result).replace(/^﻿/, "").trim());
        let bits = [];
        if (d.riservato && typeof d.riservato === "object") {
          const r = d.riservato;
          const clean = {
            partenza: typeof r.partenza === "string" ? r.partenza.trim() : "",
            passeggero: r.passeggero || "", voli: Array.isArray(r.voli) ? r.voli : [],
            alloggi: Array.isArray(r.alloggi) ? r.alloggi : [], parcheggio: r.parcheggio || {}, stansted: r.stansted || {},
          };
          try { localStorage.setItem("scozia_riservato_v2", JSON.stringify(clean)); } catch (er) {}
          this.setState({ reserved: clean });
          bits.push("dati riservati");
        }
        this.planMut((p) => {
          if (Array.isArray(d.preferiti)) { p.favs = d.preferiti.filter((x) => typeof x === "string"); bits.push(d.preferiti.length + " preferiti"); }
          const prog = d.programma;
          if (prog && prog.days) { p.days = prog.days; if (prog.tripVisit) p.tripVisit = prog.tripVisit; if (Array.isArray(prog.checklist)) p.checklist = prog.checklist; bits.push("programma"); }
        });
        this.setState({ backupMsg: bits.length ? "✓ Importato: " + bits.join(", ") + "." : "File senza dati riconosciuti." });
      } catch (err) {
        this.setState({ backupMsg: "File non valido." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Double-tap the date badge to open the time simulator.
  tapBadge = () => {
    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 320) {
      this._lastTap = 0;
      this.setState({ simOpen: true });
    } else {
      this._lastTap = now;
    }
  };
  setSim(iso) {
    try {
      localStorage.setItem("scozia_sim_v2", iso);
    } catch (e) {}
    this.setState({ sim: iso });
  }
  clearSim = () => {
    try {
      localStorage.removeItem("scozia_sim_v2");
    } catch (e) {}
    this.setState({ sim: null, simOpen: false });
  };
  onSimDate = (e) => {
    const cur = this.nowDate();
    const t = this.state.sim ? new Date(this.state.sim) : cur;
    const [y, m, d] = e.target.value.split("-").map(Number);
    const nd = new Date(t);
    nd.setFullYear(y, m - 1, d);
    this.setSim(nd.toISOString());
  };
  onSimTime = (e) => {
    const t = this.state.sim ? new Date(this.state.sim) : this.nowDate();
    const [h, mi] = e.target.value.split(":").map(Number);
    const nd = new Date(t);
    nd.setHours(h, mi, 0, 0);
    this.setSim(nd.toISOString());
  };

  // ---------- now engine ----------
  card(o) {
    return Object.assign(
      {
        bg: "#F6F0E2", fg: "#17142C", paper: true, kicker: "", title: "", sub: "",
        badge: "", badgeBg: "#0E1542", badgeFg: "#fff", rows: [], hasRows: false,
        steps: [], hasSteps: false, note: "", ctaHref: "", ctaBg: "#FFD23F",
        ctaFg: "#0E1542", ctaLabel: "Apri ↗", locked: false,
        lockedMsg: "caricali in Impostazioni",
      },
      o,
      { hasRows: !!(o.rows && o.rows.length), hasSteps: !!(o.steps && o.steps.length) }
    );
  }
  steps(arr) {
    return arr.map((t, i) => ({ n: i + 1, t, dot: "#0E1542", dotfg: "#FFD23F" }));
  }
  weatherCard(idx) {
    if (!(this.props.showWeather ?? true)) return null;
    const c = this.cityOf(idx).label;
    const w = this.dayWeather(idx);
    return this.card({
      bg: "#0E1542", fg: "#fff", paper: false,
      kicker: "Meteo oggi · " + c, title: w.hi + "° / " + w.lo + "°", sub: w.desc,
      rows: [
        { k: "Massima", v: w.hi + "°", ff: MONO },
        { k: "Minima", v: w.lo + "°", ff: MONO },
        { k: "Cielo", v: w.desc, ff: "inherit" },
      ],
      note: w.estimate
        ? "Media stagionale · tocca Aggiorna nelle Info pratiche per il dettaglio live"
        : "Previsione aggiornata",
    });
  }
  parkCard(pk) {
    if (pk && (pk.nome || pk.prenotazione || pk.apertura)) {
      const rows = [];
      if (pk.prenotazione) rows.push({ k: "Prenotazione", v: pk.prenotazione, ff: MONO });
      if (pk.apertura || pk.chiusura) rows.push({ k: "Orari", v: (pk.apertura || "?") + "–" + (pk.chiusura || "?"), ff: MONO });
      if (pk.indirizzo) rows.push({ k: "Dove", v: pk.indirizzo, ff: "inherit" });
      return this.card({
        kicker: "Parcheggio aeroporto", title: pk.nome || "Parcheggio aeroporto", rows,
        note: pk.note || "",
        ctaHref: pk.maps || this.M((pk.nome || "parcheggio aeroporto") + " " + (pk.indirizzo || "")),
        ctaLabel: "Indicazioni Maps ↗",
      });
    }
    return this.card({
      kicker: "Parcheggio aeroporto", title: "Parcheggio non ancora prenotato",
      sub: "Quando prenoti, carica i dati e compaiono qui",
      locked: true, lockedMsg: "da compilare nel JSON",
      ctaHref: "#sSet", ctaLabel: "Apri Impostazioni →",
    });
  }
  flightCard(f, title, tag) {
    if (f && (f.volo || f.orario)) {
      const rows = [];
      if (f.volo) rows.push({ k: "Volo", v: f.volo, ff: MONO });
      if (f.data) rows.push({ k: "Data", v: f.data, ff: "inherit" });
      if (f.apertura_gate) rows.push({ k: "Gate apre", v: f.apertura_gate, ff: MONO });
      if (f.chiusura_gate) rows.push({ k: "Gate chiude", v: f.chiusura_gate, ff: MONO });
      if (f.orario) rows.push({ k: "Decollo", v: f.orario, ff: MONO });
      if (f.atterraggio) rows.push({ k: "Atterraggio", v: f.atterraggio, ff: MONO });
      if (f.pnr) rows.push({ k: "PNR", v: f.pnr, ff: MONO });
      return this.card({ kicker: title, title: f.tratta || title, badge: tag, badgeBg: "#FF2E7E", rows });
    }
    return this.card({
      kicker: title, title: "Orario riservato", locked: true, lockedMsg: "carica il volo",
      ctaHref: "#sSet", ctaLabel: "Apri Impostazioni →",
    });
  }
  hotelMini(h, city, transfer) {
    if (h && (h.nome || h.indirizzo)) {
      const rows = [];
      if (h.conferma) rows.push({ k: "Conferma", v: h.conferma, ff: MONO });
      if (h.pin) rows.push({ k: "PIN", v: h.pin, ff: MONO });
      return this.card({
        kicker: "Alloggio · " + city, title: h.nome || h.indirizzo, sub: h.indirizzo || "",
        rows, note: transfer,
        ctaHref: h.maps || this.M((h.nome || "") + " " + (h.indirizzo || "")), ctaLabel: "Apri in Maps ↗",
      });
    }
    return this.card({
      kicker: "Alloggio · " + city, title: "Indirizzo riservato", sub: transfer,
      locked: true, lockedMsg: "carica l'alloggio",
      ctaHref: "#sSet", ctaLabel: "Apri Impostazioni →",
    });
  }
  stanstedCard() {
    const R = this.effReserved();
    const st = (R && R.stansted) || {};
    return this.card({
      bg: "#14C08C", fg: "#06382a", paper: false,
      kicker: "Appena scesi a Stansted", title: "Raggiungi Londra",
      steps: this.steps([
        "Segui i cartelli «Trains / Stansted Express» sotto il terminal",
        "Biglietto in app/sito stanstedexpress.com o alle macchinette",
        st.note || "Stansted Express ogni 15', ~47' fino a Liverpool Street",
        "A Liverpool Street: a piedi o tube fino all'hotel a Shoreditch",
      ]),
      ctaHref: "https://www.stanstedexpress.com", ctaBg: "#0E1542", ctaFg: "#fff",
      ctaLabel: "Stansted Express ↗",
    });
  }
  planCardFor(key) {
    const D = getData();
    const sched = this.sequentialStarts(key);
    if (!sched.length) return null;
    const rows = sched
      .map((s) => {
        const a = D.catalog[s.id];
        return a ? { k: this.hhmm(s.startMin), v: a.name, ff: MONO } : null;
      })
      .filter(Boolean);
    if (!rows.length) return null;
    return this.card({
      bg: "#0E1542", fg: "#fff", paper: false,
      kicker: "Programma di oggi", title: rows.length + " tappe in agenda", rows,
      ctaHref: "#sPlan", ctaBg: "#FFD23F", ctaFg: "#0E1542", ctaLabel: "Modifica il Programma →",
    });
  }
  // Proactive "right now" card for an in-trip day: what you're doing now and what's next,
  // read minute-by-minute from today's programme. Returns null when there's nothing planned.
  nowNextCard() {
    const dates = this.tripDates();
    if (!dates) return null;
    const now = this.nowDate();
    const idx = dates.indexOf(this.iso(now));
    if (idx < 0) return null;
    const key = DAYS[idx] && DAYS[idx].key;
    const sched = this.sequentialStarts(key);
    if (!sched.length) return null;
    const D = getData();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const items = sched
      .map((s) => {
        const a = D.catalog[s.id];
        return a ? { name: a.name, start: s.startMin, end: s.startMin + s.dur } : null;
      })
      .filter(Boolean);
    if (!items.length) return null;
    const current = items.find((x) => nowMin >= x.start && nowMin < x.end);
    const next = items.find((x) => x.start > nowMin);
    const rows = [];
    if (current) rows.push({ k: "Ora", v: current.name + " · fino " + this.hhmm(current.end), ff: MONO });
    if (next) rows.push({ k: "Poi", v: this.hhmm(next.start) + " · " + next.name, ff: MONO });
    if (!rows.length) rows.push({ k: "Fatto", v: "Tappe di oggi completate", ff: "inherit" });
    return this.card({
      bg: "#FF2E7E", fg: "#fff", paper: false, kicker: "Adesso",
      title: current ? current.name : next ? "Tra poco: " + next.name : "Giornata libera",
      rows, ctaHref: "#sPlan", ctaBg: "#FFD23F", ctaFg: "#0E1542", ctaLabel: "Apri il Programma →",
    });
  }
  nowContext() {
    const now = this.nowDate();
    const today = this.iso(now);
    const hour = now.getHours() + now.getMinutes() / 60;
    const R = this.effReserved();
    const volo = (i) => (R && R.voli && R.voli[i] ? R.voli[i] : null);
    // Index-based: alloggi[0] = Londra, alloggi[1] = Edimburgo (order is fixed by the itinerary).
    const allog = (idx) => (R && R.alloggi && R.alloggi[idx] ? R.alloggi[idx] : null);
    const parse = (s) => { const m = this.parseMin(s); return m == null ? null : m / 60; };
    const checklist = () =>
      this.card({
        kicker: "Checklist partenza", title: "Prima di uscire",
        steps: this.steps([
          "Carta d'identità/passaporto + carte (contactless)",
          "Adattatore UK tipo G + power bank",
          "Liquidi ≤100 ml in contenitori a norma",
          "Salva offline mappe di Edimburgo e Londra",
          "Carica voli e alloggi in Impostazioni",
        ]),
        ctaHref: "#sSet", ctaLabel: "Apri Impostazioni →",
      });

    const dates = this.tripDates();
    // No partenza loaded yet → setup state, no real dates exposed anywhere.
    if (!dates) {
      return {
        label: "Taccuino", title: "Pronto a partire?",
        sub: "Carica i dati riservati per attivare conto alla rovescia, vista “Oggi” e meteo.",
        cards: [
          this.card({
            bg: "#FF2E7E", fg: "#fff", paper: false, kicker: "Per iniziare",
            title: "Imposta la data di partenza",
            sub: "Incolla il tuo JSON (campo « partenza ») in Impostazioni.",
            ctaHref: "#sSet", ctaBg: "#FFD23F", ctaFg: "#0E1542", ctaLabel: "Apri Impostazioni →",
          }),
        ],
      };
    }

    const start = dates[0], end = dates[5];
    const idx = dates.indexOf(today);
    const pretty = "Oggi · " + this.prettyDate(today, true);

    // pre-trip
    if (today < start) {
      const ms = new Date(start + "T00:00:00") - new Date(today + "T00:00:00");
      const days = Math.max(0, Math.round(ms / 86400000));
      const cards = [];
      const pk = R && R.parcheggio ? R.parcheggio : null;
      cards.push(
        this.card({
          bg: "#FF2E7E", fg: "#fff", paper: false, kicker: "Conto alla rovescia",
          title: days === 0 ? "Si parte oggi!" : "Mancano " + days + " giorni",
          sub: "Andata: due voli con cambio a Londra",
        })
      );
      if (pk && (pk.nome || pk.prenotazione)) cards.push(this.parkCard(pk));
      return {
        label: "Prossima partenza",
        title: days === 0 ? "Oggi si vola" : "Tra " + days + " giorni in Scozia",
        sub: "Anteprima del giorno di partenza qui sotto.",
        cards,
      };
    }
    // post-trip
    if (today > end) {
      return {
        label: "Viaggio concluso", title: "Bentornato",
        sub: "Le tue tappe restano qui, e i preferiti sono esportabili.",
        cards: [
          this.card({
            bg: "#14C08C", fg: "#06382a", paper: false, kicker: "Ricordi",
            title: "Slàinte mhath!", sub: "Esporta i preferiti dalle Impostazioni per conservarli.",
          }),
        ],
      };
    }

    // day 0 — departure
    if (idx === 0) {
      const f0 = volo(0);
      const dep = parse(f0 && f0.orario);
      const cards = [];
      if (dep === null || hour < dep) {
        cards.push(this.weatherCard(0));
        cards.push(this.parkCard(R && R.parcheggio ? R.parcheggio : null));
        cards.push(this.flightCard(f0, "Volo · andata · 1ª tratta", "Andata"));
        const fp0 = this.flightPlan(f0, LEGS[0]);
        cards.push(
          this.card({
            bg: "#14C08C", fg: "#06382a", paper: false, kicker: "In aeroporto", title: "Quando muoverti",
            steps: this.steps(
              fp0
                ? [
                    "Parti per l'aeroporto entro le " + this.hhmm(fp0.leaveBy),
                    "Al terminal ~" + this.hhmm(fp0.secStart) + " · check-in + sicurezza ~" + this.durLabel(fp0.secMin),
                    "Gate " + this.hhmm(fp0.gateOpen) + "–" + this.hhmm(fp0.gateClose) + " · decollo " + this.hhmm(fp0.dep),
                    "Vai dritto ai controlli di sicurezza",
                  ]
                : ["Arriva ~2h prima", "Vai dritto ai controlli di sicurezza", "Imbarco chiude ~30' prima del decollo"]
            ),
          })
        );
      } else {
        cards.push(this.stanstedCard());
        cards.push(this.hotelMini(allog(0), "Londra", "Stansted Express ↔ Liverpool Street (~47'), poi a piedi/tube"));
        cards.push(
          this.card({
            bg: "#0E1542", fg: "#fff", paper: false, kicker: "Stasera", title: "Brick Lane & Shoreditch",
            sub: "A piedi dall'hotel", ctaHref: "#s08", ctaBg: "#FFD23F", ctaLabel: "Vedi cosa fare →",
          })
        );
      }
      return {
        label: pretty,
        title: dep !== null && hour >= dep ? "Atterrati a Londra" : "Giorno di partenza",
        sub: "Tutto quello che ti serve, in ordine.",
        cards,
      };
    }
    // day 1 — travel London → Edinburgh
    if (idx === 1) {
      const f1 = volo(1);
      const cards = [];
      if (hour < 12) {
        const lh = allog(0);
        const fp1 = this.flightPlan(f1, LEGS[1], 7); // +7' hotel → Liverpool Street
        let steps1, note1 = "";
        if (fp1) {
          steps1 = [
            "Lascia la stanza entro le 11:00 (check-out)",
            "Parti da Liverpool Street entro le " + this.hhmm(fp1.leaveBy) + " · Stansted Express ~" + LEGS[1].toMin + "′",
            "Al terminal ~" + this.hhmm(fp1.secStart) + " · check-in + sicurezza ~" + this.durLabel(fp1.secMin),
            "Gate " + this.hhmm(fp1.gateOpen) + "–" + this.hhmm(fp1.gateClose) + " · decollo " + this.hhmm(fp1.dep),
          ];
          const hotelLeave = fp1.leaveBy - 7;
          if (hotelLeave < 11 * 60)
            note1 = "Stretto: per questo volo dovresti uscire dall'hotel verso le " + this.hhmm(hotelLeave) + ", prima del check-out delle 11:00 — valuta deposito bagagli o late check-out.";
        } else {
          steps1 = ["Lascia la stanza entro le 11:00", "Stansted Express da Liverpool Street (~47')", "Sii al gate ~2h prima del volo"];
        }
        cards.push(
          this.card({
            bg: "#FF2E7E", fg: "#fff", paper: false, kicker: "Stamattina",
            title: "Check-out Londra entro le 11:00", sub: lh && lh.nome ? lh.nome : "",
            steps: this.steps(steps1), note: note1,
          })
        );
        cards.push(this.flightCard(f1, "Volo · andata · 2ª tratta", ""));
        cards.push(this.hotelMini(allog(1), "Edimburgo", "Tram → Haymarket (~25') o taxi (~20'). Check-in dalle 15:00."));
      } else {
        cards.push(this.weatherCard(1));
        cards.push(
          this.card({
            bg: "#14C08C", fg: "#06382a", paper: false, kicker: "Arrivo Edimburgo",
            title: "Check-in dalle 15:00", sub: "Lascia i bagagli e parti leggero",
          })
        );
        const pc = this.planCardFor("g1");
        if (pc) cards.push(pc);
        const nn = this.nowNextCard();
        if (nn) cards.unshift(nn);
      }
      return { label: pretty, title: hour < 12 ? "Si vola a Edimburgo" : "Benvenuto a Edimburgo", sub: "", cards };
    }
    // day 5 — return
    if (idx === 5) {
      const cards = [];
      cards.push(
        this.card({
          bg: "#FF2E7E", fg: "#fff", paper: false, kicker: "Rientro", title: "Lascia l'alloggio ~08:00",
          steps: this.steps(["Check-out e bagagli pronti", "Tram/taxi per l'aeroporto di Edimburgo", "Sii al gate ~2h prima"]),
        })
      );
      cards.push(this.flightCard(volo(2), "Volo · rientro · 1ª tratta", "Rientro"));
      cards.push(
        this.card({
          bg: "#0E1542", fg: "#fff", paper: false, kicker: "Scalo",
          title: "3h 20' di scalo", sub: "Tempo per sgranchirsi e mangiare qualcosa",
        })
      );
      cards.push(this.flightCard(volo(3), "Volo · rientro · 2ª tratta", "Ultima tratta"));
      return { label: pretty, title: "Giorno del rientro", sub: "In bocca al lupo per i trasferimenti.", cards };
    }
    // days 2–4 — full Edinburgh days
    const cards = [];
    cards.push(this.weatherCard(idx));
    const nn = this.nowNextCard();
    if (nn) cards.unshift(nn);
    const pc = this.planCardFor(DAYS[idx] ? DAYS[idx].key : "");
    if (pc) cards.push(pc);
    else
      cards.push(
        this.card({
          bg: "#14C08C", fg: "#06382a", paper: false, kicker: "Programma libero",
          title: "Giornata aperta a Edimburgo", sub: "Aggiungi attività dal Programma",
          ctaHref: "#sPlan", ctaBg: "#0E1542", ctaFg: "#fff", ctaLabel: "Apri il Programma →",
        })
      );
    return { label: pretty, title: "Giornata a Edimburgo", sub: "Il piano di oggi e il meteo del giorno.", cards };
  }

  // ---------- card renderer (now engine) ----------
  renderCard(c, key) {
    return (
      <div
        key={key}
        className={c.paper ? "paper" : undefined}
        style={{
          position: "relative", overflow: "hidden", borderRadius: 18, marginBottom: 12,
          background: c.bg, color: c.fg, boxShadow: tiltShadow(16, 32, -20, 0.55),
        }}
      >
        {c.paper && <Overlays grain={0.05} light={0.7} size="240px 260px" />}
        <div style={{ position: "relative", padding: "15px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: ".13em", textTransform: "uppercase", opacity: 0.78 }}>
              {c.kicker}
            </span>
            {c.badge && (
              <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 999, background: c.badgeBg, color: c.badgeFg, whiteSpace: "nowrap" }}>
                {c.badge}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.08, marginTop: 6, letterSpacing: "-.01em" }}>{c.title}</div>
          {c.sub && <div style={{ fontSize: 12.5, opacity: 0.82, marginTop: 4, fontWeight: 600 }}>{c.sub}</div>}
          {c.hasRows && (
            <div style={{ marginTop: 11, display: "grid", gap: 0 }}>
              {c.rows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, borderTop: "1px solid rgba(122,112,84,.22)", padding: "7px 0" }}>
                  <span style={{ opacity: 0.7, fontWeight: 700 }}>{r.k}</span>
                  <span style={{ fontWeight: 900, textAlign: "right", fontFamily: r.ff }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}
          {c.hasSteps && (
            <div style={{ marginTop: 12, display: "grid", gap: 9 }}>
              {c.steps.map((st, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, fontWeight: 600 }}>
                  <span style={{ flex: "none", width: 20, height: 20, borderRadius: 999, background: st.dot, color: st.dotfg, fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    {st.n}
                  </span>
                  <span>{st.t}</span>
                </div>
              ))}
            </div>
          )}
          {c.note && <div style={{ marginTop: 11, fontSize: 12, opacity: 0.78, lineHeight: 1.5, fontWeight: 600 }}>{c.note}</div>}
          {c.locked && (
            <div style={{ marginTop: 11, display: "inline-flex", gap: 6, alignItems: "center", fontSize: 11, fontWeight: 900, letterSpacing: ".05em", textTransform: "uppercase", background: "rgba(0,0,0,.1)", padding: "5px 10px", borderRadius: 999, opacity: 0.85 }}>
              Riservato · {c.lockedMsg}
            </div>
          )}
          {c.ctaHref && (
            <a href={c.ctaHref} target={c.ctaHref.startsWith("#") ? undefined : "_blank"} rel="noopener" style={{ display: "inline-block", marginTop: 13, fontSize: 12.5, fontWeight: 900, textDecoration: "none", background: c.ctaBg, color: c.ctaFg, padding: "8px 15px", borderRadius: 999 }}>
              {c.ctaLabel}
            </a>
          )}
        </div>
      </div>
    );
  }

  render() {
    const D = getData();
    const R = this.effReserved();
    const now = this.nowDate();
    const today = this.iso(now);
    const favs = (this.state.plan && this.state.plan.favs) || [];

    const coverVar = this.state.coverVar || this.props.coverVariant || "Manifesto";
    const onSel = (val) => ({
      background: coverVar === val ? "#FFD23F" : "transparent",
      color: coverVar === val ? "#0E1542" : "#cfd3ee",
    });

    // Flights with public transfer estimates and airport check-in+security buffers.
    const legs = LEGS;
    // Older backups store one "City (CODE)" per leg in `aeroporto` (no da/a). Derive the
    // from/to codes by chaining: each leg departs from its own airport and lands at the
    // next leg's; the final return leg lands back at the first airport (round trip).
    const allVoli = (R && R.voli) || [];
    const parseAp = (s) => { const m = String(s || "").match(/^\s*(.*?)\s*\(([A-Za-z]{3})\)\s*$/); return m ? { city: m[1].trim(), code: m[2].toUpperCase() } : null; };
    const flights = legs.map((l, i) => {
      const r = R && R.voli ? R.voli[i] : null;
      const hasData = !!(r && (r.volo || r.orario || r.data));
      const g = (k) => (r && r[k] ? r[k] : "");
      const details = [];
      details.push({ k: "Volo", v: g("volo") || "—", mono: true });
      if (g("data")) details.push({ k: "Data", v: g("data"), mono: false });
      if (g("apertura_gate")) details.push({ k: "Gate apre", v: g("apertura_gate"), mono: true });
      if (g("chiusura_gate")) details.push({ k: "Gate chiude", v: g("chiusura_gate"), mono: true });
      details.push({ k: "Decollo", v: g("orario") || "—", mono: true });
      if (g("atterraggio")) details.push({ k: "Atterraggio", v: g("atterraggio"), mono: true });
      if (g("pnr")) details.push({ k: "PNR", v: g("pnr"), mono: true });
      return {
        ...l, tagLabel: "Tratta " + (i + 1),
        // Airport codes/cities: prefer the user's reserved JSON (da/a, +città);
        // fall back to the leg's value (neutral placeholder for home/layover).
        fromCode: g("da") || (parseAp(g("aeroporto")) || {}).code || l.fromCode,
        fromCity: g("da_citta") || (parseAp(g("aeroporto")) || {}).city || l.fromCity,
        toCode: g("a") || ((parseAp(allVoli[i + 1] && allVoli[i + 1].aeroporto) || (i === legs.length - 1 ? parseAp(allVoli[0] && allVoli[0].aeroporto) : null)) || {}).code || l.toCode,
        toCity: g("a_citta") || ((parseAp(allVoli[i + 1] && allVoli[i + 1].aeroporto) || (i === legs.length - 1 ? parseAp(allVoli[0] && allVoli[0].aeroporto) : null)) || {}).city || l.toCity,
        orario: g("orario") || "—", atterraggio: g("atterraggio") || "",
        loc: g("aeroporto") || g("da_citta") || l.fromCity, voloCode: g("volo"),
        startMin: this.parseMin(g("orario")), endMin: this.parseMin(g("atterraggio")),
        aperturaMin: this.parseMin(g("apertura_gate")), chiusuraMin: this.parseMin(g("chiusura_gate")),
        details, hasData, locked: !hasData,
      };
    });

    // hotels
    const hdefs = [
      { key: "lon", city: "Londra", nights: "1 notte", transfer: "Stansted Express ↔ Liverpool Street (~47')", checkin: "15:00", checkout: "11:00" },
      { key: "edi", city: "Edimburgo", nights: "4 notti", transfer: "Tram → Haymarket (~25') o taxi (~20')", checkin: "15:00", checkout: "11:00" },
    ];
    const hotels = hdefs.map((h, i) => {
      const a = R && R.alloggi ? R.alloggi[i] : null;
      const nome = a && a.nome ? a.nome : "";
      const ind = a && a.indirizzo ? a.indirizzo : "";
      const hasData = !!(a && (nome || ind || a.conferma));
      // Prefer an explicit maps URL; otherwise derive a Maps search from name+address.
      const maps = a && a.maps ? a.maps : nome || ind ? this.M((nome + " " + ind).trim()) : "";
      // Access codes (door/room/keybox…) — variable length, separate from the booking PIN.
      const codici = a && Array.isArray(a.codici)
        ? a.codici.filter((c) => c && (c.tipo || c.codice)).map((c) => ({ tipo: c.tipo || "Codice", codice: c.codice || "—" }))
        : [];
      return {
        ...h, nome, indirizzo: ind, conferma: a && a.conferma ? a.conferma : "—",
        pin: a && a.pin ? a.pin : "—", tel: a && a.tel ? a.tel : "—",
        telHref: a && a.tel ? "tel:" + String(a.tel).replace(/\s/g, "") : "#",
        maps, link: a && a.link ? a.link : "", codici, istruzioni: a && a.istruzioni ? a.istruzioni : "",
        hasData, locked: !hasData,
      };
    });

    // scheduler days — calendar (time-positioned events + fixed flight blocks)
    const planDays = DAYS.map((dd, dayIdx) => {
      const key = dd.key;
      const date = this.dateForIdx(dayIdx); // null until partenza is loaded
      const dObj = date ? new Date(date + "T12:00:00") : null;
      const dateLabel = date
        ? ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][dObj.getDay()] + " " + dObj.getDate() + " " + MESI[dObj.getMonth()]
        : "Giorno " + (dayIdx + 1);
      const frozen = !!(date && date < today);
      const isToday = !!(date && date === today);
      const pool = dd.cityIdx === 0 ? D.poolLon : D.poolEdi;
      const entriesRaw = this.dayEntries(key);
      // The hotel where you sleep this night (alloggi[cityIdx]); its coordinate
      // comes from the reserved `coord` field, or — as a fallback — from coords
      // embedded in its Maps link. The hotel is also an insertable timeline stop
      // (id "hotel"), so you can always drop a "return to the hotel" into a day.
      const alloggi = ((this.effReserved() || {}).alloggi) || [];
      const nightHotel = alloggi[dd.cityIdx] || null;
      const hotelCoord = nightHotel ? (parseCoord(nightHotel.coord) || parseCoord(nightHotel.maps)) : null;
      const hotelName = (nightHotel && nightHotel.nome) ? nightHotel.nome : "Hotel";
      // Resolve a hotel entry id to its accommodation: "hotel" = this night's
      // hotel (legacy), "hotel0"/"hotel1" = London / Edinburgh explicitly.
      const hotelOf = (id) => (id === "hotel" ? nightHotel : alloggi[parseInt(id.slice(5), 10)] || null);
      const events = entriesRaw.map((en, idx) => {
        const isHotel = en.id === "hotel" || /^hotel\d+$/.test(en.id);
        const isTransit = /^tx-/.test(en.id);
        let a;
        if (isHotel) {
          const al = hotelOf(en.id);
          a = { name: "🏨 " + ((al && al.nome) || "Hotel"), dur: 20, kind: "hotel", q: (al && (al.indirizzo || al.nome)) || "hotel", note: (al && al.indirizzo) || "La tua base — rientro", _coord: al ? (parseCoord(al.coord) || parseCoord(al.maps)) : null };
        } else if (isTransit) {
          const tx = TRANSIT[en.id];
          a = { name: "🚉 " + (tx ? tx.name : "Stazione"), dur: 10, kind: "transit", q: tx ? tx.q : "", note: tx ? tx.hint : "", _coord: tx ? tx.coord : null };
        } else {
          a = D.catalog[en.id] || { name: en.id, dur: 60, q: "", note: "", kind: "sight" };
        }
        const isTrip = a.kind === "trip";
        const train = isTrip ? a.train || 0 : 0;
        // main (visit) duration: per-entry override, else trip default, else catalog dur
        const base = isTrip ? this.tripVisitOf(en.id, a.baseVisit || a.dur) : a.dur || 60;
        // Clamp defensively — an old build's drag-to-resize allowed up to 24h
        // on a single tappa by mistake; a stray value that large, still
        // sitting in someone's saved plan, would cascade the whole day (and
        // beyond) into nonsense. Same ceiling the duration editor itself uses.
        const dur = Math.max(15, Math.min(isTrip ? 600 : 360, en.dur != null ? en.dur : base));
        const transferMin = a.transferMin || 0; // extra hop to reach the venue (e.g. Tantallon)
        const PAL = {
          eat: { a: "#E6482A", b: "#FBEDE9", l: "Mangiare" },
          trip: { a: "#14C08C", b: "#DBF3E9", l: "Gita" },
          tvenue: { a: "#0E8F6B", b: "#E3F5EE", l: "In gita" },
          sight: { a: "#0E1542", b: "#EEF0F8", l: "Visita" },
          hotel: { a: "#6C4CF1", b: "#ECE9FB", l: "Hotel" },
          transit: { a: "#3B6FE0", b: "#E7EEFB", l: "Trasporti" },
        };
        const pal = PAL[a.kind] || PAL.sight;
        return {
          // startMin/warn aren't known yet — array order is the only thing
          // that's authoritative at this point; both get filled in below,
          // once every tappa's incoming travel gap has been computed.
          idx, id: en.id, name: a.name, note: a.note || "", kind: a.kind, kindLabel: pal.l,
          durLabel: this.durLabel(dur), dur, train, transferMin, startMin: 0, accent: pal.a, bg: pal.b, warn: "",
          openHrs: a.kind === "eat" ? (a.cucina || a.open) : a.open, isEat: a.kind === "eat",
          tripId: a.trip || "", coord: (isHotel || isTransit) ? a._coord : coordForEvent(a), lead: null, tail: null,
          maps: this.M(a.q || a.name),
          onResize: (min) => this.setDur(key, idx, min),
        };
      });

      // Transfer legs — how you actually get from one activity to the next, with
      // an estimated time, transport mode AND cost (£) per leg.
      //   · gite are CHAINED: first gita = "Andata" from Edinburgh, each next gita
      //     departs from the PREVIOUS gita's town, only the last gita "Ritorna".
      //   · city venues get the recommended mode (walk/bus/Uber) for the hop, with
      //     a faster paid alternative shown alongside.
      //   · on city days the HOTEL (if its coord is known) is the morning origin
      //     and the evening destination — handy when it's out of the centre.
      // The recommended pick is the cheap-but-sensible option; the app could let
      // you switch. Everything is an estimate; real fares/timetables vary.
      // `seq` is simply `events` in array order — that order IS the day's
      // chronological order now, there's no separate clock time to sort by.
      const seq = events;
      const isCity = (e) => e.kind === "sight" || e.kind === "eat" || e.kind === "london";
      const isLocalNode = (e) => isCity(e) || e.kind === "hotel" || e.kind === "transit"; // in-town nodes
      const SAME_CITY_KM = 35; // a "local hop" can't cross cities (London↔Edinburgh)
      // Format one travelLeg result into a timeline block: recommended mode as the
      // headline, the cheapest-faster paid option as the alternative.
      const fmtLeg = (leg, fromName, prefix, chooseIdx) => {
        if (!leg || !leg.options || !leg.options.length) return null;
        // Honour a per-leg mode the user picked by tapping the connector.
        const chosen = chooseIdx != null ? this.legModeOf(key, chooseIdx) : null;
        const p = (chosen && leg.options.find((o) => o.mode === chosen)) || leg.pick;
        const alt = leg.options.find((o) => o !== p && (o.mode === "Uber" || o.mode === "Taxi"))
          || leg.options.find((o) => o !== p);
        const altTxt = alt ? " · o " + alt.icon + " " + alt.mode + " " + alt.min + "′ " + alt.costLabel : "";
        return {
          min: p.min, icon: p.icon, costLabel: p.costLabel || "",
          primary: (prefix || "") + p.mode + (fromName ? " da " + fromName : ""),
          sub: "~" + p.min + "′ · " + p.costLabel + altTxt + " · stima",
          // options + switcher (only when there's a real choice and a stable key)
          options: leg.options.length > 1 ? leg.options : null,
          chosen: p.mode,
          onMode: chooseIdx != null && leg.options.length > 1 ? (m) => this.setLegMode(key, chooseIdx, m) : null,
        };
      };
      // local hops — between two city stops (venues OR the hotel, all walkable in
      // town), OR between two sub-venues of the SAME gita.
      const localPair = (cur, prev) =>
        (isLocalNode(cur) && isLocalNode(prev)) ||
        (cur.kind === "tvenue" && prev.kind === "tvenue" && cur.tripId && cur.tripId === prev.tripId);
      for (let i = 1; i < seq.length; i++) {
        const cur = seq[i], prev = seq[i - 1];
        if (localPair(cur, prev)) {
          const leg = travelLeg(prev.coord, cur.coord);
          if (leg && leg.km < SAME_CITY_KM) { // never route a local hop across cities
            const blk = fmtLeg(leg, prev.name.replace(/^(🏨|🚉) /, ""), "", cur.idx);
            if (blk && blk.min >= 4) cur.lead = blk;
          }
        }
      }
      // Hotel bookends — you sleep at the hotel every night, so the day starts
      // from it and ends back at it. Morning departure on the full days that
      // start at the hotel (Edinburgh days + the departure morning); evening
      // return to that night's hotel on every night except the day you leave.
      // Attached to the first/last *city* stop (a gita already shows its own
      // Andata/Ritorno to Edinburgh).
      // If the user dropped an explicit hotel stop in the day, they're in control
      // of the returns — skip the automatic bookends to avoid doubling them.
      const hasHotelStop = seq.some((e) => e.kind === "hotel");
      const cityRun = seq.filter(isCity);
      if (hotelCoord && cityRun.length && !hasHotelStop) {
        const first = cityRun[0], last = cityRun[cityRun.length - 1];
        const morningDepart = dd.role === "edi" || dd.role === "rientro";
        const eveningReturn = dd.role !== "rientro";
        const fwd = travelLeg(hotelCoord, first.coord);
        if (morningDepart && !first.lead && fwd && fwd.km < SAME_CITY_KM) first.lead = fmtLeg(fwd, "hotel", "", first.idx);
        if (eveningReturn) {
          const back = travelLeg(last.coord, hotelCoord);
          if (back && back.pick && back.km < SAME_CITY_KM) last.tail = { min: back.pick.min, icon: back.pick.icon, costLabel: back.pick.costLabel, primary: "All'hotel · " + back.pick.mode, sub: "~" + back.pick.min + "′ · " + back.pick.costLabel + " · stima" };
        }
      }
      // gite: Andata (first) → chained legs → Ritorno (last). Andata/Ritorno name
      // the two real stations that bracket the ride (Waverley ↔ the gita's own
      // station/stop) and fold in a small, honest dwell — time to reach the
      // platform and board, time to get off and out at the other end — on top of
      // the curated train/bus time. An Uber is noted only when it stays cheap.
      const tripSeq = seq.filter((e) => e.kind === "trip");
      const hubLeg = (t) => travelLeg(HUB.coord, t.coord);
      const uberNote = (t) => {
        const u = (hubLeg(t) || { options: [] }).options.find((o) => o.mode === "Uber");
        return u ? " · o 🚕 Uber " + u.costLabel : "";
      };
      const stationOf = (t) => STATION_META[t.id] || { name: t.name, mode: "train" };
      // Venues actually on the timeline for each trip, chronological — computed
      // up front because it changes where the Ritorno belongs (see below).
      const venuesByTrip = {};
      tripSeq.forEach((t) => { venuesByTrip[t.id] = seq.filter((e) => e.kind === "tvenue" && e.tripId === t.id); });
      // A gita's own "dur" only matters for the sequence when it has NO
      // venues yet — once venues are attached, THEY carry all the "sul posto"
      // time (each with its own computed gap), so the trip entry becomes a
      // zero-weight header in the cascade. Its display duration/spine height
      // gets recomputed for real further down, once every tappa's actual
      // position is known.
      tripSeq.forEach((t) => { if (venuesByTrip[t.id].length) t.dur = 0; });
      tripSeq.forEach((t, i) => {
        const st = stationOf(t);
        const dwell = STATION_DWELL[st.mode] || STATION_DWELL.train;
        const icon = st.mode === "bus" ? "🚌" : "🚆";
        const vehicle = st.mode === "bus" ? "bus" : "treno";
        const total = t.train + dwell.depart + dwell.arrive;
        if (i === 0) {
          // Default origin is the Waverley hub — UNLESS the tappa right
          // before this gita in the day is a station/hotel stop the user
          // actually placed there (e.g. dropped in "Haymarket" first): then
          // that's where you're really leaving from, not Waverley.
          const globalIdx = seq.indexOf(t);
          const prevInDay = globalIdx > 0 ? seq[globalIdx - 1] : null;
          const fromStop = prevInDay && prevInDay.coord && isLocalNode(prevInDay) ? prevInDay : null;
          t.lead = (fromStop && fmtLeg(travelLeg(fromStop.coord, t.coord), fromStop.name.replace(/^(🏨|🚉) /, ""), "", t.idx))
            || { min: total, icon, primary: "Andata · Waverley → " + st.name, sub: "~" + total + "′ totali · " + t.train + "′ " + vehicle + " · 🕐 attesa stimata ~" + (dwell.depart + dwell.arrive) + "′" + uberNote(t) };
        } else {
          const prev = tripSeq[i - 1];
          t.lead = fmtLeg(travelLeg(prev.coord, t.coord), prev.name, "↪ ", t.idx)
            || { min: t.train, icon, primary: "da " + prev.name, sub: "~" + t.train + "′ stima" };
        }
        // The Ritorno sits directly on the trip block ONLY when it has no venue
        // chain to anchor to instead — otherwise it belongs on the last venue
        // (below), so it never lands earlier than where the day actually ends.
        if (i === tripSeq.length - 1 && !venuesByTrip[t.id].length) {
          t.tail = { min: total, icon, primary: "Ritorno · " + st.name + " → Waverley", sub: "~" + total + "′ totali · " + t.train + "′ " + vehicle + " · 🕐 attesa stimata ~" + (dwell.depart + dwell.arrive) + "′" + uberNote(t) };
        }
      });
      // Fix the hops at each gita's boundary: the FIRST venue you visit starts
      // from the STATION (not from Edinburgh, not from nowhere), and the LAST
      // venue's return anchors to where the day's schedule really ends — not to
      // the trip block's own (possibly stale, independently resizable) declared
      // duration, which used to leave the Ritorno chip stranded mid-gita
      // whenever the venues ran later than the block's nominal end.
      tripSeq.forEach((t, i) => {
        const venues = venuesByTrip[t.id];
        if (!venues.length) return;
        const st = stationOf(t);
        const first = venues[0], last = venues[venues.length - 1];
        if (!first.lead) first.lead = fmtLeg(travelLeg(t.coord, first.coord), st.name, "", first.idx);
        if (last.tail) return;
        const back = travelLeg(last.coord, t.coord);
        if (!back || !back.pick) return;
        const p = back.pick;
        if (i === tripSeq.length - 1) {
          // Last gita of the day: merge the local hop with the Ritorno home,
          // so the return time reflects the LAST activity, not a stale duration.
          const dwell = STATION_DWELL[st.mode] || STATION_DWELL.train;
          const vehicle = st.mode === "bus" ? "bus" : "treno";
          const totalMin = p.min + t.train + dwell.depart + dwell.arrive;
          const stIcon = st.mode === "bus" ? "🚌" : "🚆";
          last.tail = {
            min: totalMin, icon: stIcon,
            primary: "↩ " + st.name + " → Waverley",
            sub: "~" + totalMin + "′ totali · " + p.min + "′ " + p.mode.toLowerCase() + " + " + t.train + "′ " + vehicle + " · 🕐 attesa stimata ~" + (dwell.depart + dwell.arrive) + "′",
          };
        } else {
          // Not the last gita: just the local hop back to THIS gita's own
          // station — the chained hop to the next gita picks up from there.
          const alt = back.options.find((o) => o !== p && (o.mode === "Uber" || o.mode === "Taxi")) || back.options.find((o) => o !== p);
          const altTxt = alt ? " · o " + alt.icon + " " + alt.mode + " " + alt.min + "′ " + alt.costLabel : "";
          last.tail = {
            min: p.min, icon: p.icon, costLabel: p.costLabel,
            primary: "↩ " + p.mode + " · " + st.name,
            sub: "~" + p.min + "′ · " + p.costLabel + altTxt + " · stima",
            options: back.options.length > 1 ? back.options : null, chosen: p.mode,
            onMode: back.options.length > 1 ? (m) => this.setLegMode(key, last.idx, m) : null,
          };
        }
      });

      // Anything not covered by a curated rule above (e.g. a plain sight right
      // after a gita, or two activities with no specific adjacency rule) still
      // needs a gap — the day is fully sequential now, so "no lead" would
      // silently mean "starts the instant the previous tappa ends", which is
      // only right when that's actually true. Generic travelLeg fallback for
      // anything still missing one.
      for (let i = 1; i < seq.length; i++) {
        const cur = seq[i];
        if (cur.lead) continue;
        const prev = seq[i - 1];
        const gap = this.gapMinutesBetween({ coord: prev.coord }, { coord: cur.coord });
        if (gap > 0) cur.lead = { min: gap, icon: "➡️", primary: "da " + prev.name, sub: "~" + gap + "′ · stima" };
      }

      // Every start time is derived, in order — this is the only place
      // startMin gets assigned: the day's own start time (+ this tappa's own
      // lead) seeds the first tappa, then each next one starts when the
      // previous ends (+ its own lead). No independent position exists to
      // fall out of sync, so overlaps and stray gaps are structurally
      // impossible, not just avoided case by case.
      let running = this.dayStartOf(key);
      seq.forEach((e) => {
        e.startMin = running + (e.lead ? e.lead.min : 0);
        running = e.startMin + e.dur;
        // For eateries the window that matters is the KITCHEN (food service):
        // warn if the meal falls outside it. Uses `cucina` when set, else `open`.
        const hrs = e.openHrs;
        if (hrs) {
          const t = e.startMin / 60;
          if (t < hrs[0] || t + e.dur / 60 > hrs[1]) e.warn = (e.isEat ? "cucina " : "aperto ") + this.fmtH(hrs[0]) + "–" + this.fmtH(hrs[1]);
        }
      });
      // Now that every tappa's real position is known, give a venued gita
      // block back a meaningful display duration — arrival to the last
      // venue's end — instead of the zero we used to keep it out of the
      // cascade above. Purely cosmetic (spine height + "sul posto" label):
      // it doesn't feed back into anyone's position.
      tripSeq.forEach((t) => {
        const venues = venuesByTrip[t.id];
        if (!venues.length) return;
        const last = venues[venues.length - 1];
        t.dur = Math.max(30, (last.startMin + last.dur) - t.startMin);
        t.durLabel = this.durLabel(t.dur);
        t.durLocked = true;
      });

      // Day total: visit durations + every computed transfer leg (lead/tail).
      // (Movement is now modeled by the legs, so transferMin is no longer added
      // separately — it survives only as curated detail text.)
      const total = events.reduce(
        (s, e) => s + e.dur + (e.lead ? e.lead.min : 0) + (e.tail ? e.tail.min : 0),
        0,
      );
      // flights on this day + the time they really occupy: transfer to airport,
      // gate/boarding, flight, deplaning, transfer from airport.
      const flightBlocks = [];
      const flightChips = [];
      const span = (a, b) => this.hhmm(a) + " – " + this.hhmm(b);
      (FLIGHT_DAYS[key] || []).forEach((fi) => {
        const fl = flights[fi];
        const label = fl.fromCode + "→" + fl.toCode + (fl.voloCode ? " · " + fl.voloCode : "");
        if (fl.startMin != null) {
          const endMin = fl.endMin != null ? fl.endMin : fl.startMin + 120;
          const gateOpen = fl.aperturaMin != null ? fl.aperturaMin : fl.startMin - 40;
          const gateClose = fl.chiusuraMin != null ? fl.chiusuraMin : fl.startMin - 15;
          // check-in + security finishes a little AFTER the gate opens (then you're
          // at the gate until takeoff), never past gate close — August peak estimate.
          const secMin = fl.secMin || 0;
          const secEnd = secMin > 0 ? Math.max(gateOpen, Math.min(gateOpen + 12, gateClose - 5)) : gateOpen;
          const secStart = secEnd - secMin;
          if (secMin > 0) {
            flightBlocks.push({ tone: "sec", label: "Check-in + sicurezza", sub: "~" + this.durLabel(secMin) + " · coda alta stagione (stima)", timeLabel: span(secStart, secEnd), startMin: secStart, endMin: secEnd });
          }
          // gate / boarding: from when you reach the gate until takeoff
          if (secEnd < fl.startMin) {
            flightBlocks.push({ tone: "gate", label: "Imbarco · gate", sub: "apre " + this.hhmm(gateOpen) + " · chiude " + this.hhmm(gateClose), timeLabel: span(secEnd, fl.startMin), startMin: secEnd, endMin: fl.startMin });
          }
          // transfer TO the airport (estimate), ending when security starts
          if (fl.toMin) {
            const e = secStart, s = e - fl.toMin;
            // reach the boarding station from your last stop (e.g. hotel → the
            // Stansted Express at Liverpool Street) — the missing first hop.
            if (fl.board && TRANSIT[fl.board] && seq.length) {
              const lastEv = seq[seq.length - 1];
              const wl = lastEv.coord ? travelLeg(lastEv.coord, TRANSIT[fl.board].coord) : null;
              if (wl && wl.pick && wl.km < SAME_CITY_KM) {
                const ws = s - wl.pick.min;
                flightBlocks.push({ tone: "move", label: wl.pick.icon + " → " + TRANSIT[fl.board].name, sub: "~" + wl.pick.min + "′ · " + wl.pick.costLabel + " · stima", timeLabel: span(ws, s), startMin: ws, endMin: s });
              }
            }
            flightBlocks.push({ tone: "move", label: fl.toLabel, sub: "~" + fl.toMin + "′ · stima", timeLabel: span(s, e), startMin: s, endMin: e });
          }
          // the flight itself
          flightBlocks.push({ tone: "flight", accent: fl.arrow, label, sub: fl.loc, timeLabel: this.hhmm(fl.startMin) + (fl.endMin != null ? " – " + this.hhmm(fl.endMin) : ""), startMin: fl.startMin, endMin });
          // deplaning + transfer FROM the airport
          if (fl.endMin != null) {
            const d1 = fl.endMin, d2 = fl.endMin + 20;
            flightBlocks.push({ tone: "move", label: "Discesa dall'aereo", sub: "sbarco + bagagli", timeLabel: span(d1, d2), startMin: d1, endMin: d2 });
            if (fl.fromMin) {
              const s = d2, e = d2 + fl.fromMin;
              flightBlocks.push({ tone: "move", label: fl.fromLabel, sub: "~" + fl.fromMin + "′ · stima", timeLabel: span(s, e), startMin: s, endMin: e });
            }
          }
        } else {
          flightChips.push({ label, accent: fl.arrow });
        }
      });
      const pf = this.state.pickerFor;
      const pickerOpen = !!(pf && pf.key === key);
      let pickerGroups = [], pickerCats = [], pickerHoods = [], pickerAreas = [];
      if (pickerOpen) {
        // Every addable place tagged with its category, neighbourhood/area, AND
        // its distance from where the day currently ends — so the picker can be
        // filtered by category + neighbourhood/area chips + free-text, and sorted
        // by "what's actually close to my last stop" instead of a static list.
        // `zone` = city-scale neighbourhood (Old Town, Leith, Shoreditch…);
        // `area` = day-trip-scale geographic region (Fife, Glasgow, East
        // Lothian…) — kept as two separate dimensions (see pickerHoods/Areas
        // below), since mixing them made the filter chips read as one chaotic list.
        const refCoord = seq.length ? seq[seq.length - 1].coord : hotelCoord;
        const coordOf = (id) => {
          if (id === "hotel" || /^hotel\d+$/.test(id)) { const al = hotelOf(id); return al ? (parseCoord(al.coord) || parseCoord(al.maps)) : null; }
          if (/^tx-/.test(id)) return (TRANSIT[id] || {}).coord || null;
          return coordForEvent(D.catalog[id]);
        };
        const distOf = (itemCoord) => {
          if (!refCoord || !itemCoord) return null;
          const leg = travelLeg(refCoord, itemCoord);
          return leg && leg.pick ? { km: leg.km, label: leg.pick.icon + " " + leg.pick.min + "′" } : null;
        };
        const mk = (id, catKey) => {
          const dist = distOf(coordOf(id));
          if (id === "hotel" || /^hotel\d+$/.test(id)) { const al = hotelOf(id); return { id, name: "🏨 " + ((al && al.nome) || "Hotel"), note: (al && al.citta) ? ("Rientro · " + al.citta) : "La tua base", durLabel: "sosta", category: catKey, zone: "", area: "", dist, onAdd: () => this.addEntry(key, id) }; }
          if (/^tx-/.test(id)) { const tx = TRANSIT[id]; return { id, name: "🚉 " + (tx ? tx.name : id), note: tx ? tx.hint : "", durLabel: "sosta", category: catKey, zone: "", area: "", dist, onAdd: () => this.addEntry(key, id) }; }
          const a = D.catalog[id]; const d = D.details[id] || {};
          return { id, name: a.name, note: a.note || "", durLabel: this.durLabel(a.dur), category: catKey, zone: d.zone || "", area: d.area || "", dist, onAdd: () => this.addEntry(key, id) };
        };
        // Ordered categories. Hotels (both cities, so travel days work) and the
        // stations/airports relevant to this day come first — you can always drop
        // a "return to the hotel" or "get to the Stansted Express" into any day.
        const hotelIds = alloggi.length ? alloggi.map((_, i) => "hotel" + i) : ["hotel"];
        const cities = dd.key === "g1" ? ["lon", "edi"] : dd.cityIdx === 0 ? ["lon"] : ["edi"];
        const txIds = Object.keys(TRANSIT).filter((k) => cities.includes(TRANSIT[k].city));
        const cats = [{ key: "base", label: "🏨 Hotel / rientro", ids: hotelIds }];
        if (txIds.length) cats.push({ key: "transit", label: "🚉 Stazioni & aeroporti", ids: txIds });
        if (dd.cityIdx === 0) {
          cats.push({ key: "lon", label: "Londra · da fare", ids: pool });
        } else {
          if (dd.key === "g1") cats.push({ key: "lon", label: "Londra · mattina (colazione)", ids: D.poolLon });
          cats.push(
            { key: "sight", label: "Visite", ids: D.sights.map((s) => s.id) },
            { key: "eat", label: "Mangiare & locali", ids: D.eats.map((e) => e.id) },
            { key: "trip", label: "Gite (in giornata)", ids: D.trips.map((t) => t.id) },
          );
          // Venues of a day trip appear ONLY once that trip is added to this day.
          const seenTrip = {};
          entriesRaw.forEach((en) => {
            const a = D.catalog[en.id];
            if (a && a.kind === "trip" && !seenTrip[en.id] && D.tripPools[en.id] && D.tripPools[en.id].length) {
              seenTrip[en.id] = 1;
              cats.push({ key: "tv-" + en.id, label: "In gita · " + a.name, ids: D.tripPools[en.id] });
            }
          });
        }
        const all = [];
        cats.forEach((c) => c.ids.forEach((id) => all.push(mk(id, c.key))));
        pickerCats = cats.map((c) => ({ key: c.key, label: c.label }));

        const q = (this.state.pickerQuery || "").trim().toLowerCase();
        const selCat = this.state.pickerCat || "";
        const selHood = this.state.pickerHood || "";
        const selArea = this.state.pickerArea || "";
        // Neighbourhood / area chips: only values present in the (category-scoped)
        // set, ordered — two SEPARATE dimensions so a city neighbourhood never
        // shares a row with a day-trip region.
        const scope = all.filter((it) => !selCat || it.category === selCat);
        const presentHood = new Set(scope.map((it) => it.zone).filter(Boolean));
        pickerHoods = [...ZONES_ORDER.filter((z) => presentHood.has(z)), ...[...presentHood].filter((z) => !ZONES_ORDER.includes(z))];
        const presentArea = new Set(scope.map((it) => it.area).filter(Boolean));
        pickerAreas = [...AREAS_ORDER.filter((z) => presentArea.has(z)), ...[...presentArea].filter((z) => !AREAS_ORDER.includes(z))];

        const filtered = all.filter((it) =>
          (!selCat || it.category === selCat) &&
          (!selHood || it.zone === selHood) &&
          (!selArea || it.area === selArea) &&
          (!q || it.name.toLowerCase().includes(q)));
        // Sort each group by distance from the day's current last stop (closest
        // first); items with no computable distance sink to the end, stable order.
        const byDist = (a, b) => (a.dist ? a.dist.km : Infinity) - (b.dist ? b.dist.km : Infinity);
        pickerGroups = cats
          .map((c) => ({ label: c.label, items: filtered.filter((it) => it.category === c.key).slice().sort(byDist) }))
          .filter((g) => g.items.length);
      }
      const open = this.state.dayOpen[key] !== undefined ? this.state.dayOpen[key] : isToday;
      const editMode = !frozen && !!this.state.editDays[key];
      const tripCount = events.filter((e) => e.kind === "trip").length;
      return {
        key, dayIdx, date, dateLabel, cityLabel: dd.cityLabel, frozen, isToday, canEdit: !frozen, editMode, open,
        dim: frozen ? "0.62" : "1",
        headBg: isToday ? "#FF2E7E" : frozen ? "#8d8674" : "#0E1542", headFg: "#fff",
        badge: isToday ? "Oggi" : frozen ? "Giorno passato" : date && date > today ? "In programma" : "",
        badgeBg: isToday ? "#0E1542" : "rgba(255,255,255,.2)",
        events, flightBlocks, flightChips,
        multiTripWarn: tripCount >= 2,
        dayStart: this.hhmm(this.dayStartOf(key)),
        onDayStart: (hhmm) => this.setDayStart(key, hhmm),
        summary: {
          count: events.length,
          totalLabel: total ? this.durLabel(total) : "vuoto",
          flightCount: (FLIGHT_DAYS[key] || []).length,
          names: events.map((e) => e.name),
        },
        nowMin: isToday ? now.getHours() * 60 + now.getMinutes() : null,
        onToggle: () => this.toggleDay(key),
        onToggleEdit: () => this.toggleEditDay(key),
        onSelect: (idx) => { const ev = events[idx]; if (ev && D.details[ev.id]) this.openDetail(ev.id, events.map((e) => e.id).filter((id) => D.details[id])); },
        onReorder: (fromIdx, toIdx) => this.reorderDay(key, fromIdx, toIdx),
        onResize: (idx, min) => this.setDur(key, idx, min),
        onRemove: (idx) => this.removeEntry(key, idx),
        canAdd: !frozen, pickerOpen, pickerGroups, pickerCats, pickerHoods, pickerAreas,
        addLabel: pickerOpen ? "Chiudi" : "+ Aggiungi attività",
        onToggleAdd: () => this.setState((s) => ({ pickerFor: pickerOpen ? null : { key }, pickerQuery: "", pickerCat: "", pickerHood: "", pickerArea: "" })),
        pickerQuery: this.state.pickerQuery,
        onPickerQuery: (v) => this.setState({ pickerQuery: v }),
        pickerCat: this.state.pickerCat,
        pickerHood: this.state.pickerHood,
        pickerArea: this.state.pickerArea,
        // Changing category resets neighbourhood/area (both are category-scoped).
        onPickerCat: (k) => this.setState((s) => ({ pickerCat: s.pickerCat === k ? "" : k, pickerHood: "", pickerArea: "" })),
        // Neighbourhood and area are mutually exclusive — picking one clears the other.
        onPickerHood: (z) => this.setState((s) => ({ pickerHood: s.pickerHood === z ? "" : z, pickerArea: "" })),
        onPickerArea: (z) => this.setState((s) => ({ pickerArea: s.pickerArea === z ? "" : z, pickerHood: "" })),
      };
    });

    // sections — grouped lists of place IDs; the shared VenueDetail modal holds the
    // full content, and each row is a tappable 2-line summary (SummaryRow).
    const groupByKey = (arr, zones, keyOf) => {
      const groups = zones.map((z) => ({ label: z, ids: arr.filter((o) => keyOf(o) === z).map((o) => o.id) })).filter((g) => g.ids.length);
      const placed = new Set(groups.flatMap((g) => g.ids));
      const rest = arr.filter((o) => !placed.has(o.id)).map((o) => o.id);
      if (rest.length) groups.push({ label: "Altro", ids: rest });
      return groups;
    };
    const sightsByZone = groupByKey(D.sights, ZONES_ORDER, (s) => s.zone || "");
    const eatsIds = D.eats.map((e) => e.id);
    const glasgowIds = D.glasgow.map((g) => g.id);
    const neighborhoodIds = D.neighborhoods.map((n) => n.id);
    const tripsByArea = groupByKey(D.trips, AREAS_ORDER, (t) => t.area || "");
    const LONDON_ZONES = ["Colazione", "Shoreditch", "Brick Lane", "Spitalfields", "City & South Bank"];
    const londonByZone = groupByKey(D.london, LONDON_ZONES, (l) => l.zone || "");
    // Flat per-section id lists (display order) = the swipe context for each card.
    const sightsFlat = sightsByZone.flatMap((g) => g.ids);
    const londonFlat = londonByZone.flatMap((g) => g.ids);
    const tripsFlat = tripsByArea.flatMap((g) => g.ids);
    // Props for a SummaryRow given a place id (fav only where a master entry exists).
    // `list` = sibling ids so opening the card enables swipe-to-next/prev within it.
    const rowProps = (id, list) => ({ d: D.details[id], onOpen: () => this.openDetail(id, list), isFav: favs.indexOf(id) >= 0, onToggleFav: D.master[id] ? (x) => this.toggleFav(x) : undefined });
    const favorites = favs
      .map((id) => {
        const m = D.master[id];
        if (!m) return null;
        return { id, name: m.name, where: m.where, note: m.note, maps: m.maps, onToggle: () => this.toggleFav(id) };
      })
      .filter(Boolean);

    // weather
    const showWeather = this.props.showWeather ?? true;
    const forecastDays = DAYS.map((dd, i) => {
      const date = this.dateForIdx(i);
      const w = this.dayWeather(i);
      const cs = this.condStyle(w.cond);
      const dayLabel = date ? this.prettyDate(date, true) : "Giorno " + (i + 1);
      return { dayLabel, cityLabel: this.cityOf(i).label, desc: w.desc, hi: w.hi, lo: w.lo, estimate: w.estimate, condBg: cs.condBg, condFg: cs.condFg };
    });

    // now
    const ctx = this.nowContext();
    const nowCards = (ctx.cards || []).filter(Boolean);
    // New user: no partenza date loaded yet → show the first-run onboarding guide.
    const noData = !this.tripDates();

    // "Install as app" invitation — hidden once we're already running installed.
    const platform = detectPlatform();
    const showInstall = !this.state.installed;
    const installCard = showInstall
      ? <InstallCard platform={platform} canPrompt={!!this.state.installEvt} onInstall={this.promptInstall} />
      : null;

    // sim
    const simD = this.state.sim ? new Date(this.state.sim) : now;
    const simDate = this.iso(simD);
    const simTime = String(simD.getHours()).padStart(2, "0") + ":" + String(simD.getMinutes()).padStart(2, "0");
    // Sim quick-jumps are relative to the loaded partenza (no hardcoded dates).
    const atTrip = (dayIdx, h, m) => {
      const d0 = this.tripStart();
      if (!d0) return null;
      const d = new Date(d0 + "T00:00:00");
      d.setDate(d.getDate() + dayIdx);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };
    const J = (label, iso) => (iso ? { label, onJump: () => this.setSim(iso) } : null);
    const simJumps = [
      J("Pre-partenza", atTrip(-2, 10, 0)),
      J("Partenza mattina", atTrip(0, 5, 30)),
      J("Atterraggio Londra", atTrip(0, 12, 0)),
      J("Sera Londra", atTrip(0, 20, 0)),
      J("Volo per Edi", atTrip(1, 10, 0)),
      J("Arrivo Edimburgo", atTrip(1, 16, 0)),
      J("Giorno pieno", atTrip(2, 10, 0)),
      J("Rientro", atTrip(5, 7, 0)),
    ].filter(Boolean);

    const nav = [
      { label: "Oggi", href: "#sNow" }, { label: "01 Voli", href: "#s01" }, { label: "02 Alloggi", href: "#s02" },
      { label: "Programma", href: "#sPlan" }, { label: "03 Londra", href: "#s08" }, { label: "04 Edimburgo", href: "#s03" },
      { label: "05 Mangiare", href: "#s04" }, { label: "06 Esperienze", href: "#s07" }, { label: "07 Dintorni", href: "#s06" },
      { label: "08 Glasgow", href: "#s05" }, { label: "★ Preferiti", href: "#sFav" }, { label: "09 Pratica", href: "#s09" },
      { label: "Impostazioni", href: "#sSet" },
    ];

    const fb = this.state.feedback;
    const headerBadge = this.state.sim ? "SIM " + simD.getDate() + " " + MESI[simD.getMonth()] : this.rangeShort();
    const badgeBg = this.state.sim ? "#14C08C" : "#FF2E7E";

    const sec = { scrollMarginTop: 108 };
    const numBadge = (bg, fg) => ({
      flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 34, height: 34, padding: "0 9px", background: bg, borderRadius: 999,
      fontWeight: 900, fontSize: 15, color: fg,
    });
    const h2 = (color) => ({ fontWeight: 900, fontSize: 27, margin: 0, color, letterSpacing: "-0.02em" });

    return (
      <div
        ref={this.setRoot}
        style={{
          minHeight: "100vh", background: "#0E1542", color: "#17142C",
          fontFamily: "'Archivo','Helvetica Neue',system-ui,-apple-system,sans-serif", lineHeight: 1.5,
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", background: "#ECE3D0", minHeight: "100vh", overflow: "hidden", position: "relative", paddingBottom: "calc(94px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column" }}>
          {/* ===== NAV ===== */}
          <div style={{ position: "sticky", top: 0, zIndex: 60, background: "#0E1542", paddingTop: "env(safe-area-inset-top)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 15px 8px" }}>
              <span style={{ fontWeight: 900, fontSize: 17, color: "#fff", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 7 }}>
                SCOZIA
                <span
                  style={{ color: "#0E1542", background: badgeBg, borderRadius: 6, padding: "2px 7px", fontSize: 12, fontWeight: 900, userSelect: "none" }}
                >
                  {headerBadge}
                </span>
              </span>
              <a href="#sSet" style={{ fontSize: 12, fontWeight: 900, color: "#0E1542", textDecoration: "none", background: "#FFD23F", borderRadius: 999, padding: "4px 12px" }}>
                £ GBP
              </a>
            </div>
          </div>

          {/* ===== COVER ===== */}
          {coverVar === "Manifesto" && (
            <section id="s00" style={{ ...sec, background: "#0E1542", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 230, height: 230, background: "#FF2E7E", borderRadius: "50%", opacity: 0.92 }} />
              <LogoMark style={{ position: "absolute", top: 150, right: 18, transform: "rotate(-9deg)", filter: "drop-shadow(0 12px 20px rgba(0,0,0,.3))" }} />
              <div style={{ position: "relative", padding: "30px 18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".2em", textTransform: "uppercase", color: "#FFD23F" }}>Taccuino di viaggio</div>
                <h1 style={{ fontWeight: 900, fontSize: 54, lineHeight: 0.92, margin: "12px 0 8px", color: "#fff", letterSpacing: "-0.03em" }}>
                  EDIM&shy;BURGO<br /><span style={{ color: "#14C08C" }}>&amp; SCOZIA</span>
                </h1>
                <div style={{ fontSize: 16, color: "#C9CEEC", fontWeight: 700 }}>{this.rangeLong()}</div>
                <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", fontSize: 13.5, fontWeight: 800, color: "#0E1542" }}>
                  <span style={{ background: "#14C08C", borderRadius: 999, padding: "5px 12px" }}>{flights[0].fromCity}</span>
                  <span style={{ color: "#FF2E7E", fontSize: 18 }}>→</span>
                  <span style={{ background: "#fff", borderRadius: 999, padding: "5px 12px" }}>Londra <span style={{ color: "#8089b8", fontWeight: 700 }}>1 notte</span></span>
                  <span style={{ color: "#FF2E7E", fontSize: 18 }}>→</span>
                  <span style={{ background: "#FFD23F", borderRadius: 999, padding: "5px 12px" }}>Edimburgo <span style={{ color: "#9a7a14", fontWeight: 700 }}>4 notti</span></span>
                </div>
              </div>
            </section>
          )}

          {coverVar === "Biglietto" && (
            <section id="s00" style={{ ...sec, background: "#FF2E7E", position: "relative", overflow: "hidden", padding: "26px 16px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".2em", textTransform: "uppercase", color: "#0E1542", marginBottom: 14 }}>Carta d'imbarco · Taccuino</div>
              <div className="paper" style={{ position: "relative", overflow: "hidden", borderRadius: 20, background: "#F6F0E2", boxShadow: tiltShadow(22, 40, -20, 0.55) }}>
                <Overlays grain={0.06} light={0.8} size="270px 300px" />
                <div style={{ position: "relative", padding: "20px 18px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase", color: "#7a8a5c" }}>Itinerario</span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#0E1542", background: "#FFD23F", borderRadius: 999, padding: "2px 9px" }}>{this.rangeShort()}</span>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ textAlign: "left" }}><div style={{ fontSize: 32, fontWeight: 900, color: "#17142C", lineHeight: 1 }}>{flights[0].fromCode}</div><div style={{ fontSize: 11, fontWeight: 700, color: "#7a7560" }}>{flights[0].fromCity}</div></div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <span style={{ flex: 1, height: 2, borderRadius: 2, background: "#FF2E7E", opacity: 0.5 }} />
                      <PlaneIcon size={16} fill="#FF2E7E" />
                      <span style={{ flex: 1, height: 2, borderRadius: 2, background: "#FF2E7E", opacity: 0.5 }} />
                    </div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 900, color: "#17142C", lineHeight: 1 }}>STN</div><div style={{ fontSize: 11, fontWeight: 700, color: "#7a7560" }}>Londra</div></div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <span style={{ flex: 1, height: 2, borderRadius: 2, background: "#14C08C", opacity: 0.5 }} />
                      <PlaneIcon size={16} fill="#14C08C" />
                      <span style={{ flex: 1, height: 2, borderRadius: 2, background: "#14C08C", opacity: 0.5 }} />
                    </div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 32, fontWeight: 900, color: "#17142C", lineHeight: 1 }}>EDI</div><div style={{ fontSize: 11, fontWeight: 700, color: "#7a7560" }}>Edimburgo</div></div>
                  </div>
                </div>
                <Perforation notch={18} notchColor="#FF2E7E" />
                <div style={{ position: "relative", padding: "14px 18px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560" }}>Passeggero</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#17142C" }}>{R ? R.passeggero || "—" : "—"}</div>
                  </div>
                  <div style={{ height: 34, width: 120, background: "repeating-linear-gradient(90deg,#17142C 0 2px,transparent 2px 4px,#17142C 4px 5px,transparent 5px 8px)", opacity: 0.85 }} />
                </div>
              </div>
              <h1 style={{ fontWeight: 900, fontSize: 40, lineHeight: 0.95, margin: "18px 0 0", color: "#0E1542", letterSpacing: "-0.03em" }}>EDIMBURGO<br />&amp; SCOZIA</h1>
            </section>
          )}

          {/* ===== OGGI / DINAMICO ===== */}
          <section id="sNow" style={{ ...sec, padding: "22px 16px", background: "#ECE3D0" }}>
            {noData ? (
              <Onboarding onDownload={this.downloadEmpty} onCopy={this.copyEmpty} msg={this.state.copyMsg}
                jsonText={this.state.jsonText} onJsonInput={this.onJsonInput} onSave={this.saveReserved}
                onFile={this.importConfigFile} onPaste={this.pasteFromClipboard} feedback={this.state.feedback}
                installCard={installCard} />
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF2E7E", animation: "scoziaPulse 1.8s ease-in-out infinite" }} />
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", color: "#17142C" }}>{ctx.label}</span>
                </div>
                <h2 style={{ fontWeight: 900, fontSize: 30, lineHeight: 1.02, margin: "0 0 3px", color: "#0E1542", letterSpacing: "-0.02em" }}>{ctx.title}</h2>
                <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 600, color: "#6B6450" }}>{ctx.sub}</p>
                {nowCards.map((c, i) => this.renderCard(c, i))}
              </>
            )}
            <Checklist
              items={(this.state.plan && this.state.plan.checklist) || []}
              onToggle={this.toggleCheck}
              onAdd={this.addCheck}
              onEdit={this.editCheck}
              onRemove={this.removeCheck}
            />
          </section>

          {/* ===== 01 VOLI ===== */}
          <section id="s01" style={{ ...sec, padding: "26px 16px 28px", background: "#0E1542" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#FFD23F", "#0E1542")}>01</span>
              <h2 style={h2("#fff")}>Voli</h2>
              <PlaneIcon size={26} fill="#FFD23F" style={{ marginLeft: "auto" }} />
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 600, color: "#9aa2d4" }}>Una scheda per tratta · dati riservati su questo dispositivo</p>
            {flights.map((f, i) => (
              <div key={i} className="paper" style={{ position: "relative", overflow: "hidden", borderRadius: 18, marginBottom: 12, background: "#F6F0E2", boxShadow: tiltShadow(16, 30, -20, 0.6) }}>
                <Overlays grain={0.05} light={0.72} size="240px 260px" />
                <div style={{ position: "relative", padding: "15px 16px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: "#7a7560" }}>{f.tagLabel}</span>
                    {f.tag && <span style={{ fontSize: 10, fontWeight: 900, color: "#fff", background: f.tagBg, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{f.tag}</span>}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
                    <div><div style={{ fontSize: 30, fontWeight: 900, color: "#17142C", lineHeight: 0.95 }}>{f.fromCode}</div><div style={{ fontSize: 11, fontWeight: 700, color: "#7a7560" }}>{f.fromCity}</div></div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                      <span style={{ flex: 1, height: 2, borderRadius: 2, background: f.arrow, opacity: 0.45 }} />
                      <PlaneIcon size={17} fill={f.arrow} />
                      <span style={{ flex: 1, height: 2, borderRadius: 2, background: f.arrow, opacity: 0.45 }} />
                    </div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 30, fontWeight: 900, color: "#17142C", lineHeight: 0.95 }}>{f.toCode}</div><div style={{ fontSize: 11, fontWeight: 700, color: "#7a7560" }}>{f.toCity}</div></div>
                  </div>
                </div>
                <Perforation notch={16} notchColor="#0E1542" />
                <div style={{ position: "relative", padding: "11px 16px 15px" }}>
                  {f.hasData ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                      {f.details.map((d, di) => (
                        <div key={di}>
                          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560" }}>{d.k}</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#17142C", fontFamily: d.mono ? MONO : "inherit" }}>{d.v}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#9a937c" }}>
                      Data, volo e orario riservati · <a href="#sSet" style={{ color: "#0E1542", textDecoration: "underline", textDecorationColor: "#FF2E7E", textDecorationThickness: "2px" }}>caricali →</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div style={{ background: "#14C08C", borderRadius: 16, padding: "14px 15px", fontSize: 13, lineHeight: 1.65, color: "#06382a", fontWeight: 600 }}>
              <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 5, color: "#06382a" }}>Da ricordare</div>
              Scalo di <strong>3h 20'</strong> al rientro · giorno del rientro lascia l'alloggio <strong>~08:00</strong>.
            </div>
          </section>

          {/* ===== 02 PRENOTAZIONI ===== */}
          <section id="s02" style={{ ...sec, padding: "26px 16px 28px", background: "#FF2E7E" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#0E1542", "#fff")}>02</span>
              <h2 style={h2("#0E1542")}>Prenotazioni</h2>
              <BedIcon size={30} fill="#0E1542" style={{ marginLeft: "auto" }} />
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 700, color: "#7d0d3f" }}>Una scheda per alloggio · dati riservati</p>
            {hotels.map((h, i) => (
              <div key={i} className="paper" style={{ position: "relative", overflow: "hidden", borderRadius: 18, marginBottom: 13, background: "#F6F0E2", boxShadow: tiltShadow(16, 30, -20, 0.5) }}>
                <Overlays grain={0.05} light={0.72} size="240px 260px" />
                <div style={{ position: "relative", padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff", background: "#0E1542", padding: "3px 11px", borderRadius: 999 }}>{h.city} · {h.nights}</span>
                  </div>
                  {h.hasData ? (
                    <>
                      <div style={{ fontWeight: 900, fontSize: 20, color: "#17142C", lineHeight: 1.1, marginTop: 11 }}>{h.nome}</div>
                      <div style={{ fontSize: 13, color: "#7a7560", marginTop: 3, fontWeight: 600 }}>{h.indirizzo}</div>
                      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 14 }}>
                        <div><div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560" }}>Conferma</div><div style={{ fontSize: 14, fontWeight: 900, color: "#17142C", fontFamily: MONO }}>{h.conferma}</div></div>
                        <div><div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560" }}>PIN</div><div style={{ fontSize: 14, fontWeight: 900, color: "#17142C", fontFamily: MONO }}>{h.pin}</div></div>
                        <div><div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a7560" }}>Tel</div><a href={h.telHref} style={{ fontSize: 14, fontWeight: 900, color: "#17142C", textDecoration: "none" }}>{h.tel}</a></div>
                      </div>
                      <div style={{ marginTop: 13, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {h.maps && <a href={h.maps} target="_blank" rel="noopener" style={{ fontSize: 12, fontWeight: 900, color: "#fff", textDecoration: "none", background: "#FF2E7E", padding: "7px 14px", borderRadius: 999 }}>Apri in Maps ↗</a>}
                        {h.link && <a href={h.link} target="_blank" rel="noopener" style={{ fontSize: 12, fontWeight: 900, color: "#0E1542", textDecoration: "none", background: "#FFD23F", padding: "7px 14px", borderRadius: 999 }}>Prenotazione ↗</a>}
                      </div>
                      {h.codici.length > 0 && (
                        <div style={{ marginTop: 13, padding: 11, background: "#0E1542", borderRadius: 12 }}>
                          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9aa2d4", marginBottom: 7 }}>Codici accesso</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {h.codici.map((c, ci) => (
                              <div key={ci} style={{ background: "rgba(255,255,255,.08)", borderRadius: 9, padding: "5px 10px" }}>
                                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#9aa2d4" }}>{c.tipo}</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: "#FFD23F", fontFamily: MONO, letterSpacing: ".04em" }}>{c.codice}</div>
                              </div>
                            ))}
                          </div>
                          {h.istruzioni && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#C9CEEC", lineHeight: 1.5 }}>{h.istruzioni}</div>}
                        </div>
                      )}
                      {h.codici.length === 0 && h.istruzioni && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "#5b5644", lineHeight: 1.5 }}>{h.istruzioni}</div>}
                    </>
                  ) : (
                    <div style={{ marginTop: 11, fontSize: 12.5, color: "#9a937c", fontWeight: 700, lineHeight: 1.5 }}>
                      Nome, indirizzo, conferma e PIN riservati. <a href="#sSet" style={{ color: "#0E1542", textDecoration: "underline", textDecorationColor: "#FF2E7E", textDecorationThickness: "2px" }}>Caricali →</a>
                    </div>
                  )}
                  <div style={{ marginTop: 13, paddingTop: 12, borderTop: "1.5px dashed #C8BCA0", fontSize: 12.5, color: "#5b5644", lineHeight: 1.6, fontWeight: 600 }}>
                    <div><strong style={{ color: "#17142C" }}>Dall'aeroporto:</strong> {h.transfer}</div>
                    <div style={{ marginTop: 7, display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ background: "#FFD23F", color: "#0E1542", borderRadius: 999, padding: "3px 10px", fontWeight: 900, fontSize: 11.5 }}>Check-in {h.checkin}</span>
                      <span style={{ background: "#0E1542", color: "#fff", borderRadius: 999, padding: "3px 10px", fontWeight: 900, fontSize: 11.5 }}>Check-out {h.checkout}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* ===== PROGRAMMA ===== */}
          <section id="sPlan" style={{ ...sec, padding: "26px 16px 28px", background: "#ECE3D0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "#14C08C", borderRadius: 999 }}><TimelineIcon size={19} fill="#fff" /></span>
              <h2 style={h2("#0E1542")}>Programma</h2>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 600, color: "#6B6450" }}>Ogni giorno è una sequenza: trascina la maniglia ⠿ per riordinare le tappe, tocca la durata di una tappa per allungarla o accorciarla (spinge avanti tutto il resto) · gli orari si calcolano da soli, in base a quando si parte e ai tempi di spostamento reali · voli fissi · tocca il giorno per aprirlo/chiuderlo · i giorni passati si bloccano</p>
            {/* transfer legend — what the dashed connectors between tappe mean */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", background: "#F6F0E2", border: "1px solid #E1D7BF", borderRadius: 12, padding: "9px 12px", marginBottom: 16, fontSize: 11.5, fontWeight: 700, color: "#6B6450" }}>
              <span style={{ fontWeight: 900, color: "#0E1542" }}>Spostamenti</span>
              <span>🚶 a piedi</span><span>🚌 bus/tram</span><span>🚆 treno/bus</span><span>🚕 Uber</span>
              <span style={{ color: "#9a937c" }}>· tempi e costi (£) sono <strong style={{ color: "#6B6450" }}>stime</strong></span>
            </div>
            {planDays.map((d) => (
              <div key={d.key} style={{ borderRadius: 18, marginBottom: 13, overflow: "hidden", background: "#fff", boxShadow: tiltShadow(12, 26, -20, 0.4), opacity: d.dim }}>
                <div onClick={d.onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 15px", background: d.headBg, color: d.headFg, cursor: "pointer", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
                    <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>{d.dateLabel}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.cityLabel}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                    {d.badge && <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".05em", textTransform: "uppercase", background: d.badgeBg, color: d.headFg, padding: "3px 9px", borderRadius: 999 }}>{d.badge}</span>}
                    <span style={{ fontSize: 16, transform: d.open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>⌄</span>
                  </div>
                </div>

                {/* collapsed → summary only */}
                {!d.open && (
                  <div style={{ padding: "11px 15px 13px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 900, color: "#0E1542", background: "#ECE3D0", borderRadius: 999, padding: "3px 10px" }}>{d.summary.count} attività · {d.summary.totalLabel}</span>
                      {d.summary.flightCount > 0 && <span style={{ fontSize: 11.5, fontWeight: 900, color: "#9c2a18", background: "#FBE4E0", borderRadius: 999, padding: "3px 10px" }}>✈ {d.summary.flightCount} {d.summary.flightCount === 1 ? "volo" : "voli"}</span>}
                    </div>
                    {d.summary.names.length > 0 && <div style={{ marginTop: 7, fontSize: 12.5, fontWeight: 600, color: "#6B6450", lineHeight: 1.5 }}>{d.summary.names.join(" · ")}</div>}
                  </div>
                )}

                {/* expanded → calendar timeline */}
                {d.open && (
                  <div style={{ padding: "4px 13px 13px" }}>
                    {d.flightChips.map((fl, fi) => (
                      <div key={"fc" + fi} style={{ display: "flex", gap: 8, alignItems: "center", background: "#FBE4E0", borderLeft: `4px solid ${fl.accent}`, borderRadius: 10, padding: "8px 11px", marginTop: 8 }}>
                        <PlaneIcon size={16} fill={fl.accent} />
                        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800, color: "#9c2a18" }}>{fl.label}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: "#b8503f" }}>orari riservati</span>
                      </div>
                    ))}
                    {d.canEdit && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "8px 0 2px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#8a836c" }}>
                          {d.editMode ? "Modifica · trascina ⠿ per riordinare" : "Tocca un blocco per i dettagli"}
                        </span>
                        <button onClick={d.onToggleEdit} style={{ cursor: "pointer", fontSize: 11.5, fontWeight: 900, border: "none", borderRadius: 999, padding: "6px 13px", color: d.editMode ? "#fff" : "#0E1542", background: d.editMode ? "#14C08C" : "#FFD23F" }}>
                          {d.editMode ? "Fine ✓" : "Modifica orari"}
                        </button>
                      </div>
                    )}
                    {d.canEdit && d.editMode && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6B6450" }}>Si parte alle</span>
                        <input
                          type="time"
                          value={d.dayStart}
                          onChange={(e) => e.target.value && d.onDayStart(e.target.value)}
                          style={{ fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#F6F0E2", border: "1.5px solid #D9CFB7", borderRadius: 8, padding: "5px 8px", fontFamily: MONO }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#9a937c" }}>dall'hotel — il resto si calcola da solo</span>
                      </div>
                    )}
                    {d.multiTripWarn && (
                      <div style={{ display: "flex", gap: 8, background: "#FFF3CC", border: "1px solid #E9D08A", borderRadius: 10, padding: "8px 11px", margin: "6px 0 2px", fontSize: 11.5, fontWeight: 600, color: "#6a5410", lineHeight: 1.45 }}>
                        <span style={{ fontWeight: 900 }}>↪</span>
                        <span>Più gite in giornata: l'app le <strong>concatena</strong> — Andata da Edimburgo solo alla prima, poi lo spostamento parte dalla gita precedente, e Ritorno solo dall'ultima. Per ogni tratta stima tempo, mezzo (a piedi / bus / treno, Uber se resta sotto £20) e costo. Sono <strong>stime</strong>: verifica orari e tariffe reali e aggiusta in « Modifica orari ».</span>
                      </div>
                    )}
                    {d.events.length === 0 && d.summary.flightCount === 0 && (
                      <div style={{ textAlign: "center", border: "1.5px dashed #d8cdb2", borderRadius: 12, padding: "16px 14px", margin: "4px 0 2px", background: "#FCFAF3" }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }} aria-hidden>🗓️</div>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0E1542" }}>Giornata ancora libera</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6450", marginTop: 3, lineHeight: 1.45 }}>{d.canEdit ? (d.editMode ? "Aggiungi la prima tappa qui sotto ↓" : "Tocca « Modifica orari » per aggiungere visite, pasti e gite.") : "Nessuna attività in programma."}</div>
                      </div>
                    )}
                    <DayTimeline
                      events={d.events}
                      flights={d.flightBlocks}
                      editable={d.editMode}
                      nowMin={d.nowMin}
                      onReorder={d.onReorder}
                      onResize={d.onResize}
                      onRemove={d.onRemove}
                      onSelect={d.onSelect}
                    />
                    {d.canAdd && d.editMode && (
                      <div style={{ marginTop: 10 }}>
                        <button onClick={d.onToggleAdd} style={{ cursor: "pointer", width: "100%", border: "1.5px dashed #bcae8f", background: "transparent", borderRadius: 10, padding: 9, fontSize: 12.5, fontWeight: 800, color: "#0E1542" }}>{d.addLabel}</button>
                        {d.pickerOpen && (
                          <div style={{ marginTop: 7, background: "#F6F0E2", border: "1.5px solid #D9CFB7", borderRadius: 12, padding: 9, maxHeight: 360, overflowY: "auto", overscrollBehavior: "contain" }}>
                            {/* quick filter — type to narrow the long catalogue */}
                            <div style={{ position: "sticky", top: -9, zIndex: 4, background: "#F6F0E2", paddingTop: 2, margin: "-2px -1px 8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #D9CFB7", borderRadius: 9, padding: "7px 10px" }}>
                                <span style={{ fontSize: 13, opacity: 0.6 }} aria-hidden>🔎</span>
                                <input
                                  value={d.pickerQuery}
                                  onChange={(e) => d.onPickerQuery(e.target.value)}
                                  placeholder="Cerca un luogo…"
                                  style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: "#17142C" }}
                                />
                                {d.pickerQuery && (
                                  <button onClick={() => d.onPickerQuery("")} title="Pulisci" style={{ flex: "none", cursor: "pointer", border: "none", background: "transparent", color: "#9a937c", fontSize: 16, fontWeight: 900, lineHeight: 1, padding: 0 }}>×</button>
                                )}
                              </div>
                            </div>
                            {/* category chips */}
                            {d.pickerCats.length > 1 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "0 1px 7px" }}>
                                {[{ key: "", label: "Tutte" }, ...d.pickerCats].map((c) => {
                                  const on = (d.pickerCat || "") === c.key;
                                  return <button key={c.key || "all"} onClick={() => d.onPickerCat(c.key)} style={{ cursor: "pointer", fontSize: 11, fontWeight: 800, border: "1.5px solid " + (on ? "#0E1542" : "#D9CFB7"), background: on ? "#0E1542" : "#fff", color: on ? "#fff" : "#4b463a", borderRadius: 999, padding: "4px 11px", whiteSpace: "nowrap" }}>{c.label.replace(/ \(.*\)| ·.*/, "")}</button>;
                                })}
                              </div>
                            )}
                            {/* neighbourhood chips (city-scale: Old Town, Leith, Shoreditch…) */}
                            {d.pickerHoods.length > 0 && (
                              <div style={{ margin: "0 1px 6px" }}>
                                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", color: "#9a937c", margin: "0 2px 3px" }}>Quartiere</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                  {["", ...d.pickerHoods].map((z) => {
                                    const on = (d.pickerHood || "") === z;
                                    return <button key={z || "allhood"} onClick={() => d.onPickerHood(z)} style={{ cursor: "pointer", fontSize: 10.5, fontWeight: 700, border: "1px solid " + (on ? "#14C08C" : "#E4DAC2"), background: on ? "#E3F5EE" : "#FBF7EC", color: on ? "#0a7d5d" : "#6B6450", borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{z || "Ogni quartiere"}</button>;
                                  })}
                                </div>
                              </div>
                            )}
                            {/* geographic-area chips (day-trip scale: Fife, Glasgow, East Lothian…) */}
                            {d.pickerAreas.length > 0 && (
                              <div style={{ margin: "0 1px 8px" }}>
                                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", color: "#9a937c", margin: "0 2px 3px" }}>Zona geografica · gite</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                  {["", ...d.pickerAreas].map((z) => {
                                    const on = (d.pickerArea || "") === z;
                                    return <button key={z || "allarea"} onClick={() => d.onPickerArea(z)} style={{ cursor: "pointer", fontSize: 10.5, fontWeight: 700, border: "1px solid " + (on ? "#3B6FE0" : "#E4DAC2"), background: on ? "#E7EEFB" : "#FBF7EC", color: on ? "#1d4ba8" : "#6B6450", borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{z || "Ogni zona"}</button>;
                                  })}
                                </div>
                              </div>
                            )}
                            {d.pickerGroups.length === 0 && (
                              <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "#9a937c", padding: "14px 6px" }}>Nessun luogo trovato con questi filtri.</div>
                            )}
                            {d.pickerGroups.map((grp, gi2) => (
                              <div key={gi2} style={{ marginBottom: 6 }}>
                                <div style={{ position: "sticky", top: 38, zIndex: 3, fontSize: 10, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", color: "#9a937c", background: "#F6F0E2", margin: "0 2px", padding: "4px 0 6px" }}>{grp.label}</div>
                                {grp.items.map((p, pi) => (
                                  <button key={pi} onClick={p.onAdd} style={{ cursor: "pointer", width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, background: "#fff", border: "1px solid #E4DAC2", borderRadius: 9, padding: "8px 10px", marginBottom: 6 }}>
                                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                      <span style={{ fontSize: 13, fontWeight: 800, color: "#17142C" }}>{p.name}</span>
                                      {p.note && <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6450", lineHeight: 1.35 }}>{p.note}</span>}
                                    </span>
                                    <span style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                                      <span style={{ marginTop: 1, fontSize: 10.5, fontWeight: 800, color: "#6B6450", background: "#ECE3D0", borderRadius: 999, padding: "1px 7px", whiteSpace: "nowrap" }}>{p.durLabel}</span>
                                      {p.dist && <span style={{ fontSize: 10, fontWeight: 800, color: "#0a7d5d", whiteSpace: "nowrap" }}>{p.dist.label}</span>}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* ===== PREFERITI ===== */}
          <section id="sFav" style={{ ...sec, padding: "26px 16px 28px", background: "#14C08C" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "#0E1542", borderRadius: 999, color: "#FFD23F", fontSize: 18 }}>★</span>
              <h2 style={h2("#06382a")}>Preferiti</h2>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 700, color: "#0a4e3b" }}>Tocca la stella su qualsiasi luogo · esporta/importa dalle Impostazioni</p>
            {favorites.length === 0 && (
              <div style={{ background: "#F6F0E2", borderRadius: 16, padding: 18, textAlign: "center", fontSize: 13.5, fontWeight: 600, color: "#6B6450", lineHeight: 1.6 }}>
                Nessun preferito ancora. Aggiungi una stella ai luoghi nelle sezioni qui sotto.
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              {favorites.map((fv, i) => (
                <div key={i} className="paper" onClick={() => this.openDetail(fv.id, favorites.map((f) => f.id))} style={{ position: "relative", overflow: "hidden", background: "#F6F0E2", borderRadius: 16, boxShadow: tiltShadow(12, 26, -20, 0.4), cursor: "pointer" }}>
                  <div style={{ position: "relative", padding: "13px 14px" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#17142C", lineHeight: 1.12 }}>{fv.name}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#0a7d5d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 3 }}>{fv.where}</div>
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#6B6450", fontWeight: 600, lineHeight: 1.45 }}>{fv.note}</p>
                    <div style={{ marginTop: 10, display: "flex", gap: 7 }}>
                      <a href={fv.maps} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11.5, fontWeight: 900, color: "#0E1542", textDecoration: "none", background: "#FFD23F", padding: "5px 12px", borderRadius: 999 }}>Maps ↗</a>
                      <button onClick={(e) => { e.stopPropagation(); fv.onToggle(); }} style={{ cursor: "pointer", fontSize: 11.5, fontWeight: 900, color: "#E6482A", background: "#fff", border: "1.5px solid #f0c4bb", padding: "5px 12px", borderRadius: 999 }}>Rimuovi ★</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== 03 EDIMBURGO ===== */}
          <section id="s03" style={{ ...sec, padding: "26px 16px 22px", background: "#ECE3D0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#FF2E7E", "#fff")}>04</span>
              <h2 style={h2("#0E1542")}>Edimburgo</h2>
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, fontWeight: 600, color: "#6B6450" }}>Per zona · stella = preferito, poi pianificalo dal Programma</p>
            {sightsByZone.map((g, gi) => (
              <div key={gi} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 2px 8px" }}>
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", color: "#0E1542" }}>{g.label}</span>
                  <span style={{ flex: 1, height: 2, borderRadius: 2, background: "#D9CFB7" }} />
                </div>
                <div style={{ background: "#fff", borderRadius: 16, padding: "2px 14px" }}>
                  {g.ids.map((id, i) => <SummaryRow key={id} {...rowProps(id, sightsFlat)} last={i === g.ids.length - 1} />)}
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: "#0E1542", margin: "4px 0 9px" }}>Quartieri da girare</div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "2px 14px" }}>
              {neighborhoodIds.map((id, i) => <SummaryRow key={id} {...rowProps(id, neighborhoodIds)} last={i === neighborhoodIds.length - 1} />)}
            </div>
          </section>

          {/* ===== 04 MANGIARE ===== */}
          <section id="s04" style={{ ...sec, padding: "26px 16px 28px", background: "#46150E" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#E6482A", "#fff")}>05</span>
              <h2 style={h2("#fff")}>Mangiare &amp; locali</h2>
              <CutleryIcon fill="#FFD23F" style={{ marginLeft: "auto" }} />
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, fontWeight: 600, color: "#e3a596" }}>Solo scozzese / locale · tocca per la scheda</p>
            <div style={{ background: "#F6F0E2", borderRadius: 16, padding: "2px 14px" }}>
              {eatsIds.map((id, i) => <SummaryRow key={id} {...rowProps(id, eatsIds)} last={i === eatsIds.length - 1} />)}
            </div>
          </section>

          {/* ===== 05 GLASGOW ===== */}
          <section id="s05" style={{ ...sec, padding: "26px 16px 22px", background: "#ECE3D0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#0E1542", "#fff")}>08</span>
              <h2 style={h2("#0E1542")}>Glasgow</h2>
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, fontWeight: 600, color: "#6B6450" }}>Treno da Edimburgo ~50' · gita in giornata</p>
            <div style={{ background: "#fff", borderRadius: 16, padding: "2px 14px" }}>
              {glasgowIds.map((id, i) => <SummaryRow key={id} {...rowProps(id, glasgowIds)} last={i === glasgowIds.length - 1} />)}
            </div>
          </section>

          {/* ===== 06 DINTORNI ===== */}
          <section id="s06" style={{ ...sec, padding: "26px 16px 22px", background: "#ECE3D0", borderTop: "1px solid #ddd2bb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#14C08C", "#fff")}>07</span>
              <h2 style={h2("#0E1542")}>Dintorni &amp; gite</h2>
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, fontWeight: 600, color: "#6B6450" }}>Per zona · tocca per la scheda della gita · forse <strong style={{ color: "#0E1542" }}>una</strong> gita vera</p>
            {tripsByArea.map((grp, gi) => (
              <div key={gi} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 2px 8px" }}>
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", color: "#0E1542" }}>{grp.label}</span>
                  <span style={{ flex: 1, height: 2, borderRadius: 2, background: "#D9CFB7" }} />
                </div>
                <div style={{ background: "#fff", borderRadius: 14, padding: "2px 14px" }}>
                  {grp.ids.map((id, i) => <SummaryRow key={id} {...rowProps(id, tripsFlat)} last={i === grp.ids.length - 1} />)}
                </div>
              </div>
            ))}
          </section>

          {/* ===== 07 ESPERIENZE ===== */}
          {/* Each themed experience behaves like a section: its venues are listed directly
              as tappable rows (tap → that venue's card). No theme "submenu" sheet. A venue
              repeating elsewhere is fine. */}
          <section id="s07" style={{ ...sec, padding: "26px 16px 22px", background: "#ECE3D0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#FF2E7E", "#fff")}>06</span>
              <h2 style={h2("#0E1542")}>Esperienze</h2>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 600, color: "#6B6450" }}>Itinerari per tema · tocca una tappa per la scheda</p>
            {D.experiences.map((x) => (
              <div key={x.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 2px 6px" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: ".05em", textTransform: "uppercase", color: "#0E1542" }}>{x.title}</span>
                  <span style={{ flex: 1, height: 2, borderRadius: 2, background: "#D9CFB7" }} />
                </div>
                {x.body && <p style={{ margin: "0 2px 9px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, color: "#6B6450" }}>{x.body}</p>}
                <div style={{ background: "#fff", borderRadius: 16, padding: "2px 14px" }}>
                  {(() => { const exIds = x.places.map((p) => p.ref || p.id); return x.places.map((p, i) => { const pid = p.ref || p.id; return <SummaryRow key={pid} {...rowProps(pid, exIds)} last={i === x.places.length - 1} />; }); })()}
                </div>
              </div>
            ))}
          </section>

          {/* ===== 08 LONDRA ===== */}
          <section id="s08" style={{ ...sec, padding: "26px 16px 28px", background: "#0E1542" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#FFD23F", "#0E1542")}>03</span>
              <h2 style={h2("#fff")}>Londra · prima sera</h2>
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, fontWeight: 600, color: "#9aa2d4" }}>Sera d'arrivo + colazione · a piedi dall'hotel a Shoreditch</p>
            {londonByZone.map((grp, gi) => (
              <div key={gi} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", color: "#FFD23F", margin: "0 2px 8px" }}>{grp.label === "City & South Bank" ? "City & South Bank · opzionali" : grp.label}</div>
                <div style={{ background: "#F6F0E2", borderRadius: 16, padding: "2px 14px" }}>
                  {grp.ids.map((id, i) => <SummaryRow key={id} {...rowProps(id, londonFlat)} last={i === grp.ids.length - 1} />)}
                </div>
              </div>
            ))}
          </section>

          {/* ===== 09 INFO PRATICHE ===== */}
          <section id="s09" style={{ ...sec, padding: "26px 16px 22px", background: "#ECE3D0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={numBadge("#0E1542", "#fff")}>09</span>
              <h2 style={h2("#0E1542")}>Info pratiche</h2>
            </div>
            <p style={{ margin: "0 0 15px", fontSize: 13.5, fontWeight: 600, color: "#6B6450" }}>L'essenziale per il posto</p>
            {showWeather && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 15, marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: "#0E1542" }}>Meteo · giorni del viaggio</div>
                  <button onClick={this.fetchWeather} style={{ fontSize: 11.5, fontWeight: 900, color: "#fff", background: "#14C08C", border: "none", padding: "6px 12px", borderRadius: 999, cursor: "pointer" }}>Aggiorna</button>
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {forecastDays.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 11px", background: "#F6F0E2", borderRadius: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 14, color: "#0E1542" }}>{w.dayLabel} <span style={{ fontSize: 11, fontWeight: 700, color: "#9a937c" }}>{w.cityLabel}</span></div>
                        <div style={{ marginTop: 3, display: "inline-block", fontSize: 10.5, fontWeight: 800, color: w.condFg, background: w.condBg, borderRadius: 999, padding: "2px 9px" }}>{w.desc}</div>
                      </div>
                      <div style={{ textAlign: "right", flex: "none" }}>
                        <div style={{ fontWeight: 900, fontSize: 17, color: "#0E1542", fontFamily: MONO }}>{w.hi}°<span style={{ color: "#9a937c", fontSize: 14 }}> / {w.lo}°</span></div>
                        {w.estimate && <div style={{ fontSize: 9, fontWeight: 900, color: "#c08a2a", textTransform: "uppercase", letterSpacing: ".04em" }}>Media stag.</div>}
                      </div>
                    </div>
                  ))}
                </div>
                {this.state.wxErr && <div style={{ marginTop: 9, fontSize: 11.5, color: "#9a937c", fontWeight: 700, lineHeight: 1.5 }}>{this.state.wxErr}</div>}
                <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1.5px solid #EFE7D6", fontSize: 13, color: "#5b5644", lineHeight: 1.6, fontWeight: 600 }}>
                  <strong style={{ color: "#0E1542" }}>In piena estate:</strong> max ~18–19°, min ~11°, variabile e piovoso. Giornate lunghe, tramonto tardi. <strong style={{ color: "#0E1542" }}>Strati + impermeabile.</strong>
                </div>
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}><div style={{ fontWeight: 900, color: "#0E1542", marginBottom: 3, fontSize: 14.5 }}>£ Sterlina (GBP)</div><span style={{ color: "#5b5644" }}>Londra <em>ed</em> Edimburgo usano la <strong style={{ color: "#17142C" }}>sterlina, non l'euro</strong>. Contactless ovunque; banconote scozzesi valide.</span></div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}><div style={{ fontWeight: 900, color: "#0E1542", marginBottom: 3, fontSize: 14.5 }}>Trasporti Edimburgo</div><span style={{ color: "#5b5644" }}>Lothian Buses + Tram: paga contactless, c'è il <em>daily cap</em>. App <strong style={{ color: "#17142C" }}>Transport for Edinburgh</strong>.</span></div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}><div style={{ fontWeight: 900, color: "#0E1542", marginBottom: 3, fontSize: 14.5 }}>Prese elettriche</div><span style={{ color: "#5b5644" }}>UK <strong style={{ color: "#17142C" }}>tipo G</strong> (3 spinotti), 230V. Serve l'adattatore.</span></div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}><div style={{ fontWeight: 900, color: "#0E1542", marginBottom: 3, fontSize: 14.5 }}>Banconote scozzesi</div><span style={{ color: "#5b5644" }}>Valide ovunque nel Regno Unito ma <strong style={{ color: "#17142C" }}>a volte rifiutate fuori dalla Scozia</strong>: spendile o cambiale prima di rientrare.</span></div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}><div style={{ fontWeight: 900, color: "#0E1542", marginBottom: 3, fontSize: 14.5 }}>SIM & dati</div><span style={{ color: "#5b5644" }}>UK <strong style={{ color: "#17142C" }}>fuori dalla UE</strong>: controlla il roaming del tuo operatore. Spesso conviene una <strong style={{ color: "#17142C" }}>eSIM</strong> (Airalo/Holafly).</span></div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}><div style={{ fontWeight: 900, color: "#0E1542", marginBottom: 3, fontSize: 14.5 }}>Mance & pub</div><span style={{ color: "#5b5644" }}>Mancia non obbligatoria; <strong style={{ color: "#17142C" }}>~10%</strong> al ristorante se il servizio non è incluso. Nei pub si ordina e paga <strong style={{ color: "#17142C" }}>al banco</strong>, senza mancia.</span></div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}><div style={{ fontWeight: 900, color: "#0E1542", marginBottom: 3, fontSize: 14.5 }}>Acqua & orari</div><span style={{ color: "#5b5644" }}>Acqua del rubinetto ottima e gratis. Molti negozi chiudono <strong style={{ color: "#17142C" }}>17–18</strong>, la <strong style={{ color: "#17142C" }}>domenica</strong> orari ridotti; i pub fino a tardi.</span></div>
              <div style={{ background: "#fff", borderRadius: 14, padding: 13, fontSize: 13, lineHeight: 1.55, fontWeight: 600, border: "2px solid #E6482A" }}><div style={{ fontWeight: 900, color: "#E6482A", marginBottom: 3, fontSize: 14.5 }}>Emergenze</div><span style={{ color: "#5b5644" }}><strong style={{ color: "#17142C" }}>999</strong> o <strong style={{ color: "#17142C" }}>112</strong> · <strong style={{ color: "#17142C" }}>111</strong> NHS non urgente.</span></div>
            </div>
          </section>

          {/* ===== IMPOSTAZIONI ===== */}
          <section id="sSet" style={{ ...sec, padding: "26px 16px 40px", background: "#17142C" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
              <span style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "#FFD23F", borderRadius: 999, color: "#17142C", fontSize: 18 }}>⚙</span>
              <h2 style={h2("#fff")}>Impostazioni</h2>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 600, color: "#9d98c4" }}>Dati riservati solo su questo dispositivo</p>

            {showInstall && (
              <div style={{ marginBottom: 14 }}>
                <InstallCard platform={platform} canPrompt={!!this.state.installEvt} onInstall={this.promptInstall} compact />
              </div>
            )}

            <Collapsible open={!!this.state.setOpen.sim} onToggle={() => this.toggleSet("sim")} title="Simula data e ora" sub="Anteprima del viaggio in qualsiasi momento">
              <button onClick={() => this.setState({ simOpen: true })} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 900, color: "#17142C", background: this.state.sim ? "#14C08C" : "#FFD23F", border: "none", padding: "10px 15px", borderRadius: 999 }}>{this.state.sim ? "Simulazione attiva — modifica" : "Apri simulatore"}</button>
            </Collapsible>

            <Collapsible open={!!this.state.setOpen.luce} onToggle={() => this.toggleSet("luce")} title="Effetto luce carta" sub="Su telefono la luce segue l'inclinazione">
              <button onClick={this.enableLight} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 900, color: "#17142C", background: this.state.lightOn ? "#14C08C" : "#FFD23F", border: "none", padding: "9px 14px", borderRadius: 999, whiteSpace: "nowrap" }}>{this.state.lightOn ? "Attivo ✓" : "Attiva"}</button>
            </Collapsible>

            <Collapsible open={!!this.state.setOpen.dati} onToggle={() => this.toggleSet("dati")} title="Dati riservati (JSON)" sub="Voli, alloggi, parcheggio · solo su questo dispositivo">
              <div style={{ fontSize: 12.5, color: "#9d98c4", lineHeight: 1.55, marginBottom: 10, fontWeight: 600 }}>Copia il modello: i valori sono segnaposto d'esempio (formato AAAA-MM-GG, HH:MM…) che mostrano come compilare ogni campo — utile anche per farti aiutare da un'AI. Sostituiscili coi tuoi dati e reincolla. Solo voli, alloggi, parcheggio e Stansted.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <button onClick={this.copyEmpty} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#17142C", background: "#FFD23F", border: "none", padding: "8px 13px", borderRadius: 999 }}>Copia modello</button>
                <button onClick={this.copyCurrent} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#fff", background: "#14C08C", border: "none", padding: "8px 13px", borderRadius: 999 }}>Copia JSON attuale</button>
                <button onClick={this.fillFromCurrent} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#fff", background: "rgba(255,255,255,.12)", border: "none", padding: "8px 13px", borderRadius: 999 }}>Modifica attuale</button>
              </div>
              {this.state.copyMsg && <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: "#FFD23F" }}>{this.state.copyMsg}</div>}
              <textarea value={this.state.jsonText} onChange={this.onJsonInput} placeholder="Incolla qui il JSON…" style={{ width: "100%", minHeight: 140, fontFamily: MONO, fontSize: 12, color: "#fff", background: "#15122b", border: "1.5px solid #3a3560", borderRadius: 12, padding: 11, resize: "vertical", lineHeight: 1.5 }} />
              {fb && fb.ok && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#14C08C", padding: "10px 12px", borderRadius: 12 }}>{fb.msg}</div>}
              {fb && !fb.ok && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color: "#fff", background: "#E6482A", padding: "10px 12px", borderRadius: 12 }}>{fb.msg}</div>}
              <div style={{ display: "flex", gap: 9, marginTop: 11 }}>
                <button onClick={this.saveReserved} style={{ flex: 1, background: "#FFD23F", color: "#17142C", fontWeight: 900, fontSize: 14, padding: 12, border: "none", borderRadius: 999, cursor: "pointer" }}>Salva dati</button>
                <button onClick={this.clearReserved} style={{ flex: "none", background: "transparent", color: "#ff8f7d", border: "1.5px solid #5a3340", fontWeight: 900, fontSize: 14, padding: "12px 18px", borderRadius: 999, cursor: "pointer" }}>Cancella</button>
              </div>
            </Collapsible>

            <Collapsible open={!!this.state.setOpen.fav} onToggle={() => this.toggleSet("fav")} title="Preferiti · esporta / importa" sub="Copia o ripristina la lista dei preferiti">
              <div style={{ fontSize: 12.5, color: "#9d98c4", lineHeight: 1.55, marginBottom: 10, fontWeight: 600 }}>Stesso metodo: copia la lista, salvala dove vuoi, reincollala su un altro dispositivo.</div>
              <button onClick={this.exportFavs} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#17142C", background: "#FFD23F", border: "none", padding: "8px 13px", borderRadius: 999, marginBottom: 10 }}>Copia preferiti</button>
              {this.state.favCopyMsg && <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: "#FFD23F" }}>{this.state.favCopyMsg}</div>}
              <textarea value={this.state.favText} onChange={this.onFavInput} placeholder="Incolla qui la lista preferiti…" style={{ width: "100%", minHeight: 70, fontFamily: MONO, fontSize: 12, color: "#fff", background: "#15122b", border: "1.5px solid #3a3560", borderRadius: 12, padding: 11, resize: "vertical", lineHeight: 1.5 }} />
              <button onClick={this.importFavs} style={{ marginTop: 10, width: "100%", background: "#14C08C", color: "#fff", fontWeight: 900, fontSize: 13.5, padding: 11, border: "none", borderRadius: 999, cursor: "pointer" }}>Importa preferiti</button>
              {this.state.favImpMsg && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#14C08C", padding: "10px 12px", borderRadius: 12 }}>{this.state.favImpMsg}</div>}
            </Collapsible>

            <Collapsible open={!!this.state.setOpen.prog} onToggle={() => this.toggleSet("prog")} title="Programma · esporta / importa" sub="Timeline e checklist · backup o trasferimento">
              <div style={{ fontSize: 12.5, color: "#9d98c4", lineHeight: 1.55, marginBottom: 10, fontWeight: 600 }}>Copia l'intera timeline (giorni, attività, orari, durate e checklist), salvala o passala a un altro dispositivo, poi reincollala qui per ripristinarla.</div>
              <button onClick={this.exportPlan} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#17142C", background: "#FFD23F", border: "none", padding: "8px 13px", borderRadius: 999, marginBottom: 10 }}>Copia programma</button>
              {this.state.planCopyMsg && <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: "#FFD23F" }}>{this.state.planCopyMsg}</div>}
              <textarea value={this.state.planText} onChange={this.onPlanInput} placeholder="Incolla qui il programma…" style={{ width: "100%", minHeight: 90, fontFamily: MONO, fontSize: 12, color: "#fff", background: "#15122b", border: "1.5px solid #3a3560", borderRadius: 12, padding: 11, resize: "vertical", lineHeight: 1.5 }} />
              <button onClick={this.importPlan} style={{ marginTop: 10, width: "100%", background: "#14C08C", color: "#fff", fontWeight: 900, fontSize: 13.5, padding: 11, border: "none", borderRadius: 999, cursor: "pointer" }}>Importa programma</button>
              {this.state.planImpMsg && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#14C08C", padding: "10px 12px", borderRadius: 12 }}>{this.state.planImpMsg}</div>}

              {/* AI-ready template: fixed points + venue catalogue + editable days */}
              <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid #34305a" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Fallo generare a un'AI ✨</div>
                <div style={{ fontSize: 12.5, color: "#9d98c4", lineHeight: 1.55, marginBottom: 10, fontWeight: 600 }}>Esporta un template con i <strong style={{ color: "#cfc8ee" }}>punti fissi</strong> (voli e transfer) e l'<strong style={{ color: "#cfc8ee" }}>elenco di tutte le venue</strong> mappate. Dallo a Claude, fattelo compilare e reincollalo qui sopra con « Importa programma ».</div>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  <button onClick={this.exportPlanTemplate} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#17142C", background: "#FFD23F", border: "none", padding: "9px 14px", borderRadius: 999 }}>Copia template AI</button>
                  <button onClick={this.downloadPlanTemplate} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#fff", background: "transparent", border: "1.5px solid #4a4570", padding: "9px 14px", borderRadius: 999 }}>Scarica file ↓</button>
                </div>
                {this.state.planTplMsg && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, color: "#FFD23F" }}>{this.state.planTplMsg}</div>}
              </div>
            </Collapsible>

            {/* ===== BACKUP & SYNC (file) ===== */}
            <Collapsible open={!!this.state.setOpen.backup} onToggle={() => this.toggleSet("backup")} title="Backup & sincronizzazione (file)" sub="Un unico file con tutto · nessun server">
              <div style={{ fontSize: 12.5, color: "#9d98c4", lineHeight: 1.55, marginBottom: 11, fontWeight: 600 }}>Scarica <strong style={{ color: "#cfc8ee" }}>un unico file</strong> con dati riservati, preferiti e programma. Salvalo nella tua cartella <strong style={{ color: "#cfc8ee" }}>File / iCloud Drive / Google Drive</strong>: per sincronizzare un altro dispositivo, riaprilo da lì con « Importa file ». (I dati restano tuoi: nessun server.)</div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={this.downloadBackup} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 900, color: "#17142C", background: "#FFD23F", border: "none", padding: "10px 15px", borderRadius: 999 }}>Scarica backup ↓</button>
                <label style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 900, color: "#fff", background: "#14C08C", padding: "10px 15px", borderRadius: 999 }}>
                  Importa file ↑
                  <input type="file" accept=".json,application/json,text/json,text/plain,application/octet-stream" onChange={this.importBackupFile} style={{ display: "none" }} />
                </label>
              </div>
              {this.state.backupMsg && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#14C08C", padding: "10px 12px", borderRadius: 12 }}>{this.state.backupMsg}</div>}
            </Collapsible>

            {/* ===== VERSION / UPDATE CHECK ===== */}
            <Collapsible open={!!this.state.setOpen.ver} onToggle={() => this.toggleSet("ver")} title="Versione app" sub={this.state.updateInfo.available ? "Nuova versione disponibile" : "Controlla se hai l'ultima versione"}>
              <div style={{ fontSize: 12.5, color: "#9d98c4", lineHeight: 1.55, marginBottom: 11, fontWeight: 600 }}>
                In uso: <span style={{ fontFamily: MONO, color: "#cfc8ee" }}>{__APP_VERSION__}</span>
                {this.state.updateInfo.checkedOnce && this.state.updateInfo.available && <> · ultima: <span style={{ fontFamily: MONO, color: "#cfc8ee" }}>{this.state.updateInfo.latest}</span></>}
              </div>
              {this.state.updateInfo.available ? (
                <div>
                  <div style={{ marginBottom: 10, fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#FFD23F", padding: "10px 12px", borderRadius: 12 }}>È disponibile una nuova versione. L'aggiornamento non tocca i tuoi dati (programma, preferiti, dati riservati) — cancella solo la copia offline dell'app.</div>
                  <button onClick={this.applyUpdate} style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 900, color: "#fff", background: "#14C08C", border: "none", padding: "11px 18px", borderRadius: 999 }}>Aggiorna ora ↻</button>
                </div>
              ) : (
                <button onClick={() => this.checkForUpdate(true)} disabled={this.state.updateInfo.checking} style={{ cursor: this.state.updateInfo.checking ? "default" : "pointer", fontSize: 12.5, fontWeight: 900, color: "#17142C", background: "#FFD23F", border: "none", padding: "10px 15px", borderRadius: 999, opacity: this.state.updateInfo.checking ? 0.6 : 1 }}>{this.state.updateInfo.checking ? "Controllo…" : "Controlla aggiornamenti"}</button>
              )}
              {/* Escape hatch: the check above can give a false "already
                  updated" — it depends on version.json reaching you fresh,
                  and on iOS a PWA's service worker can sit on an old
                  index.html for a long time regardless of what the CDN is
                  serving by now. This works even when the check is wrong. */}
              <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid #34305a" }}>
                <div style={{ fontSize: 11.5, color: "#9d98c4", lineHeight: 1.5, marginBottom: 8, fontWeight: 600 }}>Il controllo dice "già aggiornato" ma sospetti di vedere una versione vecchia? Succede — cancella comunque la copia offline, senza aspettare che il controllo lo confermi.</div>
                <button onClick={this.applyUpdate} style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#cfc8ee", background: "transparent", border: "1.5px solid #4a4570", padding: "8px 13px", borderRadius: 999 }}>Forza aggiornamento ↻</button>
              </div>
            </Collapsible>

            <div style={{ textAlign: "center", marginTop: 24, fontWeight: 900, fontSize: 15, color: "#fff" }}>Slàinte mhath · <span style={{ background: "#FF2E7E", borderRadius: 999, padding: "3px 12px" }}>buon viaggio</span></div>
          </section>
          <BottomNav
            active={this.state.navActive}
            moreOpen={this.state.moreOpen}
            onToggleMore={() => this.setState((s) => ({ moreOpen: !s.moreOpen }))}
            onClose={() => this.setState({ moreOpen: false })}
            extra={nav.filter((n) => !NAV_TABS.includes(n.href.slice(1)))}
            compact={this.state.navCompact}
            onExpand={() => this.setState({ navCompact: false })}
          />
        </div>

        {/* ===== VENUE DETAIL (shared) ===== */}
        {this.state.detail && (() => {
          const dl = this.state.detailList || [];
          const di = dl.indexOf(this.state.detail.id);
          return (
            <VenueDetail
              d={this.state.detail}
              onClose={this.closeDetail}
              onOpen={this.pushDetail}
              onBack={this.popDetail}
              canBack={(this.state.detailStack || []).length > 0}
              onPrev={di > 0 ? () => this.swipeDetail(-1) : undefined}
              onNext={di >= 0 && di < dl.length - 1 ? () => this.swipeDetail(1) : undefined}
              navPos={di >= 0 && dl.length > 1 ? { i: di + 1, n: dl.length } : null}
              isFav={favs.indexOf(this.state.detail.id) >= 0}
              onToggleFav={D.master[this.state.detail.id] ? (id) => this.toggleFav(id) : undefined}
              tripVisit={this.state.detail.kind === "trip" ? this.tripVisitOf(this.state.detail.id, this.state.detail.visit) : null}
              onTripLess={() => this.setTripVisit(this.state.detail.id, this.state.detail.visit, -30)}
              onTripMore={() => this.setTripVisit(this.state.detail.id, this.state.detail.visit, 30)}
            />
          );
        })()}

        {/* ===== SIM SHEET ===== */}
        {this.state.simOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(14,21,66,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => this.setState({ simOpen: false })}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, maxHeight: "calc(100vh - 32px)", overflowY: "auto", background: "#17142C", borderRadius: 20, padding: "18px 16px 22px", boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", color: "#FF2E7E" }}>Anteprima tempo</div><div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>Simula data e ora</div></div>
                <button onClick={() => this.setState({ simOpen: false })} style={{ cursor: "pointer", background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 999, fontSize: 16, fontWeight: 900 }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 9, marginBottom: 12 }}>
                <label style={{ flex: 1, fontSize: 11, fontWeight: 800, color: "#9d98c4" }}>Data<br /><input type="date" value={simDate} onChange={this.onSimDate} style={{ marginTop: 4, width: "100%", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#fff", background: "#211d3e", border: "1.5px solid #3a3560", borderRadius: 10, padding: 8 }} /></label>
                <label style={{ flex: "none", fontSize: 11, fontWeight: 800, color: "#9d98c4" }}>Ora<br /><input type="time" value={simTime} onChange={this.onSimTime} style={{ marginTop: 4, fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#fff", background: "#211d3e", border: "1.5px solid #3a3560", borderRadius: 10, padding: 8 }} /></label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                {simJumps.map((j, i) => (
                  <button key={i} onClick={j.onJump} style={{ cursor: "pointer", fontSize: 11.5, fontWeight: 800, color: "#fff", background: "rgba(255,255,255,.1)", border: "none", padding: "7px 11px", borderRadius: 999 }}>{j.label}</button>
                ))}
              </div>
              <button onClick={this.clearSim} style={{ cursor: "pointer", width: "100%", background: "#FFD23F", color: "#17142C", fontWeight: 900, fontSize: 14, padding: 12, border: "none", borderRadius: 999 }}>Torna all'ora reale</button>
              <div style={{ marginTop: 10, fontSize: 11, color: "#7a76a0", textAlign: "center", fontWeight: 600 }}>{this.state.sim ? "Simulazione attiva: " + simDate + " " + simTime : "Ora reale"}</div>
            </div>
          </div>
        )}

        {/* duplicate-add toast */}
        {this.state.dupWarn && (
          <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(env(safe-area-inset-bottom) + 16px)", display: "flex", justifyContent: "center", zIndex: 120, pointerEvents: "none" }}>
            <div style={{ maxWidth: 420, margin: "0 16px", background: "#0E1542", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "10px 14px", borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,.45)" }}>⚠ {this.state.dupWarn}</div>
          </div>
        )}

        {/* unified confirmation toast (copy / download / save) */}
        {this.state.toast && (
          <div style={{ position: "fixed", left: "50%", bottom: "calc(env(safe-area-inset-bottom) + 74px)", zIndex: 130, pointerEvents: "none", animation: "scoziaToastIn .2s ease-out", transform: "translateX(-50%)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 360, background: this.state.toast.ok ? "#14C08C" : "#E6482A", color: "#fff", fontSize: 13, fontWeight: 800, padding: "11px 16px", borderRadius: 999, boxShadow: "0 14px 34px rgba(0,0,0,.4)" }}>
              <span aria-hidden>{this.state.toast.ok ? "✓" : "⚠"}</span>
              <span>{this.state.toast.msg}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
}
