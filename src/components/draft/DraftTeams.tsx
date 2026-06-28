"use client";

import TeamFlag from "@/components/TeamFlag";
import type { KnockoutTeam } from "@/app/draft/page";

type Props = {
  teams: KnockoutTeam[];
};

const FIFA_RANKING_ORDER = [
  "Argentina",
  "España",
  "Francia",
  "Inglaterra",
  "Brasil",
  "Portugal",
  "Países Bajos",
  "Bélgica",
  "Alemania",
  "Croacia",
  "Marruecos",
  "México",
  "Estados Unidos",
  "Colombia",
  "Japón",
  "Suiza",
  "Senegal",
  "Ecuador",
  "Austria",
  "Paraguay",
  "Noruega",
  "Canadá",
  "Australia",
  "Suecia",
  "Costa de Marfil",
  "Ghana",
  "Argelia",
  "Bosnia y Herzegovina",
  "Egipto",
  "Sudáfrica",
  "RD Congo",
  "Islas de Cabo Verde",
];

function getFifaRank(teamName: string) {
  const index = FIFA_RANKING_ORDER.indexOf(teamName);
  return index === -1 ? 999 : index + 1;
}

export default function DraftTeams({ teams }: Props) {
  const orderedTeams = [...teams].sort(
    (a, b) => getFifaRank(a.team_name) - getFifaRank(b.team_name)
  );
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl">
      <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300">
        Equipos disponibles
      </p>

      {teams.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Todavía no se han cargado las 32 selecciones clasificadas.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
          {orderedTeams.map((team) => (
            <div
              key={team.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,#334155_0,#0f172a_55%,#020617_100%)] p-4 shadow-xl transition hover:-translate-y-1 hover:border-lime-300/40"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-lime-300/10 blur-2xl transition group-hover:bg-lime-300/20" />

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl bg-black/35 p-2">
                    <TeamFlag
                      code={team.team_flag}
                      name={team.team_name}
                      style={{ width: 52, borderRadius: 10 }}
                    />
                  </div>

                  <span className="rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lime-300">
                    FIFA #{getFifaRank(team.team_name)}
                  </span>
                </div>

                <p className="mt-5 text-lg font-black">{team.team_name}</p>

                <p className="mt-1 text-xs text-slate-400">
                  {team.seed_label ?? "Clasificado"}
                </p>

                <div className="mt-4 h-px bg-white/10" />

                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Draft Panteras
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}