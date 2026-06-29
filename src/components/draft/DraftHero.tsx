"use client";

import TeamFlag from "@/components/TeamFlag";
import type { DraftParticipant } from "@/app/draft/page";

type Props = {
  participants?: DraftParticipant[];
};

function getAlivePicks(participant: DraftParticipant) {
  return participant.picks.filter(
    (pick) => pick.knockout_teams && !pick.knockout_teams.is_eliminated
  );
}

function getEliminatedPicks(participant: DraftParticipant) {
  return participant.picks.filter(
    (pick) => pick.knockout_teams?.is_eliminated
  );
}

function isParticipantAlive(participant: DraftParticipant) {
  return getAlivePicks(participant).length > 0;
}

export default function DraftHero({ participants = [] }: Props) {
  const aliveParticipants = participants.filter(isParticipantAlive);
  const eliminatedParticipants = participants.filter(
    (participant) => !isParticipantAlive(participant)
  );

  const totalTeams = participants.reduce(
    (total, participant) =>
      total + participant.picks.filter((pick) => pick.knockout_teams).length,
    0
  );

  const aliveTeams = participants.reduce(
    (total, participant) => total + getAlivePicks(participant).length,
    0
  );

  const eliminatedTeams = participants.reduce(
    (total, participant) => total + getEliminatedPicks(participant).length,
    0
  );

  const survivalPercent =
    totalTeams === 0 ? 0 : Math.round((aliveTeams / totalTeams) * 100);

  const latestEliminatedPick = participants
    .flatMap((participant) =>
      participant.picks.map((pick) => ({
        ...pick,
        participantName: participant.user_name,
      }))
    )
    .filter((pick) => pick.knockout_teams?.is_eliminated)
    .sort((a, b) => b.pick_number - a.pick_number)[0];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-2xl">
      <div className="border-b border-white/10 bg-black/50 px-6 py-5">
        <p className="text-xs font-black uppercase tracking-[0.45em] text-lime-300">
          Panteras del ICC · Mundial 2026
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-6xl">
          Supervivencia
        </h1>

        <p className="mt-3 text-lg font-semibold text-lime-300">
          Fase de eliminación directa
        </p>

        <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
          Cada participante sigue con vida mientras conserve al menos una selección activa.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-[radial-gradient(circle_at_center,#166534_0,#0f172a_62%,#020617_100%)] p-6 md:p-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-lime-300/20 bg-white/10 p-6 text-center shadow-2xl backdrop-blur">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none text-white/[0.035] md:text-[16rem]">
              VIDA
            </div>

            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-[0.45em] text-lime-200">
                Estado actual
              </p>

              <p className="mt-6 text-5xl font-black text-lime-300 md:text-7xl">
                {aliveParticipants.length} con vida
              </p>

              <p className="mt-4 text-slate-300">
                {eliminatedParticipants.length === 0
                  ? "Todos los participantes siguen en competencia."
                  : `${eliminatedParticipants.length} participante${
                      eliminatedParticipants.length === 1 ? "" : "s"
                    } eliminado${eliminatedParticipants.length === 1 ? "" : "s"}.`}
              </p>

              <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                <StatusBox
                  label="Participantes"
                  value={participants.length}
                  tone="neutral"
                />
                <StatusBox
                  label="Con vida"
                  value={aliveParticipants.length}
                  tone="alive"
                />
                <StatusBox
                  label="Eliminados"
                  value={eliminatedParticipants.length}
                  tone="eliminated"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/80 p-6 lg:border-l lg:border-t-0">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
            Selecciones vivas
          </p>

          <div className="mt-5">
            <p className="text-6xl font-black">
              {aliveTeams}
              <span className="text-2xl text-slate-500">/{totalTeams}</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {survivalPercent}% siguen con vida
            </p>
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-lime-300 transition-all"
              style={{ width: `${survivalPercent}%` }}
            />
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Última eliminación
            </p>

            {latestEliminatedPick?.knockout_teams ? (
              <div className="mt-4 flex items-center gap-4">
                <TeamFlag
                  code={latestEliminatedPick.knockout_teams.team_flag}
                  name={latestEliminatedPick.knockout_teams.team_name}
                  style={{ width: 58, borderRadius: 10 }}
                />
                <div>
                  <p className="text-xl font-black text-red-200 line-through">
                    {latestEliminatedPick.knockout_teams.team_name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {latestEliminatedPick.participantName} · {latestEliminatedPick.knockout_teams.eliminated_round ?? "Eliminada"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Aún no hay selecciones eliminadas.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-red-400/20 bg-red-950/20 p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
              Selecciones eliminadas
            </p>
            <p className="mt-3 text-4xl font-black text-red-200">
              {eliminatedTeams}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "alive" | "eliminated";
}) {
  const toneClass =
    tone === "alive"
      ? "border-lime-300/30 bg-lime-300/10 text-lime-200"
      : tone === "eliminated"
        ? "border-red-300/30 bg-red-500/10 text-red-200"
        : "border-white/15 bg-black/30 text-white";

  return (
    <div className={`rounded-2xl border px-4 py-5 ${toneClass}`}>
      <p className="text-4xl font-black">{value}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
        {label}
      </p>
    </div>
  );
}