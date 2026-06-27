"use client";

import { useEffect, useMemo, useState } from "react";
import TeamFlag from "@/components/TeamFlag";
import type { DraftPick } from "@/app/draft/page";

const DRAFT_START_TIME = new Date("2026-06-28T11:00:00-06:00").getTime();

function getCountdownParts(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  return {
    hours: String(Math.floor(totalSeconds / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"),
    seconds: String(totalSeconds % 60).padStart(2, "0"),
  };
}

type Props = {
  currentPick: DraftPick | null;
  completedPicks: number;
  totalPicks: number;
  progress: number;
  lastPick: DraftPick | null;
};

export default function DraftHero({
  currentPick,
  completedPicks,
  totalPicks,
  progress,
  lastPick,
}: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDraftLive = now >= DRAFT_START_TIME;
  const countdown = useMemo(
    () => getCountdownParts(DRAFT_START_TIME - now),
    [now]
  );

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-2xl">
      <div className="border-b border-white/10 bg-black/50 px-6 py-5">
        <p className="text-xs font-black uppercase tracking-[0.45em] text-lime-300">
          Panteras del ICC · Mundial 2026
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-6xl">Draft Day</h1>

        <p className="mt-3 text-lg font-semibold text-lime-300">
          Domingo 28 de junio · 11:00 hrs
        </p>

        <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
          Selección especial de equipos para la fase de eliminación directa.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-[radial-gradient(circle_at_center,#1d4ed8_0,#0f172a_62%,#020617_100%)] p-6 md:p-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-blue-300/20 bg-white/10 p-6 text-center shadow-2xl backdrop-blur">
            {currentPick && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13rem] font-black leading-none text-white/[0.035] md:text-[20rem]">
                #{currentPick.pick_number}
              </div>
            )}

            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-[0.45em] text-blue-200">
                {isDraftLive ? "En vivo · On the clock" : "Comienza en"}
              </p>

              {!isDraftLive && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <CountdownBox value={countdown.hours} label="Horas" />
                  <CountdownBox value={countdown.minutes} label="Min" />
                  <CountdownBox value={countdown.seconds} label="Seg" />
                </div>
              )}

              {currentPick ? (
                <>
                  <p className="mt-8 text-6xl font-black md:text-8xl">
                    #{currentPick.pick_number}
                  </p>

                  <h2 className="mt-4 text-3xl font-black md:text-5xl">
                    {currentPick.user_name}
                  </h2>

                  <p className="mt-3 text-sm uppercase tracking-[0.25em] text-slate-300">
                    Lugar {currentPick.leaderboard_position} del leaderboard
                  </p>

                  <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-dashed border-white/25 bg-black/30 px-6 py-8">
                    <p className="text-lg font-bold text-slate-200">
                      Esperando selección...
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      El equipo aparecerá aquí cuando Pepe registre el pick.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-6 text-5xl font-black text-lime-300 md:text-7xl">
                    Draft completo
                  </p>
                  <p className="mt-4 text-slate-300">
                    Ya se asignaron los 30 equipos.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/80 p-6 lg:border-l lg:border-t-0">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
            Progreso
          </p>

          <div className="mt-5">
            <p className="text-6xl font-black">
              {completedPicks}
              <span className="text-2xl text-slate-500">/{totalPicks}</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">{progress}% completado</p>
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-lime-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Última selección
            </p>

            {lastPick?.knockout_teams ? (
              <div className="mt-4 flex items-center gap-4">
                <TeamFlag
                  code={lastPick.knockout_teams.team_flag}
                  name={lastPick.knockout_teams.team_name}
                  style={{ width: 58, borderRadius: 10 }}
                />
                <div>
                  <p className="text-xl font-black">
                    {lastPick.knockout_teams.team_name}
                  </p>
                  <p className="text-sm text-slate-400">
                    Pick #{lastPick.pick_number} · {lastPick.user_name}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Aún no hay selecciones registradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CountdownBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-lime-300/20 bg-black/35 px-3 py-5 shadow-inner">
      <p className="text-4xl font-black text-lime-300 md:text-6xl">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-slate-300">
        {label}
      </p>
    </div>
  );
}