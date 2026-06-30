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

const FINAL_LEADERBOARD_ORDER = [
  "Hector Guerra",
  "Armando Barajas",
  "Alejandro Quiroz",
  "Luis Arreola",
  "mario jalil",
  "jose tamez",
  "Gerardo Gutierrez Flores",
  "LUIS ALEJANDRO HERNANDEZ GARCIA",
  "jose luis cantu",
  "Jose luis",
];

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const finalLeaderboardPosition = new Map(
  FINAL_LEADERBOARD_ORDER.map((name, index) => [normalizeName(name), index + 1])
);

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

  const { data: latestEliminationRows, error: latestEliminationError } =
    await supabase
      .from("results_dev")
      .select("match_id, eliminated_team, updated_at")
      .not("eliminated_team", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1);

  if (latestEliminationError) {
    return NextResponse.json(
      { error: latestEliminationError.message },
      { status: 500 }
    );
  }

  const draftPicks = ((picks ?? []) as unknown as DraftPickRaw[]).map(
    normalizePick
  );

  const knockoutTeams = (teams ?? []) as KnockoutTeam[];

  const latestEliminationResult = latestEliminationRows?.[0] ?? null;
  const latestEliminatedTeam = latestEliminationResult?.eliminated_team
    ? knockoutTeams.find(
        (team) =>
          normalizeName(team.team_name) ===
          normalizeName(latestEliminationResult.eliminated_team)
      ) ?? null
    : null;

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

  const latestEliminatedPick = latestEliminatedTeam
    ? draftPicks.find((pick) => pick.team_id === latestEliminatedTeam.id) ?? null
    : null;

  return NextResponse.json({
    total_picks: draftPicks.length,
    completed_picks: completedPicks,
    pending_picks: draftPicks.length - completedPicks,
    current_pick: currentPick,
    picks: draftPicks,
    teams: knockoutTeams,
    available_teams: availableTeams,
    latest_elimination: latestEliminatedTeam
      ? {
          match_id: latestEliminationResult.match_id,
          updated_at: latestEliminationResult.updated_at,
          team_name: latestEliminatedTeam.team_name,
          team_flag: latestEliminatedTeam.team_flag,
          eliminated_round: latestEliminatedTeam.eliminated_round,
          participant_name: latestEliminatedPick?.user_name ?? null,
        }
      : null,
    participants: Object.values(picksByParticipant)
      .map((participant) => ({
        ...participant,
        leaderboard_position:
          finalLeaderboardPosition.get(normalizeName(participant.user_name)) ??
          participant.leaderboard_position,
      }))
      .sort((a, b) => a.leaderboard_position - b.leaderboard_position),
  });
}