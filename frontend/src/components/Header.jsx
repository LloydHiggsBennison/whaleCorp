import React from "react";
import { Link } from "react-router-dom";

export default function Header({ userEmail, onLogout }) {
  const linkBase = {
    textDecoration: "none",
    color: "#7A5DC7",
  };

  const rightLink = {
    ...linkBase,
    fontWeight: 500,
  };

  const headerLink = {
    ...linkBase,
    fontSize: 14,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 8,
    background: "transparent",
    transition: "background .15s ease, transform .15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  const headerLinkHover = (e) => {
    e.currentTarget.style.background = "rgba(122,93,199,0.10)";
    e.currentTarget.style.transform = "translateY(-1px)";
  };
  const headerLinkLeave = (e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.transform = "none";
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        backgroundColor: "#f5f6f8",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      {/* Izquierda: Marca + enlaces de navegación principales */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Link to="/" style={linkBase} aria-label="Go home">
          <h1 style={{ margin: 0, letterSpacing: ".2px", whiteSpace: "nowrap" }}>WhaleCorp</h1>
        </Link>

        {/* Separador sutil */}
        <span style={{ width: 1, height: 22, background: "rgba(0,0,0,0.08)" }} />

        {/* Enlaces en el título */}
        <nav
          aria-label="Primary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/raids"
            style={headerLink}
            onMouseEnter={headerLinkHover}
            onMouseLeave={headerLinkLeave}
          >
            {/* ícono lista */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#7A5DC7" viewBox="0 0 24 24" style={{ display: "block" }}>
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h12v2H3v-2z" />
            </svg>
            See all Raids
          </Link>

          <Link
            to="/players"
            style={headerLink}
            onMouseEnter={headerLinkHover}
            onMouseLeave={headerLinkLeave}
          >
            {/* ícono users */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#7A5DC7" viewBox="0 0 24 24" style={{ display: "block" }}>
              <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zm0 2c-2.33 0-7 1.17-7 3.5V20h10v-3.5C11 14.17 6.33 13 4 13zm12 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h5v-3.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            Players Online
          </Link>
        </nav>
      </div>

      {/* Derecha: Discord + acciones */}
      <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Discord  */}
        <a
          href="https://discord.gg/DqcXn6WBx2"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join WhaleCorp Discord"
          title="Join Discord"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            transition: "transform .15s ease, opacity .15s ease",
            opacity: 0.95,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.opacity = "0.95";
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#5865F2"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            style={{ display: "block" }}
          >
            <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.211-.386-.444-.875-.617-1.25a19.736 19.736 0 0 0-4.885 1.515C2.146 9.045 1.292 13.58 1.638 18.063c2.052 1.5 4.046 2.404 5.992 3.009.462-.63.873-1.295 1.226-1.994-.652-.247-1.274-.549-1.872-.892.126-.094.252-.192.372-.291 3.928 1.793 8.18 1.793 12.062 0 .12.099.246.198.372.291-.598.343-1.22.645-1.873.892.36.698.77 1.363 1.225 1.993 1.957-.605 3.951-1.509 6.003-3.009.5-6.178-.838-10.673-3.548-13.669ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.175 1.095 2.157 2.419 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.175 1.095 2.157 2.419 0 1.334-.947 2.419-2.157 2.419Z" />
          </svg>
        </a>

        {/* Separador sutil */}
        <span style={{ width: 1, height: 20, background: "rgba(0,0,0,0.08)" }} />

        {userEmail ? (
          <>
            <span style={{ fontWeight: 600, color: "#354052" }}>{userEmail}</span>
            <Link to="/profile" style={rightLink}>
              Profile
            </Link>
            <button
              onClick={onLogout}
              style={{
                padding: "6px 12px",
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                transition: "filter .15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              Log off
            </button>
          </>
        ) : (
          <Link to="/login" style={{ ...rightLink, color: "#007bff" }}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
