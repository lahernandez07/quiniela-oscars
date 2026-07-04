

"use client";

import { useEffect, useMemo, useState } from "react";

type MatchResult = {
  home_score: number;
  away_score: number;
  decided_by_penalties?: boolean;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;
  winner_side?: "home" | "away" | null;
  winner_team?: string | null;
} | null;

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
  result?: MatchResult;
};

type FilterValue =
  | "Todos"
  | "Hoy"
  | "Ayer"
  | "1"
  | "2"
  | "3"
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "Final";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "Hoy", label: "Hoy" },
  { value: "Ayer", label: "Ayer" },
  { value: "1", label: "Semana 1" },
  { value: "2", label: "Semana 2" },
  { value: "3", label: "Semana 3" },
  { value: "R32", label: "Dieciseisavos" },
  { value: "R16", label: "Octavos" },
  { value: "QF", label: "Cuartos" },
  { value: "SF", label: "Semifinal" },
  { value: "Final", label: "Final" },
];

export default function ResultadosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("Todos");
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("Todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const today = getMexicoDateOffset(0);
  const yesterday = getMexicoDateOffset(-1);

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        const response = await fetch("/api/results", { cache: "no-store" });
        const data = await response.json();

        if (Array.isArray(data)) {
          setMatches(data);
        }
      } catch (error) {
        console.error("No se pudieron cargar los resultados", error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  const groups = useMemo(() => {
    return ["Todos", ...Array.from(new Set(matches.map((m) => getGroupLabel(m))))];
  }, [matches]);

  const dates = useMemo(() => {
    return [
      "Todos",
      ...Array.from(new Set(matches.map((match) => match.date))).sort(),
    ];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const filterOk =
        selectedFilter === "Todos" ||
        (selectedFilter === "Hoy" && match.date === today) ||
        (selectedFilter === "Ayer" && match.date === yesterday) ||
        (selectedFilter === "Final" && ["3P", "F"].includes(match.round ?? "")) ||
        match.round === selectedFilter ||
        (!isKnockoutMatch(match) && getCutByDate(match.date) === selectedFilter);

      const groupOk =
        selectedGroup === "Todos" || getGroupLabel(match) === selectedGroup;

      const dateOk = selectedDate === "Todos" || match.date === selectedDate;

      const resolvedHome = resolvePlaceholderTeam(match, "home", matches);
      const resolvedAway = resolvePlaceholderTeam(match, "away", matches);

      const text = `${resolvedHome.team} ${resolvedAway.team} ${match.city} ${match.stadium} ${getGroupLabel(match)}`.toLowerCase();

      const searchOk =
        search.trim() === "" || text.includes(search.trim().toLowerCase());

      return filterOk && groupOk && dateOk && searchOk;
    });
  }, [matches, selectedFilter, selectedGroup, selectedDate, search, today, yesterday]);

  const groupedByDate = useMemo(() => {
    return filteredMatches.reduce<Record<string, Match[]>>((acc, match) => {
      if (!acc[match.date]) {
        acc[match.date] = [];
      }

      acc[match.date].push(match);
      return acc;
    }, {});
  }, [filteredMatches]);

  const capturedCount = filteredMatches.filter((match) => match.result).length;
  const pendingCount = filteredMatches.length - capturedCount;

  return (
    <main className="min-h-screen px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-300">
          Mundial 2026
        </p>

        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight md:text-7xl">
              Resultados
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-zinc-300">
              Consulta marcadores oficiales, penales, ganadores y partidos pendientes del torneo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-black/40 p-4 md:min-w-[320px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Capturados
              </p>
              <p className="text-3xl font-black text-lime-300">{capturedCount}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Pendientes
              </p>
              <p className="text-3xl font-black text-yellow-300">{pendingCount}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-black/50 p-4 shadow-2xl">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={
                  selectedFilter === filter.value
                    ? "shrink-0 rounded-full bg-yellow-400 px-6 py-3 font-black text-black"
                    : "shrink-0 rounded-full bg-white/10 px-6 py-3 font-black text-white hover:bg-white/15"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[220px_280px_1fr]">
            <select
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="rounded-xl border border-white/15 bg-black px-3 py-3 font-bold text-white"
            >
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group === "Todos" ? "Todos los grupos y rondas" : group}
                </option>
              ))}
            </select>

            <select
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-white/15 bg-black px-3 py-3 font-bold text-white"
            >
              {dates.map((date) => (
                <option key={date} value={date}>
                  {date === "Todos" ? "Todas las fechas" : formatDate(date)}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar equipo, ciudad o estadio..."
              className="rounded-xl border border-white/15 bg-black px-4 py-3 font-bold text-white outline-none placeholder:text-zinc-500"
            />
          </div>
        </section>

        <div className="mt-5 text-sm font-black text-zinc-300">
          {loading ? "Cargando resultados..." : `${filteredMatches.length} partidos`}
        </div>

        <section className="mt-6 space-y-8">
          {Object.entries(groupedByDate).map(([date, dayMatches]) => (
            <div key={date}>
              <h2 className="mb-4 text-lg font-black capitalize text-yellow-300">
                {formatDate(date)}
              </h2>

              <div className="grid gap-5 lg:grid-cols-2">
                {dayMatches.map((match) => {
                  const resolvedHome = resolvePlaceholderTeam(match, "home", matches);
                  const resolvedAway = resolvePlaceholderTeam(match, "away", matches);
                  const winner = getWinnerFromMatch(match, resolvedHome, resolvedAway);
                  const hasResult = Boolean(match.result);

                  return (
                    <article
                      key={match.id}
                      className="rounded-[1.75rem] border border-white/10 bg-black/60 p-5 shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-zinc-400">
                            Partido {match.matchNumber} · {getGroupLabel(match)}
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {match.time || "Hora por definir"} CDMX · {match.city}
                          </p>
                        </div>

                        <span
                          className={
                            hasResult
                              ? "rounded-full bg-lime-400 px-3 py-1 text-xs font-black uppercase text-black"
                              : "rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-black uppercase text-yellow-300"
                          }
                        >
                          {hasResult ? "Final" : "Pendiente"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <TeamRow
                          team={resolvedHome.team}
                          flag={resolvedHome.flag}
                          score={match.result?.home_score}
                          winner={winner?.side === "home"}
                        />

                        <div className="text-center text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
                          vs
                        </div>

                        <TeamRow
                          team={resolvedAway.team}
                          flag={resolvedAway.flag}
                          score={match.result?.away_score}
                          winner={winner?.side === "away"}
                        />
                      </div>

                      {match.result?.decided_by_penalties && (
                        <div className="mt-4 rounded-2xl border border-yellow-400/25 bg-yellow-400/10 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">
                            Definido en penales
                          </p>
                          <p className="mt-2 text-lg font-black">
                            {match.result.home_penalty_score ?? "-"} - {match.result.away_penalty_score ?? "-"}
                          </p>
                        </div>
                      )}

                      {winner && (
                        <div className="mt-4 rounded-2xl border border-lime-400/20 bg-lime-400/10 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                            Ganador
                          </p>
                          <p className="mt-1 text-xl font-black text-lime-200">
                            {winner.team}
                          </p>
                        </div>
                      )}

                      {!hasResult && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-zinc-400">
                          Resultado pendiente de captura.
                        </div>
                      )}

                      <div className="mt-4 text-sm text-zinc-500">
                        {match.stadium || "Estadio por definir"}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

function TeamRow({
  team,
  flag,
  score,
  winner,
}: {
  team: string;
  flag: string;
  score?: number;
  winner?: boolean;
}) {
  return (
    <div
      className={
        winner
          ? "flex items-center justify-between gap-4 rounded-2xl border border-lime-400/25 bg-lime-400/10 px-4 py-3"
          : "flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3"
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-3xl">{flagEmoji(flag)}</span>
        <span className="truncate text-lg font-black">{team}</span>
      </div>

      <div className="shrink-0 text-3xl font-black text-white">
        {typeof score === "number" ? score : "-"}
      </div>
    </div>
  );
}

function getMexicoDateOffset(offsetDays: number) {
  const now = new Date();
  const mexicoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const date = new Date(`${mexicoDate}T12:00:00`);
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

function getCutByDate(date: string) {
  if (date >= "2026-06-11" && date <= "2026-06-14") return "1";
  if (date >= "2026-06-15" && date <= "2026-06-21") return "2";
  if (date >= "2026-06-22" && date <= "2026-06-27") return "3";
  return "Todos";
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
  if (match.group) return match.group;

  const roundLabels: Record<string, string> = {
    R32: "Dieciseisavos",
    R16: "Octavos",
    QF: "Cuartos",
    SF: "Semifinal",
    F: "Final",
    "3P": "Tercer lugar",
  };

  return roundLabels[match.round ?? ""] ?? "Eliminatoria";
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

function getWinnerFromMatch(
  match?: Match,
  resolvedHome?: { team: string; flag: string; resolved: boolean },
  resolvedAway?: { team: string; flag: string; resolved: boolean }
) {
  if (!match?.result) return null;

  const homeTeam = resolvedHome?.team ?? match.home;
  const awayTeam = resolvedAway?.team ?? match.away;

  if (match.result.winner_team) {
    const normalizedWinner = normalizeTeamName(match.result.winner_team);

    if (normalizeTeamName(homeTeam) === normalizedWinner) {
      return { side: "home" as const, team: homeTeam };
    }

    if (normalizeTeamName(awayTeam) === normalizedWinner) {
      return { side: "away" as const, team: awayTeam };
    }

    return { side: null, team: match.result.winner_team };
  }

  if (match.result.winner_side === "home") {
    return { side: "home" as const, team: homeTeam };
  }

  if (match.result.winner_side === "away") {
    return { side: "away" as const, team: awayTeam };
  }

  if (match.result.home_score > match.result.away_score) {
    return { side: "home" as const, team: homeTeam };
  }

  if (match.result.away_score > match.result.home_score) {
    return { side: "away" as const, team: awayTeam };
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
    flag:
      winner.side === "home"
        ? sourceMatch?.homeFlag ?? "un"
        : winner.side === "away"
          ? sourceMatch?.awayFlag ?? "un"
          : "un",
    resolved: true,
  };
}

function flagEmoji(code: string) {
  const specialFlags: Record<string, string> = {
    un: "🌐",
    "gb-eng": "🏴",
    "gb-sct": "🏴",
  };

  if (specialFlags[code]) return specialFlags[code];
  if (!code || code.length !== 2) return "🌐";

  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}