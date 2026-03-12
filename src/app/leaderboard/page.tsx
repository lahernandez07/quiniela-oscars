"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type ScoreRow = {
  user_id: string;
  name: string;
  score: number;
};

export default function LeaderboardPage() {
  const supabase = supabaseBrowser();

  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [leader, setLeader] = useState<string | null>(null);
  const [newLeader, setNewLeader] = useState<string | null>(null);

  async function loadLeaderboard() {
    const res = await fetch("/api/leaderboard", {
      cache: "no-store",
    });

    const data = await res.json();

    if (res.ok) {
      const currentLeader = data[0]?.name;

      if (leader && currentLeader !== leader) {
        setNewLeader(currentLeader);

        setTimeout(() => {
          setNewLeader(null);
        }, 4000);
      }

      setLeader(currentLeader);
      setRows(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLeaderboard();

    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "winners" },
        () => loadLeaderboard()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "picks" },
        () => loadLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const maxScore = useMemo(() => {
    if (rows.length === 0) return 1;
    return Math.max(...rows.map((row) => row.score), 1);
  }, [rows]);

  function medalColor(position: number) {
    if (position === 1)
      return "linear-gradient(90deg,#FFD700,#FFC700)";

    if (position === 2)
      return "linear-gradient(90deg,#C0C0C0,#E5E5E5)";

    if (position === 3)
      return "linear-gradient(90deg,#CD7F32,#E0A96D)";

    return "#22c55e";
  }

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "sans-serif",
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
        <h1 style={{ margin: 0 }}>Leaderboard</h1>

        <Link
          href="/quiniela"
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
          ← Volver a la quiniela
        </Link>
      </div>

      {/* ANUNCIO NUEVO LIDER */}

      {newLeader && (
        <div
          style={{
            background: "#1a1403",
            border: "1px solid #FFD700",
            padding: "14px 18px",
            borderRadius: 10,
            marginBottom: 20,
            fontWeight: 700,
            fontSize: 18,
            textAlign: "center",
            animation: "fadeIn 0.6s ease",
          }}
        >
          🎉 Nuevo líder: {newLeader}
        </div>
      )}

      {loading ? (
        <p>Cargando ranking...</p>
      ) : (
        <>
          {/* GRAFICA */}

          <div
            style={{
              marginBottom: 24,
              border: "1px solid #333",
              borderRadius: 14,
              background: "#111",
              padding: 18,
            }}
          >
            <div
              style={{
                marginBottom: 16,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Desempeño en vivo
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {rows.map((row, index) => {
                const position = index + 1;
                const isLeader = index === 0;
                const width = `${(row.score / maxScore) * 100}%`;

                return (
                  <div
                    key={row.user_id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "200px 1fr 60px",
                      gap: 12,
                      alignItems: "center",
                      background: isLeader ? "#1a1403" : "transparent",
                      borderRadius: 10,
                      padding: isLeader ? 6 : 0,
                      transition: "all 0.5s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#e5e7eb",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.name}
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: 20,
                        background: "#1f2937",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width,
                          height: "100%",
                          background: medalColor(position),
                          borderRadius: 999,
                          transition:
                            "width 0.8s cubic-bezier(.34,1.56,.64,1)",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {row.score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLA */}

          <div
            style={{
              overflowX: "auto",
              border: "1px solid #333",
              borderRadius: 12,
              background: "#111",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#1a1a1a" }}>
                  <th style={{ padding: 14 }}>Posición</th>
                  <th style={{ padding: 14 }}>Usuario</th>
                  <th style={{ padding: 14 }}>Puntos</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const position = index + 1;

                  let medal = "";
                  if (position === 1) medal = "🥇";
                  if (position === 2) medal = "🥈";
                  if (position === 3) medal = "🥉";

                  return (
                    <tr key={row.user_id}>
                      <td style={{ padding: 14 }}>
                        {medal} {position}
                      </td>
                      <td style={{ padding: 14 }}>{row.name}</td>
                      <td
                        style={{
                          padding: 14,
                          fontWeight: 700,
                        }}
                      >
                        {row.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}