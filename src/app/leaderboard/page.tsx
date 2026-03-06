"use client";

import { useEffect, useState } from "react";
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

  async function loadLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error cargando leaderboard:", data?.error);
        return;
      }

      setRows(data);
    } catch (error) {
      console.error("Error cargando leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();

    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "winners",
        },
        () => {
          loadLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "picks",
        },
        () => {
          loadLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "sans-serif",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: 24 }}>Leaderboard</h1>

      {loading ? (
        <p>Cargando ranking...</p>
      ) : rows.length === 0 ? (
        <p>No hay datos todavía.</p>
      ) : (
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
                <th
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderBottom: "1px solid #333",
                  }}
                >
                  Posición
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderBottom: "1px solid #333",
                  }}
                >
                  Usuario
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderBottom: "1px solid #333",
                  }}
                >
                  Puntos
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const position = index + 1;

                let medal = "";
                if (position === 1) medal = "🥇 ";
                if (position === 2) medal = "🥈 ";
                if (position === 3) medal = "🥉 ";

                return (
                  <tr key={row.user_id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>
                      {medal}
                      {position}
                    </td>
                    <td style={{ padding: 14 }}>{row.name}</td>
                    <td style={{ padding: 14, fontWeight: 700 }}>{row.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}