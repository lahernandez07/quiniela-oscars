"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import TeamFlag from "@/components/TeamFlag";

type MatchResult = {
  match_id: number;
  home_score: number;
  away_score: number;
  decided_by_penalties?: boolean;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;
  winner_side?: "home" | "away" | null;
  winner_team?: string | null;
  eliminated_team?: string | null;
  updated_at?: string;
};

type Match = {
  id: number;
  matchNumber: number;
  stage?: string;
  round?: string;
  group: string | null;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  homePlaceholder?: string;
  awayPlaceholder?: string;
  defined?: boolean;
  date: string;
  time: string;
  stadium: string;
  city: string;
  result: MatchResult | null;
};

type ResultInput = {
  homeScore: string;
  awayScore: string;
  decidedByPenalties: boolean;
  homePenaltyScore: string;
  awayPenaltyScore: string;
  winnerSide: "home" | "away" | "";
};

type FilterType = "pending" | "captured" | "today" | "yesterday" | "all";

function isKnockoutMatch(match: Match) {
  return Boolean(match.round) || Number(match.matchNumber) >= 73;
}

function isMatchDefined(match: Match) {
  if (!isKnockoutMatch(match)) return true;
  return match.defined === true && !!match.home && !!match.away;
}

function getDisplayTeam(match: Match, side: "home" | "away") {
  if (side === "home") {
    return match.home || match.homePlaceholder || "Equipo por definir";
  }

  return match.away || match.awayPlaceholder || "Equipo por definir";
}

function getDisplayFlag(match: Match, side: "home" | "away") {
  if (!isMatchDefined(match)) return "un";
  return side === "home" ? match.homeFlag : match.awayFlag;
}

function isOfficialScoreTied(result?: ResultInput) {
  if (!result?.homeScore || !result?.awayScore) return false;
  return Number(result.homeScore) === Number(result.awayScore);
}

function getPenaltyWinnerSide(result?: ResultInput): "home" | "away" | "" {
  if (!result?.homePenaltyScore || !result?.awayPenaltyScore) return "";

  const homePenalties = Number(result.homePenaltyScore);
  const awayPenalties = Number(result.awayPenaltyScore);

  if (homePenalties > awayPenalties) return "home";
  if (awayPenalties > homePenalties) return "away";

  return "";
}

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
            decidedByPenalties: Boolean(match.result.decided_by_penalties),
            homePenaltyScore:
              match.result.home_penalty_score === null ||
              match.result.home_penalty_score === undefined
                ? ""
                : String(match.result.home_penalty_score),
            awayPenaltyScore:
              match.result.away_penalty_score === null ||
              match.result.away_penalty_score === undefined
                ? ""
                : String(match.result.away_penalty_score),
            winnerSide: match.result.winner_side ?? "",
          };
        } else {
          map[match.id] = {
            homeScore: "",
            awayScore: "",
            decidedByPenalties: false,
            homePenaltyScore: "",
            awayPenaltyScore: "",
            winnerSide: "",
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
    field:
      | "homeScore"
      | "awayScore"
      | "decidedByPenalties"
      | "homePenaltyScore"
      | "awayPenaltyScore"
      | "winnerSide",
    value: string | boolean
  ) {
    setSavedMatchId(null);

    setResults((prev) => ({
      ...prev,
      [matchId]: {
        homeScore: prev[matchId]?.homeScore ?? "",
        awayScore: prev[matchId]?.awayScore ?? "",
        decidedByPenalties: prev[matchId]?.decidedByPenalties ?? false,
        homePenaltyScore: prev[matchId]?.homePenaltyScore ?? "",
        awayPenaltyScore: prev[matchId]?.awayPenaltyScore ?? "",
        winnerSide: prev[matchId]?.winnerSide ?? "",
        [field]: value,
      },
    }));
  }

  async function saveResult(matchId: number) {
    const result = results[matchId];
    const match = matches.find((item) => item.id === matchId);

    if (!match || !isMatchDefined(match)) {
      alert("Este partido todavía no tiene equipos definidos.");
      return;
    }

    if (!result?.homeScore || !result?.awayScore) {
      alert("Captura ambos marcadores oficiales.");
      return;
    }

    const mustCapturePenalties =
      isKnockoutMatch(match) && isOfficialScoreTied(result);

    const penaltyWinnerSide = getPenaltyWinnerSide(result);

    if (mustCapturePenalties) {
      if (!result.homePenaltyScore || !result.awayPenaltyScore) {
        alert("El partido terminó empatado. Captura el marcador de penales.");
        return;
      }

      if (!penaltyWinnerSide) {
        alert("El marcador de penales no puede quedar empatado.");
        return;
      }
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
          decided_by_penalties: mustCapturePenalties,
          home_penalty_score: mustCapturePenalties
            ? Number(result.homePenaltyScore)
            : null,
          away_penalty_score: mustCapturePenalties
            ? Number(result.awayPenaltyScore)
            : null,
          winner_side: mustCapturePenalties ? penaltyWinnerSide : null,
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
    return match.result !== null;
  }

  const today = getMexicoCityDate(0);
  const yesterday = getMexicoCityDate(-1);

  const groups = useMemo(() => {
    return Array.from(new Set(matches.map((match) => match.group ?? "Sin grupo"))).sort();
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
        if (selectedGroup !== "all" && (match.group ?? "Sin grupo") !== selectedGroup) {
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
            style={filter === "yesterday" ? activeFilterButton : filterButton}
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
          const defined = isMatchDefined(match);
          const showPenaltyFields =
            isKnockoutMatch(match) && isOfficialScoreTied(current);
          const penaltyWinnerSide = getPenaltyWinnerSide(current);
          const penaltyWinnerName = penaltyWinnerSide
            ? getDisplayTeam(match, penaltyWinnerSide)
            : "Pendiente";

          return (
            <div key={match.id} style={matchCardStyle}>
              <div style={matchHeaderStyle}>
                <div>
                  <div style={matchMetaStyle}>
                    Partido #{match.matchNumber} · {match.group ?? match.round ?? "Eliminatoria"}
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
                  {!defined ? "POR DEFINIR" : resultCaptured ? "CAPTURADO" : "PENDIENTE"}
                </div>
              </div>

              <div style={scoreGridStyle}>
                <AdminScoreRow
                  score={current?.homeScore ?? ""}
                  team={getDisplayTeam(match, "home")}
                  flag={getDisplayFlag(match, "home")}
                  onChange={(value) =>
                    updateResult(match.id, "homeScore", value)
                  }
                />

                <div style={vsStyle}>VS</div>

                <AdminScoreRow
                  score={current?.awayScore ?? ""}
                  team={getDisplayTeam(match, "away")}
                  flag={getDisplayFlag(match, "away")}
                  onChange={(value) =>
                    updateResult(match.id, "awayScore", value)
                  }
                />
              </div>

              {showPenaltyFields && (
                <section style={penaltyCardStyle}>
                  <div style={penaltyToggleStyle}>
                    Partido empatado · Captura penales
                  </div>

                  <div style={penaltyDetailsStyle}>
                    <div style={penaltyScoresStyle}>
                      <label style={penaltyInputLabelStyle}>
                        <span>{getDisplayTeam(match, "home")}</span>
                        <input
                          type="number"
                          min="0"
                          value={current?.homePenaltyScore ?? ""}
                          onChange={(event) =>
                            updateResult(
                              match.id,
                              "homePenaltyScore",
                              event.target.value
                            )
                          }
                          style={penaltyInputStyle}
                        />
                      </label>

                      <label style={penaltyInputLabelStyle}>
                        <span>{getDisplayTeam(match, "away")}</span>
                        <input
                          type="number"
                          min="0"
                          value={current?.awayPenaltyScore ?? ""}
                          onChange={(event) =>
                            updateResult(
                              match.id,
                              "awayPenaltyScore",
                              event.target.value
                            )
                          }
                          style={penaltyInputStyle}
                        />
                      </label>
                    </div>

                    <div style={winnerBoxStyle}>
                      <div style={winnerTitleStyle}>Ganador oficial</div>
                      <div style={winnerAutoStyle}>{penaltyWinnerName}</div>
                      <div style={winnerHintStyle}>
                        Se calcula automáticamente con el marcador de penales.
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <div style={saveRowStyle}>
                <button
                  onClick={() => saveResult(match.id)}
                  disabled={savingMatchId === match.id || !defined}
                  style={{
                    ...greenButton,
                    opacity: savingMatchId === match.id || !defined ? 0.6 : 1,
                    cursor:
                      savingMatchId === match.id || !defined
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {!defined
                    ? "Cruce pendiente"
                    : savingMatchId === match.id
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

      <TeamFlag code={flag} name={team} style={flagStyle} />

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
  padding: "clamp(14px, 4vw, 32px) clamp(12px, 4vw, 32px) 90px",
  color: "white",
  overflowX: "hidden" as const,
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
  padding: "clamp(16px, 4vw, 24px)",
  marginBottom: 24,
  background: "rgba(0,0,0,.28)",
  overflow: "hidden" as const,
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
  width: "100%",
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
  justifyContent: "center",
};

const scoreRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(68px, 86px) minmax(44px, 64px) minmax(0, 1fr)",
  gap: 12,
  alignItems: "center",
  width: "100%",
  minWidth: 0,
};

const scoreInput = {
  width: "100%",
  height: 64,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(0,0,0,.55)",
  color: "white",
  textAlign: "center" as const,
  fontSize: 28,
  fontWeight: 900,
  outline: "none",
  boxSizing: "border-box" as const,
};

const flagStyle = {
  width: "100%",
  maxWidth: 64,
  height: 44,
  objectFit: "cover" as const,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
};

const teamNameStyle = {
  fontSize: "clamp(17px, 5vw, 32px)",
  fontWeight: 900,
  minWidth: 0,
  overflowWrap: "anywhere" as const,
};

const greenButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  maxWidth: 360,
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
const penaltyCardStyle = {
  marginTop: 24,
  padding: "clamp(14px, 4vw, 18px)",
  borderRadius: 20,
  border: "1px solid rgba(255,204,0,.22)",
  background: "rgba(255,204,0,.07)",
  width: "100%",
  maxWidth: 560,
  marginLeft: "auto",
  marginRight: "auto",
  boxSizing: "border-box" as const,
  overflow: "hidden" as const,
};

const penaltyToggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 900,
  color: "#FFCC00",
  cursor: "pointer",
  fontSize: "clamp(18px, 5vw, 24px)",
  lineHeight: 1.25,
};

const penaltyDetailsStyle = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
};

const penaltyScoresStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  width: "100%",
};

const penaltyInputLabelStyle = {
  display: "grid",
  gap: 8,
  fontWeight: 900,
  minWidth: 0,
};

const penaltyInputStyle = {
  width: "100%",
  height: 54,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(0,0,0,.55)",
  color: "white",
  textAlign: "center" as const,
  fontSize: 24,
  fontWeight: 900,
  outline: "none",
  boxSizing: "border-box" as const,
};

const winnerBoxStyle = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(0,0,0,.35)",
  width: "100%",
  boxSizing: "border-box" as const,
};

const winnerTitleStyle = {
  color: "#FFCC00",
  fontWeight: 900,
  marginBottom: 10,
};

const winnerAutoStyle = {
  fontSize: "clamp(22px, 6vw, 32px)",
  fontWeight: 900,
  color: "#7CFC00",
};

const winnerHintStyle = {
  marginTop: 6,
  color: "rgba(255,255,255,.65)",
  fontSize: 13,
};