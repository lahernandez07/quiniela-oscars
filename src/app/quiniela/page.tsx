"use client";

import { isPicksLocked } from "@/lib/deadline";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useEffect, useState } from "react";
import Image from "next/image";

type Nominee = {
  id: string;
  label: string;
  image_url?: string | null;
};

type Category = {
  id: string;
  name: string;
  sort_order: number;
  points?: number | null;
  winner_nominee_id?: string | null;
  nominees: Nominee[];
};

export default function QuinielaPage() {
  const picksLocked = isPicksLocked();
  const supabase = supabaseBrowser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPicks, setSelectedPicks] = useState<Record<string, string>>(
    {}
  );

  const totalCategories = categories.length;
  const completedCategories = categories.filter(
    (cat) => !!selectedPicks[cat.id]
  ).length;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function loadUserPicks() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data, error } = await supabase
      .from("picks")
      .select("category_id, nominee_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error cargando picks:", error);
      return;
    }

    const picksMap: Record<string, string> = {};

    data.forEach((p) => {
      picksMap[p.category_id] = p.nominee_id;
    });

    setSelectedPicks(picksMap);
  }

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    }

    loadCategories();
    loadUserPicks();
  }, []);

  async function savePick(categoryId: string, nomineeId: string) {
    if (picksLocked) {
      alert("La quiniela ya está cerrada.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }

    const { error } = await supabase.from("picks").upsert({
      user_id: user.id,
      category_id: categoryId,
      nominee_id: nomineeId,
    });

    if (error) {
      console.error("Error guardando pick:", error);
      alert("No se pudo guardar tu selección");
      return;
    }

    setSelectedPicks((prev) => ({
      ...prev,
      [categoryId]: nomineeId,
    }));
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        fontFamily: "sans-serif",
        padding: "0 16px",
        color: "white",
      }}
    >
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
        <h1 style={{ margin: 0 }}>Quiniela Oscars 2026</h1>

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
            Ver tablero en vivo
          </Link>

          <button
            onClick={signOut}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #444",
              background: "#2a1414",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          top: 12,
          zIndex: 50,
          marginBottom: 24,
          padding: "16px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            Progreso de selección
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#d1d5db",
              fontWeight: 600,
            }}
          >
            Picks completados: {completedCategories}/{totalCategories}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {categories.map((cat) => {
            const isCompleted = !!selectedPicks[cat.id];

            return (
              <a
                key={`jump-${cat.id}`}
                href={`#cat-${cat.id}`}
                style={{
                  width: 36,
                  height: 36,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  color: isCompleted ? "#052e16" : "white",
                  background: isCompleted ? "#4ade80" : "#374151",
                  border: isCompleted
                    ? "1px solid #22c55e"
                    : "1px solid rgba(255,255,255,0.12)",
                }}
                title={`${cat.sort_order}. ${cat.name}`}
              >
                {cat.sort_order}
              </a>
            );
          })}
        </div>
      </div>

      {picksLocked && (
        <div
          style={{
            background: "#7f1d1d",
            color: "white",
            padding: "12px 16px",
            marginBottom: 24,
            borderRadius: 10,
            border: "1px solid #ef4444",
            fontWeight: 600,
          }}
        >
          La quiniela está cerrada. Ya no se pueden modificar picks.
        </div>
      )}

      {categories.map((cat) => (
        <div id={`cat-${cat.id}`} key={cat.id} style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: 12,
              padding: "10px 16px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              color: "white",
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.15)",
              letterSpacing: "0.3px",
            }}
          >
            <span>🏆 {cat.sort_order}. {cat.name}</span>
            <span
              style={{
                fontSize: 12,
                color: "#facc15",
                fontWeight: 700,
              }}
            >
              Valor: {cat.points ?? 0} pts
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}
          >
            {cat.nominees.map((n) => {
              const isPicked = selectedPicks[cat.id] === n.id;
              const isWinner = cat.winner_nominee_id === n.id;
              const hasWinner = !!cat.winner_nominee_id;
              const isCorrect = isPicked && isWinner;
              const isWrong = isPicked && hasWinner && !isWinner;
              const hasImage = !!n.image_url && n.image_url.trim() !== "";

              let borderColor = "1px solid #444";
              let backgroundColor = "#111";

              if (isCorrect) {
                borderColor = "2px solid #22c55e";
                backgroundColor = "#13261a";
              } else if (isWrong) {
                borderColor = "2px solid #ef4444";
                backgroundColor = "#2a1414";
              } else if (isWinner) {
                borderColor = "2px solid #facc15";
                backgroundColor = "#2a2410";
              } else if (isPicked) {
                borderColor = "2px solid #22c55e";
                backgroundColor = "#1a2e22";
              }

              return (
                <label
                  key={n.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    cursor: picksLocked ? "not-allowed" : "pointer",
                    padding: 12,
                    borderRadius: 12,
                    border: borderColor,
                    background: backgroundColor,
                    opacity: picksLocked ? 0.95 : 1,
                  }}
                >
                  <input
                  type="radio"
                  name={cat.id}
                  value={n.id}
                  checked={isPicked}
                  disabled={picksLocked}
                  onChange={() => savePick(cat.id, n.id)}
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
                          display: "block",
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
                          fontWeight: 600,
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

                    {isCorrect && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#22c55e",
                          color: "#000",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        ✅ ACERTASTE
                      </div>
                    )}

                    {!hasWinner && isPicked && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#22c55e",
                          color: "#000",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        ✓ PICK
                      </div>
                    )}

                    {isWrong && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#ef4444",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        ❌ FALLASTE
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{n.label}</span>

                    {!hasWinner && isPicked && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#4ade80",
                          fontWeight: "bold",
                          marginTop: 4,
                        }}
                      >
                        Tu pick
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}