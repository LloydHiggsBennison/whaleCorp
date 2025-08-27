import React, { useEffect, useMemo, useRef, useState } from "react";

const CHANNELS = [
  "https://www.twitch.tv/trickmasteh",
  "https://www.twitch.tv/blawbberto",
  "https://www.twitch.tv/kaosniight",
  "https://www.twitch.tv/khangsoofly",
  "https://www.twitch.tv/faaaxy",
  "https://www.twitch.tv/takeshijoga",
];

// Normaliza a "login" de Twitch (minúsculas, sin @, etc.)
const normalizeLogin = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim();
  try {
    if (s.startsWith("http")) {
      const u = new URL(s);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[0]?.toLowerCase() || null;
    }
  } catch {}
  return s.replace(/^@/, "").replace(/\s+/g, "").toLowerCase();
};

// Determina si la respuesta del backend indica que está live
const isJsonLive = (j) => {
  if (!j) return false;
  if (j.live === true) return true;
  if (j.isLive === true) return true;
  if (j.data && typeof j.data === "object" && j.data.type === "live") return true;
  if (j.status === "live") return true;
  return false;
};

// Obtiene el login desde el JSON, o cae al fallback
const pickLogin = (j, fallbackLogin) => {
  return (
    j?.channel ||
    j?.login ||
    j?.user ||
    j?.username ||
    j?.data?.user_login ||
    fallbackLogin
  );
};

export default function Streamings({
  channels = CHANNELS,
  pollIntervalMs = 120000,
  maxCards = 12,
  cardWidth = 220,
  probeEndpoint = "/api/stream/live-status",
  onLiveCountChange,
}) {
  const [liveList, setLiveList] = useState([]); 
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  // Preconnect leve
  useEffect(() => {
    const add = (href) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.crossOrigin = "";
      document.head.appendChild(link);
      return link;
    };
    const a = add("https://static-cdn.jtvnw.net");
    const b = add("https://www.twitch.tv");
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const normalized = useMemo(
    () =>
      (channels || [])
        .map(normalizeLogin)
        .filter(Boolean)
        .slice(0, maxCards),
    [channels, maxCards]
  );

  const notify = (count) => {
    if (typeof onLiveCountChange === "function") {
      try {
        onLiveCountChange(count);
      } catch {}
    }
  };

  const checkLive = async (signal) => {
    if (!normalized.length) {
      setLiveList([]);
      setLoading(false);
      notify(0);
      return;
    }

    setLoading(true);

    const qs = (login) => {
      const p = new URLSearchParams();
      // soporta backends que esperen "channel" o "login"
      p.set("channel", login);
      p.set("login", login);
      // evita caches intermedias
      p.set("_", Date.now().toString());
      return `${probeEndpoint}?${p.toString()}`;
    };

    try {
      const resList = await Promise.allSettled(
        normalized.map((login) =>
          fetch(qs(login), { cache: "no-store", signal }).then((r) =>
            r.ok ? r.json().catch(() => null) : null
          )
        )
      );

      const lives = [];
      for (let i = 0; i < resList.length; i++) {
        const json = resList[i].status === "fulfilled" ? resList[i].value : null;
        const fallbackLogin = normalized[i];
        if (isJsonLive(json)) {
          const login = pickLogin(json, fallbackLogin);
          if (!login) continue;
          const safeLogin = String(login).toLowerCase();
          lives.push({
            channel: safeLogin,
            thumbUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${encodeURIComponent(
              safeLogin
            )}-320x180.jpg?cb=${Date.now()}`,
            w: 320,
            h: 180,
          });
        }
      }

      setLiveList(lives);
      notify(lives.length);
    } catch (e) {
      // En caso de error de red, deja lista vacía
      console.error("checkLive error", e);
      setLiveList([]);
      notify(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();

    const start = () => {
      if (document.visibilityState === "visible") checkLive(ctrl.signal);
    };

    const ric =
      window.requestIdleCallback?.(start) ??
      setTimeout(start, 500);

    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") checkLive(ctrl.signal);
    }, pollIntervalMs);

    const vis = () =>
      document.visibilityState === "visible" && checkLive(ctrl.signal);
    document.addEventListener("visibilitychange", vis);

    return () => {
      window.cancelIdleCallback
        ? window.cancelIdleCallback(ric)
        : clearTimeout(ric);
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", vis);
      ctrl.abort();
    };
  }, [normalized, pollIntervalMs]); 

  const cardHeight = Math.round((cardWidth * 9) / 16);

  // Si no hay nada que mostrar, no se renderiza
  if ((loading && liveList.length === 0) || liveList.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="List of live streamings"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "flex-end",
      }}
    >
      {liveList.map((s) => (
        <a
          key={s.channel}
          href={`https://www.twitch.tv/${encodeURIComponent(s.channel)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              position: "relative",
              border: "3px solid #000",
              borderRadius: 10,
              background: "#f7f9fc",
              overflow: "hidden",
              width: cardWidth,
              contentVisibility: "auto",
              containIntrinsicSize: `${cardHeight + 48}px`,
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "#ff3b30",
                color: "#fff",
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 999,
                fontWeight: 700,
                letterSpacing: 0.5,
                zIndex: 2,
              }}
            >
              LIVE
            </div>

            <img
              src={s.thumbUrl}
              srcSet={`${s.thumbUrl} ${s.w}w`}
              sizes={`${cardWidth}px`}
              alt={`${s.channel} en vivo`}
              width={cardWidth}
              height={cardHeight}
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              style={{
                width: "100%",
                height: cardHeight,
                objectFit: "cover",
                display: "block",
                background: "#555",
              }}
            />

            <div style={{ padding: "8px 10px 10px" }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#1e2a38",
                  marginBottom: 2,
                  textTransform: "capitalize",
                  fontSize: 14,
                }}
              >
                {s.channel}
              </div>
              <div style={{ fontSize: 11, color: "#66788a" }}>
                Click to open on Twitch
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
