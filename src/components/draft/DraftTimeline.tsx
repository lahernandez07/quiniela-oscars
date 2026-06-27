"use client";

import TeamFlag from "@/components/TeamFlag";
import type { DraftPick } from "@/app/draft/page";

type Props = {
  picks: DraftPick[];
  currentPick: DraftPick | null;
};

export default function DraftTimeline({ picks, currentPick }: Props) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl">
      <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300">
        Orden del Draft
      </p>

      <div className="mt-5 max-h-[620px] space-y-2 overflow-y-auto pr-2">
        {picks.map((pick) => {
          const isCurrent = currentPick?.id === pick.id;
          const isDone = Boolean(pick.team_id);

          return (
            <div
              key={pick.id}
              className={`rounded-2xl border px-4 py-3 transition ${
                isDone
                  ? "border-lime-300/30 bg-lime-300/10"
                  : isCurrent
                    ? "border-blue-300/50 bg-blue-500/20"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Pick #{pick.pick_number} · Lugar {pick.leaderboard_position}
                  </p>
                  <p className="font-black">{pick.user_name}</p>
                </div>

                {pick.knockout_teams ? (
                  <div className="flex items-center gap-3 text-right">
                    <TeamFlag
                      code={pick.knockout_teams.team_flag}
                      name={pick.knockout_teams.team_name}
                      style={{ width: 38, borderRadius: 7 }}
                    />
                    <p className="text-sm font-black">
                      {pick.knockout_teams.team_name}
                    </p>
                  </div>
                ) : (
                  <p
                    className={`text-xs font-black uppercase tracking-widest ${
                      isCurrent ? "text-blue-200" : "text-slate-500"
                    }`}
                  >
                    {isCurrent ? "En turno" : "Pendiente"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}