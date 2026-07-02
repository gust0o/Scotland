import React, { useState, useRef, useEffect } from "react";

const HOUR_PX = 64; // height of one hour (full 0–24 ≈ two phone screens of scroll)
const GUTTER = 46; // left hour-label gutter
const SNAP = 5; // minutes
const DAY_MIN = 24 * 60;

const pad = (n) => String(n).padStart(2, "0");
const fmt = (min) => pad(Math.floor(min / 60)) + ":" + pad(Math.round(min % 60));

// Full-day (00:00–24:00) calendar for one day, in a screen-height scroll box.
// Events are positioned by start and sized by duration; day trips also render
// their travel time as transfer blocks before/after the visit. Drag the top
// handle to move, the bottom handle to change duration (touch-friendly).
export default function DayTimeline({ events, flights, editable, nowMin, onChangeStart, onResize, onRemove, onSelect }) {
  const [drag, setDrag] = useState(null); // { idx, mode, start, dur }
  const st = useRef(null);
  const scroller = useRef(null);

  const height = DAY_MIN / 60 * HOUR_PX;
  const yOf = (min) => (min / 60) * HOUR_PX;

  // Auto-scroll to the earliest content (minus a little headroom) on first paint.
  useEffect(() => {
    if (!scroller.current) return;
    const all = [
      ...events.map((e) => e.startMin - (e.lead ? e.lead.min : 0)),
      ...flights.map((f) => f.startMin),
    ];
    const earliest = all.length ? Math.max(0, Math.min(...all) - 40) : (typeof nowMin === "number" ? Math.max(0, nowMin - 60) : 8 * 60);
    scroller.current.scrollTop = yOf(earliest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hours = [];
  for (let h = 0; h <= 24; h++) hours.push(h);

  const begin = (idx, mode, start, dur) => (ev) => {
    if (!editable) return;
    ev.preventDefault();
    ev.stopPropagation();
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) {}
    st.current = { idx, mode, start, dur, y0: ev.clientY };
    setDrag({ idx, mode, start, dur });
  };
  const move = (ev) => {
    if (!st.current) return;
    ev.preventDefault();
    const dMin = ((ev.clientY - st.current.y0) / HOUR_PX) * 60;
    if (st.current.mode === "move") {
      let s = Math.round((st.current.start + dMin) / SNAP) * SNAP;
      s = Math.max(0, Math.min(DAY_MIN - st.current.dur, s));
      setDrag({ ...st.current, start: s });
    } else {
      let dur = Math.round((st.current.dur + dMin) / SNAP) * SNAP;
      dur = Math.max(15, Math.min(DAY_MIN - st.current.start, dur));
      setDrag({ ...st.current, dur });
    }
  };
  const up = (ev) => {
    if (!st.current) return;
    ev.preventDefault();
    const cur = drag || st.current;
    const { idx, mode } = st.current;
    st.current = null;
    setDrag(null);
    if (mode === "move") onChangeStart(idx, cur.start);
    else onResize(idx, cur.dur);
  };

  const TONES = {
    sec: { bg: "#FBE7CF", bd: "#e9c79a", txt: "#7a4a12", accent: "#C77D2E", icon: "🛂 " },
    gate: { bg: "#FFF3CC", bd: "#ecd58a", txt: "#7a5b00", accent: "#E0A92E", icon: "" },
    move: { bg: "#EDE7D7", bd: "#d8cdb2", txt: "#5b5644", accent: "#b9ac8d", icon: "" },
  };

  // Render a transfer (incoming `lead` / outgoing `tail`) as a VERTICAL dashed
  // connector that links one activity to the next, with the transport icon on
  // the line. `up` runs from the activity's top upward (toward the previous
  // stop); `down` runs from its bottom downward. A floating chip beside the line
  // shows the mode/time/cost — more detail the longer the gap.
  const transferEl = (t, anchorMin, dir, leftPx, isDrag) => {
    const pxH = (t.min / 60) * HOUR_PX;
    const lineH = Math.max(pxH, 16); // keep the connector visible even when tiny
    const topPx = dir === "up" ? yOf(anchorMin) - lineH : yOf(anchorMin);
    const x = leftPx + 15; // sits just inside the block's left edge
    const z = isDrag ? 9 : 3;
    // Chip detail scales with the available vertical room.
    const canSwitch = !!(t.onMode && t.options && t.options.length > 1);
    const sw = canSwitch ? " ⇄" : "";
    let chip;
    if (lineH >= 46) chip = t.icon + " " + t.primary + " · " + t.min + "′" + (t.costLabel ? " · " + t.costLabel : "") + sw;
    else if (lineH >= 26) chip = t.icon + " " + t.min + "′" + (t.costLabel ? " · " + t.costLabel : "") + sw;
    else chip = t.icon + " " + t.min + "′" + sw;
    // Tap the chip to cycle to the next mode (a piedi ↔ bus ↔ Uber).
    const cycle = (ev) => {
      ev.stopPropagation();
      const opts = t.options;
      const i = Math.max(0, opts.findIndex((o) => o.mode === t.chosen));
      t.onMode(opts[(i + 1) % opts.length].mode);
    };
    return (
      <div style={{ position: "absolute", top: topPx, left: x, height: lineH, width: 0, borderLeft: "2px dashed #b9ac8d", zIndex: z }}>
        <span
          onClick={canSwitch ? cycle : undefined}
          onPointerDown={canSwitch ? (e) => e.stopPropagation() : undefined}
          title={canSwitch ? "Tocca per cambiare mezzo" : undefined}
          style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", whiteSpace: "nowrap", background: canSwitch ? "#FFF6DD" : "#FCFAF3", padding: "1px 6px", borderRadius: 6, boxShadow: "0 0 0 1px " + (canSwitch ? "#E7C766" : "#E7DEC9"), fontSize: 9.5, fontWeight: 800, color: "#6b6450", cursor: canSwitch ? "pointer" : "default" }}
        >{chip}</span>
      </div>
    );
  };

  return (
    <div ref={scroller} style={{ position: "relative", marginTop: 6, maxHeight: "70vh", overflowY: "auto", overscrollBehavior: "contain", borderRadius: 12, border: "1px solid #E7DEC9", background: "#FCFAF3" }}>
      <div style={{ position: "relative", height }}>
        {/* hour grid */}
        {hours.map((h) => (
          <div key={h} style={{ position: "absolute", top: yOf(h * 60), left: 0, right: 0, height: 1, borderTop: "1px solid #EFE7D3" }}>
            <span style={{ position: "absolute", top: -7, left: 6, fontSize: 10, fontWeight: 700, color: "#b3a98c", fontFamily: "'Spline Sans Mono',monospace" }}>{pad(h)}:00</span>
          </div>
        ))}

        {/* now line */}
        {typeof nowMin === "number" && (
          <div style={{ position: "absolute", top: yOf(nowMin), left: GUTTER - 4, right: 4, height: 0, borderTop: "2px solid #FF2E7E", zIndex: 6 }}>
            <span style={{ position: "absolute", left: -6, top: -4, width: 8, height: 8, borderRadius: 999, background: "#FF2E7E" }} />
          </div>
        )}

        {/* fixed blocks: flight + transfers + gate/security */}
        {flights.map((f, i) => {
          const top = yOf(f.startMin);
          const h = Math.max(yOf(f.endMin) - top, 26);
          const t = f.tone === "flight" ? { bg: "#FBE4E0", bd: "#f3c4bb", txt: "#9c2a18", accent: f.accent || "#E6482A", icon: "✈ " } : TONES[f.tone] || TONES.move;
          return (
            <div key={"f" + i} style={{ position: "absolute", top, left: GUTTER, right: 4, height: h, background: t.bg, border: `1px solid ${t.bd}`, borderLeft: `4px solid ${t.accent}`, borderRadius: 9, padding: "4px 8px", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: t.txt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.icon}{f.label}</div>
              {f.sub && h > 46 && <div style={{ fontSize: 10, fontWeight: 600, color: t.txt, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.sub}</div>}
              {f.timeLabel && h > 30 && <div style={{ fontSize: 10, fontWeight: 700, color: t.txt, opacity: 0.9, fontFamily: "'Spline Sans Mono',monospace" }}>{f.timeLabel}</div>}
            </div>
          );
        })}

        {/* events */}
        {events.map((e) => {
          const isDrag = drag && drag.idx === e.idx;
          const start = isDrag ? drag.start : e.startMin;
          const dur = isDrag ? (drag.mode === "resize" ? drag.dur : e.dur) : e.dur;
          const top = yOf(start);
          const h = Math.max((dur / 60) * HOUR_PX, 30);
          const isTripBlock = e.kind === "trip";
          const isVenueBlock = e.kind === "tvenue";
          const leftPx = GUTTER + (isVenueBlock ? 16 : 0);
          return (
            <React.Fragment key={e.idx}>
              {/* incoming transfer (Andata, chained hop, hotel→, or city walk/bus) */}
              {e.lead && e.lead.min > 0 && transferEl(e.lead, start, "up", leftPx, isDrag)}
              {/* outgoing transfer (Ritorno to Edinburgh / back to the hotel) */}
              {e.tail && e.tail.min > 0 && transferEl(e.tail, start + dur, "down", leftPx, isDrag)}
              {isTripBlock ? (
                <>
                  {/* A gita is a SPAN, not a card: a thin colored spine marks how
                      long you're out for, and a small header pill (auto height,
                      not stretched over the whole visit) carries the name/
                      actions — so any venues placed inside its time range stay
                      fully legible instead of sitting on top of a filled box. */}
                  <div style={{ position: "absolute", top, left: leftPx, width: 4, height: h, background: e.accent, borderRadius: 3, pointerEvents: "none", zIndex: 1 }} />
                  <div
                    onClick={() => { if (!editable && onSelect) onSelect(e.idx); }}
                    style={{ position: "absolute", top, left: leftPx + 10, right: 4, background: "#fff", border: `1px solid ${e.accent}`, borderRadius: 10, overflow: "hidden", boxSizing: "border-box", boxShadow: isDrag ? "0 10px 24px -8px rgba(0,0,0,.4)" : "0 2px 7px -2px rgba(20,16,40,.18)", zIndex: isDrag ? 10 : 2, cursor: editable ? "default" : "pointer" }}
                  >
                    {!editable && (
                      <span style={{ position: "absolute", top: 0, right: 0, pointerEvents: "none", fontSize: 8.5, fontWeight: 900, letterSpacing: ".08em", color: "#fff", background: e.accent, borderRadius: "0 0 0 8px", padding: "2px 7px", zIndex: 3 }}>GITA</span>
                    )}
                    <div
                      onPointerDown={begin(e.idx, "move", e.startMin, e.dur)}
                      onPointerMove={move}
                      onPointerUp={up}
                      onPointerCancel={up}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 7px 3px 9px", touchAction: editable ? "none" : "pan-y", cursor: editable ? "grab" : "pointer", userSelect: "none" }}
                    >
                      {editable && (
                        <span style={{ flex: "none", display: "grid", gridTemplateColumns: "2px 2px", gap: 2, opacity: 0.5 }} aria-hidden>
                          {Array.from({ length: 6 }).map((_, i) => (<span key={i} style={{ width: 2, height: 2, borderRadius: 2, background: "#17142C" }} />))}
                        </span>
                      )}
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: "#17142C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span>
                      <span style={{ flex: "none", fontSize: 10.5, fontWeight: 700, color: "#6B6450", fontFamily: "'Spline Sans Mono',monospace" }}>{fmt(start)}</span>
                      {editable && (
                        <button onClick={(ev) => { ev.stopPropagation(); onRemove(e.idx); }} onPointerDown={(ev) => ev.stopPropagation()} title="Rimuovi" style={{ flex: "none", cursor: "pointer", border: "none", background: "transparent", color: "#E6482A", fontSize: 14, fontWeight: 900, lineHeight: 1, padding: "0 2px" }}>×</button>
                      )}
                    </div>
                    <div style={{ padding: "0 9px 6px 9px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase", color: "#fff", background: e.accent, borderRadius: 999, padding: "1px 6px" }}>{e.kindLabel}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#6B6450" }}>{this_durLabel(dur)} sul posto</span>
                        {e.maps && <a href={e.maps} target="_blank" rel="noopener" onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => ev.stopPropagation()} style={{ fontSize: 10, fontWeight: 800, color: "#0E1542", textDecoration: "none", background: "#FFD23F", borderRadius: 6, padding: "1px 7px" }}>Maps ↗</a>}
                        {!editable && <span style={{ fontSize: 9.5, fontWeight: 800, color: "#9a937c" }}>tocca per i dettagli ›</span>}
                      </div>
                      {e.warn && <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 700, color: "#E6482A" }}>⚠ {e.warn}</div>}
                    </div>
                  </div>
                  {/* resize handle sits at the bottom of the SPINE (the real end
                      of the visit), independent of the pill's own small height */}
                  {editable && (
                    <div
                      onPointerDown={begin(e.idx, "resize", e.startMin, e.dur)}
                      onPointerMove={move}
                      onPointerUp={up}
                      onPointerCancel={up}
                      onClick={(ev) => ev.stopPropagation()}
                      title="Trascina per la durata"
                      style={{ position: "absolute", top: top + h - 14, left: leftPx, right: 4, height: 14, cursor: "ns-resize", touchAction: "none", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2, zIndex: 2 }}
                    >
                      <span style={{ width: 26, height: 3, borderRadius: 3, background: e.accent, opacity: 0.55 }} />
                    </div>
                  )}
                </>
              ) : (
                <div
                  onClick={() => { if (!editable && onSelect) onSelect(e.idx); }}
                  style={{ position: "absolute", top, left: leftPx, right: 4, height: h, background: e.bg, border: "1px solid rgba(20,16,40,.05)", borderLeft: isVenueBlock ? `4px dashed ${e.accent}` : `5px solid ${e.accent}`, borderRadius: 10, overflow: "hidden", boxSizing: "border-box", boxShadow: isDrag ? "0 10px 24px -8px rgba(0,0,0,.4)" : "none", zIndex: isDrag ? 10 : 2, cursor: editable ? "default" : "pointer" }}
                >
                  {/* drag-to-move header (drag only in edit mode; tap opens detail in consult) */}
                  <div
                    onPointerDown={begin(e.idx, "move", e.startMin, e.dur)}
                    onPointerMove={move}
                    onPointerUp={up}
                    onPointerCancel={up}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 7px 3px 9px", touchAction: editable ? "none" : "pan-y", cursor: editable ? "grab" : "pointer", userSelect: "none" }}
                  >
                    {editable && (
                      <span style={{ flex: "none", display: "grid", gridTemplateColumns: "2px 2px", gap: 2, opacity: 0.5 }} aria-hidden>
                        {Array.from({ length: 6 }).map((_, i) => (<span key={i} style={{ width: 2, height: 2, borderRadius: 2, background: "#17142C" }} />))}
                      </span>
                    )}
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: "#17142C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span>
                    <span style={{ flex: "none", fontSize: 10.5, fontWeight: 700, color: "#6B6450", fontFamily: "'Spline Sans Mono',monospace" }}>{fmt(start)}</span>
                    {editable && (
                      <button onClick={(ev) => { ev.stopPropagation(); onRemove(e.idx); }} onPointerDown={(ev) => ev.stopPropagation()} title="Rimuovi" style={{ flex: "none", cursor: "pointer", border: "none", background: "transparent", color: "#E6482A", fontSize: 14, fontWeight: 900, lineHeight: 1, padding: "0 2px" }}>×</button>
                    )}
                  </div>
                  {h > 48 && (
                    <div style={{ padding: "0 9px 6px 9px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase", color: "#fff", background: e.accent, borderRadius: 999, padding: "1px 6px" }}>{e.kindLabel}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#6B6450" }}>{this_durLabel(dur)}</span>
                        {e.maps && <a href={e.maps} target="_blank" rel="noopener" onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => ev.stopPropagation()} style={{ fontSize: 10, fontWeight: 800, color: "#0E1542", textDecoration: "none", background: "#FFD23F", borderRadius: 6, padding: "1px 7px" }}>Maps ↗</a>}
                        {!editable && <span style={{ fontSize: 9.5, fontWeight: 800, color: "#9a937c" }}>tocca per i dettagli ›</span>}
                      </div>
                      {e.note && h > 76 && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: "#6B6450", lineHeight: 1.35, overflow: "hidden" }}>{e.note}</div>}
                      {e.warn && <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 700, color: "#E6482A" }}>⚠ {e.warn}</div>}
                    </div>
                  )}
                  {/* drag-to-resize handle */}
                  {editable && (
                    <div
                      onPointerDown={begin(e.idx, "resize", e.startMin, e.dur)}
                      onPointerMove={move}
                      onPointerUp={up}
                      onPointerCancel={up}
                      onClick={(ev) => ev.stopPropagation()}
                      title="Trascina per la durata"
                      style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, cursor: "ns-resize", touchAction: "none", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2 }}
                    >
                      <span style={{ width: 26, height: 3, borderRadius: 3, background: e.accent, opacity: 0.55 }} />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// small duration formatter (kept local to avoid prop drilling)
function this_durLabel(min) {
  if (!min) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  if (min >= 240) { const v = Math.round((min / 60) * 10) / 10; return (v % 1 ? v.toFixed(1) : v) + "h"; }
  return ((h ? h + "h " : "") + (m ? m + "′" : "")).trim() || "—";
}
