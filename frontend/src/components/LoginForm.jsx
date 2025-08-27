import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); 
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    try {
      const userData = await onLogin(email.trim(), password.trim(), mode);
      // Si backend pidió crear contraseña, pasamos al modo crear contraseña
      if (userData && userData.message === "Password Created") {
        alert("Password created successfully. Please log in.");
        setMode("login");
        setPassword("");
        return;
      }

      if (mode === "login") {
        if (userData.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/profile");
        }
      } else if (mode === "register") {
        navigate("/profile");
      }
    } catch (e) {
      if (
        e.message &&
        (e.message.toLowerCase().includes("Password to create") ||
          e.message.toLowerCase().includes("create password"))
      ) {
        setMode("createPassword");
        setError(
          "Your account requires creating a password. Please enter a new password."
        );
      } else {
        setError(e.message || "Error logging in");
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "40px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <form onSubmit={handleSubmit}>
        <h2 style={{ textAlign: "center", marginTop: 0 }}>
          {mode === "createPassword"
            ? "Create Password"
            : mode === "login"
            ? "Log In"
            : "Register"}
        </h2>

        {error && (
          <p style={{ color: "#dc3545", textAlign: "center", marginBottom: 10 }}>
            {error}
          </p>
        )}

        <div style={{ marginBottom: "15px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
            disabled={mode === "createPassword"}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <input
            type="password"
            placeholder={mode === "createPassword" ? "New Password" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {mode === "createPassword" ? "Create Password" : "Log In"}
        </button>

        {mode !== "createPassword" && (
          <p style={{ textAlign: "center", marginTop: "15px" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode(mode === "login" ? "register" : "login");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              {mode === "login" ? "Register" : "Log In"}
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
