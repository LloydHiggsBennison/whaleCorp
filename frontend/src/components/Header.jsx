import React from "react";
import { Link } from "react-router-dom";

export default function Header({ userEmail, onLogout }) {
  return (
    <header style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      padding: "20px",
      backgroundColor: "#f0f0f0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <Link to="/" style={{ textDecoration: "none", color: "#7A5DC7",  }}>
        <h1 style={{ margin: 0 }}>WhaleCorp</h1>
      </Link>
      
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {userEmail ? (
          <>
            <span style={{ fontWeight: "bold", color: "#000080" }}>{userEmail}</span>
            <Link to="/profile" style={{ textDecoration: "none", color: "#7A5DC7" }}>
              Profile
            </Link>
            <button 
              onClick={onLogout}
              style={{
                padding: "5px 10px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Log off
            </button>
          </>
        ) : (
          <Link to="/login" style={{ textDecoration: "none", color: "#007bff" }}>
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}