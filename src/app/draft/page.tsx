"use client";

import { useEffect, useMemo, useState } from "react";
import DraftHero from "@/components/draft/DraftHero";
import DraftTeams from "@/components/draft/DraftTeams";
import DraftTimeline from "@/components/draft/DraftTimeline";
import DraftParticipants from "@/components/draft/DraftParticipants";

export type KnockoutTeam = {
  id: number;
  team_name: string;
  team_flag: string;
  group_name: string | null;
  seed_label: string | null;
  is_available: boolean;
  is_eliminated: boolean;
  eliminated_round: string | null;
};

export type DraftPick = {
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

export type DraftParticipant = {
  user_id: string;
  user_name: string;
  leaderboard_position: number;
  picks: DraftPick[];
};

type DraftData = {
  total_picks: number;
  completed_picks: number;
  pending_picks: number;
  current_pick: DraftPick | null;
  picks: DraftPick[];
  teams: KnockoutTeam[];
  available_teams: KnockoutTeam[];
  participants: DraftParticipant[];
};

export default function DraftPage() {
  const [data, setData] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDraft() {
    try {
      const response = await fetch("/api/draft", { cache: "no-store" });
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("Error loading draft:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDraft();
    const interval = setInterval(loadDraft, 7000);
    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(() => {
    if (!data || data.total_picks === 0) return 0;
    return Math.round((data.completed_picks / data.total_picks) * 100);
  }, [data]);

  const lastPick = useMemo(() => {
    if (!data) return null;
    return [...data.picks]
      .reverse()
      .find((pick) => pick.team_id !== null && pick.knockout_teams) ?? null;
  }, [data]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <p>Cargando Draft Panteras...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <p className="text-red-300">No se pudo cargar el draft.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0,#020617_45%,#020617_100%)] px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <DraftHero
          currentPick={data.current_pick}
          completedPicks={data.completed_picks}
          totalPicks={data.total_picks}
          progress={progress}
          lastPick={lastPick}
        />

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DraftTeams teams={data.available_teams} />
          <DraftTimeline picks={data.picks} currentPick={data.current_pick} />
        </section>

        <DraftParticipants participants={data.participants} />
      </div>
    </main>
  );
}