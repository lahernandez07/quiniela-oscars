"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Nominee = {
  id: string;
  label: string;
  image_url?: string | null;
};

type Category = {
  id: string;
  name: string;
  sort_order: number;
  winner_nominee_id?: string | null;
  nominees: Nominee[];
};

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  // refs para cada sección de categoría (para scroll suave)
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      setCategories(data);
    }

    loadCategories();
  }, []);

  const confirmedWinners = categories.filter(
    (cat) => !!cat.winner_nominee_id
  ).length;

  // categorías para la barra: pendientes primero, luego resueltas
  const navCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aDone = !!a.winner_nominee_id;
      const bDone = !!b.winner_nominee_id;

      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.sort_order - b.sort_order;
    });
  }, [categories]);

  // al hacer click en la barra, saltamos a la categoría
  function scrollToCategory(catId: string) {
    const el = catRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveCatId(catId);
    }
  }

  // encontrar la siguiente categoría pendiente
  function getNextPendingCategory(currentId: string) {
    const pending = categories.filter((c) => !c.winner_nominee_id);
    const index = pending.findIndex((c) => c.id === currentId);
    return pending[index + 1];
  }

  async function setWinner(categoryId: string, nomineeId: string) {
    try {
      setSavingKey(`${categoryId}-${nomineeId}`);

      const res = await fetch("/api/winners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: categoryId,
          nominee_id: nomineeId,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar el ganador");
      }

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? { ...cat, winner_nominee_id: nomineeId }
            : cat
        )
      );

      alert("Ganador guardado");

      // auto-scroll al siguiente premio pendiente
      const next = getNextPendingCategory(categoryId);
      if (next) {
        setTimeout(() => scrollToCategory(next.id), 400);
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el ganador");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        fontFamily: "sans-serif",
        padding: "0 260px 0 16px", // espacio para la barra lateral
        color: "white",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Admin — Ganadores Oscars</h1>
          <p style={{ marginTop: 8, color: "#aaa" }}>
            Selecciona el ganador oficial por categoría.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #444",
              background: "#161616",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Inicio
          </Link>

          <Link
            href="/leaderboard"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #444",
              background: "#161616",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Ver tablero
          </Link>
        </div>
      </div>

      {/* BARRA LATERAL */}

      <div
        style={{
          position: "fixed",
          right: 20,
          top: 120,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 14,
          borderRadius: 14,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
          maxHeight: "75vh",
          overflowY: "auto",
          width: 220,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 8,
            color: "#d1d5db",
          }}
        >
          {confirmedWinners}/{categories.length} premios
        </div>

        {navCategories.map((cat) => {
          const hasWinner = !!cat.winner_nominee_id;
          const isActive = activeCatId === cat.id;

          return (
            <button
              key={`jump-${cat.id}`}
              onClick={() => scrollToCategory(cat.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                textAlign: "left",
                cursor: "pointer",
                background: hasWinner
                  ? "#4ade80"
                  : isActive
                  ? "#1d4ed8"
                  : "#374151",
                color: hasWinner ? "#052e16" : "white",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* CATEGORÍAS */}

      {categories.map((cat) => (
        <div
          id={`cat-${cat.id}`}
          key={cat.id}
          ref={(el) => (catRefs.current[cat.id] = el)}
          style={{ marginBottom: 40 }}
        >
          <div
            style={{
              display: "inline-block",
              marginBottom: 12,
              padding: "10px 16px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              color: "white",
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            🏆 {cat.sort_order}. {cat.name}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginTop: 16,
            }}
          >
            {cat.nominees.map((n) => {
              const isWinner = cat.winner_nominee_id === n.id;
              const hasImage = !!n.image_url && n.image_url.trim() !== "";
              const isSaving = savingKey === `${cat.id}-${n.id}`;

              return (
                <label
                  key={n.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    cursor: isSaving ? "wait" : "pointer",
                    padding: 12,
                    borderRadius: 12,
                    border: isWinner ? "2px solid #facc15" : "1px solid #444",
                    background: isWinner ? "#2a2410" : "#111",
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name={cat.id}
                    checked={isWinner}
                    onChange={() => setWinner(cat.id, n.id)}
                    style={{ display: "none" }}
                  />

                  <div style={{ position: "relative" }}>
                    {hasImage ? (
                      <Image
                        src={n.image_url as string}
                        alt={n.label}
                        width={180}
                        height={270}
                        style={{
                          objectFit: "cover",
                          borderRadius: 4,
                          border: "1px solid #444",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 180,
                          height: 270,
                          borderRadius: 4,
                          background: "#1f1f1f",
                          border: "1px solid #444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#aaa",
                          fontSize: 12,
                        }}
                      >
                        No poster
                      </div>
                    )}

                    {isWinner && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          background: "#facc15",
                          color: "#000",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        🏆 GANADOR
                      </div>
                    )}

                    {isSaving && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#2563eb",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        Guardando...
                      </div>
                    )}
                  </div>

                  <span style={{ fontWeight: 600, textAlign: "center" }}>
                    {n.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}