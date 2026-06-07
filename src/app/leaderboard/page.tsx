"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  exact_scores: number;
};

type LeaderboardCut = "general" | "1" | "2" | "3";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCut, setActiveCut] = useState<LeaderboardCut>("general");

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);

        const query =
          activeCut === "general"
            ? "/api/leaderboard"
            : `/api/leaderboard?cut=${activeCut}`;

        const response = await fetch(query);
        const json = await response.json();

        const normalizedRows = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.leaderboard)
              ? json.leaderboard
              : [];

        setRows(normalizedRows);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [activeCut]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.92)), url('/worldcup-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "40px 16px",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                color: "gold",
                fontWeight: 900,
                fontSize: 13,
                marginBottom: 6,
                letterSpacing: 1,
              }}
            >
              TABLA GENERAL
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(34px, 5vw, 56px)",
              }}
            >
              Leaderboard Mundial 2026
            </h1>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                background: "black",
                color: "white",
                border: "1px solid gray",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Inicio
            </Link>

            <Link
              href="/quiniela"
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                background: "limegreen",
                color: "black",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              Ir a Quiniela
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 26,
          }}
        >
          {[
            { key: "general", label: "General" },
            { key: "1", label: "Corte 1" },
            { key: "2", label: "Corte 2" },
            { key: "3", label: "Corte 3" },
          ].map((tab) => {
            const active = activeCut === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveCut(tab.key as LeaderboardCut)}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: active
                    ? "1px solid limegreen"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: active ? "limegreen" : "rgba(0,0,0,0.72)",
                  color: active ? "black" : "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={emptyCardStyle}>Cargando leaderboard...</div>
        ) : rows.length === 0 ? (
          <div style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Todavía no hay resultados</h2>
            <p style={{ color: "lightgray", marginBottom: 0 }}>
              Cuando comiencen a registrarse puntos aparecerá el ranking.
            </p>
          </div>
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 18,
                marginBottom: 36,
              }}
            >
              {rows.slice(0, 3).map((row, index) => {
                const medals = ["🥇", "🥈", "🥉"];

                return (
                  <div
                    key={`${row.user_id}-podium-${index}`}
                    style={{
                      padding: 24,
                      borderRadius: 24,
                      background:
                        index === 0
                          ? "linear-gradient(135deg, rgba(255,215,0,0.22), rgba(0,0,0,0.88))"
                          : "rgba(0,0,0,0.82)",
                      border:
                        index === 0
                          ? "1px solid rgba(255,215,0,0.45)"
                          : "1px solid rgba(255,255,255,0.12)",
                      boxShadow:
                        index === 0
                          ? "0 0 40px rgba(255,215,0,0.18)"
                          : "none",
                    }}
                  >
                    <div style={{ fontSize: 42, marginBottom: 12 }}>
                      {medals[index]}
                    </div>

                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        marginBottom: 10,
                      }}
                    >
                      {row.display_name}
                    </div>

                    <div style={{ display: "flex", gap: 22 }}>
                      <div>
                        <div style={labelStyle}>PUNTOS</div>
                        <div style={bigNumberStyle}>{row.total_points}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>EXACTOS</div>
                        <div style={{ ...bigNumberStyle, color: "gold" }}>
                          {row.exact_scores}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {rows.map((row, index) => (
                <div
                  key={`${row.user_id}-${index}`}
                  style={{
                    padding: 22,
                    borderRadius: 20,
                    background:
                      index === 0
                        ? "linear-gradient(90deg, rgba(255,215,0,0.18), rgba(0,0,0,0.88))"
                        : "rgba(0,0,0,0.82)",
                    border:
                      index === 0
                        ? "1px solid rgba(255,215,0,0.45)"
                        : "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 18,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 999,
                        background: index === 0 ? "gold" : "rgba(255,255,255,0.1)",
                        color: index === 0 ? "black" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 20,
                      }}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          marginBottom: 4,
                        }}
                      >
                        {row.display_name}
                      </div>

                      <div style={{ fontSize: 13, color: "lightgray" }}>
                        Competidor Mundial 2026
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={labelStyle}>PUNTOS</div>
                      <div style={scoreStyle}>{row.total_points}</div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={labelStyle}>EXACTOS</div>
                      <div style={{ ...scoreStyle, color: "gold" }}>
                        {row.exact_scores}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const emptyCardStyle: React.CSSProperties = {
  padding: 50,
  borderRadius: 24,
  background: "rgba(0,0,0,0.82)",
  border: "1px solid rgba(255,255,255,0.12)",
  textAlign: "center",
};

const labelStyle: React.CSSProperties = {
  color: "darkgray",
  fontSize: 12,
  marginBottom: 4,
};

const bigNumberStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 900,
};

const scoreStyle: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 900,
};