import React, { useState, useEffect, useMemo } from "react";
import { CLASSES, CLASS_BY_KEY } from "../constants/classes";

export default function UserProfile({ userEmail, userData, setUserData }) {
  const [newCharacter, setNewCharacter] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(""); 
  const [newLabel, setNewLabel] = useState("");         
  const [classKey, setClassKey] = useState(CLASSES[0]?.key || "");
  const [isSaving, setIsSaving] = useState(false);
  const [characterError, setCharacterError] = useState("");
  const [labelError, setLabelError] = useState("");

  // ===== Mensaje para administradores (📩) =====
  const MAX_NOTE = 500;
  const [note, setNote] = useState(userData?.note || "");
  useEffect(() => {
    setNote(userData?.note || "");
  }, [userData?.note]);

  const handleChangeNote = (e) => {
    const v = e.target.value.slice(0, MAX_NOTE);
    setNote(v);
    setUserData((prev) => {
      const updatedChars = Array.isArray(prev?.characters)
        ? prev.characters.map((c) => ({ ...c, userNote: v }))
        : [];
      const newData = { ...prev, note: v, characters: updatedChars };
      setIsSaving(true);
      return newData;
    });
  };

  // utilidades
  const normalize = (s) => s?.trim().toLowerCase();
  const labels = useMemo(
    () => (Array.isArray(userData?.labels) ? userData.labels : []),
    [userData]
  );
  const hasLabel = (name) => labels.some((l) => normalize(l) === normalize(name));

  // Mostrar estado de guardado temporalmente
  useEffect(() => {
    if (isSaving) {
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isSaving]);

  // ===== Crear personaje =====
  const handleAddCharacter = (e) => {
    e.preventDefault();

    const characterName = newCharacter.trim();
    const characterLabel = selectedLabel.trim();

    if (!characterName) {
      setCharacterError("Enter a name for the character");
      return;
    }
    if (!characterLabel) {
      setLabelError("Select a label from the dropdown");
      return;
    }

    const selectedClass = CLASS_BY_KEY[classKey] || null;

    setCharacterError("");
    setLabelError("");

    setUserData((prev) => {
      const newData = {
        ...prev,
        characters: [
          ...prev.characters,
          {
            name: characterName,
            label: characterLabel,
            class: selectedClass ? { ...selectedClass } : null,
            userNote: prev?.note || "",
          },
        ],
      };
      setIsSaving(true);
      return newData;
    });

    setNewCharacter("");
    setSelectedLabel("");
    setClassKey(CLASSES[0]?.key || "");
  };

  // ===== Eliminar personaje =====
  const handleRemoveCharacter = (index) => {
    setUserData((prev) => {
      const newData = {
        ...prev,
        characters: prev.characters.filter((_, i) => i !== index),
      };
      setIsSaving(true);
      return newData;
    });
  };

  // ===== Cambiar label de un personaje YA creado =====
  const handleChangeCharacterLabel = (index, newLbl) => {
    if (!newLbl || !hasLabel(newLbl)) return; 
    setUserData((prev) => {
      const chars = prev.characters.map((c, i) =>
        i === index ? { ...c, label: newLbl } : c
      );
      const newData = { ...prev, characters: chars };
      setIsSaving(true);
      return newData;
    });
  };

  // ===== Catálogo: agregar/eliminar labels =====
  const handleAddLabel = (e) => {
    e.preventDefault();
    const trimmed = newLabel.trim();
    if (!trimmed) {
      setLabelError("Enter a valid label");
      return;
    }
    if (hasLabel(trimmed)) {
      setLabelError("This label already exists");
      return;
    }

    setLabelError("");
    setUserData((prev) => {
      const updated = [...prev.labels, trimmed].sort((a, b) =>
        a.localeCompare(b, "es")
      );
      const newData = { ...prev, labels: updated };
      setIsSaving(true);
      return newData;
    });
    setNewLabel("");
  };

  const handleRemoveLabel = (index) => {
    const labelToRemove = userData.labels[index];
    setUserData((prev) => {
      const newData = {
        ...prev,
        characters: prev.characters.filter(
          (c) => normalize(c.label) !== normalize(labelToRemove)
        ),
        labels: prev.labels.filter((_, i) => i !== index),
      };
      setIsSaving(true);
      return newData;
    });

    if (normalize(selectedLabel) === normalize(labelToRemove)) {
      setSelectedLabel("");
    }
  };

  // helper para leer nota
  const getNote = (obj) => obj?.userNote || obj?.note || obj?.profileNote || "";

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "20px auto",
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 15px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      {/* Overlay de guardado */}
      {isSaving && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            Saving…
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2
          style={{
            margin: 0,
            paddingBottom: "10px",
            borderBottom: "2px solid #f0f0f0",
            color: "#2c3e50",
          }}
        >
          Profile of {userEmail}
        </h2>

        <div
          style={{
            background: "#e8f4fe",
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#3498db",
            fontWeight: "500",
          }}
        >
          {userData.characters.length} character(s)
        </div>
      </div>

      {/* 📩 MENSAJE PARA ADMINISTRADORES (auto guardado) */}
      <section style={{ marginTop: 18 }}>
        <h3 style={{ margin: 0, color: "#2c3e50" }}>Message for Administrators</h3>
        <p style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
          Write here your availability this week (only visible for admins).
        </p>

        <textarea
          value={note}
          onChange={handleChangeNote}
          rows={3}
          placeholder="Ex. holidays this week, gonna be out until Friday"
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 6,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
          {note.length}/{MAX_NOTE}
        </div>

        {note.trim() && (
          <div
            style={{
              marginTop: 10,
              padding: "10px",
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              background: "#f8fafc",
              color: "#0f172a",
              fontSize: 14,
            }}
          >
            <strong>Preview:</strong> {note}
          </div>
        )}
      </section>

      <section style={{ marginTop: "30px" }}>
        <h3 style={{ color: "#34495e", marginBottom: "15px" }}>Characters with Labels</h3>

        {userData.characters.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px dashed #ddd",
            }}
          >
            <p style={{ color: "#7f8c8d", marginBottom: "15px" }}>
              No characters have been created yet
            </p>
            <div style={{ fontSize: "48px", color: "#ecf0f1" }}>🐳</div>
          </div>
        ) : (
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "#fafafa",
            }}
          >
            {userData.characters.map((ch, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 15px",
                  backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9",
                  borderRadius: "6px",
                  marginBottom: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
                title={getNote(ch) || undefined}
              >
                {/* IZQUIERDA: icono clase + nombre + chip label + selector editable */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {ch.class?.image && (
                      <img
                        src={ch.class.image}
                        alt={ch.class?.name || "Class"}
                        style={{ width: 26, height: 26, borderRadius: "50%" }}
                      />
                    )}
                    <div style={{ fontWeight: 600, fontSize: 16, whiteSpace: "nowrap" }}>
                      {ch.name} {getNote(ch) ? <span title={getNote(ch)}>📩</span> : null}
                    </div>

                    {/* Chip actual */}
                    {ch.label && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#e0f7fa",
                          color: "#0097a7",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "13px",
                        }}
                      >
                        {ch.label}
                      </div>
                    )}
                  </div>

                  {/* Selector para EDITAR label del personaje */}
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 12, color: "#64748b" }}>Edit label:</label>
                    <select
                      value={ch.label || ""}
                      onChange={(e) => handleChangeCharacterLabel(i, e.target.value)}
                      disabled={labels.length === 0}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        background: "#fff",
                      }}
                      title={
                        labels.length === 0
                          ? "First, create a label in the section below"
                          : "Change character label"
                      }
                    >
                      {labels.length === 0 ? (
                        <option value="">No labels</option>
                      ) : (
                        labels.map((lbl, idx) => (
                          <option key={idx} value={lbl}>
                            {lbl}
                          </option>
                        ))
                      )}
                    </select>

                    {ch.class && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b" }}>
                        Class: <strong>{ch.class.name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* DERECHA: eliminar */}
                <button
                  onClick={() => handleRemoveCharacter(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e74c3c",
                    cursor: "pointer",
                    fontSize: "20px",
                    padding: "5px 10px",
                  }}
                  title="Remove Character"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form crear personaje */}
        <form onSubmit={handleAddCharacter} style={{ marginTop: "25px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#34495e" }}>
                Character Name
              </label>
              <input
                type="text"
                placeholder="E.g. GazooWhale"
                value={newCharacter}
                onChange={(e) => {
                  setNewCharacter(e.target.value);
                  setCharacterError("");
                }}
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  border: characterError ? "1px solid #e74c3c" : "1px solid #ddd",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              {characterError && (
                <div style={{ color: "#e74c3c", fontSize: 13, marginTop: 5 }}>{characterError}</div>
              )}
            </div>

            {/* Desplegable de etiquetas existentes */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#34495e" }}>
                Label
              </label>
              <select
                value={selectedLabel}
                onChange={(e) => {
                  setSelectedLabel(e.target.value);
                  setLabelError("");
                }}
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  border: labelError ? "1px solid #e74c3c" : "1px solid #ddd",
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="" disabled>
                  {labels.length === 0 ? "No labels — create one below" : "Select a label"}
                </option>
                {labels.map((label, i) => (
                  <option key={i} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              {labelError && (
                <div style={{ color: "#e74c3c", fontSize: 13, marginTop: 5 }}>{labelError}</div>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#34495e" }}>
                Class
              </label>
              <select
                value={classKey}
                onChange={(e) => setClassKey(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {CLASSES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ alignSelf: "flex-end" }}>
              <button
                type="submit"
                style={{
                  padding: "12px 20px",
                  background: "#2ecc71",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  width: "100%",
                }}
                disabled={labels.length === 0}
                title={labels.length === 0 ? "First, create a label in the section below" : undefined}
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </section>

      <section style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ color: "#34495e", marginBottom: "15px" }}>My Labels</h3>
          <div
            style={{
              background: "#e8f4fe",
              padding: "5px 10px",
              borderRadius: "4px",
              fontSize: "14px",
              color: "#3498db",
              fontWeight: "500",
            }}
          >
            {labels.length} label(s)
          </div>
        </div>

        {labels.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px dashed #ddd",
            }}
          >
            <p style={{ color: "#7f8c8d" }}>
              Create labels to organize your characters. You can then select them in the form.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              padding: "15px",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              border: "1px solid #eee",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {labels.map((label, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#e0f7fa",
                  borderRadius: "20px",
                  padding: "6px 15px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <span style={{ color: "#0097a7", fontWeight: 500 }}>{label}</span>
                <button
                  onClick={() => handleRemoveLabel(i)}
                  style={{
                    marginLeft: "10px",
                    background: "none",
                    border: "none",
                    color: "#e74c3c",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "0 5px",
                  }}
                  title="Remove Label"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Nueva Etiqueta (catálogo) */}
        <form onSubmit={handleAddLabel} style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#34495e" }}>
                New Label
              </label>
              <input
                type="text"
                placeholder="E.g. Thaemine HM, Brel HM, Mordum HM..."
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value);
                  setLabelError("");
                }}
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  border: labelError ? "1px solid #e74c3c" : "1px solid #ddd",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <small style={{ color: "#64748b" }}>
                It will be added to the catalog and will be available in the dropdown above.
              </small>
              {labelError && (
                <div style={{ color: "#e74c3c", fontSize: 13, marginTop: 5 }}>{labelError}</div>
              )}
            </div>

            <div style={{ alignSelf: "flex-end" }}>
              <button
                type="submit"
                style={{
                  padding: "12px 20px",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </section>

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#7f8c8d",
          borderLeft: "4px solid #3498db",
        }}
      >
        <strong>Note:</strong> All changes are saved automatically. Removing a label will also delete the associated characters.
      </div>
    </div>
  );
}
