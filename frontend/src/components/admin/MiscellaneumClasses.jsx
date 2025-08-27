import React, { useEffect, useMemo, useState } from "react";
import { CLASSES } from "../../constants/classes";

function resolveImagePath(p) {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("/")) return p;
  if (p.startsWith("assets/")) return `/${p}`;
  return `/assets/${p}`;
}

export default function MiscellaneumClasses({
  title = "Clases",
  sortMode = "asIs",
  customOrder = [],
}) {
  const STORAGE_KEY = "misc-classes-collapsed";
  const [collapsed, setCollapsed] = useState(false);

  // Cargar estado colapsado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved != null) setCollapsed(saved === "1");
    } catch {}
  }, []);

  // Guardar estado colapsado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  const classesOrdered = useMemo(() => {
    if (!Array.isArray(CLASSES)) return [];

    if (sortMode === "alpha") {
      return [...CLASSES].sort((a, b) => a.name.localeCompare(b.name, "es"));
    }

    if (sortMode === "custom" && Array.isArray(customOrder) && customOrder.length) {
      const indexMap = new Map(customOrder.map((k, i) => [k, i]));
      return [...CLASSES].sort((a, b) => {
        const ia = indexMap.has(a.key) ? indexMap.get(a.key) : Number.MAX_SAFE_INTEGER;
        const ib = indexMap.has(b.key) ? indexMap.get(b.key) : Number.MAX_SAFE_INTEGER;
        if (ia === ib) return a.name.localeCompare(b.name, "es");
        return ia - ib;
      });
    }

    return CLASSES;
  }, [sortMode, customOrder]);

  const handleKeyAsClick = (e, fn) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <>
      {!collapsed && (
        <aside
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            width: 520,
            maxWidth: "90vw",
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            padding: 12,
            zIndex: 50,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            transition: "transform 160ms ease, opacity 160ms ease",
          }}
          aria-label={`${title} - Classes Panel`}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h4
              style={{
                margin: 0,
                color: "#111827",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              {title}
            </h4>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              onKeyDown={(e) => handleKeyAsClick(e, () => setCollapsed(true))}
              aria-label="Minimize classes panel"
              title="Minimize"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                cursor: "pointer",
                fontWeight: 700,
                color: "#374151",
              }}
            >
              —
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 8,
              alignItems: "stretch",
            }}
          >
            {classesOrdered.map((cls) => {
              const src = resolveImagePath(cls.image);
              return (
                <div
                  key={cls.key}
                  title={cls.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: 8,
                    borderRadius: 10,
                    background: "#f9fafb",
                    border: "1px solid #eef2f7",
                  }}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={cls.name}
                      width={36}
                      height={36}
                      style={{
                        borderRadius: 8,
                        objectFit: "contain",
                      }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        // fallback visual si la ruta está rota
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.removeAttribute("aria-hidden");
                        e.currentTarget.nextElementSibling?.setAttribute("title", "Image not available");
                      }}
                    />
                  ) : null}

                  {!src && (
                    <div
                      aria-hidden
                      style={{
                        width: 36,
                        height: 36,
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

                  <span
                    style={{
                      fontSize: 11,
                      lineHeight: 1.2,
                      color: "#374151",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                    }}
                  >
                    {cls.name}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          onKeyDown={(e) => handleKeyAsClick(e, () => setCollapsed(false))}
          aria-label="Maximize classes panel"
          title="Show classes"
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 55,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "#1e293b",
            color: "#fff",
            border: "1px solid #0f172a",
            borderRadius: 999,
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            fontWeight: 700,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 16,
              height: 16,
              display: "inline-block",
              borderRadius: 3,
              background:
                "linear-gradient(90deg, rgba(255,255,255,.85) 50%, transparent 50%), linear-gradient(0deg, rgba(255,255,255,.85) 50%, transparent 50%)",
              backgroundSize: "8px 8px",
            }}
          />
          Classes
        </button>
      )}
    </>
  );
}
