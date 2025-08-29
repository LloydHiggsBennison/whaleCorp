// HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import RegisteredUsersPanel from "./RegisteredUsersPanel";

const StreamingsLazy = React.lazy(() => import("./Streamings"));

// ==== API base dinámica (Vercel/Local) ====
const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");
const API_BASE = API_ORIGIN; 

// ---- Helpers: orden y fechas ----
const SPECIAL_TAIL = new Set(["bard", "paladin", "artist", "valkyrie"]);
const isTailClass = (clsName) =>
  typeof clsName === "string" && SPECIAL_TAIL.has(clsName.trim().toLowerCase());

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

// ⬇️ NUEVO: días en inglés (como en tu captura)
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ⬇️ Actualizado: devuelve "MM-DD Friday"
const formatDayMonth = (value) => {
  if (!value) return "Fecha no asignada";
  const s = String(value).trim();

  // "MM-DD"
  if (mmddRe.test(s)) {
    const [mStr, dStr] = s.split("-");
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    const year = new Date().getFullYear();
    const dt = new Date(year, m - 1, d);
    if (!isNaN(dt)) {
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      return `${mm}-${dd} ${WEEKDAYS[dt.getDay()]}`;
    }
    return `${mStr.padStart(2,"0")}-${dStr.padStart(2,"0")}`;
  }

  // "yyyy-mm-dd"
  const ymd = s.match(ymdRe);
  if (ymd) {
    const [, y, m, d] = ymd;
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

// 🚨 Probe SIEMPRE montado (off-screen): detecta si hay al menos 1 LIVE
function StreamsProbe({ onHasLiveChange }) {
  return (
    <React.Suspense fallback={null}>
      <StreamingsLazy
        pollIntervalMs={60000}
        cardWidth={220}
        probeEndpoint={`${API_BASE}/api/stream/live-status`}
        onLiveCountChange={(count) => onHasLiveChange?.(count > 0)}
      />
    </React.Suspense>
  );
}

const CharItem = React.memo(function CharItem({ char }) {
  if (!char) return null;
  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#e0e0e0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        textAlign: "center",
        contentVisibility: "auto",
        containIntrinsicSize: "60px",
      }}
      title={char.name}
    >
      {char.class?.image ? (
        <img
          src={char.class.image}
          alt={char.class?.name || "Clase"}
          width={32}
          height={32}
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#e5e7eb",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          ?
        </div>
      )}

      <div
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "#0f172a",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {char.name}
      </div>
    </div>
  );
});

// ===================== HomePage ======================
export default function HomePage({ cards = [], loading, error }) {
  const [nowTs, setNowTs] = React.useState(() => Date.now());
  const [hasLive, setHasLive] = React.useState(false);

  // Estado local
  const [dataCards, setDataCards] = React.useState(cards);
  const [allCharacters, setAllCharacters] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(!!loading);
  const [errMsg, setErrMsg] = React.useState(error || "");

  // Sync props
  React.useEffect(() => {
    if (Array.isArray(cards) && cards.length) setDataCards(cards);
    if (typeof loading === "boolean") setIsLoading(loading);
    if (error) setErrMsg(error);

    if (Array.isArray(cards)) {
      const pool = [];
      cards.forEach((c) => {
        const arr = Array.isArray(c?.characters)
          ? c.characters
          : [...(c?.team1 || []), ...(c?.team2 || [])];
        pool.push(...arr);
      });
      const seen = new Set();
      const uniq = [];
      pool.forEach((ch) => {
        const k = (ch?.name || "").toLowerCase().trim();
        if (k && !seen.has(k)) { seen.add(k); uniq.push(ch); }
      });
      if (uniq.length) setAllCharacters(uniq);
    }
  }, [cards, loading, error]);

  // reloj local
  React.useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // polling datos
  React.useEffect(() => {
    let aborter = new AbortController();
    const load = async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const res = await fetch(`${API_BASE}/api/data`, { signal: aborter.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const nextCards = Array.isArray(json.cards) ? json.cards : [];
        setDataCards(nextCards);

        const apiChars =
          Array.isArray(json.allCharacters) ? json.allCharacters :
          Array.isArray(json.characters) ? json.characters : [];
        if (apiChars.length) {
          setAllCharacters(apiChars);
        } else {
          const pool = [];
          nextCards.forEach((c) => {
            const arr = Array.isArray(c?.characters)
              ? c.characters
              : [...(c?.team1 || []), ...(c?.team2 || [])];
            pool.push(...arr);
          });
          const seen = new Set();
          const uniq = [];
          pool.forEach((ch) => {
            const k = (ch?.name || "").toLowerCase().trim();
            if (k && !seen.has(k)) { seen.add(k); uniq.push(ch); }
          });
          setAllCharacters(uniq);
        }

        setErrMsg("");
      } catch (e) {
        if (e.name !== "AbortError") setErrMsg(e.message || "Error loading data");
      } finally {
        setIsLoading(false);
      }
    };

    load(false);
    const id = setInterval(() => load(true), 30_000);
    const onVis = () => { if (document.visibilityState === "visible") load(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      aborter.abort();
      aborter = null;
    };
  }, []);

  // ordenar y filtrar
  const sortedCards = React.useMemo(() => {
    return [...dataCards].sort((a, b) => {
      const da = dateKeyFromDate(a?.date);
      const db = dateKeyFromDate(b?.date);
      if (da !== db) return da - db;
      const ta = minutesFromTime(a?.time);
      const tb = minutesFromTime(b?.time);
      if (ta !== tb) return ta - tb;
      const at = (a?.title || "").toLowerCase();
      const bt = (b?.title || "").toLowerCase();
      if (at < bt) return -1;
      if (at > bt) return 1;
      return 0;
    });
  }, [dataCards]);

  const visibleCards = React.useMemo(
    () => sortedCards.filter((c) => getCardStatus(c, nowTs) !== "expired"),
    [sortedCards, nowTs]
  );

  // SOLO 3 próximas
  const top3Upcoming = React.useMemo(() => visibleCards.slice(0, 3), [visibleCards]);

  return (
    <div
      style={{
        maxWidth: "1480px",
        margin: "20px auto",
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#34495e",
      }}
    >
      <style>{`
        @keyframes whaleGlowPulse {
          0% { box-shadow: 0 0 0 0 rgba(30,136,229,0.35), 0 0 24px rgba(30,136,229,0.45); }
          50% { box-shadow: 0 0 0 6px rgba(30,136,229,0.12), 0 0 36px rgba(30,136,229,0.65); }
          100% { box-shadow: 0 0 0 0 rgba(30,136,229,0.35), 0 0 24px rgba(30,136,229,0.45); }
        }
        .whale-glow { animation: whaleGlowPulse 1.6s ease-in-out infinite; border-radius: 14px; }

        .wc-sections {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .wc-sections { grid-template-columns: 1fr; }
        }
        .wc-left { position: relative; content-visibility: auto; contain-intrinsic-size: 600px; }
        .wc-right { content-visibility: auto; contain-intrinsic-size: 400px; }

        .reg-users-overlay {
          position: fixed;
          left: 20px;
          top: 120px;
          width: 160px;
          max-height: 70vh;
          overflow: auto;
          z-index: 50;
        }
        @media (max-width: 1100px) {
          .reg-users-overlay { left: 12px; top: 100px; width: min(55vw, 200px); max-height: 50vh; }
        }
      `}</style>

      {/* Título local (sin botones aquí) */}
      <section
        aria-labelledby="welcome-title"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          alignItems: "center",
          marginBottom: "28px",
          textAlign: "center",
        }}
      >
        <h1 id="welcome-title" style={{ color: "#000080", fontWeight: 700, margin: 0 }}>
          Whalecome to WhaleCorp
        </h1>
      </section>

      {/* Estados / contenido */}
      {isLoading ? (
        <section style={{ textAlign: "center", margin: "50px 0" }}>
          <div className="spinner" />
          <p style={{ color: "#95a5a6", fontSize: 16 }}>Loading Characters...</p>
        </section>
      ) : errMsg ? (
        <section style={{ textAlign: "center", margin: "50px 0", color: "#e74c3c" }}>
          <p>Error loading data: {errMsg}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "#1e88e5",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 16,
              marginTop: 15,
              boxShadow: "0 2px 6px rgba(30,136,229,0.4)",
            }}
          >
            Retry
          </button>
        </section>
      ) : top3Upcoming.length === 0 ? (
        <section style={{ textAlign: "center", margin: "50px 0", color: "#000080", fontSize: 18 }}>
          <p>No upcoming raids</p>
          <Link
            to="/login"
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "10px 25px",
              background: "#1e88e5",
              color: "white",
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: "0 2px 6px rgba(30,136,229,0.4)",
            }}
          >
            Log in as Admin
          </Link>
        </section>
      ) : (
        <section className="wc-sections" aria-label="contenido principal">
          {/* LEFT */}
          <section aria-labelledby="raids-title" className="wc-left">
            {/* Overlay de usuarios (Online/Offline) */}
            <h2
              id="raids-title"
              style={{
                textAlign: "center",
                marginBottom: "24px",
                color: "#7A5DC7",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              <b>Upcoming Raids</b> <span style={{ fontSize: 14, color: "#7A5DC7"}}></span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "24px",
              }}
            >
              {top3Upcoming.map((card, index) => {
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
                    key={index}
                    className={isLive ? "whale-glow" : undefined}
                    style={{
                      borderRadius: 14,
                      overflow: "hidden",
                      boxShadow: isLive
                        ? "0 0 0 0 rgba(30,136,229,0.35), 0 0 24px rgba(30,136,229,0.55)"
                        : "0 10px 20px rgba(0,0,0,0.08)",
                      backgroundColor: "#e0e0e0",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: "18px 22px",
                        background: "linear-gradient(145deg, #6a0dad, #32cd32)",
                        borderBottom: "1px solid #bbdefb",
                        userSelect: "none",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          color: "#e0e0e0",
                          fontWeight: 700,
                          fontSize: "1.3rem",
                          lineHeight: 1.15,
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                        title={card.title}
                      >
                        {card.title}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 14,
                          color: "#e0e0e0",
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {card.date ? formatDayMonth(card.date) : "Date not asigned"}
                        </span>
                        <span>{card.time || "Time not asigned"}</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div
                      style={{
                        padding: "18px 22px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        background: "#e0e0e0"
                      }}
                    >
                      {!hasAny ? (
                        <p
                          style={{
                            color: "#7A5DC7",
                            textAlign: "center",
                            padding: "30px 0",
                            gridColumn: "1 / -1",
                            fontWeight: 500,
                            fontStyle: "italic",
                            margin: 0,
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
                                alignItems: "center",
                                marginBottom: 8,
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
                                gap: 10,
                              }}
                            >
                              {team1.map((char, i) => (
                                <CharItem key={`t1-${i}-${char?.name || i}`} char={char} />
                              ))}
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
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
                                gap: 10,
                              }}
                            >
                              {team2.map((char, i) => (
                                <CharItem key={`t2-${i}-${char?.name || i}`} char={char} />
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
          </section>

          {/* RIGHT: Live Streamings */}
          <section aria-labelledby="streams-title" className="wc-right" style={{ justifySelf: "end" }}>
            <h2
              id="streams-title"
              style={{
                color: "#7A5DC7",
                fontWeight: 700,
                letterSpacing: "0.5px",
                margin: "0 0 12px",
                textAlign: "right",
              }}
            >
              <b>Live Streamings</b>
            </h2>

            {/* Probe off-screen */}
            <div style={{ position: "absolute", left: -99999, width: 1, height: 1, overflow: "hidden" }}>
              <StreamsProbe onHasLiveChange={setHasLive} />
            </div>

            {hasLive && (
              <div
                style={{
                  borderRadius: 10,
                  padding: 12,
                  background: "transparent",
                  width: 360,
                }}
              >
                <React.Suspense fallback={null}>
                  <StreamingsLazy
                    pollIntervalMs={60000}
                    cardWidth={220}
                    probeEndpoint={`${API_BASE}/api/stream/live-status`}
                    onLiveCountChange={(count) => setHasLive(count > 0)}
                  />
                </React.Suspense>
              </div>
            )}
          </section>
        </section>
      )}
    </div>
  );
}
