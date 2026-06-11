"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type MatchResult = {
  match_id: number;
  home_score: number;
  away_score: number;
  updated_at?: string;
};

type Match = {
  id: number;
  matchNumber: number;
  group: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  result: MatchResult | null;
};

type ResultInput = {
  homeScore: string;
  awayScore: string;
};

const ADMIN_EMAILS = [
  "la.hernandez07@gmail.com",
  "josetamezg@gmail.com",
];

export default function AdminPage() {
  const supabase = supabaseBrowser();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Record<number, ResultInput>>({});
  const [loading, setLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);
  const [savedMatchId, setSavedMatchId] = useState<number | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email ?? null;

      setUserEmail(email);
      setIsAdmin(!!email && ADMIN_EMAILS.includes(email));
      setCheckingAuth(false);
    }

    checkUser();
  }, [supabase]);

  useEffect(() => {
    if (!isAdmin) return;

    loadResults();
  }, [isAdmin]);

  async function loadResults() {
    try {
      setLoading(true);

      const response = await fetch("/api/results", {
        cache: "no-store",
      });

      const data = await response.json();

      setMatches(Array.isArray(data) ? data : []);

      const map: Record<number, ResultInput> = {};

      data.forEach((match: Match) => {
        if (match.result) {
          map[match.id] = {
            homeScore: String(match.result.home_score),
            awayScore: String(match.result.away_score),
          };
        } else {
          map[match.id] = {
            homeScore: "",
            awayScore: "",
          };
        }
      });

      setResults(map);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function updateResult(
    matchId: number,
    field: "homeScore" | "awayScore",
    value: string
  ) {
    setSavedMatchId(null);

    setResults((prev) => ({
      ...prev,
      [matchId]: {
        homeScore: prev[matchId]?.homeScore ?? "",
        awayScore: prev[matchId]?.awayScore ?? "",
        [field]: value,
      },
    }));
  }

  async function saveResult(matchId: number) {
    const result = results[matchId];

    if (!result?.homeScore || !result?.awayScore) {
      alert("Captura ambos marcadores oficiales.");
      return;
    }

    try {
      setSavingMatchId(matchId);

      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: matchId,
          home_score: Number(result.homeScore),
          away_score: Number(result.awayScore),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        console.log("RESULT SAVE ERROR:", json);

        alert(
          json?.error ||
            json?.details?.message ||
            "No se pudo guardar el resultado."
        );

        return;
      }

      setSavedMatchId(matchId);
      await loadResults();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el resultado.");
    } finally {
      setSavingMatchId(null);
    }
  }
    async function syncApiResults() {
    try {
      setSyncing(true);
      setSyncMessage("");

      const response = await fetch("/api/sync-results", {
        method: "POST",
      });

      const json = await response.json();

      if (!response.ok) {
        setSyncMessage(
          json?.error || "Error sincronizando resultados."
        );
        return;
      }

      setSyncMessage(
        `Sincronización completada. ${json.updated ?? 0} partido(s) actualizados.`
      );

      await loadResults();
    } catch (error) {
      console.error(error);
      setSyncMessage("Error sincronizando resultados.");
    } finally {
      setSyncing(false);
    }
  }

  if (checkingAuth) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Validando acceso...</h1>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Acceso restringido</h1>
        <p>{userEmail ?? "Usuario no autenticado"}</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Cargando resultados...</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px 32px" }}>
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              background: "#3DFF4F",
              color: "black",
              padding: "10px 18px",
              borderRadius: 999,
              fontWeight: 900,
              marginBottom: 18,
            }}
          >
            PANEL OPERATIVO
          </div>

          <h1
            style={{
              fontSize: "clamp(42px,6vw,72px)",
              fontWeight: 900,
              margin: 0,
            }}
          >
            Resultados oficiales
          </h1>

          <p
            style={{
              marginTop: 18,
              opacity: 0.9,
              fontSize: 20,
            }}
          >
            Captura o sincroniza resultados oficiales del Mundial 2026.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={syncApiResults}
            disabled={syncing}
            style={yellowButton}
          >
            {syncing
              ? "Sincronizando..."
              : "Sincronizar API"}
          </button>

          <Link
            href="/leaderboard"
            style={greenButton}
          >
            Ver leaderboard
          </Link>

          <Link
            href="/quiniela"
            style={darkButton}
          >
            Ir a quiniela
          </Link>
        </div>
      </section>

      {syncMessage && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            background: "rgba(0,255,0,.08)",
          }}
        >
          {syncMessage}
        </div>
      )}

      {matches.map((match) => {
        const current = results[match.id];

        const hasResult =
          current?.homeScore !== "" &&
          current?.awayScore !== "";

        return (
          <div
            key={match.id}
            style={{
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 28,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#FFCC00",
                    fontWeight: 900,
                    marginBottom: 10,
                  }}
                >
                  Partido #{match.matchNumber} · {match.group}
                </div>

                <div>
                  {match.date} · {match.time} · {match.city}
                </div>

                <div
                  style={{
                    opacity: 0.7,
                    marginTop: 4,
                  }}
                >
                  {match.stadium}
                </div>
              </div>

              <div
                style={{
                  color: hasResult
                    ? "#00ff66"
                    : "#ffb000",
                  fontWeight: 900,
                }}
              >
                {hasResult
                  ? "CAPTURADO"
                  : "PENDIENTE"}
              </div>
            </div>
                        <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 18,
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              <AdminScoreRow
                score={current?.homeScore ?? ""}
                team={match.home}
                flag={match.homeFlag}
                onChange={(value) =>
                  updateResult(match.id, "homeScore", value)
                }
              />

              <div
                style={{
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#FFCC00",
                }}
              >
                VS
              </div>

              <AdminScoreRow
                score={current?.awayScore ?? ""}
                team={match.away}
                flag={match.awayFlag}
                onChange={(value) =>
                  updateResult(match.id, "awayScore", value)
                }
              />
            </div>

            <div
              style={{
                marginTop: 26,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => saveResult(match.id)}
                disabled={savingMatchId === match.id}
                style={{
                  ...greenButton,
                  opacity: savingMatchId === match.id ? 0.6 : 1,
                  cursor:
                    savingMatchId === match.id
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {savingMatchId === match.id
                  ? "Guardando..."
                  : savedMatchId === match.id
                  ? "✓ Guardado"
                  : "Guardar resultado"}
              </button>
            </div>
          </div>
        );
      })}
    </main>
  );
}

function AdminScoreRow({
  score,
  team,
  flag,
  onChange,
}: {
  score: string;
  team: string;
  flag: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "90px 64px 1fr",
        gap: 14,
        alignItems: "center",
      }}
    >
      <input
        type="number"
        min="0"
        value={score}
        onChange={(e) => onChange(e.target.value)}
        style={scoreInput}
      />

      <img
        src={`https://flagcdn.com/w80/${flag}.png`}
        alt={team}
        style={{
          width: 64,
          height: 48,
          objectFit: "cover",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      />

      <span
        style={{
          fontSize: "clamp(22px,4vw,32px)",
          fontWeight: 900,
        }}
      >
        {team}
      </span>
    </div>
  );
}

const scoreInput = {
  width: 86,
  height: 72,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(0,0,0,.55)",
  color: "white",
  textAlign: "center" as const,
  fontSize: 30,
  fontWeight: 900,
  outline: "none",
};

const greenButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 22px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg, limegreen, #7CFC00)",
  color: "black",
  fontWeight: 900,
  textDecoration: "none",
};

const yellowButton = {
  ...greenButton,
  background: "linear-gradient(135deg, #FFCC00, #FFE066)",
};

const darkButton = {
  ...greenButton,
  background: "rgba(255,255,255,.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,.14)",
};