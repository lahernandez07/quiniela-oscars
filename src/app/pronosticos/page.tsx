"use client";

import { useEffect, useMemo, useState } from "react";

type Prediction = {
  user_id: string;
  display_name: string;
  home_score: number;
  away_score: number;
  points: number | null;
  exact: number;
};

type MatchPrediction = {
  match_id: number;
  match_number: number;
  group: string;
  date: string;
  time: string;
  city: string;
  stadium: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  result: {
    home_score: number;
    away_score: number;
  } | null;
  predictions: Prediction[];
};

export default function PronosticosPage() {
  const [matches, setMatches] = useState<MatchPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCut, setSelectedCut] = useState("Todos");
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPredictions() {
      try {
        const res = await fetch("/api/match-predictions");
        const data = await res.json();

        if (Array.isArray(data)) {
          setMatches(data);
        } else {
          console.error("Respuesta inesperada de la API:", data);
          setMatches([]);
        }
      } catch (error) {
        console.error("Error cargando pronósticos:", error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }

    loadPredictions();
  }, []);

  const groups = useMemo(() => {
    return ["Todos", ...Array.from(new Set(matches.map((m) => m.group)))];
  }, [matches]);

  const dates = useMemo(() => {
    return ["Todos", ...Array.from(new Set(matches.map((m) => m.date)))];
  }, [matches]);

  function getCut(matchNumber: number) {
    if (matchNumber <= 12) return "1";
    if (matchNumber <= 24) return "2";
    return "3";
  }

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const cutOk =
        selectedCut === "Todos" || getCut(match.match_number) === selectedCut;

      const groupOk =
        selectedGroup === "Todos" || match.group === selectedGroup;

      const dateOk =
        selectedDate === "Todos" || match.date === selectedDate;

      const text = `${match.match_number} ${match.home_team} ${match.away_team} ${match.city} ${match.stadium} ${match.group}`.toLowerCase();

      const searchOk =
        search.trim() === "" || text.includes(search.toLowerCase());

      return cutOk && groupOk && dateOk && searchOk;
    });
  }, [matches, selectedCut, selectedGroup, selectedDate, search]);

  function scrollToMatch(matchId: number) {
    const element = document.getElementById(`match-${matchId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xl">Cargando pronósticos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-yellow-400 md:text-5xl">
            Pronósticos Cerrados
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-lg text-zinc-400">
            Visualiza los pronósticos de todos los participantes cuando el
            partido ya inició.
          </p>
        </div>
                <section className="mb-8 rounded-3xl border border-zinc-800 bg-black/90 p-4 shadow-2xl backdrop-blur">
          <div className="mb-4 flex flex-wrap gap-2">
            {["Todos", "1", "2", "3"].map((cut) => (
              <button
                key={cut}
                type="button"
                onClick={() => setSelectedCut(cut)}
                className={
                  selectedCut === cut
                    ? "rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black shadow-lg shadow-yellow-400/20"
                    : "rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-black text-white"
                }
              >
                {cut === "Todos" ? "Todas" : `Semana ${cut}`}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[220px_260px_1fr]">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold text-white"
            >
              {groups.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>

            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold text-white"
            >
              {dates.map((date) => (
                <option key={date} value={date}>
                  {date === "Todos" ? "Todas las fechas" : formatDate(date)}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar partido, equipo, ciudad o estadio..."
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {filteredMatches.map((match) => (
              <button
                key={`quick-${match.match_id}`}
                onClick={() => scrollToMatch(match.match_id)}
                className="shrink-0 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300"
              >
                #{match.match_number}
              </button>
            ))}
          </div>

          <div className="mt-3 text-sm font-bold text-zinc-400">
            {filteredMatches.length} partidos visibles
          </div>
        </section>

        {filteredMatches.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            No hay partidos que coincidan con los filtros seleccionados.
          </div>
        )}

        <div className="space-y-8">
          {filteredMatches.map((match) => (
            <div
              id={`match-${match.match_id}`}
              key={match.match_id}
              className="scroll-mt-40 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-5 text-black md:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">
                      Partido #{match.match_number} · {match.group}
                    </p>

                    <h2 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-black md:text-3xl">
                      <span>{match.home_team}</span>
                      <span>vs</span>
                      <span>{match.away_team}</span>
                    </h2>

                    <p className="mt-2 text-sm font-semibold">
                      {formatDate(match.date)} · {match.time} CDMX ·{" "}
                      {match.city}
                    </p>

                    <p className="mt-1 text-xs font-medium opacity-80">
                      {match.stadium}
                    </p>
                  </div>

                  {match.result ? (
                    <div className="rounded-2xl bg-black px-6 py-4 text-center text-yellow-400 md:min-w-[140px]">
                      <p className="text-xs uppercase tracking-widest">
                        Resultado
                      </p>

                      <p className="text-4xl font-black">
                        {match.result.home_score} - {match.result.away_score}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-black px-6 py-4 text-center text-zinc-400 md:min-w-[140px]">
                      <p className="text-xs uppercase tracking-widest">
                        Resultado
                      </p>

                      <p className="text-xl font-black">Pendiente</p>
                    </div>
                  )}
                </div>
              </div>
                            {match.predictions.length === 0 ? (
                <div className="py-10 text-center text-zinc-500">
                  Sin pronósticos registrados
                </div>
              ) : (
                <>
                  <div className="block divide-y divide-zinc-800 md:hidden">
                    {match.predictions.map((prediction) => (
                      <div
                        key={`${match.match_id}-${prediction.user_id}-mobile`}
                        className="bg-zinc-950 px-5 py-5"
                      >
                        <div className="mb-4">
                          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                            Participante
                          </p>
                          <p className="mt-1 text-xl font-black text-white">
                            {prediction.display_name}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-zinc-900 p-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              Pronóstico
                            </p>
                            <p className="mt-1 text-xl font-black">
                              {prediction.home_score} -{" "}
                              {prediction.away_score}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-zinc-900 p-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              Puntos
                            </p>
                            <p
                              className={`mt-1 text-2xl font-black ${pointsColor(
                                prediction.points
                              )}`}
                            >
                              {prediction.points ?? "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-zinc-900 p-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              Exacto
                            </p>
                            <p className="mt-1 text-2xl font-black">
                              {prediction.exact === 1 ? "🎯" : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead className="bg-zinc-800 text-sm uppercase text-zinc-300">
                        <tr>
                          <th className="px-6 py-4 text-left">
                            Participante
                          </th>
                          <th className="px-6 py-4 text-center">
                            Pronóstico
                          </th>
                          <th className="px-6 py-4 text-center">Puntos</th>
                          <th className="px-6 py-4 text-center">Exacto</th>
                        </tr>
                      </thead>

                      <tbody>
                        {match.predictions.map((prediction, index) => (
                          <tr
                            key={`${match.match_id}-${prediction.user_id}`}
                            className={`border-t border-zinc-800 ${
                              index % 2 === 0 ? "bg-zinc-900" : "bg-zinc-950"
                            }`}
                          >
                            <td className="px-6 py-4 font-semibold">
                              {prediction.display_name}
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span className="inline-block rounded-xl bg-zinc-800 px-4 py-2 text-lg font-bold">
                                {prediction.home_score} -{" "}
                                {prediction.away_score}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span
                                className={`text-2xl font-black ${pointsColor(
                                  prediction.points
                                )}`}
                              >
                                {prediction.points ?? "-"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-center">
                              {prediction.exact === 1 ? (
                                <span className="text-3xl">🎯</span>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function pointsColor(points: number | null) {
  if (points === 3) return "text-green-400";
  if (points === 1) return "text-yellow-400";
  if (points === 0) return "text-red-400";
  return "text-zinc-500";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}