"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAdmin as checkIsAdmin } from "@/lib/admin";

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

type FilterType =
  | "pending"
  | "captured"
  | "today"
  | "yesterday"
  | "all";

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

  const [filter, setFilter] = useState<FilterType>("pending");
  const [selectedGroup, setSelectedGroup] = useState("all");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email ?? null;

      setUserEmail(email);
      setIsAdmin(checkIsAdmin(email));
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

      const safeData = Array.isArray(data) ? data : [];

      setMatches(safeData);

      const map: Record<number, ResultInput> = {};

      safeData.forEach((match: Match) => {
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
        setSyncMessage(json?.error || "Error sincronizando resultados.");
        return;
      }

      setSyncMessage(
        `Sincronización completada. ${
          json.updated ?? 0
        } partido(s) actualizados.`
      );

      await loadResults();
    } catch (error) {
      console.error(error);
      setSyncMessage("Error sincronizando resultados.");
    } finally {
      setSyncing(false);
    }
  }

  function hasResult(match: Match) {
    const current = results[match.id];

    return current?.homeScore !== "" && current?.awayScore !== "";
  }

  const today = getMexicoCityDate(0);
  const yesterday = getMexicoCityDate(-1);

  const groups = useMemo(() => {
    return Array.from(new Set(matches.map((match) => match.group))).sort();
  }, [matches]);

  const counters = useMemo(() => {
    const captured = matches.filter((match) => hasResult(match)).length;
    const pending = matches.length - captured;
    const todayMatches = matches.filter((match) => match.date === today).length;
    const yesterdayMatches = matches.filter(
      (match) => match.date === yesterday
    ).length;

    return {
      all: matches.length,
      captured,
      pending,
      today: todayMatches,
      yesterday: yesterdayMatches,
    };
  }, [matches, results, today, yesterday]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((match) => {
        if (selectedGroup !== "all" && match.group !== selectedGroup) {
          return false;
        }

        if (filter === "pending") {
          return !hasResult(match);
        }

        if (filter === "captured") {
          return hasResult(match);
        }

        if (filter === "today") {
          return match.date === today;
        }

        if (filter === "yesterday") {
          return match.date === yesterday;
        }

        return true;
      })
      .sort((a, b) => {
        const aHasResult = hasResult(a);
        const bHasResult = hasResult(b);

        if (aHasResult !== bHasResult) {
          return aHasResult ? 1 : -1;
        }

        return a.matchNumber - b.matchNumber;
      });
  }, [matches, results, filter, selectedGroup, today, yesterday]);

  if (checkingAuth) {
    return (
      <main style={simplePage}>
        <h1>Validando acceso...</h1>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main style={simplePage}>
        <h1>Acceso restringido</h1>
        <p>{userEmail ?? "Usuario no autenticado"}</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={simplePage}>
        <h1>Cargando resultados...</h1>
      </main>
    );
  }
    return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={pillStyle}>PANEL OPERATIVO</div>

          <h1 style={titleStyle}>Resultados oficiales</h1>

          <p style={subtitleStyle}>
            Captura resultados oficiales del Mundial 2026 sin buscar partido por
            partido.
          </p>
        </div>

        <button onClick={syncApiResults} disabled={syncing} style={yellowButton}>
          {syncing ? "Sincronizando..." : "Sincronizar API"}
        </button>
      </section>

      {syncMessage && <div style={messageStyle}>{syncMessage}</div>}

      <section style={filterCardStyle}>
        <div style={filterTopStyle}>
          <button
            onClick={() => setFilter("pending")}
            style={filter === "pending" ? activeFilterButton : filterButton}
          >
            Pendientes · {counters.pending}
          </button>

          <button
            onClick={() => setFilter("today")}
            style={filter === "today" ? activeFilterButton : filterButton}
          >
            Hoy · {counters.today}
          </button>

          <button
            onClick={() => setFilter("yesterday")}
            style={
              filter === "yesterday" ? activeFilterButton : filterButton
            }
          >
            Ayer · {counters.yesterday}
          </button>

          <button
            onClick={() => setFilter("captured")}
            style={filter === "captured" ? activeFilterButton : filterButton}
          >
            Capturados · {counters.captured}
          </button>

          <button
            onClick={() => setFilter("all")}
            style={filter === "all" ? activeFilterButton : filterButton}
          >
            Todos · {counters.all}
          </button>
        </div>

        <div style={groupFilterStyle}>
          <span style={{ fontWeight: 900, color: "#FFCC00" }}>Grupo</span>

          <select
            value={selectedGroup}
            onChange={(event) => setSelectedGroup(event.target.value)}
            style={selectStyle}
          >
            <option value="all">Todos los grupos</option>

            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={summaryStyle}>
        Mostrando <strong>{filteredMatches.length}</strong> partido(s)
      </section>

      {filteredMatches.length === 0 ? (
        <div style={emptyStyle}>No hay partidos con estos filtros.</div>
      ) : (
        filteredMatches.map((match) => {
          const current = results[match.id];
          const resultCaptured = hasResult(match);

          return (
            <div key={match.id} style={matchCardStyle}>
              <div style={matchHeaderStyle}>
                <div>
                  <div style={matchMetaStyle}>
                    Partido #{match.matchNumber} · {match.group}
                  </div>

                  <div>
                    {match.date} · {match.time} · {match.city}
                  </div>

                  <div style={stadiumStyle}>{match.stadium}</div>
                </div>

                <div
                  style={{
                    color: resultCaptured ? "#00ff66" : "#ffb000",
                    fontWeight: 900,
                  }}
                >
                  {resultCaptured ? "CAPTURADO" : "PENDIENTE"}
                </div>
              </div>

              <div style={scoreGridStyle}>
                <AdminScoreRow
                  score={current?.homeScore ?? ""}
                  team={match.home}
                  flag={match.homeFlag}
                  onChange={(value) =>
                    updateResult(match.id, "homeScore", value)
                  }
                />

                <div style={vsStyle}>VS</div>

                <AdminScoreRow
                  score={current?.awayScore ?? ""}
                  team={match.away}
                  flag={match.awayFlag}
                  onChange={(value) =>
                    updateResult(match.id, "awayScore", value)
                  }
                />
              </div>

              <div style={saveRowStyle}>
                <button
                  onClick={() => saveResult(match.id)}
                  disabled={savingMatchId === match.id}
                  style={{
                    ...greenButton,
                    opacity: savingMatchId === match.id ? 0.6 : 1,
                    cursor:
                      savingMatchId === match.id ? "not-allowed" : "pointer",
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
        })
      )}
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
    <div style={scoreRowStyle}>
      <input
        type="number"
        min="0"
        value={score}
        onChange={(event) => onChange(event.target.value)}
        style={scoreInput}
      />

      <img
        src={`https://flagcdn.com/w80/${flag}.png`}
        alt={team}
        style={flagStyle}
      />

      <span style={teamNameStyle}>{team}</span>
    </div>
  );
}

function getMexicoCityDate(dayOffset: number) {
  const baseDate = new Date();

  baseDate.setDate(baseDate.getDate() + dayOffset);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(baseDate);
}
const simplePage = {
  minHeight: "100vh",
  padding: 40,
  background: "black",
  color: "white",
};

const pageStyle = {
  minHeight: "100vh",
  padding: "24px 32px 60px",
  color: "white",
};

const heroStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  flexWrap: "wrap" as const,
  alignItems: "center",
  marginBottom: 24,
};

const pillStyle = {
  display: "inline-block",
  background: "#3DFF4F",
  color: "black",
  padding: "10px 18px",
  borderRadius: 999,
  fontWeight: 900,
  marginBottom: 18,
};

const titleStyle = {
  fontSize: "clamp(42px,6vw,72px)",
  fontWeight: 900,
  margin: 0,
};

const subtitleStyle = {
  marginTop: 18,
  opacity: 0.9,
  fontSize: 20,
};

const messageStyle = {
  marginBottom: 24,
  padding: 16,
  borderRadius: 12,
  background: "rgba(0,255,0,.08)",
};

const filterCardStyle = {
  position: "sticky" as const,
  top: 12,
  zIndex: 20,
  marginBottom: 24,
  padding: 18,
  borderRadius: 22,
  background: "rgba(0,0,0,.88)",
  border: "1px solid rgba(255,255,255,.12)",
  backdropFilter: "blur(10px)",
};

const filterTopStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  marginBottom: 14,
};

const filterButton = {
  padding: "12px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const activeFilterButton = {
  ...filterButton,
  background: "linear-gradient(135deg, limegreen, #7CFC00)",
  color: "black",
};

const groupFilterStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap" as const,
};

const selectStyle = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(0,0,0,.7)",
  color: "white",
  fontWeight: 900,
  outline: "none",
};

const summaryStyle = {
  marginBottom: 18,
  color: "rgba(255,255,255,.78)",
};

const emptyStyle = {
  padding: 24,
  borderRadius: 20,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.1)",
};

const matchCardStyle = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  marginBottom: 24,
  background: "rgba(0,0,0,.28)",
};

const matchHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  marginBottom: 24,
  flexWrap: "wrap" as const,
};

const matchMetaStyle = {
  color: "#FFCC00",
  fontWeight: 900,
  marginBottom: 10,
};

const stadiumStyle = {
  opacity: 0.7,
  marginTop: 4,
};

const scoreGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 18,
  maxWidth: 560,
  margin: "0 auto",
};

const vsStyle = {
  textAlign: "center" as const,
  fontSize: 20,
  fontWeight: 900,
  color: "#FFCC00",
};

const saveRowStyle = {
  marginTop: 26,
  display: "flex",
  justifyContent: "flex-end",
};

const scoreRowStyle = {
  display: "grid",
  gridTemplateColumns: "90px 64px 1fr",
  gap: 14,
  alignItems: "center",
};

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

const flagStyle = {
  width: 64,
  height: 48,
  objectFit: "cover" as const,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
};

const teamNameStyle = {
  fontSize: "clamp(22px,4vw,32px)",
  fontWeight: 900,
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