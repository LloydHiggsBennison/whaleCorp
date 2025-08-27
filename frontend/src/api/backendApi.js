const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");
const API_BASE = `${API_ORIGIN}/api`;

// Helper con timeout y manejo de errores homogéneo
async function http(path, options = {}, timeoutMs = 15000) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      signal: ctrl.signal,
      ...options,
    });

    if (!res.ok) {
      // Intentamos leer JSON de error; si no, texto plano
      let errMsg = res.statusText;
      try {
        const data = await res.json();
        errMsg = data?.error || JSON.stringify(data);
      } catch {
        try { errMsg = await res.text(); } catch {}
      }
      throw new Error(`HTTP ${res.status}: ${errMsg}`);
    }

    // Puede devolver 204 No Content
    if (res.status === 204) return null;
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

// ===== Endpoints =====

export async function fetchAppData() {
  try {
    return await http("/data", { method: "GET" });
  } catch (error) {
    console.error("Fetch error:", error);
    // Fallback seguro para que el front no explote
    return { users: {}, cards: [] };
  }
}

export async function saveUserData(email, data) {
  try {
    return await http("/user", {
      method: "POST",
      body: JSON.stringify({ email, data }),
    });
  } catch (error) {
    console.error("Save user error:", error);
    throw error;
  }
}

export async function saveCards(cards) {
  try {
    return await http("/cards", {
      method: "POST",
      body: JSON.stringify({ cards }),
    });
  } catch (error) {
    console.error("Save cards error:", error);
    throw error;
  }
}
