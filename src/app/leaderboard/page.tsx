"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SummaryRow = {
  user_id: string;
  display_name: string;
  cut1: number;
  cut2: number;
  cut3: number;
  total: number;
  exact_scores: number;
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/leaderboard?view=summary"
        );

        const json = await response.json();

        setRows(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,0.78), rgba(0,0,0,0.92)), url('/worldcup-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "40px 16px",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 30,
          }}
        >
          <div>
            <div
              style={{
                color: "gold",
                fontWeight: 900,
                fontSize: 13,
                marginBottom: 8,
                letterSpacing: 1,
              }}
            >
              TABLA GENERAL
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(38px, 6vw, 64px)",
              }}
            >
              Leaderboard Mundial 2026
            </h1>

            <p
              style={{
                color: "lightgray",
                marginTop: 14,
                lineHeight: 1.6,
                maxWidth: 700,
              }}
            >
              Consulta el rendimiento acumulado por cortes semanales y el
              puntaje total del torneo.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link href="/" style={secondaryButton}>
              Inicio
            </Link>

            <Link href="/quiniela" style={primaryButton}>
              Ir a Quiniela
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={loadingCard}>
            Cargando leaderboard...
          </div>
        ) : rows.length === 0 ? (
          <div style={loadingCard}>
            Todavía no hay resultados registrados.
          </div>
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 18,
                marginBottom: 30,
              }}
            >
              {rows.slice(0, 3).map((row, index) => (
                <div
                  key={row.user_id}
                  style={{
                    borderRadius: 24,
                    padding: 24,
                    background:
                      index === 0
                        ? "linear-gradient(135deg, rgba(255,215,0,0.22), rgba(0,0,0,0.88))"
                        : "rgba(0,0,0,0.78)",
                    border:
                      index === 0
                        ? "1px solid gold"
                        : "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <div
                    style={{
                      color:
                        index === 0
                          ? "gold"
                          : "lightgray",
                      fontWeight: 900,
                      marginBottom: 10,
                    }}
                  >
                    #{index + 1}
                  </div>

                  <h2
                    style={{
                      marginTop: 0,
                      marginBottom: 8,
                    }}
                  >
                    {row.display_name}
                  </h2>

                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 900,
                      color: "limegreen",
                    }}
                  >
                    {row.total}
                  </div>

                  <div
                    style={{
                      color: "lightgray",
                      marginTop: 8,
                    }}
                  >
                    Exactos: {row.exact_scores}
                  </div>
                </div>
              ))}
            </section>

            <section
              style={{
                borderRadius: 26,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.78)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 900,
                  }}
                >
                  <thead
                    style={{
                      background:
                        "linear-gradient(135deg, limegreen, #7CFC00)",
                      color: "black",
                    }}
                  >
                    <tr>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Participante</th>
                      <th style={thStyle}>Semana 1</th>
                      <th style={thStyle}>Semana 2</th>
                      <th style={thStyle}>Semana 3</th>
                      <th style={thStyle}>Total</th>
                      <th style={thStyle}>Exactos</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={row.user_id}
                        style={{
                          borderBottom:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <td style={tdStyle}>
                          <strong>#{index + 1}</strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>{row.display_name}</strong>
                        </td>

                        <td style={tdStyle}>{row.cut1}</td>

                        <td style={tdStyle}>{row.cut2}</td>

                        <td style={tdStyle}>{row.cut3}</td>

                        <td
                          style={{
                            ...tdStyle,
                            color: "limegreen",
                            fontWeight: 900,
                            fontSize: 22,
                          }}
                        >
                          {row.total}
                        </td>

                        <td style={tdStyle}>
                          {row.exact_scores}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "18px 16px",
  textAlign: "left",
  fontSize: 14,
  letterSpacing: 1,
};

const tdStyle: React.CSSProperties = {
  padding: "18px 16px",
  color: "white",
};

const primaryButton: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 14,
  background:
    "linear-gradient(135deg, limegreen, #7CFC00)",
  color: "black",
  textDecoration: "none",
  fontWeight: 900,
};

const secondaryButton: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const loadingCard: React.CSSProperties = {
  padding: 50,
  borderRadius: 24,
  background: "rgba(0,0,0,0.78)",
  textAlign: "center",
};