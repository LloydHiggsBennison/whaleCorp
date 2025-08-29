// RaidsAll.jsx
import React from "react";

// ==== API base dinámica (Vercel/Local) ====
const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");
const API_BASE = API_ORIGIN;

// ---- Helpers: orden y fechas (mismos que HomePage) ----
const SPECIAL_TAIL = new Set(["bard", "paladin", "artist", "valkyrie"]);
const isTailClass = (clsName) =>
  typeof clsName === "string" && SPECIAL_TAIL.has(clsName?.trim().toLowerCase());

const sortTeam = (arr = []) => {
  const withIndex = arr.map((c, i) => ({ c, i }));
  withIndex.sort((a, b) => {
    const aIsTail = isTailClass(a.c?.class?.name);
    const bIsTail = isTailClass(b.c?.class?.name);
    if (aIsTail !== bIsTail) return aIsTail ? 1 : -1;
    return a.i - b.i;
  });
  return withIndex.map((x) => x.c);
};

const mmddRe = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ymdRe = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// ⬇️ NUEVO: días en inglés (como en la captura)
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ⬇️ Actualizado: devuelve "MM-DD Friday"
const formatDayMonth = (value) => {
  if (!value) return "Fecha no asignada";
  const s = String(value).trim();

  // Si ya viene "MM-DD"
  if (mmddRe.test(s)) {
    const [m, d] = s.split("-").map((x) => parseInt(x, 10));
    const year = new Date().getFullYear();
    const dt = new Date(year, m - 1, d);
    if (!isNaN(dt)) {
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      return `${mm}-${dd} ${WEEKDAYS[dt.getDay()]}`;
    }
    return s;
  }

  // "yyyy-mm-dd"
  const ymd = s.match(ymdRe);
  if (ymd) {
    const [ , y, m, d ] = ymd;
    const dt = new Date(parseInt(y,10), parseInt(m,10) - 1, parseInt(d,10));
    if (!isNaN(dt)) {
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${mm}-${dd} ${WEEKDAYS[dt.getDay()]}`;
    }
    return `${m}-${d}`;
  }

  // Cualquier fecha parseable por Date (incluye ISO)
  const dfree = new Date(s);
  if (!isNaN(dfree)) {
    const mm = String(dfree.getMonth() + 1).padStart(2, "0");
    const dd = String(dfree.getDate()).padStart(2, "0");
    return `${mm}-${dd} ${WEEKDAYS[dfree.getDay()]}`;
  }

  return s;
};

const minutesFromTime = (timeStr) => {
  if (!timeStr) return Number.POSITIVE_INFINITY;
  const s = String(timeStr).trim();
  let m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  m = s.match(/^(\d{3,4})$/);
  if (m) {
    const raw = m[1];
    const hh = parseInt(raw.length === 3 ? raw.slice(0, 1) : raw.slice(0, 2), 10);
    const mm = parseInt(raw.length === 3 ? raw.slice(1) : raw.slice(2), 10);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return hh * 60 + mm;
  }
  m = s.match(/^([01]?\d|2[0-3])$/);
  if (m) return parseInt(m[1], 10) * 60;
  return Number.POSITIVE_INFINITY;
};

const dateKeyFromDate = (dateStr) => {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const s = String(dateStr).trim();
  if (mmddRe.test(s)) {
    const [m, d] = s.split("-");
    return parseInt(`${m}${d}`, 10);
  }
  const ymd = s.match(ymdRe);
  if (ymd) {
    const [, , m, d] = ymd;
    return parseInt(`${m}${d}`, 10);
  }
  const d = new Date(s);
  if (!isNaN(d)) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return parseInt(`${mm}${dd}`, 10);
  }
  return Number.POSITIVE_INFINITY;
};

const dateFromCard = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const now = new Date();
  let y = now.getFullYear(), m, d;
  if (mmddRe.test(dateStr)) {
    const [mm, dd] = dateStr.split("-").map((x) => parseInt(x, 10));
    m = mm; d = dd;
  } else {
    const ymd = dateStr.match(ymdRe);
    if (ymd) {
      y = parseInt(ymd[1], 10);
      m = parseInt(ymd[2], 10);
      d = parseInt(ymd[3], 10);
    } else {
      const free = new Date(dateStr);
      if (isNaN(free)) return null;
      y = free.getFullYear();
      m = free.getMonth() + 1;
      d = free.getDate();
    }
  }
  let hh = 0, mm = 0;
  if (typeof timeStr === "string" && timeStr.trim()) {
    const s = timeStr.trim();
    let m1 = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (m1) { hh = parseInt(m1[1], 10); mm = parseInt(m1[2], 10); }
    else {
      m1 = s.match(/^(\d{3,4})$/);
      if (m1) {
        const raw = m1[1];
        hh = parseInt(raw.length === 3 ? raw.slice(0, 1) : raw.slice(0, 2), 10);
        mm = parseInt(raw.length === 3 ? raw.slice(1) : raw.slice(2), 10);
      } else {
        m1 = s.match(/^([01]?\d|2[0-3])$/);
        if (m1) hh = parseInt(m1[1], 10);
      }
    }
  }
  const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
  return isNaN(dt) ? null : dt;
};

const getCardStatus = (card, nowTs) => {
  const start = dateFromCard(card?.date, card?.time);
  if (!start) return "upcoming";
  const startTs = start.getTime();
  const endTs = startTs + 60 * 60 * 1000;
  if (nowTs >= endTs) return "expired";
  if (nowTs >= startTs) return "live";
  return "upcoming";
};

const CharItem = React.memo(function CharItem({ char }) {
  if (!char) return null;
  return (
    <div style={{
      padding: 10, backgroundColor: "#e0e0e0", display: "flex",
      flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center"
    }}>
      {char?.class?.image ? (
        <img src={char.class.image} alt={char.class?.name || "Clase"}
             width={32} height={32}
             style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
             loading="lazy" decoding="async" />
      ) : (
        <div aria-hidden style={{
          width: 32, height: 32, borderRadius: 8, background: "#e5e7eb",
          display: "grid", placeItems: "center", fontSize: 12, color: "#6b7280"
        }}>?</div>
      )}
      <div style={{
        fontWeight: 700, fontSize: 13, color: "#0f172a",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%"
      }}>
        {char?.name}
      </div>
    </div>
  );
});

export default function RaidsAll() {
  const [cards, setCards] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let aborter = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/data`, { signal: aborter.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const next = Array.isArray(json.cards) ? json.cards : [];
        // Orden por fecha/hora ascendente
        next.sort((a, b) => {
          const da = dateKeyFromDate(a?.date);
          const db = dateKeyFromDate(b?.date);
          if (da !== db) return da - db;
          const ta = minutesFromTime(a?.time);
          const tb = minutesFromTime(b?.time);
          if (ta !== tb) return ta - tb;
          return (a?.title || "").localeCompare(b?.title || "");
        });
        setCards(next);
        setErr("");
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
    return () => aborter.abort();
  }, []);

  const nowTs = Date.now();
  const upcomingOrLive = cards.filter((c) => getCardStatus(c, nowTs) !== "expired");

  return (
    <div style={{ maxWidth: 1600, margin: "20px auto", padding: 20 }}>
      <style>{`
        .grid-4 { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 20px; 
        }
        @media (max-width: 1200px) { 
          .grid-4 { grid-template-columns: repeat(2, 1fr); } 
        }
        @media (max-width: 720px)  { 
          .grid-4 { grid-template-columns: 1fr; } 
        }

        @keyframes whaleGlowPulse {
          0% { box-shadow: 0 0 0 0 rgba(30,136,229,0.35), 0 0 24px rgba(30,136,229,0.45); }
          50% { box-shadow: 0 0 0 6px rgba(30,136,229,0.12), 0 0 36px rgba(30,136,229,0.65); }
          100% { box-shadow: 0 0 0 0 rgba(30,136,229,0.35), 0 0 24px rgba(30,136,229,0.45); }
        }
        .whale-glow { animation: whaleGlowPulse 1.6s ease-in-out infinite; border-radius: 14px; }
      `}</style>

      <h1 style={{ color: "#7A5DC7", marginBottom: 18, textAlign: "center" }}>All Raids</h1>

      {loading ? (
        <p style={{ color: "#95a5a6" }}>Loading raids…</p>
      ) : err ? (
        <p style={{ color: "#e74c3c" }}>Error: {err}</p>
      ) : upcomingOrLive.length === 0 ? (
        <p style={{ color: "#000080" }}>No upcoming raids.</p>
      ) : (
        <div className="grid-4">
          {upcomingOrLive.map((card, idx) => {
            const status = getCardStatus(card, nowTs);
            const isLive = status === "live";

            const team1Raw = Array.isArray(card.team1)
              ? card.team1
              : Array.isArray(card.characters)
              ? card.characters.slice(0, 4)
              : [];
            const team2Raw = Array.isArray(card.team2)
              ? card.team2
              : Array.isArray(card.characters)
              ? card.characters.slice(4, 8)
              : [];

            const team1 = sortTeam(team1Raw).slice(0, 4);
            const team2 = sortTeam(team2Raw).slice(0, 4);
            const hasAny = team1.length + team2.length > 0;

            return (
              <div
                key={idx}
                className={isLive ? "whale-glow" : ""}
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: isLive
                    ? "0 0 0 0 rgba(30,136,229,0.35), 0 0 24px rgba(30,136,229,0.55)"
                    : "0 10px 20px rgba(0,0,0,0.08)",
                  backgroundColor: "#e0e0e0",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div
                  style={{
                    padding: "16px 18px",
                    background: "linear-gradient(145deg, #6a0dad, #32cd32)",
                    borderBottom: "1px solid #bbdefb"
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: "#e0e0e0",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                    title={card.title}
                  >
                    {card.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "#e0e0e0",
                      marginTop: 6,
                      fontWeight: 600
                    }}
                  >
                    <span>{card.date ? formatDayMonth(card.date) : "Date not asigned"}</span>
                    <span>{card.time || "Time not asigned"}</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px 16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14
                  }}
                >
                  {!hasAny ? (
                    <p
                      style={{
                        color: "#7A5DC7",
                        textAlign: "center",
                        padding: "22px 0",
                        gridColumn: "1 / -1",
                        fontWeight: 500,
                        fontStyle: "italic",
                        margin: 0
                      }}
                    >
                      Card pending assignment
                    </p>
                  ) : (
                    <>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8
                          }}
                        >
                          <strong style={{ color: "#7A5DC7" }}>Party 1</strong>
                          <span style={{ fontSize: 12, color: "#7A5DC7" }}>
                            {team1.length}/4
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateRows: "repeat(4, minmax(0, auto))",
                            gap: 8
                          }}
                        >
                          {team1.map((ch, i) => (
                            <CharItem key={`t1-${i}-${ch?.name || i}`} char={ch} />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8
                          }}
                        >
                          <strong style={{ color: "#7A5DC7" }}>Party 2</strong>
                          <span style={{ fontSize: 12, color: "#7A5DC7" }}>
                            {team2.length}/4
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateRows: "repeat(4, minmax(0, auto))",
                            gap: 8
                          }}
                        >
                          {team2.map((ch, i) => (
                            <CharItem key={`t2-${i}-${ch?.name || i}`} char={ch} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
