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
  }, []);

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
        throw new Error(json.error || "No se pudo sincronizar");
      }

      setSyncMessage(`✅ ${json.updated} resultados sincronizados desde API`);

      await loadResults();
    } catch (error) {
      console.error(error);
      setSyncMessage("❌ No se pudieron sincronizar resultados desde API");
    } finally {
      setSyncing(false);
    }
  }

  if (checkingAuth) {
    return <AdminShell>Cargando acceso...</AdminShell>;
  }

  if (!userEmail) {
    return (
      <AdminShell>
        <h1 style={{ marginTop: 0 }}>Acceso restringido</h1>
        <p style={{ color: "lightgray" }}>
          Debes iniciar sesión para entrar al panel operativo.
        </p>
        <Link href="/" style={primaryButton}>
          Ir al inicio
        </Link>
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell>
        <h1 style={{ marginTop: 0 }}>Sin permisos de admin</h1>
        <p style={{ color: "lightgray" }}>
          Tu usuario actual no tiene permisos para capturar resultados.
        </p>
        <p style={{ color: "gold", fontWeight: 800 }}>{userEmail}</p>
        <Link href="/" style={primaryButton}>
          Ir al inicio
        </Link>
      </AdminShell>
    );
  }
    return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,0.78), rgba(0,0,0,0.94)), url('/worldcup-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        fontFamily: "sans-serif",
        padding: "40px 16px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
            marginBottom: 30,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 999,
                background: "limegreen",
                color: "black",
                fontWeight: 900,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              PANEL OPERATIVO
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(36px, 6vw, 64px)",
              }}
            >
              Resultados oficiales
            </h1>

            <p
              style={{
                color: "lightgray",
                maxWidth: 720,
                lineHeight: 1.6,
                marginTop: 14,
              }}
            >
              Captura o sincroniza resultados oficiales del Mundial 2026.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={syncApiResults}
              disabled={syncing}
              style={{
                ...adminSyncButton,
                opacity: syncing ? 0.7 : 1,
                cursor: syncing ? "not-allowed" : "pointer",
              }}
            >
              {syncing
                ? "Sincronizando..."
                : "Sincronizar API"}
            </button>

            <Link href="/leaderboard" style={primaryButton}>
              Ver leaderboard
            </Link>

            <Link href="/quiniela" style={secondaryButton}>
              Ir a quiniela
            </Link>
          </div>
        </div>

        {syncMessage && (
          <div
            style={{
              marginBottom: 24,
              color: "gold",
              fontWeight: 900,
            }}
          >
            {syncMessage}
          </div>
        )}

        {loading ? (
          <div style={emptyCard}>Cargando partidos...</div>
        ) : (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {matches.map((match) => {
              const current = results[match.id];

              const hasResult =
                current?.homeScore !== "" &&
                current?.awayScore !== "";

              const saving = savingMatchId === match.id;

              const recentlySaved =
                savedMatchId === match.id;

              return (
                <div
                  key={match.id}
                  style={{
                    padding: 22,
                    borderRadius: 24,
                    background: "rgba(0,0,0,0.78)",
                    border: hasResult
                      ? "1px solid rgba(50,205,50,0.4)"
                      : "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      flexWrap: "wrap",
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "gold",
                          fontWeight: 900,
                          marginBottom: 6,
                        }}
                      >
                        Partido #{match.matchNumber} · {match.group}
                      </div>

                      <div
                        style={{
                          color: "lightgray",
                          fontSize: 14,
                        }}
                      >
                        {match.date} · {match.time} · {match.city}
                      </div>

                      <div
                        style={{
                          color: "darkgray",
                          fontSize: 13,
                        }}
                      >
                        {match.stadium}
                      </div>
                    </div>

                    <div
                      style={{
                        color: hasResult
                          ? "limegreen"
                          : "orange",
                        fontWeight: 900,
                      }}
                    >
                      {hasResult
                        ? "RESULTADO CARGADO"
                        : "PENDIENTE"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr auto 1fr auto",
                      gap: 18,
                      alignItems: "center",
                    }}
                  >
                    <Team
                      name={match.home}
                      flag={match.homeFlag}
                    />

                    <input
                      type="number"
                      min="0"
                      value={current?.homeScore ?? ""}
                      onChange={(e) =>
                        updateResult(
                          match.id,
                          "homeScore",
                          e.target.value
                        )
                      }
                      style={scoreInput}
                    />

                    <Team
                      name={match.away}
                      flag={match.awayFlag}
                    />

                    <input
                      type="number"
                      min="0"
                      value={current?.awayScore ?? ""}
                      onChange={(e) =>
                        updateResult(
                          match.id,
                          "awayScore",
                          e.target.value
                        )
                      }
                      style={scoreInput}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => saveResult(match.id)}
                      disabled={saving}
                      style={{
                        ...primaryButton,
                        border: "none",
                        cursor: saving
                          ? "not-allowed"
                          : "pointer",
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving
                        ? "Guardando..."
                        : recentlySaved
                          ? "✓ Resultado guardado"
                          : hasResult
                            ? "Actualizar resultado"
                            : "Guardar resultado"}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function Team({
  name,
  flag,
}: {
  name: string;
  flag: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <img
        src={`https://flagcdn.com/w80/${flag}.png`}
        alt={name}
        style={{
          width: 54,
          height: 38,
          objectFit: "cover",
          borderRadius: 8,
        }}
      />

      <div
        style={{
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        {name}
      </div>
    </div>
  );
}

function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,0.78), rgba(0,0,0,0.94)), url('/worldcup-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        fontFamily: "sans-serif",
        padding: "40px 16px",
      }}
    >
      <section
        style={{
          maxWidth: 760,
          margin: "80px auto",
          padding: 32,
          borderRadius: 24,
          background: "rgba(0,0,0,0.82)",
          border:
            "1px solid rgba(255,255,255,0.14)",
        }}
      >
        {children}
      </section>
    </main>
  );
}

const primaryButton: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 14,
  background:
    "linear-gradient(135deg, limegreen, #7CFC00)",
  color: "black",
  textDecoration: "none",
  fontWeight: 900,
};

const adminSyncButton: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 14,
  background: "gold",
  color: "black",
  border: "none",
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

const scoreInput: React.CSSProperties = {
  width: 78,
  height: 64,
  borderRadius: 16,
  border:
    "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.72)",
  color: "white",
  fontSize: 30,
  fontWeight: 900,
  textAlign: "center",
  outline: "none",
};

const emptyCard: React.CSSProperties = {
  padding: 50,
  borderRadius: 24,
  background: "rgba(0,0,0,0.78)",
  textAlign: "center",
};