const BACKEND_URL = "http://localhost:3001/api";

export async function fetchAppData() {
  try {
    const res = await fetch(`${BACKEND_URL}/data`);
    if (!res.ok) throw new Error("Error fetching data");
    return await res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return { users: {}, cards: [] };
  }
}

export async function saveUserData(email, data) {
  try {
    const res = await fetch(`${BACKEND_URL}/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error saving user");
    }
    return await res.json();
  } catch (error) {
    console.error("Save user error:", error);
    throw error;
  }
}

export async function saveCards(cards) {
  try {
    const res = await fetch(`${BACKEND_URL}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error saving cards");
    }
    return await res.json();
  } catch (error) {
    console.error("Save cards error:", error);
    throw error;
  }
}
