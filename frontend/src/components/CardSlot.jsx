// CardSlot.jsx
import React from "react";
import Modal from "react-modal";
import Select, { components as RSComponents } from "react-select";

Modal.setAppElement("#root");

const SPECIAL_TAIL = new Set(["Bard", "Paladin", "Artist", "Valkyrie"]);

// Días en inglés (como en la captura)
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// nameKey / email helpers
const nameKey = (c) => {
  if (!c) return "";
  if (typeof c === "string") return c.trim().toLowerCase();
  if (typeof c.name === "string") return c.name.trim().toLowerCase();
  return "";
};
const getNote = (obj) => obj?.userNote || obj?.note || obj?.profileNote || "";
const getEmail = (obj) => String(obj?.ownerEmail || obj?.email || "").trim().toLowerCase();

const sortTeam = (arr = []) => {
  const withIndex = arr.map((c, i) => ({ c, i }));
  withIndex.sort((a, b) => {
    const aIsTail = SPECIAL_TAIL.has(a.c?.class?.name);
    const bIsTail = SPECIAL_TAIL.has(b.c?.class?.name);
    if (aIsTail !== bIsTail) return aIsTail ? 1 : -1;
    return a.i - b.i;
  });
  return withIndex.map((x) => x.c);
};

const dedupeCharsByName = (arr = []) => {
  const seen = new Set(); const out = [];
  for (const c of arr) {
    const k = nameKey(c);
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(c);
  }
  return out;
};
const dedupeOptionsByName = (opts = []) => {
  const seen = new Set(); const out = [];
  for (const o of opts) {
    const k = nameKey(o?.value);
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(o);
  }
  return out;
};

// Devuelve "MM-DD Friday"
const formatDayMonth = (value) => {
  if (!value) return "Date not assigned";
  const s = String(value).trim();

  // parseable por Date (incluye ISO yyyy-mm-dd)
  const d1 = new Date(s);
  if (!isNaN(d1)) {
    const mm = String(d1.getMonth() + 1).padStart(2, "0");
    const dd = String(d1.getDate()).padStart(2, "0");
    const wd = WEEKDAYS[d1.getDay()];
    return `${mm}-${dd} ${wd}`;
  }

  // "yyyy-mm-dd"
  const parts = s.split("-");
  if (parts.length === 3) {
    const [, m, d] = parts;
    const year = new Date().getFullYear();
    const dt = new Date(year, Number(m) - 1, Number(d));
    if (!isNaN(dt)) {
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const wd = WEEKDAYS[dt.getDay()];
      return `${mm}-${dd} ${wd}`;
    }
    return `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // "MM-DD"
  if (parts.length === 2) {
    const [m, d] = parts;
    const year = new Date().getFullYear();
    const dt = new Date(year, Number(m) - 1, Number(d));
    if (!isNaN(dt)) {
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const wd = WEEKDAYS[dt.getDay()];
      return `${mm}-${dd} ${wd}`;
    }
  }

  return s;
};

/**
 * Props:
 *  - card
 *  - allCharacters
 *  - onUpdateCardData(cardId, partial)
 *  - onDeleteCard(cardId)
 *  - blockedNames?: Set<string>
 */
const CardSlot = ({ card, allCharacters = [], onUpdateCardData, onDeleteCard, blockedNames }) => {
  // Estado modal de nota 📩
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [noteTitle, setNoteTitle] = React.useState("");

  // Equipos base
  const baseTeam1 = Array.isArray(card.team1)
    ? card.team1
    : Array.isArray(card.characters)
    ? card.characters.slice(0, 4)
    : [];
  const baseTeam2 = Array.isArray(card.team2)
    ? card.team2
    : Array.isArray(card.characters)
    ? card.characters.slice(4, 8)
    : [];

  const initialT1 = React.useMemo(() => dedupeCharsByName(sortTeam(baseTeam1)).slice(0, 4), [baseTeam1]);
  const initialT2 = React.useMemo(() => {
    const t1Set = new Set(initialT1.map(nameKey));
    return dedupeCharsByName(sortTeam(baseTeam2)).filter((c) => !t1Set.has(nameKey(c))).slice(0, 4);
  }, [baseTeam2, initialT1]);

  const [t1Local, setT1Local] = React.useState(initialT1);
  const [t2Local, setT2Local] = React.useState(initialT2);
  React.useEffect(() => setT1Local(initialT1), [initialT1]);
  React.useEffect(() => setT2Local(initialT2), [initialT2]);

  // Opciones con icono
  const baseOptions = React.useMemo(
    () =>
      (allCharacters || []).map((char) => ({
        value: char,
        label: typeof char?.name === "string" ? char.name : String(char || ""),
        icon: char?.class?.image || null,
      })),
    [allCharacters]
  );

  const t1Names = React.useMemo(() => new Set(t1Local.map(nameKey)), [t1Local]);
  const t2Names = React.useMemo(() => new Set(t2Local.map(nameKey)), [t2Local]);

  // emails usados en ESTA tarjeta
  const usedEmailsInCard = React.useMemo(() => {
    const s = new Set();
    t1Local.forEach((c) => { const e = getEmail(c); if (e) s.add(e); });
    t2Local.forEach((c) => { const e = getEmail(c); if (e) s.add(e); });
    return s;
  }, [t1Local, t2Local]);

  const selectedNamesInCard = React.useMemo(() => {
    const s = new Set();
    t1Local.forEach((c) => s.add(nameKey(c)));
    t2Local.forEach((c) => s.add(nameKey(c)));
    return s;
  }, [t1Local, t2Local]);

  const blockedEffective = React.useMemo(() => {
    const s = new Set(blockedNames || []);
    t1Local.forEach((c) => s.delete(nameKey(c)));
    t2Local.forEach((c) => s.delete(nameKey(c)));
    return s;
  }, [blockedNames, t1Local, t2Local]);

  // Opciones filtradas
  const optionsFiltered = React.useMemo(() => {
    const filtered = baseOptions.filter((opt) => {
      const k = nameKey(opt.value);
      if (blockedEffective.has(k)) return false;
      if (t1Names.has(k) || t2Names.has(k)) return false;

      const e = getEmail(opt.value);
      if (e && usedEmailsInCard.has(e) && !selectedNamesInCard.has(k)) return false;

      return true;
    });
    return dedupeOptionsByName(filtered);
  }, [baseOptions, t1Names, t2Names, blockedEffective, usedEmailsInCard, selectedNamesInCard]);

  const selectedTeam1 = React.useMemo(
    () =>
      t1Local.map((c) => ({
        value: c,
        label: typeof c?.name === "string" ? c.name : String(c || ""),
        icon: c?.class?.image || null,
      })),
    [t1Local]
  );
  const selectedTeam2 = React.useMemo(
    () =>
      t2Local.map((c) => ({
        value: c,
        label: typeof c?.name === "string" ? c.name : String(c || ""),
        icon: c?.class?.image || null,
      })),
    [t2Local]
  );

  // Persistencia con validación
  const persist = (newT1, newT2) => {
    const team1 = dedupeCharsByName(sortTeam(newT1)).slice(0, 4);
    const t1Set = new Set(team1.map(nameKey));
    const team2 = dedupeCharsByName(sortTeam(newT2)).filter((c) => !t1Set.has(nameKey(c))).slice(0, 4);

    // bloqueos globales
    const current = [...team1, ...team2].map(nameKey);
    const conflicts = current.filter((k) => blockedEffective.has(k));
    if (conflicts.length) {
      alert(`You cannot use characters that are already in ACTIVE cards (upcoming/live).\nBlocked: ${Array.from(new Set(conflicts)).join(", ")}`);
      return;
    }

    // Regla de cuenta por email
    const emails = new Set();
    const byEmail = [];
    const pushUniqueByEmail = (c) => {
      const e = getEmail(c);
      if (!e) { byEmail.push(c); return; }
      if (emails.has(e)) return;
      emails.add(e);
      byEmail.push(c);
    };
    [...team1, ...team2].forEach(pushUniqueByEmail);

    // Re-armar teams según conjunto final
    const finalSet = new Set(byEmail.map(nameKey));
    const finalT1 = team1.filter((c) => finalSet.has(nameKey(c)));
    const finalT1Set = new Set(finalT1.map(nameKey));
    const finalT2 = team2.filter((c) => finalSet.has(nameKey(c)) && !finalT1Set.has(nameKey(c)));

    setT1Local(finalT1);
    setT2Local(finalT2);
    onUpdateCardData(card.id, { team1: finalT1, team2: finalT2, characters: dedupeCharsByName([...finalT1, ...finalT2]) });
  };

  const handleTeamChange = (teamKey, selected) => {
    const incoming = dedupeOptionsByName((selected || []).slice(0, 4)).map((o) => o.value);

    // emails ya usados en la tarjeta (excluir los del propio team que estoy cambiando)
    const usedEmails = new Set(usedEmailsInCard);
    if (teamKey === "team1") {
      t1Local.forEach((c) => usedEmails.delete(getEmail(c)));
      const t2Set = new Set(t2Local.map(nameKey));
      const newT1 = dedupeCharsByName(
        incoming.filter((c) => {
          const k = nameKey(c);
          const e = getEmail(c);
          if (t2Set.has(k)) return false;
          if (blockedEffective.has(k)) return false;
          if (e && usedEmails.has(e)) return false; // descarta otros del mismo dueño
          return true;
        })
      );
      persist(newT1, t2Local);
    } else {
      t2Local.forEach((c) => usedEmails.delete(getEmail(c)));
      const t1Set = new Set(t1Local.map(nameKey));
      const newT2 = dedupeCharsByName(
        incoming.filter((c) => {
          const k = nameKey(c);
          const e = getEmail(c);
          if (t1Set.has(k)) return false;
          if (blockedEffective.has(k)) return false;
          if (e && usedEmails.has(e)) return false;
          return true;
        })
      );
      persist(t1Local, newT2);
    }
  };

  const handleDateChange = (e) => onUpdateCardData(card.id, { date: e.target.value });
  const handleTimeChange = (e) => onUpdateCardData(card.id, { time: e.target.value });

  // Render de opción (menú) con icono + indicador 📩
  const renderOption = (opt) => {
    const note = getNote(opt.value);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }} title={note || undefined}>
        {opt.icon ? (
          <img src={opt.icon} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 20, height: 20, borderRadius: 4, background: "#e5e7eb" }} />
        )}
        <span>{opt.label}</span>
        {note ? <span style={{ marginLeft: 4 }}>📩</span> : null}
      </div>
    );
  };

  // Chips seleccionadas: botón 📩 clickeable
  const MultiValueLabel = (props) => {
    const { data } = props;
    const note = getNote(data?.value);
    const icon = data?.icon;
    const label = data?.label;

    return (
      <RSComponents.MultiValueLabel {...props}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {icon ? <img src={icon} alt="" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "cover" }} /> : null}
          <span>{label}</span>
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

  const Item = ({ character }) => {
    if (!character) return null;
    const label = typeof character?.name === "string" ? character.name : String(character || "");
    const note = getNote(character);

    return (
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          minHeight: 80,
        }}
        title={note || label}
      >
        {character?.class?.image ? (
          <img
            src={character.class.image}
            alt={character.class?.name || "Class"}
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#e5e7eb",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            ?
          </div>
        )}

        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: "#0f172a",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>{label}</span>
          {note ? (
            <button
              type="button"
              title="Leer mensaje"
              onClick={() => { setNoteTitle(label); setNoteText(note); setNoteOpen(true); }}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, margin: 0, lineHeight: 1 }}
            >
              📩
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        border: `2px dashed #ccc`,
        padding: 15,
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: "#fff",
        minHeight: 150,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{card.title}</h3>
        <button
          onClick={() => onDeleteCard(card.id)}
          style={{ background: "#ff4d4d", color: "white", border: "none", borderRadius: 4, padding: "5px 10px", cursor: "pointer" }}
        >
          Delete
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#607d8b", fontWeight: 600, marginTop: 6 }}>
        <span>{card.date ? formatDayMonth(card.date) : "Date not assigned"}</span>
        <span>{card.time || "Time not assigned"}</span>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "10px 0" }}>
        <div>
          <label>Date: </label>
          <input type="date" value={card.date || ""} onChange={(e) => onUpdateCardData(card.id, { date: e.target.value })} style={{ padding: 5 }} />
        </div>
        <div>
          <label>Time: </label>
          <input type="time" value={card.time || ""} onChange={(e) => onUpdateCardData(card.id, { time: e.target.value })} style={{ padding: 5 }} />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <strong>Characters by team (max 4 per team, no repeated names; ocultar otros del mismo email)</strong>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 10, alignItems: "start" }}>
          {/* TEAM 1 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>Party 1</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{t1Local.length}/4</span>
            </div>
            <Select
              isMulti
              options={optionsFiltered}
              value={selectedTeam1}
              onChange={(v) => handleTeamChange("team1", v)}
              placeholder="Select characters..."
              closeMenuOnSelect={false}
              getOptionValue={(opt) => nameKey(opt.value)}
              isOptionDisabled={(opt) => {
                const k = nameKey(opt.value);
                const e = getEmail(opt.value);
                return blockedEffective.has(k)
                  || t1Names.has(k) || t2Names.has(k)
                  || (e && usedEmailsInCard.has(e) && !selectedNamesInCard.has(k));
              }}
              formatOptionLabel={renderOption}
              components={selectComponents}
            />
            <div style={{ display: "grid", gridTemplateRows: "repeat(4, minmax(0, auto))", gap: 10, marginTop: 10 }}>
              {t1Local.map((character, idx) => (
                <Item key={`team1-${idx}-${nameKey(character)}`} character={character} />
              ))}
            </div>
          </div>

          {/* TEAM 2 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>Party 2</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{t2Local.length}/4</span>
            </div>
            <Select
              isMulti
              options={optionsFiltered}
              value={selectedTeam2}
              onChange={(v) => handleTeamChange("team2", v)}
              placeholder="Selecciona personajes..."
              closeMenuOnSelect={false}
              getOptionValue={(opt) => nameKey(opt.value)}
              isOptionDisabled={(opt) => {
                const k = nameKey(opt.value);
                const e = getEmail(opt.value);
                return blockedEffective.has(k)
                  || t1Names.has(k) || t2Names.has(k)
                  || (e && usedEmailsInCard.has(e) && !selectedNamesInCard.has(k));
              }}
              formatOptionLabel={renderOption}
              components={selectComponents}
            />
            <div style={{ display: "grid", gridTemplateRows: "repeat(4, minmax(0, auto))", gap: 10, marginTop: 10 }}>
              {t2Local.map((character, idx) => (
                <Item key={`team2-${idx}-${nameKey(character)}`} character={character} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ver nota 📩 */}
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
          {noteText || "No content"}
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
    </div>
  );
};

export default CardSlot;
