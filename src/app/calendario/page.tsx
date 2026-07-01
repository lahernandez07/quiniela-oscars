"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Match = {
  id: number;
  matchNumber: number;
  stage: string;
  round?: string;
  order?: number;
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
  cut: string;
  result?: {
    home_score: number;
    away_score: number;
    decided_by_penalties?: boolean;
    home_penalty_score?: number | null;
    away_penalty_score?: number | null;
    winner_side?: "home" | "away" | null;
    winner_team?: string | null;
  } | null;
};

type CutFilter = "Todos" | "Hoy" | "1" | "2" | "3" | "R32" | "R16" | "QF" | "SF" | "Final";

export default function CalendarioPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedCut, setSelectedCut] = useState<CutFilter>("Todos");
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch("/api/results", { cache: "no-store" });
        const data = await response.json();

        if (Array.isArray(data)) {
          setMatches(data);
          return;
        }
      } catch (error) {
        console.error("No se pudieron cargar resultados para calendario", error);
      }

      const response = await fetch("/data/worldcup2026-group-stage.json");
      const data = await response.json();

      setMatches(data);
    }

    loadMatches();
  }, []);

  const today = getTodayMexicoCity();

  const groups = useMemo(() => {
    return ["Todos", ...Array.from(new Set(matches.map((m) => getGroupLabel(m))))];
  }, [matches]);

  const dates = useMemo(() => {
    return ["Todos", ...Array.from(new Set(matches.map((m) => m.date)))];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const cutOk =
        selectedCut === "Todos" ||
        (selectedCut === "Hoy" && match.date === today) ||
        (selectedCut === "Final" && ["3P", "F"].includes(match.round ?? "")) ||
        match.round === selectedCut ||
        (!isKnockoutMatch(match) && getCutByDate(match.date) === selectedCut);

      const groupOk =
        selectedGroup === "Todos" || getGroupLabel(match) === selectedGroup;

      const dateOk =
        selectedDate === "Todos" || match.date === selectedDate;

      const resolvedHome = resolvePlaceholderTeam(match, "home", matches);
      const resolvedAway = resolvePlaceholderTeam(match, "away", matches);

      const text =
        `${resolvedHome.team} ${resolvedAway.team} ${match.city} ${match.stadium} ${getGroupLabel(match)}`.toLowerCase();

      const searchOk =
        search.trim() === "" || text.includes(search.toLowerCase());

      return cutOk && groupOk && dateOk && searchOk;
    });
  }, [matches, selectedCut, selectedGroup, selectedDate, search, today]);

  const groupedByDate = useMemo(() => {
    const result: Record<string, Match[]> = {};

    filteredMatches.forEach((match) => {
      if (!result[match.date]) {
        result[match.date] = [];
      }

      result[match.date].push(match);
    });

    return result;
  }, [filteredMatches]);

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div>
            <div className="eyebrow">CALENDARIO OFICIAL</div>

            <h1>Mundial 2026</h1>

            <p>
              Consulta todos los partidos en horario CDMX certificados para la
              quiniela.
            </p>
          </div>

          <div className="actions">
            <Link href="/" className="secondaryButton">
              Inicio
            </Link>

            <Link href="/quiniela" className="primaryButton">
              Quiniela
            </Link>
          </div>
        </header>

        <section className="cuts">
          {[
            { value: "Todos", label: "Todos" },
            { value: "Hoy", label: "Hoy" },
            { value: "1", label: "Semana 1" },
            { value: "2", label: "Semana 2" },
            { value: "3", label: "Semana 3" },
            { value: "R32", label: "Dieciseisavos" },
            { value: "R16", label: "Octavos" },
            { value: "QF", label: "Cuartos" },
            { value: "SF", label: "Semis" },
            { value: "Final", label: "Final" },
          ].map((cut) => (
            <button
              key={cut.value}
              onClick={() => {
                const value = cut.value as CutFilter;
                setSelectedCut(value);

                if (value === "Hoy") {
                  setSelectedDate("Todos");
                }
              }}
              className={selectedCut === cut.value ? "cut active" : "cut"}
            >
              {cut.label}
            </button>
          ))}
        </section>
                <section className="filters">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>

          <select
            value={selectedDate}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedDate(value);

              if (value !== "Todos") {
                setSelectedCut("Todos");
              }
            }}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {date === "Todos" ? "Todas las fechas" : formatDate(date)}
              </option>
            ))}
          </select>

          <input
            placeholder="Buscar equipo, ciudad o estadio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        <div className="counter">
          {filteredMatches.length} partidos
          {selectedCut === "Hoy" ? ` · Hoy CDMX: ${formatDate(today)}` : ""}
        </div>

        {Object.entries(groupedByDate).map(([date, dayMatches]) => (
          <section key={date} className="dateBlock">
            <h2>{formatDate(date)}</h2>

            <div className="grid">
              {dayMatches.map((match) => {
                const resolvedHome = resolvePlaceholderTeam(match, "home", matches);
                const resolvedAway = resolvePlaceholderTeam(match, "away", matches);
                const resolvedDefined = resolvedHome.resolved && resolvedAway.resolved;

                return (
                  <article key={match.id} className="card">
                    <div className="top">
                      <span>Partido {match.matchNumber}</span>
                      <strong>{getGroupLabel(match)}</strong>
                    </div>

                    <div className="teams">
                      <div>
                        <span className="flag">{flagEmoji(resolvedHome.flag)}</span>
                        {resolvedHome.team}
                      </div>

                      <div className="vs">VS</div>

                      <div>
                        <span className="flag">{flagEmoji(resolvedAway.flag)}</span>
                        {resolvedAway.team}
                      </div>
                    </div>

                    {!resolvedDefined && (
                      <div className="pendingBadge">Cruce por definir</div>
                    )}

                    <div className="time">{match.time || "Hora por definir"} CDMX</div>

                    <div className="meta">
                      <div>{match.stadium || "Estadio por definir"}</div>
                      <div>{match.city || "Sede por definir"}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {filteredMatches.length === 0 && (
          <div className="emptyCard">
            No hay partidos para los filtros seleccionados.
          </div>
        )}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 40px 16px;
          color: white;
          background:
            linear-gradient(rgba(0, 0, 0, 0.82), rgba(0, 0, 0, 0.92)),
            url("/worldcup-bg.jpg");
          background-size: cover;
          background-position: center;
        }

        .container {
          max-width: 1300px;
          margin: auto;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .eyebrow {
          color: gold;
          font-weight: 900;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 64px);
        }

        p {
          color: lightgray;
          line-height: 1.6;
          max-width: 720px;
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .primaryButton,
        .secondaryButton {
          padding: 14px 20px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 900;
        }

        .primaryButton {
          background: linear-gradient(135deg, limegreen, #7cfc00);
          color: black;
        }

        .secondaryButton {
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
        }
                  .cuts {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .cut {
          border: none;
          padding: 12px 18px;
          border-radius: 999px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-weight: 800;
        }

        .active {
          background: gold;
          color: black;
          font-weight: 900;
        }

        .filters {
          display: grid;
          grid-template-columns: 220px 280px 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        select,
        input {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.75);
          color: white;
          font-size: 15px;
        }

        option {
          background: black;
        }

        .counter {
          color: lightgray;
          margin-bottom: 28px;
          font-weight: 800;
        }

        .dateBlock {
          margin-bottom: 36px;
        }

        .dateBlock h2 {
          color: gold;
          margin-bottom: 16px;
          text-transform: capitalize;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .card {
          border-radius: 24px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
        }

        .top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 14px;
          color: lightgray;
          font-size: 13px;
        }

        .top strong {
          color: limegreen;
        }

        .teams {
          text-align: center;
          font-size: 20px;
          font-weight: 900;
        }

        .teams div {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .flag {
          font-size: 26px;
        }

        .vs {
          color: gold;
          margin: 8px 0;
          font-size: 13px;
          letter-spacing: 1px;
        }

        .pendingBadge {
          margin: 12px auto 0;
          width: fit-content;
          border-radius: 999px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          background: rgba(255, 215, 0, 0.1);
          color: gold;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .time {
          text-align: center;
          font-size: 30px;
          font-weight: 900;
          color: limegreen;
          margin-top: 16px;
        }

        .meta {
          text-align: center;
          color: lightgray;
          margin-top: 14px;
          line-height: 1.6;
        }

        .emptyCard {
          border-radius: 24px;
          padding: 28px;
          text-align: center;
          background: rgba(0, 0, 0, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: lightgray;
          font-weight: 900;
        }

        @media (max-width: 768px) {
          .page {
            padding: 28px 12px;
          }

          .filters {
            grid-template-columns: 1fr;
          }

          .actions {
            width: 100%;
          }

          .primaryButton,
          .secondaryButton {
            flex: 1;
            text-align: center;
          }

          .time {
            font-size: 26px;
          }
        }
      `}</style>
    </main>
  );
}

function getTodayMexicoCity() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCutByDate(date: string) {
  if (date >= "2026-06-11" && date <= "2026-06-14") return "1";
  if (date >= "2026-06-15" && date <= "2026-06-21") return "2";
  return "3";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function isKnockoutMatch(match: Match) {
  return Boolean(match.round) || Number(match.matchNumber) >= 73;
}

function isMatchDefined(match: Match) {
  if (!isKnockoutMatch(match)) return true;
  return match.defined === true && !!match.home && !!match.away;
}

function getGroupLabel(match: Match) {
  return match.group ?? match.round ?? "Eliminatoria";
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

function normalizeTeamName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getReferencedMatchNumber(value?: string) {
  if (!value) return null;

  const match = value.match(/M(\d+)/i);

  if (!match) return null;

  return Number(match[1]);
}

function getWinnerFromMatch(match?: Match) {
  if (!match?.result) return null;

  const winnerTeam = match.result.winner_team;

  if (winnerTeam) {
    const normalizedWinner = normalizeTeamName(winnerTeam);

    if (normalizeTeamName(match.home) === normalizedWinner) {
      return {
        team: match.home,
        flag: match.homeFlag,
      };
    }

    if (normalizeTeamName(match.away) === normalizedWinner) {
      return {
        team: match.away,
        flag: match.awayFlag,
      };
    }

    return {
      team: winnerTeam,
      flag: "un",
    };
  }

  if (match.result.winner_side === "home") {
    return {
      team: match.home,
      flag: match.homeFlag,
    };
  }

  if (match.result.winner_side === "away") {
    return {
      team: match.away,
      flag: match.awayFlag,
    };
  }

  if (match.result.home_score > match.result.away_score) {
    return {
      team: match.home,
      flag: match.homeFlag,
    };
  }

  if (match.result.away_score > match.result.home_score) {
    return {
      team: match.away,
      flag: match.awayFlag,
    };
  }

  return null;
}

function resolvePlaceholderTeam(
  match: Match,
  side: "home" | "away",
  allMatches: Match[]
) {
  const currentTeam = side === "home" ? match.home : match.away;
  const placeholder =
    side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  const referenceMatchNumber = getReferencedMatchNumber(
    currentTeam || placeholder
  );

  if (!referenceMatchNumber) {
    return {
      team: getDisplayTeam(match, side),
      flag: getDisplayFlag(match, side),
      resolved: isMatchDefined(match),
    };
  }

  const sourceMatch = allMatches.find(
    (item) => Number(item.matchNumber) === referenceMatchNumber
  );

  const winner = getWinnerFromMatch(sourceMatch);

  if (!winner) {
    return {
      team: getDisplayTeam(match, side),
      flag: getDisplayFlag(match, side),
      resolved: false,
    };
  }

  return {
    team: winner.team,
    flag: winner.flag,
    resolved: true,
  };
}

function flagEmoji(code: string) {
  const specialFlags: Record<string, string> = {
    "gb-eng": "🏴",
    "gb-sct": "🏴",
    un: "🏳️",
  };

  if (specialFlags[code]) {
    return specialFlags[code];
  }

  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}