"use client";

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
  winner_nominee_id?: string | null;
  nominees: Nominee[];
};

export default function QuinielaPage() {
  const supabase = supabaseBrowser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPicks, setSelectedPicks] = useState<Record<string, string>>({});

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
      <h1 style={{ marginBottom: 24 }}>Quiniela Oscars 2026</h1>

      {categories.map((cat) => (
        <div key={cat.id} style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 8 }}>
            {cat.sort_order}. {cat.name}
          </h2>

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
                    cursor: "pointer",
                    padding: 12,
                    borderRadius: 12,
                    border: borderColor,
                    background: backgroundColor,
                  }}
                >
                  <input
                    type="radio"
                    name={cat.id}
                    value={n.id}
                    checked={isPicked}
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