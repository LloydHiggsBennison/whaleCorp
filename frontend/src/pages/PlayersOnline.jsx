import React from "react";

const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");
const API_BASE = API_ORIGIN;

function Dot({ online }) {
  return (
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        display: "inline-block",
        marginRight: 8,
        backgroundColor: online ? "#22c55e" : "#6b7280",
        boxShadow: online ? "0 0 0 2px rgba(34,197,94,.15)" : "none",
      }}
    />
  );
}

function PlayerRow({ email, count, online }) {
  // 👇 Nos quedamos solo con la parte antes de @
  const displayName = email.split("@")[0];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "6px 8px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.72)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        backdropFilter: "blur(2px)",
        minWidth: 0,
      }}
      title={email}
    >
      <Dot online={online} />
      <div
        style={{
          fontWeight: 600,
          color: "#0f172a",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
      >
        {displayName}
      </div>
      <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
        {count} {count === 1 ? "char" : "chars"}
      </span>
    </div>
  );
}

export default function PlayersOnline() {
  const [usersMap, setUsersMap] = React.useState({});
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
        setUsersMap(json?.users || {});
        setErr("");
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
    return () => aborter.abort();
  }, []);

  // Transformamos users -> listas, ignorando admins
  const allUsers = React.useMemo(() => {
    return Object.entries(usersMap || {})
      .filter(([_, u]) => (u?.role || "user") !== "admin") // ignorar admin
      .map(([email, u]) => {
        const count = Array.isArray(u?.characters) ? u.characters.length : 0;
        return { email, count, online: count > 0 };
      });
  }, [usersMap]);

  const onlineUsers = React.useMemo(
    () => allUsers.filter((u) => u.online).sort((a, b) => a.email.localeCompare(b.email)),
    [allUsers]
  );

  const offlineUsers = React.useMemo(
    () => allUsers.filter((u) => !u.online).sort((a, b) => a.email.localeCompare(b.email)),
    [allUsers]
  );

  return (
    <div style={{ maxWidth: 1400, margin: "24px auto", padding: "0 16px 24px" }}>
      <style>{`
        .two-panels {
          display: grid;
          grid-template-columns: 1fr 1fr; 
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 980px) {
          .two-panels { grid-template-columns: 1fr; }
        }

        .flow-cols-12rows {
          display: grid;
          grid-auto-flow: column;
          grid-template-rows: repeat(12, auto); 
          grid-auto-columns: minmax(260px, 1fr);
          gap: 10px 18px;
          align-content: start;
        }

        .panel {
          border-radius: 14px;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08);
          padding: 14px;
        }
        .panel h2 {
          margin: 0 0 12px;
          color: #7A5DC7;
          font-weight: 800;
          letter-spacing: .2px;
          font-size: 20px;
        }
        .empty {
          color: #64748b;
          font-style: italic;
          padding: 8px 2px;
        }
      `}</style>

      <h1 style={{ color: "#7A5DC7", margin: "0 0 14px", textAlign: "center" }}>
        Players Online
      </h1>

      {loading ? (
        <p style={{ color: "#95a5a6", textAlign: "center" }}>Loading players…</p>
      ) : err ? (
        <p style={{ color: "#e74c3c", textAlign: "center" }}>Error: {err}</p>
      ) : (
        <section className="two-panels" aria-label="players by status">
          {/* ONLINE */}
          <div className="panel">
            <h2>Online ({onlineUsers.length})</h2>
            {onlineUsers.length === 0 ? (
              <div className="empty">None</div>
            ) : (
              <div className="flow-cols-12rows">
                {onlineUsers.map((u) => (
                  <PlayerRow
                    key={`on-${u.email}`}
                    email={u.email}
                    count={u.count}
                    online={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* OFFLINE */}
          <div className="panel">
            <h2>Offline ({offlineUsers.length})</h2>
            {offlineUsers.length === 0 ? (
              <div className="empty">None</div>
            ) : (
              <div className="flow-cols-12rows">
                {offlineUsers.map((u) => (
                  <PlayerRow
                    key={`off-${u.email}`}
                    email={u.email}
                    count={u.count}
                    online={false}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
