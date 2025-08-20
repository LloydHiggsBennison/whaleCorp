require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// fetch compatible con Node < 18
const _fetch =
  typeof fetch === "function"
    ? fetch
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

let db;

async function connectDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db("whalecorpdb"); // Usa la base de datos indicada en la URI
  console.log("Conectado a MongoDB Atlas");
}

app.use(cors());
app.use(express.json());

/* ============================================================================
   STREAM PROBE (sin secret keys, sin OAuth)
   - Detecta si un canal de Twitch está LIVE raspando el HTML público del canal.
   - Responde siempre 200 con { channel, live } para no romper el front.
   - Cache en memoria 20s por canal (salteable con ?force=1).
   - Ruta de debug opcional para inspeccionar patrones.
============================================================================ */
const _UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const liveCache = new Map(); // key: login, value: { live, ts, meta }

async function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await _fetch(url, { ...opts, signal: ctrl.signal });
    return r;
  } finally {
    clearTimeout(id);
  }
}

function detectLiveFromHtml(html) {
  // Patrones robustos:
  // - "isLiveBroadcast":true
  // - "isLive":true
  // - data-a-player-state="site.live"  (comillas dobles o simples)
  // - "type":"live" con contexto cercano (viewer_count, game, started_at)
  const reasons = [];

  const p1 = /"isLiveBroadcast"\s*:\s*true/i.test(html);
  if (p1) reasons.push('match:"isLiveBroadcast":true');

  const p2 = /"isLive"\s*:\s*true/i.test(html);
  if (p2) reasons.push('match:"isLive":true');

  const p3 =
    /data-a-player-state\s*=\s*"site\.live"/i.test(html) ||
    /data-a-player-state\s*=\s*'site\.live'/i.test(html);
  if (p3) reasons.push("match:data-a-player-state=site.live");

  const p4 = /"type"\s*:\s*"live".{0,180}("viewer_count"|\"game\"|\"started_at\")/is.test(html);
  if (p4) reasons.push('match:blob contains "type":"live"+context');

  return { live: reasons.length > 0, reasons };
}

async function scrapeIsLive(login) {
  const url = `https://www.twitch.tv/${encodeURIComponent(login)}`;
  const res = await fetchWithTimeout(
    url,
    {
      headers: {
        "User-Agent": _UA,
        "Accept-Language": "en-US,en;q=0.9,es-ES;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
    10000
  );

  if (!res.ok) {
    return { live: false, reasons: [`status:${res.status}`] };
  }

  const html = await res.text();
  return detectLiveFromHtml(html);
}

// GET /api/stream/live-status?channel=foo[&force=1]
app.get("/api/stream/live-status", async (req, res) => {
  const channel = String(req.query.channel || req.query.login || "").trim().toLowerCase();
  if (!channel) return res.status(400).json({ error: "channel required" });

  const force = String(req.query.force || "0") === "1";

  // Cache 20s (salteable con ?force=1)
  const now = Date.now();
  const cached = liveCache.get(channel);
  if (!force && cached && now - cached.ts < 20000) {
    return res.status(200).json({ channel, live: cached.live, cached: true });
  }

  try {
    const { live, reasons } = await scrapeIsLive(channel);
    liveCache.set(channel, { live, ts: now, meta: { reasons } });
    return res.status(200).json({ channel, live });
  } catch (e) {
    console.error("live-status scrape error:", e);
    return res.status(200).json({ channel, live: false, error: "probe_failed" });
  }
});

// GET /api/stream/live-debug?channel=foo  (no usar en prod; sólo diagnóstico)
app.get("/api/stream/live-debug", async (req, res) => {
  const channel = String(req.query.channel || req.query.login || "").trim().toLowerCase();
  if (!channel) return res.status(400).json({ error: "channel required" });

  const out = await scrapeIsLive(channel).catch((e) => ({
    live: false,
    reasons: [`error:${e?.message || "unknown"}`],
  }));
  return res.status(200).json({ channel, ...out });
});
/* ========================================================================== */

/* ============================================================================
   USUARIOS Y TARJETAS
============================================================================ */

// LOGIN - Creación de contraseña para admins sin password
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Falta email" });

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    // Admin sin contraseña: permite crearla
    if (user.role === "admin" && (!user.password || user.password === "")) {
      if (!password) return res.status(400).json({ error: "Debe enviar contraseña para crear" });
      await db.collection("users").updateOne({ email: user.email }, { $set: { password } });
      return res.json({ success: true, message: "Contraseña creada", user });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error en login" });
  }
});

// Obtener todos los usuarios y tarjetas (admins ven todas)
app.get("/api/data", async (req, res) => {
  try {
    const usersArray = await db.collection("users").find({}).toArray();
    const cardsArray = await db.collection("cards").find({}).toArray();

    const usersObj = {};
    usersArray.forEach((user) => {
      const u = { ...user };
      delete u._id;
      usersObj[user.email] = u;
    });

    res.json({ users: usersObj, cards: cardsArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

// Guardar o actualizar usuario
app.post("/api/user", async (req, res) => {
  try {
    const { email, data } = req.body;
    if (!email || !data) return res.status(400).json({ error: "Faltan datos" });

    await db.collection("users").updateOne(
      { email },
      { $set: { ...data, email } },
      { upsert: true }
    );

    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar usuario" });
  }
});

// Guardar o actualizar todas las tarjetas
app.post("/api/cards", async (req, res) => {
  try {
    const { cards } = req.body;
    if (!Array.isArray(cards)) return res.status(400).json({ error: "Datos inválidos" });

    await db.collection("cards").deleteMany({});
    if (cards.length > 0) {
      await db.collection("cards").insertMany(cards);
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar tarjetas" });
  }
});

// Actualizar tarjeta individual (PATCH)
app.patch("/api/cards/:id", async (req, res) => {
  const { id } = req.params;
  const { title, characters, date, time } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Falta el id de la tarjeta" });
  }

  try {
    const updated = await db.collection("cards").findOneAndUpdate(
      { id: Number(id) },
      {
        $set: {
          title,
          characters,
          date,
          time,
        },
      },
      { returnDocument: "after" }
    );

    if (!updated.value) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    res.json({ success: true, card: updated.value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando tarjeta" });
  }
});

/* ============================================================================
   START
============================================================================ */
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error conectando a MongoDB:", err);
  });
