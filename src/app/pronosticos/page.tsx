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
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Cargando pronósticos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-yellow-400">
            Pronósticos Cerrados
          </h1>

          <p className="mt-3 text-zinc-400 text-lg">
            Visualiza los pronósticos de todos los participantes cuando el
            partido ya está cerrado.
          </p>
        </div>

        {matches.length === 0 && (
          <div className="text-center text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            Todavía no hay partidos cerrados con pronósticos disponibles.
          </div>
        )}

        <div className="space-y-8">
          {matches.map((match) => (
            <div
              key={match.match_id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm uppercase tracking-widest">
                      Partido #{match.match_number} · {match.group}
                    </p>

                    <h2 className="text-2xl md:text-3xl font-black mt-1 flex items-center gap-3 flex-wrap">
                      <span>{match.home_team}</span>
                      <span>vs</span>
                      <span>{match.away_team}</span>
                    </h2>

                    <p className="text-sm mt-2 font-semibold">
                      {match.date} · {match.time} · {match.city}
                    </p>

                    <p className="text-xs mt-1 font-medium opacity-80">
                      {match.stadium}
                    </p>
                  </div>

                  {match.result ? (
                    <div className="bg-black text-yellow-400 rounded-2xl px-6 py-4 text-center min-w-[140px]">
                      <p className="text-xs uppercase tracking-widest">
                        Resultado
                      </p>

                      <p className="text-4xl font-black">
                        {match.result.home_score} -{" "}
                        {match.result.away_score}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-black text-zinc-400 rounded-2xl px-6 py-4 text-center min-w-[140px]">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800 text-zinc-300 uppercase text-sm">
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
                            index % 2 === 0
                              ? "bg-zinc-900"
                              : "bg-zinc-950"
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold">
                            {prediction.display_name}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className="bg-zinc-800 rounded-xl px-4 py-2 inline-block font-bold text-lg">
                              {prediction.home_score} -{" "}
                              {prediction.away_score}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`font-black text-2xl ${
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
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}