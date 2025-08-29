import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { fetchAppData, saveUserData, saveCards } from "./api/backendApi";
import LoginForm from "./components/LoginForm";
import UserProfile from "./components/UserProfile";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import AdminPanel from "./components/AdminPanel";
import Footer from "./components/Footer";

// NUEVO: páginas de “See all Raids” y “Players Online”
import RaidsAll from "./pages/RaidsAll";
import PlayersOnline from "./pages/PlayersOnline";

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
  const [loginMode, setLoginMode] = useState("login");
  const isLoggingOut = useRef(false);

  // obtener todos los personajes desde el mapa de usuarios
  function getAllCharacters(users) {
    const characters = [];
    Object.entries(users || {}).forEach(([email, udata]) => {
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
  }

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
    <BrowserRouter>
      {/* Layout: header arriba, main que crece, footer abajo */}
      <div
        data-app-root
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundImage: `url(${BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Header userEmail={userEmail} onLogout={handleLogout} />

        <main style={{ flex: 1 }}>
          <Routes>
            {/* Público */}
            <Route path="/" element={<HomePage cards={appData.cards} loading={loading} />} />
            <Route path="/raids" element={<RaidsAll />} />
            <Route path="/players" element={<PlayersOnline />} />

            {/* Auth */}
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
                  <UserProfile
                    userEmail={userEmail}
                    userData={userData}
                    setUserData={setUserData}
                  />
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

            {/* 404 opcional */}
            {/* <Route path="*" element={<Navigate to="/" />} /> */}
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
