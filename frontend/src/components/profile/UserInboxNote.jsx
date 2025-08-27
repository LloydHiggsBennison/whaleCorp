import React, { useEffect, useState } from "react";

export default function UserInboxNote({
  userData,
  setUserData,
  field = "note",
  max = 500,
}) {
  const initial = (userData?.[field] ?? "").toString();
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText((userData?.[field] ?? "").toString());
  }, [userData, field]);

  const persist = (val) => {
    setUserData((prev) => {
      const next = { ...prev, [field]: val };
      return next;
    });
    setSaving(true);
    const t = setTimeout(() => setSaving(false), 700);
    return () => clearTimeout(t);
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
        <span role="img" aria-label="mensaje">📩</span>
        Message for admins
      </h3>
      <p style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>
        Write here your availability this week (only visible for admins).
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value.slice(0, max);
          setText(v);
        }}
        onBlur={(e) => persist(e.target.value)}
        placeholder="E.g.: I prefer support; I can't do Sundays; my Discord is ..."
        rows={4}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d1d5db",
          outline: "none",
          resize: "vertical",
          background: "#fff",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <small style={{ color: "#94a3b8" }}>
          {text.length}/{max}
        </small>
        {saving && (
          <small style={{ color: "#16a34a", fontWeight: 600 }}>Saving…</small>
        )}
      </div>

      {Boolean(text?.trim()) && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            background: "#f1f5f9",
            borderRadius: 8,
            border: "1px dashed #cbd5e1",
            color: "#334155",
            fontSize: 14,
          }}
        >
          Preview: {text}
        </div>
      )}
    </section>
  );
}
