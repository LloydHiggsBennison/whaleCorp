import React, { useMemo } from "react";

/* ===== Helpers ===== */
const getEmail = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const candidates = [
    obj.ownerEmail, obj.email, obj.accountEmail, obj.userEmail,
    obj.owner?.email, obj.user?.email, obj.profile?.email, obj.account?.email,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim().toLowerCase();
  }
  return "";
};

const getRole = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const candidates = [
    obj.ownerRole, obj.userRole, obj.accountRole, obj.role,
    obj.owner?.role, obj.user?.role, obj.account?.role,
  ];
  for (const r of candidates) {
    if (typeof r === "string" && r.trim()) return r.trim().toLowerCase();
  }
  return "";
};

const getOwnerName = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const candidates = [
    obj.ownerName, obj.userName, obj.accountName, obj.playerName,
    obj.owner?.name, obj.user?.name, obj.account?.name,
  ];
  for (const n of candidates) {
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  const e = getEmail(obj);
  if (e && e.includes("@")) return e.split("@")[0];
  return "";
};

const dot = (color) => ({
  display: "inline-block",
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: color,
  marginRight: 6,
});

/* ===== Componente ===== */
export default function RegisteredUsersPanel({
  allCharacters = [],
  extraAdminEmails = [], // opcional
}) {
  const { registered, offline } = useMemo(() => {
    const adminEmails = new Set(
      (extraAdminEmails || []).map((e) => String(e).trim().toLowerCase())
    );

    // Agregar a adminEmails los correos que tengan rol admin
    for (const ch of allCharacters || []) {
      const email = getEmail(ch);
      const role = getRole(ch);
      if (email && role.includes("admin")) adminEmails.add(email);
    }

    const byLocalPart = new Set(); // nombres antes de @ para "online"
    const offlineOwners = new Set(); // nombres sin email

    for (const ch of allCharacters || []) {
      const email = getEmail(ch);
      const role = getRole(ch);
      if (role.includes("admin")) continue; // ignorar admins
      if (email && adminEmails.has(email)) continue;

      if (email) {
        const name = email.split("@")[0];
        if (name) byLocalPart.add(name);
      } else {
        const owner = getOwnerName(ch) || "Unregistered";
        offlineOwners.add(owner);
      }
    }

    const registered = Array.from(byLocalPart).sort((a, b) => a.localeCompare(b));
    const offline = Array.from(offlineOwners).sort((a, b) => a.localeCompare(b));
    return { registered, offline };
  }, [allCharacters, extraAdminEmails]);

  return (
    <div
      style={{
        /* El ancho/posición los controla HomePage (.reg-users-overlay), 
           aquí solo estética mínima */
        background: "rgba(255,255,255,0.9)",
        borderRadius: "0 8px 8px 0",
        padding: "8px 10px",
        fontSize: 12,
        lineHeight: 1.35,
        color: "#111827",
      }}
    >
      {/* ONLINE */}
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11 }}>Online</div>
      {registered.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No players</div>
      ) : (
        registered.map((name) => (
          <div key={name} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
            <span style={dot("#22c55e")} />
            <span>{name}</span>
          </div>
        ))
      )}

      {/* OFFLINE */}
      <div style={{ fontWeight: 700, margin: "8px 0 6px", fontSize: 11 }}>Offline</div>
      {offline.length === 0 ? (
        <div style={{ color: "#9ca3af" }}>None</div>
      ) : (
        offline.map((name) => (
          <div key={name} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
            <span style={dot("#9ca3af")} />
            <span>{name}</span>
          </div>
        ))
      )}
    </div>
  );
}
