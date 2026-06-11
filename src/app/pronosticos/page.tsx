"use client";

import { useEffect, useState } from "react";

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
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-yellow-400 md:text-5xl">
            Pronósticos Cerrados
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-lg text-zinc-400">
            Visualiza los pronósticos de todos los participantes cuando el
            partido ya inició.
          </p>
        </div>

        {matches.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            Todavía no hay partidos cerrados con pronósticos disponibles.
          </div>
        )}

        <div className="space-y-8">
          {matches.map((match) => (
            <div
              key={match.match_id}
              className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl"
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
                      {match.date} · {match.time} · {match.city}
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
                        {match.result.home_score} -{" "}
                        {match.result.away_score}
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
                  {/* MOBILE CARDS */}
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
                              className={`mt-1 text-2xl font-black ${
                                prediction.points === 3
                                  ? "text-green-400"
                                  : prediction.points === 1
                                    ? "text-yellow-400"
                                    : prediction.points === 0
                                      ? "text-red-400"
                                      : "text-zinc-500"
                              }`}
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

                  {/* DESKTOP TABLE */}
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

                          <th className="px-6 py-4 text-center">
                            Puntos
                          </th>

                          <th className="px-6 py-4 text-center">
                            Exacto
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {match.predictions.map((prediction, index) => (
                          <tr
                            key={`${match.match_id}-${prediction.user_id}`}
                            className={`border-t border-zinc-800 ${
                              index % 2 === 0
                                ? "bg-zinc-900"
                                : "bg-zinc-950"
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
                                className={`text-2xl font-black ${
                                  prediction.points === 3
                                    ? "text-green-400"
                                    : prediction.points === 1
                                      ? "text-yellow-400"
                                      : prediction.points === 0
                                        ? "text-red-400"
                                        : "text-zinc-500"
                                }`}
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