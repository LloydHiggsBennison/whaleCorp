// AdminPanel.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import Modal from "react-modal";
import Select, { components as RSComponents } from "react-select";
import MiscellaneumClasses from "./admin/MiscellaneumClasses";

Modal.setAppElement("#root");

const SPECIAL_TAIL = new Set(["Bard", "Paladin", "Artist", "Valkyrie"]);
const ACTIVE_STATUSES = new Set(["upcoming", "live"]);
const INACTIVE_HINTS = new Set(["ended", "done", "finished", "archived", "past", "cancelled"]);

const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ==== Helpers básicos ====
const nameKey = (c) => {
  if (!c) return "";
  if (typeof c === "string") return c.trim().toLowerCase();
  if (typeof c?.name === "string") return c.name.trim().toLowerCase();
  return "";
};
const getNote = (obj) => obj?.userNote || obj?.note || obj?.profileNote || "";

// Email helpers
const getEmail = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const candidates = [
    obj.ownerEmail, obj.email, obj.accountEmail, obj.userEmail,
    obj.owner?.email, obj.user?.email, obj.profile?.email, obj.account?.email,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim().toLowerCase();
  }
  return "";
};
const getEmailUser = (obj) => {
  const e = getEmail(obj);
  const at = e.indexOf("@");
  return at > 0 ? e.slice(0, at) : e;
};
const getAccountKey = (obj) => {
  const e = getEmail(obj);
  if (e) return e;
  const ids = [obj.ownerId, obj.userId, obj.accountId, obj.owner?.id, obj.user?.id, obj.account?.id];
  for (const id of ids) if (id) return String(id);
  return "";
};

const sortTeam = (arr) => {
  const withIndex = (arr || []).map((c, i) => ({ c, i }));
  withIndex.sort((a, b) => {
    const aIsTail = SPECIAL_TAIL.has(a.c?.class?.name);
    const bIsTail = SPECIAL_TAIL.has(b.c?.class?.name);
    if (aIsTail !== bIsTail) return aIsTail ? 1 : -1;
    return a.i - b.i;
  });
  return withIndex.map((x) => x.c);
};

const z2 = (n) => String(n).padStart(2, "0");
const mmddRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ymdRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const toMMDD = (s) => {
  if (!s || typeof s !== "string") return "";
  const t = s.trim();
  if (mmddRegex.test(t)) return t;
  if (/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(t)) {
    const [m, d] = t.split("/");
    return `${m}-${d}`;
  }
  const ymd = t.match(ymdRegex);
  if (ymd) {
    const [, , m, d] = ymd;
    return `${m}-${d}`;
  }
  return t;
};

const isValidMMDD = (mmdd) => {
  if (!mmddRegex.test(mmdd)) return false;
  const [m, d] = mmdd.split("-").map((x) => parseInt(x, 10));
  const date = new Date(2001, m - 1, d); // sólo para validar día del mes
  return date.getMonth() + 1 === m && date.getDate() === d;
};

// ==== Día de la semana (sin desfase de TZ) ====
// Evita usar new Date("YYYY-MM-DD") que interpreta en UTC.
const weekdayFromMMDD = (mmdd, year = new Date().getFullYear()) => {
  if (!mmddRegex.test(mmdd)) return "";
  const [m, d] = mmdd.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(year, m - 1, d);        // constructor LOCAL
  return WEEKDAYS[dt.getDay()];
};
const formatMMDDWithDay = (val) => {
  const mmdd = toMMDD(val);
  if (!mmddRegex.test(mmdd)) return mmdd || "";
  return `${mmdd} ${weekdayFromMMDD(mmdd)}`;
};

const dedupeCharsByName = (arr = []) => {
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    const k = nameKey(c);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
};
const dedupeOptionsByName = (opts = []) => {
  const seen = new Set();
  const out = [];
  for (const o of opts) {
    const k = nameKey(o?.value);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(o);
  }
  return out;
};

// ==== Mini calendario (usa año real) ====
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WD = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function buildMonthMatrix(month /*1-12*/, year = new Date().getFullYear()) {
  const first = new Date(year, month - 1, 1);
  const firstWd = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const isActiveCard = (c) => {
  const st = String(c?.status || "").toLowerCase();
  if (!st) return true;
  if (INACTIVE_HINTS.has(st)) return false;
  return ACTIVE_STATUSES.has(st);
};

const AdminPanel = ({ cards, allCharacters, onSaveCards }) => {
  const [createTitle, setCreateTitle] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTeam1, setSelectedTeam1] = useState([]);
  const [selectedTeam2, setSelectedTeam2] = useState([]);

  const [menuOpen1, setMenuOpen1] = useState(false);
  const [menuOpen2, setMenuOpen2] = useState(false);

  // 📅 Calendario
  const [showCal, setShowCal] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const calRef = useRef(null);

  // Modal nota
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");

  // Confirm “eliminar todas”
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);

  const blockedActiveNames = useMemo(() => {
    const s = new Set();
    (cards || []).forEach((c) => {
      if (!isActiveCard(c)) return;
      if (c?.id === editingCardId) return;
      const pool = Array.isArray(c?.characters)
        ? c.characters
        : [...(c?.team1 || []), ...(c?.team2 || [])];
      pool.forEach((ch) => {
        const k = nameKey(ch);
        if (k) s.add(k);
      });
    });
    return s;
  }, [cards, editingCardId]);

  const baseOptions = useMemo(
    () =>
      (allCharacters ?? [])
        .map((char) => ({
          value: char,
          label: typeof char?.name === "string" ? char.name : String(char || ""),
          icon: char?.class?.image || null,
        }))
        .sort((a, b) => a.label.trim().toLowerCase().localeCompare(b.label.trim().toLowerCase())),
    [allCharacters]
  );

  const sel1Names = useMemo(() => new Set(selectedTeam1.map((o) => nameKey(o.value))), [selectedTeam1]);
  const sel2Names = useMemo(() => new Set(selectedTeam2.map((o) => nameKey(o.value))), [selectedTeam2]);

  const effectiveBlocked = useMemo(() => {
    const s = new Set(blockedActiveNames);
    selectedTeam1.forEach((o) => s.delete(nameKey(o.value)));
    selectedTeam2.forEach((o) => s.delete(nameKey(o.value)));
    return s;
  }, [blockedActiveNames, selectedTeam1, selectedTeam2]);

  const usedAccountsInCard = useMemo(() => {
    const s = new Set();
    selectedTeam1.forEach((o) => { const k = getAccountKey(o.value); if (k) s.add(k); });
    selectedTeam2.forEach((o) => { const k = getAccountKey(o.value); if (k) s.add(k); });
    return s;
  }, [selectedTeam1, selectedTeam2]);

  const selectedNamesInCard = useMemo(() => {
    const s = new Set();
    selectedTeam1.forEach((o) => s.add(nameKey(o.value)));
    selectedTeam2.forEach((o) => s.add(nameKey(o.value)));
    return s;
  }, [selectedTeam1, selectedTeam2]);

  const optionsTeam1 = useMemo(() => {
    const list = baseOptions.filter((opt) => {
      const k = nameKey(opt.value);
      if (effectiveBlocked.has(k)) return false;
      if (sel2Names.has(k)) return false;
      const acc = getAccountKey(opt.value);
      if (acc && usedAccountsInCard.has(acc) && !selectedNamesInCard.has(k)) return false;
      return true;
    });
    return dedupeOptionsByName(list).sort(
      (a, b) => a.label.trim().toLowerCase().localeCompare(b.label.trim().toLowerCase())
    );
  }, [baseOptions, sel2Names, effectiveBlocked, usedAccountsInCard, selectedNamesInCard]);

  const optionsTeam2 = useMemo(() => {
    const list = baseOptions.filter((opt) => {
      const k = nameKey(opt.value);
      if (effectiveBlocked.has(k)) return false;
      if (sel1Names.has(k)) return false;
      const acc = getAccountKey(opt.value);
      if (acc && usedAccountsInCard.has(acc) && !selectedNamesInCard.has(k)) return false;
      return true;
    });
    return dedupeOptionsByName(list).sort(
      (a, b) => a.label.trim().toLowerCase().localeCompare(b.label.trim().toLowerCase())
    );
  }, [baseOptions, sel1Names, effectiveBlocked, usedAccountsInCard, selectedNamesInCard]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!showCal) return;
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showCal]);

  const loadTeamsFromCard = (card) => {
    const fallback = Array.isArray(card?.characters) ? card.characters : [];
    const t1raw = Array.isArray(card?.team1) ? card.team1 : fallback.slice(0, 4);
    const t2raw = Array.isArray(card?.team2) ? card.team2 : fallback.slice(4, 8);

    const t1 = dedupeCharsByName(sortTeam(t1raw)).slice(0, 4);
    const t1Set = new Set(t1.map(nameKey));
    const t2 = dedupeCharsByName(sortTeam(t2raw).filter((c) => !t1Set.has(nameKey(c)))).slice(0, 4);

    setSelectedTeam1(
      t1.map((c) => ({ value: c, label: typeof c?.name === "string" ? c.name : String(c || ""), icon: c?.class?.image || null }))
    );
    setSelectedTeam2(
      t2.map((c) => ({ value: c, label: typeof c?.name === "string" ? c.name : String(c || ""), icon: c?.class?.image || null }))
    );
  };

  const openModal = (card) => {
    setEditingCardId(card?.id || null);
    setModalTitle(card?.title || (createTitle || "").trim());
    const mmdd = toMMDD(card?.date || "");
    setSelectedDate(mmdd);
    setSelectedTime(card?.time || "");
    setCalMonth(mmddRegex.test(mmdd) ? parseInt(mmdd.split("-")[0], 10) : new Date().getMonth() + 1);
    loadTeamsFromCard(card);
    setModalOpen(true);
  };

  const saveModal = () => {
    const title = (modalTitle || createTitle || "").trim();
    if (!title) return alert("Have to insert a title for the card");

    const normalizedDate = toMMDD(selectedDate);
    if (normalizedDate && !isValidMMDD(normalizedDate)) {
      return alert("The date must be in MM-DD format and valid. E.g.: 08-17");
    }

    const team1 = dedupeCharsByName(sortTeam(selectedTeam1.map((o) => o.value))).slice(0, 4);
    const preTeam2 = dedupeCharsByName(sortTeam(selectedTeam2.map((o) => o.value))).slice(0, 4);
    const t1Set = new Set(team1.map(nameKey));
    const team2 = preTeam2.filter((c) => !t1Set.has(nameKey(c))).slice(0, 4);

    const currentNames = new Set([...team1, ...team2].map(nameKey));
    const conflicts = [];
    currentNames.forEach((k) => {
      if (blockedActiveNames.has(k)) conflicts.push(k);
    });
    if (conflicts.length) {
      return alert(
        `You cannot use characters that are already in ACTIVE (upcoming/live) cards.\nBlocked: ${[...new Set(conflicts)].join(", ")}`
      );
    }

    const usedAcc = new Set();
    const pushUniqueByAccount = (accArr, c) => {
      const a = getAccountKey(c);
      if (!a) { accArr.push(c); return; }
      if (usedAcc.has(a)) return;
      usedAcc.add(a);
      accArr.push(c);
    };
    const characters = [];
    team1.forEach((c) => pushUniqueByAccount(characters, c));
    team2.forEach((c) => pushUniqueByAccount(characters, c));

    const charactersSet = new Set(characters.map(nameKey));
    const finalT1 = team1.filter((c) => charactersSet.has(nameKey(c)));
    const finalT1Set = new Set(finalT1.map(nameKey));
    const finalT2 = team2.filter((c) => charactersSet.has(nameKey(c)) && !finalT1Set.has(nameKey(c)));

    const newCardData = {
      title,
      date: normalizedDate,
      time: selectedTime,
      team1: finalT1,
      team2: finalT2,
      characters,
      status: "upcoming",
    };

    if (editingCardId) {
      const updated = (cards || []).map((c) => (c.id === editingCardId ? { ...c, ...newCardData } : c));
      onSaveCards(updated);
    } else {
      const newCard = { id: Date.now(), ...newCardData };
      onSaveCards([...(cards || []), newCard]);
      setCreateTitle("");
    }

    setModalOpen(false);
    setShowCal(false);
  };

  const deleteCard = (cardId) => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      onSaveCards((cards || []).filter((c) => c.id !== cardId));
    }
  };

  const openDeleteAllConfirm  = () => setConfirmAllOpen(true);
  const closeDeleteAllConfirm = () => setConfirmAllOpen(false);
  const confirmDeleteAll      = () => { onSaveCards([]); setConfirmAllOpen(false); };

  const onTeamChange = (teamKey, value) => {
    const incoming = dedupeOptionsByName((value || []).slice(0, 4));
    const otherTeamNames = teamKey === "team1" ? sel2Names : sel1Names;

    const usedAcc = new Set(usedAccountsInCard);
    const selfSelected = (teamKey === "team1" ? selectedTeam1 : selectedTeam2).map((o) => getAccountKey(o.value));
    selfSelected.forEach((a) => a && usedAcc.delete(a));

    const filtered = incoming.filter((o) => {
      const k = nameKey(o.value);
      if (effectiveBlocked.has(k)) return false;
      if (otherTeamNames.has(k)) return false;
      const a = getAccountKey(o.value);
      if (a && usedAcc.has(a)) return false;
      return true;
    });

    const ordered = filtered.sort((a, b) => nameKey(a.value).localeCompare(nameKey(b.value)));

    if (teamKey === "team1") {
      setSelectedTeam1(dedupeOptionsByName(ordered));
      setTimeout(() => setMenuOpen1(true), 0);
    } else {
      setSelectedTeam2(dedupeOptionsByName(ordered));
      setTimeout(() => setMenuOpen2(true), 0);
    }
  };

  const handleDateInput = (e) => {
    let v = e.target.value.replace(/[^\d\-\/]/g, "").replace(/\//g, "-");
    if (v.length > 5) v = v.slice(0, 5);
    if (/^\d{3,4}$/.test(v) && !v.includes("-")) v = `${v.slice(0, 2)}-${v.slice(2)}`;
    setSelectedDate(v);
    if (/^\d{2}-?$/.test(v)) {
      const m = parseInt(v.slice(0, 2), 10);
      if (m >= 1 && m <= 12) setCalMonth(m);
    }
  };

  const sortedCards = useMemo(() => {
    const dateKey = (d) => {
      if (!d) return Number.POSITIVE_INFINITY;
      const s = String(d).trim();
      if (mmddRegex.test(s)) {
        const [m, day] = s.split("-");
        return parseInt(`${m}${day}`, 10);
      }
      const y = s.match(ymdRegex);
      if (y) {
        const [, , m, day] = y;
        return parseInt(`${m}${day}`, 10);
      }
      // Evitar new Date("YYYY-MM-DD") por UTC; si viene otro formato, no forzamos orden por fecha
      return Number.POSITIVE_INFINITY;
    };
    const minutes = (t) => {
      if (!t) return Number.POSITIVE_INFINITY;
      const m = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (m) return parseInt(m[1],10)*60 + parseInt(m[2],10);
      return Number.POSITIVE_INFINITY;
    };
    const list = Array.isArray(cards) ? [...cards] : [];
    return list.sort((a,b)=>{
      const da = dateKey(a?.date), db = dateKey(b?.date);
      if (da!==db) return da-db;
      const ta = minutes(a?.time), tb = minutes(b?.time);
      if (ta!==tb) return ta-tb;
      return String(a?.title||"").localeCompare(String(b?.title||""));
    });
  }, [cards]);

  const renderOption = (opt) => {
    const note = getNote(opt.value);
    const owner = getEmailUser(opt.value);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }} title={note || undefined}>
        {opt.icon ? (
          <img src={opt.icon} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 20, height: 20, borderRadius: 4, background: "#e5e7eb" }} />
        )}
        <span>{opt.label}</span>
        {owner ? <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 12 }}>({owner})</span> : null}
        {note ? <span style={{ marginLeft: 4 }}>📩</span> : null}
      </div>
    );
  };

  const MultiValueLabel = (props) => {
    const { data } = props;
    const note = getNote(data?.value);
    const icon = data?.icon;
    const label = data?.label;
    const owner = getEmailUser(data?.value);

    return (
      <RSComponents.MultiValueLabel {...props}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {icon ? (
            <img src={icon} alt="" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "cover" }} />
          ) : null}
          <span>{label}</span>
          {owner ? <span style={{ opacity: 0.6, fontSize: 11 }}>({owner})</span> : null}
          {note ? (
            <button
              type="button"
              title="View message"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setNoteTitle(label);
                setNoteText(note);
                setNoteOpen(true);
              }}
              style={{ border: "none", background: "transparent", cursor: "pointer", lineHeight: 1, padding: 0, margin: 0 }}
            >
              📩
            </button>
          ) : null}
        </span>
      </RSComponents.MultiValueLabel>
    );
  };

  const selectComponents = { MultiValueLabel };

  // ---------- RENDER ----------
  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#34495e" }}>
      <h1 style={{ marginBottom: 20, color: "#000080", fontWeight: 700 }}>Admin Panel</h1>

      {/* Header creación */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <input
          type="text"
          placeholder="Title for new card"
          value={createTitle}
          onChange={(e) => setCreateTitle(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc", fontSize: "1rem" }}
        />
        <button
          onClick={() => openModal(null)}
          style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#1e88e5", color: "white", border: "none", borderRadius: 8, fontWeight: 600 }}
        >
          Create Card
        </button>

        <button
          onClick={() => setConfirmAllOpen(true)}
          disabled={!cards || cards.length === 0}
          title="Delete all cards"
          style={{
            padding: "10px 16px",
            cursor: !cards || cards.length === 0 ? "not-allowed" : "pointer",
            backgroundColor: !cards || cards.length === 0 ? "#ef9a9a" : "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "0.95rem",
            opacity: !cards || cards.length === 0 ? 0.7 : 1,
          }}
        >
          Delete All
        </button>
      </div>

      {/* Tarjetas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {(!sortedCards || sortedCards.length === 0) ? (
          <p>No cards created</p>
        ) : (
          sortedCards.map((card) => (
            <div key={card.id} style={{ borderRadius: 12, boxShadow: "0 12px 20px rgba(0,0,0,0.08)", backgroundColor: "#f0f5ff", padding: 12 }}>
              <div>
                <h3 title={card.title} style={{ color: "#7A5DC7", fontWeight: 700, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {card.title}
                </h3>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#000080", fontWeight: 600 }}>
                  <span>{formatMMDDWithDay(card.date) || "No asigned"}</span>
                  <span>{card.time || "No asigned"}</span>
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong style={{ color: "#7A5DC7" }}>Characters:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {(card.characters ?? []).map((c, i) => {
                      const note = getNote(c);
                      const label = typeof c?.name === "string" ? c.name : String(c);
                      return (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#bbdefb", padding: "5px 10px", borderRadius: 20, fontSize: "0.9em", fontWeight: 600, color: "#000080" }} title={note || undefined}>
                          {c?.class?.image && <img src={c.class.image} alt={c.class?.name || "Clase"} style={{ width: 18, height: 18, borderRadius: "50%" }} />}
                          {label}
                          {note ? (
                            <button
                              type="button"
                              title="View message"
                              onClick={() => { setNoteTitle(label); setNoteText(note); setNoteOpen(true); }}
                              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, margin: 0, lineHeight: 1 }}
                            >
                              📩
                            </button>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button onClick={() => openModal(card)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", backgroundColor: "#1976d2", color: "white", fontWeight: 600 }}>
                  Edit Card
                </button>
                <button onClick={() => deleteCard(card.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", backgroundColor: "#d32f2f", color: "white", fontWeight: 600 }}>
                  Delete Card
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: crear/editar */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => { setModalOpen(false); setShowCal(false); }}
        contentLabel="Configure Card"
        style={{
          content: {
            // ancho + sin scrollbar interno al abrir calendario
            maxWidth: "880px",
            width: "min(92vw, 880px)",
            margin: "auto",
            padding: 24,
            borderRadius: 14,
            height: "auto",
            inset: "60px auto auto",
            maxHeight: "calc(100vh - 120px)",
            overflow: "visible",
          },
          overlay: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 1000,
          },
        }}
      >
        <h2 style={{ marginBottom: 16 }}>{editingCardId ? "Edit Card" : "New Card"}</h2>

        {/* Título */}
        <input
          type="text"
          placeholder="Title for the card"
          value={modalTitle}
          onChange={(e) => setModalTitle(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #ccc" }}
        />

        {/* Fecha / Hora */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <label style={{ display: "block" }}>
              Date (MM-DD):
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM-DD"
                  value={selectedDate}
                  onChange={handleDateInput}
                  onBlur={() => setSelectedDate(toMMDD(selectedDate))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
                />
                <button
                  type="button"
                  onClick={() => setShowCal((s) => !s)}
                  style={{ padding: "0 12px", borderRadius: 8, border: "1px solid #ccc", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
                  aria-label="Open calendar"
                >
                  📅
                </button>
              </div>
            </label>

            {/* Popover calendario */}
            {showCal && (
              <div
                ref={calRef}
                style={{
                  position: "absolute",
                  zIndex: 1200,
                  top: "76px",
                  left: 0,
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  padding: 10,
                  width: 260,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCalMonth((m) => (m === 1 ? 12 : m - 1))}
                    style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <strong style={{ fontSize: 14, color: "#0f172a" }}>{MONTHS[calMonth - 1]}</strong>
                  <button
                    type="button"
                    onClick={() => setCalMonth((m) => (m === 12 ? 1 : m + 1))}
                    style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                  {WD.map((w) => <div key={w}>{w}</div>)}
                </div>

                {buildMonthMatrix(calMonth).map((row, ri) => (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                    {row.map((day, ci) => {
                      if (!day) return <div key={ci} />;
                      const mmdd = `${z2(calMonth)}-${z2(day)}`;
                      const isSel = toMMDD(selectedDate) === mmdd;
                      return (
                        <button
                          key={ci}
                          type="button"
                          onClick={() => { setSelectedDate(mmdd); setShowCal(false); }}
                          style={{
                            padding: "6px 0",
                            borderRadius: 8,
                            border: "1px solid " + (isSel ? "#1e88e5" : "#e5e7eb"),
                            background: isSel ? "#e3f2fd" : "white",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <label style={{ display: "block" }}>
            Time:
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </label>
        </div>

        {/* Equipos */}
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Select characters by team (max 4 per team):</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>Party 1</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{selectedTeam1.length}/4</span>
            </div>
            <Select
              key={`t1-${Array.from(usedAccountsInCard).join("|")}`}
              isMulti
              options={optionsTeam1}
              value={selectedTeam1}
              onChange={(v) => onTeamChange("team1", v)}
              placeholder="Search characters..."
              closeMenuOnSelect
              menuIsOpen={menuOpen1}
              onMenuOpen={() => setMenuOpen1(true)}
              onMenuClose={() => setMenuOpen1(false)}
              getOptionValue={(opt) => nameKey(opt.value)}
              isOptionDisabled={(opt) => {
                const k = nameKey(opt.value);
                const a = getAccountKey(opt.value);
                return effectiveBlocked.has(k)
                  || sel1Names.has(k) || sel2Names.has(k)
                  || (a && usedAccountsInCard.has(a) && !selectedNamesInCard.has(k));
              }}
              formatOptionLabel={renderOption}
              components={selectComponents}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>Party 2</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{selectedTeam2.length}/4</span>
            </div>
            <Select
              key={`t2-${Array.from(usedAccountsInCard).join("|")}`}
              isMulti
              options={optionsTeam2}
              value={selectedTeam2}
              onChange={(v) => onTeamChange("team2", v)}
              placeholder="Search characters..."
              closeMenuOnSelect
              menuIsOpen={menuOpen2}
              onMenuOpen={() => setMenuOpen2(true)}
              onMenuClose={() => setMenuOpen2(false)}
              getOptionValue={(opt) => nameKey(opt.value)}
              isOptionDisabled={(opt) => {
                const k = nameKey(opt.value);
                const a = getAccountKey(opt.value);
                return effectiveBlocked.has(k)
                  || sel1Names.has(k) || sel2Names.has(k)
                  || (a && usedAccountsInCard.has(a) && !selectedNamesInCard.has(k));
              }}
              formatOptionLabel={renderOption}
              components={selectComponents}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={() => { setModalOpen(false); setShowCal(false); }} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #ccc", backgroundColor: "white", cursor: "pointer", fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={saveModal} style={{ padding: "10px 20px", borderRadius: 8, border: "none", backgroundColor: "#1e88e5", color: "white", cursor: "pointer", fontWeight: 600 }}>
            Save
          </button>
        </div>
      </Modal>

      {/* MODAL: confirmar “eliminar todas” */}
      <Modal
        isOpen={confirmAllOpen}
        onRequestClose={closeDeleteAllConfirm}
        contentLabel="Confirm Bulk Deletion"
        style={{
          content: {
            maxWidth: "520px",
            margin: "auto",
            padding: 22,
            borderRadius: 12,
            height: "auto",
            inset: "40px auto auto",
          },
          overlay: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 1000,
          },
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 10, color: "#d32f2f" }}>Delete All Cards</h2>
        <p style={{ margin: 0 }}>
          You are about to delete <strong>{cards?.length || 0}</strong> card(s). This action <strong>cannot be undone</strong>.
        </p>
        <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>Do you wish to continue?</p>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={closeDeleteAllConfirm} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={confirmDeleteAll} style={{ padding: "10px 16px", borderRadius: 8, border: "none", backgroundColor: "#d32f2f", color: "white", cursor: "pointer", fontWeight: 700 }}>
            Yes, delete all
          </button>
        </div>
      </Modal>

      {/* MODAL: ver nota 📩  */}
      <Modal
        isOpen={noteOpen}
        onRequestClose={() => setNoteOpen(false)}
        contentLabel="Player Message"
        style={{
          content: {
            maxWidth: "640px",
            margin: "auto",
            padding: 20,
            borderRadius: 12,
            height: "auto",
            inset: "60px auto auto",
          },
          overlay: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 1100,
          },
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }} role="img" aria-label="mensaje">📩</span>
          <h3 style={{ margin: 0 }}>Message from {noteTitle}</h3>
        </div>
        <div
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
            color: "#0f172a",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
          }}
        >
          {noteText || "Sin contenido"}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button
            onClick={() => setNoteOpen(false)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </Modal>

      <MiscellaneumClasses title="Classes" sortMode="asIs" />
    </div>
  );
};

export default AdminPanel;
