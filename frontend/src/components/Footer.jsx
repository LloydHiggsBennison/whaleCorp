import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "20px",
        backgroundColor: "transparent",
        textAlign: "center",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 500,
        textShadow: "0px 1px 3px rgba(0,0,0,0.6)",
        position: "relative", // contenedor relativo
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      {/* Imagen flotante a la izquierda */}
      <img
        src="/assets/Bosses.png" // cambia por tu imagen
        alt="Footer Illustration"
        style={{
          position: "absolute",
          left: "20px",
          bottom: "10px",
          height: "150px", // ajusta el tamaño
          width: "auto",
          objectFit: "contain",
          zIndex: 0, // detrás del texto
          opacity: 0.95,
        }}
      />

      {/* Texto centrado, encima de la imagen */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ margin: "2px 0" }}>
          © {new Date().getFullYear()} WhaleCorp. All rights reserved.
        </p>
        <p style={{ margin: "2px 0" }}>Created and designed by Sekai.</p>
      </div>
    </footer>
  );
}
