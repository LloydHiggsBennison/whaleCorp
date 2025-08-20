import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { fetchAppData, saveUserData, saveCards } from "./api/backendApi";
import LoginForm from "./components/LoginForm";
import UserProfile from "./components/UserProfile";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import AdminPanel from "./components/AdminPanel";

// Fallback robusto para el background cuando la app se despliega bajo subcarpetas.
// Usa la imagen que está en /public/assets/background/whale.png
// Ruta absoluta directa desde public/
const BG_URL = "/assets/background/whale.png";

function App() {
  const [userEmail, setUserEmail] = useState(null);
  const [userData, setUserData] = useState(null);
  const [appData, setAppData] = useState({
    users: {},
    cards: [],
    allCharacters: [],
  });
  const [loading, setLoading] = useState(true);
  const [loginMode, setLoginMode] = useState("login"); // "login" | "register" | "createPassword"
  const isLoggingOut = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAppData();
        setAppData({
          users: data.users || {},
          cards: data.cards || [],
          allCharacters: getAllCharacters(data.users || {}),
        });
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoggingOut.current) return;
    if (userEmail && userData) {
      const saveTimeout = setTimeout(() => {
        saveUserData(userEmail, userData)
          .then(() => {
            setAppData((prev) => ({
              ...prev,
              users: {
                ...prev.users,
                [userEmail]: userData,
              },
              allCharacters: getAllCharacters({
                ...prev.users,
                [userEmail]: userData,
              }),
            }));
          })
          .catch((error) => {
            console.error("Save user error:", error);
            alert("Error saving data, please try again.");
          });
      }, 500);

      return () => clearTimeout(saveTimeout);
    }
  }, [userData, userEmail]);

  const getAllCharacters = (users) => {
    const characters = [];
    Object.entries(users).forEach(([email, udata]) => {
      if (udata?.characters?.length) {
        udata.characters.forEach((char) => {
          characters.push({
            ...char,
            userEmail: email,
          });
        });
      }
    });
    return characters;
  };

  const saveCardsHandler = async (cards) => {
    try {
      await saveCards(cards);
      setAppData((prev) => ({ ...prev, cards }));
    } catch (error) {
      console.error("Save cards error:", error);
      alert("Error saving cards, please try again.");
    }
  };

  const handleLogin = async (email, password, mode) => {
    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = appData.users[trimmedEmail];

    if (mode === "register") {
      if (existingUser) throw new Error("User already registered");

      const newUser = {
        password,
        characters: [],
        labels: [],
        role: "user",
      };

      setUserEmail(trimmedEmail);
      setUserData(newUser);
      setLoginMode("login");
      return newUser;
    }

    if (mode === "createPassword") {
      if (!existingUser) throw new Error("User not found");
      if (existingUser.password && existingUser.password !== "") {
        throw new Error("Password has already been created");
      }
      setUserEmail(trimmedEmail);
      setUserData({ ...existingUser, password });
      setLoginMode("login");
      return existingUser;
    }

    // login normal
    if (!existingUser) throw new Error("User not found");

    if (existingUser.role === "admin" && (!existingUser.password || existingUser.password === "")) {
      throw new Error("You must create a password for your account");
    }

    if (existingUser.password !== password) {
      throw new Error("Invalid credentials");
    }

    setUserEmail(trimmedEmail);
    setUserData({
      ...existingUser,
      role: existingUser.role || "user",
    });
    setLoginMode("login");
    return existingUser;
  };

  const handleLogout = () => {
    isLoggingOut.current = true;

    if (userEmail && userData) {
      saveUserData(userEmail, userData).catch((error) => {
        console.error("Final save error:", error);
      });
    }

    setUserEmail(null);
    setUserData(null);
    setLoginMode("login");

    setTimeout(() => {
      isLoggingOut.current = false;
    }, 1000);
  };

  const userRole = userData?.role || "user";

  return (
    <div
      data-app-root
      style={{
        minHeight: "100vh",
        /* Fallback JS por si el CSS no se aplica (subpaths, overrides, etc.) */
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <BrowserRouter>
        <Header userEmail={userEmail} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<HomePage cards={appData.cards} loading={loading} />} />
          <Route
            path="/login"
            element={
              userEmail ? (
                <Navigate to={userRole === "admin" ? "/admin" : "/profile"} />
              ) : (
                <LoginForm onLogin={handleLogin} mode={loginMode} />
              )
            }
          />
          <Route
            path="/profile"
            element={
              userEmail && userRole === "user" ? (
                <UserProfile userEmail={userEmail} userData={userData} setUserData={setUserData} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin"
            element={
              userEmail && userRole === "admin" ? (
                <AdminPanel
                  cards={appData.cards}
                  allCharacters={appData.allCharacters}
                  onSaveCards={saveCardsHandler}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
