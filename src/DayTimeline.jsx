import React, { useState, useRef } from "react";

const HOUR_PX = 64; // px-per-hour scale for a tappa's minimum visual height
const MONO = "'Spline Sans Mono',monospace";

const pad = (n) => String(n).padStart(2, "0");
const fmt = (min) => pad(Math.floor(min / 60)) + ":" + pad(Math.round(min % 60));
const parseHHMM = (s) => {
  const m = String(s || "").match(/(\d{1,2}):(\d{2})/);
  return m ? +m[1] * 60 + +m[2] : null;
};

// small duration formatter
function durLbl(min) {
  if (!min) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  if (min >= 240) { const v = Math.round((min / 60) * 10) / 10; return (v % 1 ? v.toFixed(1) : v) + "h"; }
  return ((h ? h + "h " : "") + (m ? m + "′" : "")).trim() || "—";
}

// One day = a SEQUENCE of blocks, not a clock canvas. Every block's start/end
// is computed by the caller (App.jsx) from the day's own start time + the
// real travel gap since the previous block — there's no independent position
// to drag onto an arbitrary time, so overlaps and stray gaps can't happen.
// What you CAN do: drag the ⠿ handle to reorder, or tap a block's duration
// badge to open a slider + "fino alle" time picker underneath it — changing
// either reflows everyone after it, for free, since this is now a normal
// flow layout.
export default function DayTimeline({ events, flights, editable, nowMin, onReorder, onResize, onRemove, onSelect }) {
  const [editingIdx, setEditingIdx] = useState(null); // idx of the tappa whose duration editor is open
  const [dragReorder, setDragReorder] = useState(null); // { fromIdx, order }
  const ost = useRef(null);
  const cardH = useRef({});

  const beginReorder = (idx) => (ev) => {
    if (!editable) return;
    ev.preventDefault();
    ev.stopPropagation();
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) {}
    ost.current = { fromIdx: idx, order: events.map((_, i) => i), y0: ev.clientY };
    setDragReorder({ fromIdx: idx, order: ost.current.order.slice() });
  };
  const moveReorder = (ev) => {
    const st = ost.current;
    if (!st) return;
    ev.preventDefault();
    const dy = ev.clientY - st.y0;
    const pos = st.order.indexOf(st.fromIdx);
    if (dy > 0 && pos < st.order.length - 1) {
      const belowIdx = st.order[pos + 1];
      const belowH = (cardH.current[belowIdx] || 60) + 10;
      if (dy > belowH / 2) {
        st.order[pos] = st.order[pos + 1];
        st.order[pos + 1] = st.fromIdx;
        st.y0 = ev.clientY;
        setDragReorder({ fromIdx: st.fromIdx, order: st.order.slice() });
      }
    } else if (dy < 0 && pos > 0) {
      const aboveIdx = st.order[pos - 1];
      const aboveH = (cardH.current[aboveIdx] || 60) + 10;
      if (-dy > aboveH / 2) {
        st.order[pos] = st.order[pos - 1];
        st.order[pos - 1] = st.fromIdx;
        st.y0 = ev.clientY;
        setDragReorder({ fromIdx: st.fromIdx, order: st.order.slice() });
      }
    }
  };
  const upReorder = (ev) => {
    const st = ost.current;
    if (!st) return;
    ev.preventDefault();
    ost.current = null;
    setDragReorder(null);
    const toIdx = st.order.indexOf(st.fromIdx);
    if (toIdx !== st.fromIdx) onReorder(st.fromIdx, toIdx);
  };

  const TONES = {
    sec: { bg: "#FBE7CF", bd: "#e9c79a", txt: "#7a4a12", accent: "#C77D2E", icon: "🛂 " },
    gate: { bg: "#FFF3CC", bd: "#ecd58a", txt: "#7a5b00", accent: "#E0A92E", icon: "" },
    move: { bg: "#EDE7D7", bd: "#d8cdb2", txt: "#5b5644", accent: "#b9ac8d", icon: "" },
  };

  // A transfer gap as a slim inline chip between two cards — mode/time/cost,
  // tap to cycle mode where a switch is possible.
  const TransferChip = ({ t }) => {
    const canSwitch = !!(t.onMode && t.options && t.options.length > 1);
    const cycle = (ev) => {
      ev.stopPropagation();
      const opts = t.options;
      const i = Math.max(0, opts.findIndex((o) => o.mode === t.chosen));
      t.onMode(opts[(i + 1) % opts.length].mode);
    };
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "3px 4px 4px 22px", margin: "-2px 0" }}>
        <div style={{ flex: "none", width: 0, height: 14, marginTop: 3, borderLeft: "2px dashed #b9ac8d" }} />
        <div style={{ minWidth: 0 }}>
          <span
            onClick={canSwitch ? cycle : undefined}
            title={canSwitch ? "Tocca per cambiare mezzo" : undefined}
            style={{ display: "inline-block", fontSize: 10, fontWeight: 800, color: "#6b6450", background: canSwitch ? "#FFF6DD" : "transparent", borderRadius: 6, padding: canSwitch ? "1px 7px" : 0, cursor: canSwitch ? "pointer" : "default" }}
          >
            {t.icon} {t.primary} · {t.min}′{t.costLabel ? " · " + t.costLabel : ""}{canSwitch ? " ⇄" : ""}
          </span>
          {/* the fuller breakdown (mode split, station wait/boarding estimate,
              cheaper/faster alternative) — computed all along, now actually shown */}
          {t.sub && <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9a937c", marginTop: 1 }}>{t.sub}</div>}
        </div>
      </div>
    );
  };

  // Reorder into the LIVE drag order when a drag is in progress, so the DOM
  // already shows the swap as it happens.
  const order = dragReorder ? dragReorder.order : events.map((_, i) => i);
  const ordered = order.map((i) => events[i]);

  return (
    <div style={{ borderRadius: 12, border: "1px solid #E7DEC9", background: "#FCFAF3", padding: 8 }}>
      {flights.map((f, i) => {
        const t = f.tone === "flight" ? { bg: "#FBE4E0", bd: "#f3c4bb", txt: "#9c2a18", accent: f.accent || "#E6482A", icon: "✈ " } : TONES[f.tone] || TONES.move;
        return (
          <div key={"f" + i} style={{ background: t.bg, border: `1px solid ${t.bd}`, borderLeft: `4px solid ${t.accent}`, borderRadius: 9, padding: "7px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: t.txt }}>{t.icon}{f.label}</span>
              {f.timeLabel && <span style={{ fontSize: 10.5, fontWeight: 800, color: t.txt, opacity: 0.9, fontFamily: MONO, whiteSpace: "nowrap" }}>{f.timeLabel}</span>}
            </div>
            {f.sub && <div style={{ fontSize: 10.5, fontWeight: 600, color: t.txt, opacity: 0.85, marginTop: 2 }}>{f.sub}</div>}
          </div>
        );
      })}

      {typeof nowMin === "number" && events.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 6px" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#FF2E7E", flex: "none" }} />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#FF2E7E" }}>adesso {fmt(nowMin)}</span>
          <div style={{ flex: 1, height: 0, borderTop: "2px solid #FF2E7E", opacity: 0.35 }} />
        </div>
      )}

      {ordered.map((e, pos) => {
        const dur = e.dur;
        const start = e.startMin;
        const isReordering = dragReorder && dragReorder.fromIdx === e.idx;
        const isTripBlock = e.kind === "trip";
        const isVenueBlock = e.kind === "tvenue";
        const isEditingDur = editingIdx === e.idx;
        const durMax = isTripBlock ? 600 : 360;
        const minH = Math.max((e.dur / 60) * HOUR_PX * 0.4, 30); // a soft visual cue, not a hard clip
        return (
          <React.Fragment key={e.idx}>
            {e.lead && e.lead.min > 0 && <TransferChip t={e.lead} />}
            <div
              ref={(el) => { if (el) cardH.current[e.idx] = el.offsetHeight; }}
              onClick={() => { if (!editable && onSelect) onSelect(e.idx); }}
              style={{
                position: "relative", marginLeft: isVenueBlock ? 14 : 0, minHeight: minH,
                background: isTripBlock ? "#fff" : e.bg, border: isTripBlock ? `1.5px solid ${e.accent}` : "1px solid rgba(20,16,40,.05)",
                borderLeft: isVenueBlock ? `4px dashed ${e.accent}` : isTripBlock ? `5px solid ${e.accent}` : `5px solid ${e.accent}`,
                borderRadius: 10, overflow: "hidden", boxSizing: "border-box", marginBottom: 4,
                boxShadow: isReordering ? "0 10px 24px -8px rgba(0,0,0,.4)" : "none",
                zIndex: isReordering ? 10 : 1, cursor: editable ? "default" : "pointer",
                WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none",
                opacity: isReordering ? 0.92 : 1,
              }}
            >
              {isTripBlock && !editable && (
                <span style={{ position: "absolute", top: 0, right: 0, pointerEvents: "none", fontSize: 8.5, fontWeight: 900, letterSpacing: ".08em", color: "#fff", background: e.accent, borderRadius: "0 0 0 8px", padding: "2px 7px", zIndex: 3 }}>GITA</span>
              )}
              <div
                onPointerDown={beginReorder(e.idx)}
                onPointerMove={moveReorder}
                onPointerUp={upReorder}
                onPointerCancel={upReorder}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 7px 3px 9px", touchAction: editable ? "none" : "pan-y", cursor: editable ? "grab" : "pointer", WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
              >
                {editable && (
                  <span style={{ flex: "none", display: "grid", gridTemplateColumns: "2px 2px", gap: 2, opacity: 0.5 }} aria-hidden>
                    {Array.from({ length: 6 }).map((_, i) => (<span key={i} style={{ width: 2, height: 2, borderRadius: 2, background: "#17142C" }} />))}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: "#17142C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span>
                <span style={{ flex: "none", fontSize: 10.5, fontWeight: 700, color: "#6B6450", fontFamily: MONO }}>{fmt(start)}–{fmt(start + dur)}</span>
                {editable && (
                  <button onClick={(ev) => { ev.stopPropagation(); onRemove(e.idx); }} onPointerDown={(ev) => ev.stopPropagation()} title="Rimuovi" style={{ flex: "none", cursor: "pointer", border: "none", background: "transparent", color: "#E6482A", fontSize: 14, fontWeight: 900, lineHeight: 1, padding: "0 2px" }}>×</button>
                )}
              </div>
              <div style={{ padding: "0 9px 7px 9px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase", color: "#fff", background: e.accent, borderRadius: 999, padding: "1px 6px" }}>{e.kindLabel}</span>
                  {editable && !e.durLocked ? (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); setEditingIdx(isEditingDur ? null : e.idx); }}
                      onPointerDown={(ev) => ev.stopPropagation()}
                      style={{ cursor: "pointer", fontSize: 10, fontWeight: 800, color: isEditingDur ? "#fff" : e.accent, background: isEditingDur ? e.accent : "transparent", border: `1.5px solid ${e.accent}`, borderRadius: 999, padding: "1px 8px" }}
                    >
                      {durLbl(dur)}{isTripBlock ? " sul posto" : ""} ✎
                    </button>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#6B6450" }}>{durLbl(dur)}{isTripBlock ? " sul posto" : ""}{e.durLocked ? " · dalle venue" : ""}</span>
                  )}
                  {e.maps && <a href={e.maps} target="_blank" rel="noopener" onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => ev.stopPropagation()} style={{ fontSize: 10, fontWeight: 800, color: "#0E1542", textDecoration: "none", background: "#FFD23F", borderRadius: 6, padding: "1px 7px" }}>Maps ↗</a>}
                  {!editable && <span style={{ fontSize: 9.5, fontWeight: 800, color: "#9a937c" }}>tocca per i dettagli ›</span>}
                </div>
                {!isTripBlock && e.note && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: "#6B6450", lineHeight: 1.35 }}>{e.note}</div>}
                {e.warn && <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 700, color: "#E6482A" }}>⚠ {e.warn}</div>}
                {/* duration editor — appears/disappears below the block
                    (replaces the old drag-a-thin-bar gesture, which fought
                    with the page's own vertical scroll). Horizontal slider +
                    steppers, or type the end time directly. */}
                {isEditingDur && (
                  <div style={{ marginTop: 8, padding: "9px 10px", background: "rgba(20,16,40,.04)", borderRadius: 10 }} onClick={(ev) => ev.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => onResize(e.idx, Math.max(15, dur - 15))} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#17142C", background: "#fff", border: "1.5px solid #D9CFB7", borderRadius: 999, padding: "4px 9px", flex: "none" }}>−15′</button>
                      <input
                        type="range" min={15} max={durMax} step={15} value={Math.min(dur, durMax)}
                        onChange={(ev) => onResize(e.idx, Number(ev.target.value))}
                        style={{ flex: 1, accentColor: e.accent }}
                      />
                      <button onClick={() => onResize(e.idx, Math.min(durMax, dur + 15))} style={{ cursor: "pointer", fontSize: 12, fontWeight: 900, color: "#17142C", background: "#fff", border: "1.5px solid #D9CFB7", borderRadius: 999, padding: "4px 9px", flex: "none" }}>+15′</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 9 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6450" }}>Fino alle</span>
                      <input
                        type="time" value={fmt(start + dur)}
                        onChange={(ev) => {
                          const endMin = parseHHMM(ev.target.value);
                          if (endMin == null) return;
                          let d = endMin - start;
                          if (d <= 0) d += 24 * 60;
                          onResize(e.idx, Math.max(15, Math.min(durMax, d)));
                        }}
                        style={{ fontSize: 12.5, fontWeight: 800, color: "#17142C", background: "#fff", border: "1.5px solid #D9CFB7", borderRadius: 8, padding: "5px 8px", fontFamily: MONO }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {e.tail && e.tail.min > 0 && <TransferChip t={e.tail} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
