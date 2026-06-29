"use client";

import TeamFlag from "@/components/TeamFlag";
import type { DraftParticipant } from "@/app/draft/page";

type Props = {
  participants: DraftParticipant[];
};

export default function DraftParticipants({ participants }: Props) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl">
      <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300">
        Participantes
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...participants]
          .sort(
            (a, b) => a.leaderboard_position - b.leaderboard_position
          )
          .map((participant) => (
          <div
            key={participant.user_id}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-xs font-bold text-slate-400">
              Lugar {participant.leaderboard_position}
            </p>

            <h3 className="mt-1 text-xl font-black">
              {participant.user_name}
            </h3>

            <div className="mt-5 space-y-3">
              {participant.picks
                .sort((a, b) => a.pick_number - b.pick_number)
                .map((pick, index) => {
                  const isEliminated = pick.knockout_teams?.is_eliminated === true;

                  return (
                  <div
                    key={pick.id}
                    className={
                      isEliminated
                        ? "flex items-center justify-between rounded-2xl border border-red-400/35 bg-red-950/35 px-4 py-3 opacity-80"
                        : "flex items-center justify-between rounded-2xl bg-black/35 px-4 py-3"
                    }
                  >
                    <div>
                      <p className="text-xs text-slate-500">
                        Selección {index + 1}
                      </p>
                      <p className="text-sm font-black">
                        Pick #{pick.pick_number}
                      </p>
                      {isEliminated && (
                        <span className="mt-1 inline-flex rounded-full border border-red-400/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-200">
                          Eliminada
                        </span>
                      )}
                    </div>

                    {pick.knockout_teams ? (
                      <div className="flex items-center gap-2">
                        <TeamFlag
                          code={pick.knockout_teams.team_flag}
                          name={pick.knockout_teams.team_name}
                          style={{ width: 36, borderRadius: 7 }}
                        />
                        <span
                          className={
                            isEliminated
                              ? "text-sm font-black text-red-300 line-through decoration-red-400 decoration-2"
                              : "text-sm font-black text-white"
                          }
                        >
                          {pick.knockout_teams.team_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}