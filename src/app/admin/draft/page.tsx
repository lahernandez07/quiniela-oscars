"use client";

import { useEffect, useMemo, useState } from "react";
import TeamFlag from "@/components/TeamFlag";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type KnockoutTeam = {
  id: number;
  team_name: string;
  team_flag: string;
  group_name: string | null;
  seed_label: string | null;
  is_available: boolean;
  is_eliminated: boolean;
  eliminated_round: string | null;
};

type DraftPick = {
  id: string;
  pick_number: number;
  leaderboard_position: number;
  user_id: string;
  user_name: string;
  team_id: number | null;
  picked_at: string | null;
  picked_by: string | null;
  knockout_teams: KnockoutTeam | null;
};

type DraftData = {
  total_picks: number;
  completed_picks: number;
  pending_picks: number;
  current_pick: DraftPick | null;
  picks: DraftPick[];
  teams: KnockoutTeam[];
  available_teams: KnockoutTeam[];
};

export default function AdminDraftPage() {
  const [data, setData] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<KnockoutTeam | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadDraft() {
    try {
      const response = await fetch("/api/draft", { cache: "no-store" });
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("Error loading draft:", error);
      setMessage("No se pudo cargar el draft.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  loadDraft();

  const channel = supabaseBrowser()
    .channel("draft-admin-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "draft_picks",
      },
      () => {
        loadDraft();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "knockout_teams",
      },
      () => {
        loadDraft();
      }
    )
    .subscribe();

  return () => {
    supabaseBrowser().removeChannel(channel);
  };
}, []);

  const progress = useMemo(() => {
    if (!data || data.total_picks === 0) return 0;
    return Math.round((data.completed_picks / data.total_picks) * 100);
  }, [data]);

  async function confirmPick() {
    if (!data?.current_pick || !selectedTeam) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/draft/pick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pick_id: data.current_pick.id,
          team_id: selectedTeam.id,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setMessage(json.error ?? "No se pudo asignar el equipo.");
        return;
      }

      setMessage(`✅ ${selectedTeam.team_name} asignado correctamente.`);
      setSelectedTeam(null);
      await loadDraft();
    } catch (error) {
      console.error("Error assigning pick:", error);
      setMessage("Ocurrió un error al asignar el pick.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        Cargando Admin Draft...
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <p className="text-red-300">No se pudo cargar el Admin Draft.</p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-8 text-white"
      style={{
        background:
          "linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.95)), url('/worldcup-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-lime-300">
            Admin Panteras
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-6xl">
                Admin Draft Day
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
                Panel para capturar las selecciones del Draft de eliminación
                directa.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Progreso
              </p>
              <p className="text-3xl font-black">
                {data.completed_picks}/{data.total_picks}
              </p>
              <p className="text-sm text-slate-400">{progress}% completado</p>
            </div>
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-lime-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-sm font-bold">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300">
              Pick actual
            </p>

            {data.current_pick ? (
              <div className="mt-5 rounded-3xl border border-blue-300/30 bg-blue-500/15 p-6 text-center">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-200">
                  On the clock
                </p>

                <p className="mt-5 text-7xl font-black">
                  #{data.current_pick.pick_number}
                </p>

                <h2 className="mt-4 text-3xl font-black">
                  {data.current_pick.user_name}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Lugar {data.current_pick.leaderboard_position} del leaderboard
                </p>

                {selectedTeam ? (
                  <div className="mt-8 rounded-2xl border border-lime-300/30 bg-lime-300/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-lime-300">
                      Equipo seleccionado
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-4">
                      <TeamFlag
                        code={selectedTeam.team_flag}
                        name={selectedTeam.team_name}
                        style={{ width: 62, borderRadius: 10 }}
                      />
                      <p className="text-2xl font-black">
                        {selectedTeam.team_name}
                      </p>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => setSelectedTeam(null)}
                        disabled={saving}
                        className="flex-1 rounded-full border border-white/20 bg-black px-4 py-3 font-black text-white disabled:opacity-50"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={confirmPick}
                        disabled={saving}
                        className="flex-1 rounded-full bg-lime-300 px-4 py-3 font-black text-black disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "Confirmar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-black/40 p-5 text-sm text-slate-300">
                    Selecciona un equipo disponible para asignarlo a este pick.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-lime-300/30 bg-lime-300/10 p-6">
                <h2 className="text-3xl font-black text-lime-300">
                  Draft completo
                </h2>
                <p className="mt-2 text-slate-300">
                  Ya se capturaron los 30 picks.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300">
              Equipos disponibles
            </p>

            {data.available_teams.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                Todavía no se han cargado las 32 selecciones clasificadas.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {data.available_teams.map((team) => {
                  const isSelected = selectedTeam?.id === team.id;

                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      disabled={!data.current_pick || saving}
                      className={`group rounded-3xl border p-4 text-left shadow-xl transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected
                          ? "border-lime-300 bg-lime-300/15"
                          : "border-white/10 bg-white/5 hover:border-lime-300/40 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <TeamFlag
                          code={team.team_flag}
                          name={team.team_name}
                          style={{ width: 52, borderRadius: 10 }}
                        />

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            isSelected
                              ? "bg-lime-300 text-black"
                              : "bg-cyan-400/15 text-cyan-200"
                          }`}
                        >
                          {isSelected ? "Elegido" : "Libre"}
                        </span>
                      </div>

                      <p className="mt-5 text-lg font-black">
                        {team.team_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {team.seed_label ?? "Clasificado"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300">
            Orden del Draft
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.picks.map((pick) => {
              const isCurrent = data.current_pick?.id === pick.id;
              const isDone = Boolean(pick.team_id);

              return (
                <div
                  key={pick.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    isDone
                      ? "border-lime-300/30 bg-lime-300/10"
                      : isCurrent
                        ? "border-blue-300/50 bg-blue-500/20"
                        : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className="text-xs text-slate-400">
                    Pick #{pick.pick_number} · Lugar{" "}
                    {pick.leaderboard_position}
                  </p>

                  <p className="mt-1 font-black">{pick.user_name}</p>

                  {pick.knockout_teams ? (
                    <div className="mt-3 flex items-center gap-3">
                      <TeamFlag
                        code={pick.knockout_teams.team_flag}
                        name={pick.knockout_teams.team_name}
                        style={{ width: 34, borderRadius: 7 }}
                      />
                      <p className="text-sm font-black">
                        {pick.knockout_teams.team_name}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      {isCurrent ? "En turno" : "Pendiente"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}