import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

type DraftPickRaw = {
  id: string;
  pick_number: number;
  leaderboard_position: number;
  user_id: string;
  user_name: string;
  team_id: number | null;
  picked_at: string | null;
  picked_by: string | null;
  knockout_teams: KnockoutTeam | KnockoutTeam[] | null;
};

type DraftPick = Omit<DraftPickRaw, "knockout_teams"> & {
  knockout_teams: KnockoutTeam | null;
};

function normalizePick(pick: DraftPickRaw): DraftPick {
  const team = Array.isArray(pick.knockout_teams)
    ? pick.knockout_teams[0] ?? null
    : pick.knockout_teams;

  return {
    ...pick,
    knockout_teams: team,
  };
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: picks, error: picksError } = await supabase
    .from("draft_picks")
    .select(
      `
      id,
      pick_number,
      leaderboard_position,
      user_id,
      user_name,
      team_id,
      picked_at,
      picked_by,
      knockout_teams (
        id,
        team_name,
        team_flag,
        group_name,
        seed_label,
        is_available,
        is_eliminated,
        eliminated_round
      )
    `
    )
    .order("pick_number", { ascending: true });

  if (picksError) {
    return NextResponse.json(
      { error: picksError.message },
      { status: 500 }
    );
  }

  const { data: teams, error: teamsError } = await supabase
    .from("knockout_teams")
    .select(
      `
      id,
      team_name,
      team_flag,
      group_name,
      seed_label,
      is_available,
      is_eliminated,
      eliminated_round
    `
    )
    .order("team_name", { ascending: true });

  if (teamsError) {
    return NextResponse.json(
      { error: teamsError.message },
      { status: 500 }
    );
  }

  const draftPicks = ((picks ?? []) as unknown as DraftPickRaw[]).map(
    normalizePick
  );

  const knockoutTeams = (teams ?? []) as KnockoutTeam[];

  const selectedTeamIds = new Set(
    draftPicks
      .map((pick) => pick.team_id)
      .filter((teamId): teamId is number => teamId !== null)
  );

  const availableTeams = knockoutTeams.filter(
    (team) => !selectedTeamIds.has(team.id) && team.is_available
  );

  const currentPick =
    draftPicks.find((pick) => pick.team_id === null) ?? null;

  const completedPicks = draftPicks.filter(
    (pick) => pick.team_id !== null
  ).length;

  const picksByParticipant = draftPicks.reduce<
    Record<
      string,
      {
        user_id: string;
        user_name: string;
        leaderboard_position: number;
        picks: DraftPick[];
      }
    >
  >((acc, pick) => {
    if (!acc[pick.user_id]) {
      acc[pick.user_id] = {
        user_id: pick.user_id,
        user_name: pick.user_name,
        leaderboard_position: pick.leaderboard_position,
        picks: [],
      };
    }

    acc[pick.user_id].picks.push(pick);

    return acc;
  }, {});

  return NextResponse.json({
    total_picks: draftPicks.length,
    completed_picks: completedPicks,
    pending_picks: draftPicks.length - completedPicks,
    current_pick: currentPick,
    picks: draftPicks,
    teams: knockoutTeams,
    available_teams: availableTeams,
    participants: Object.values(picksByParticipant).sort(
      (a, b) => a.leaderboard_position - b.leaderboard_position
    ),
  });
}