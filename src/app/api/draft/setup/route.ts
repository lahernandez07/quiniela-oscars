import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type LeaderboardRow = {
  user_id: string;
  display_name: string | null;
  name?: string | null;
  total_points?: number;
  points?: number;
  total?: number;
  exacts?: number;
  exact_scores?: number;
};

const DRAFT_ORDER = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  9, 8, 7, 6, 5, 4, 3, 2, 1,
  2, 3, 4, 5, 6, 7, 8, 9, 10,
  1, 10,
];

async function getLeaderboardFromApi() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  const url = baseUrl.startsWith("http")
    ? `${baseUrl}/api/leaderboard`
    : `https://${baseUrl}/api/leaderboard`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo leer /api/leaderboard: ${response.status}`);
  }

  const json = await response.json();

  if (Array.isArray(json)) {
    return json as LeaderboardRow[];
  }

  if (Array.isArray(json.leaderboard)) {
    return json.leaderboard as LeaderboardRow[];
  }

  if (Array.isArray(json.participants)) {
    return json.participants as LeaderboardRow[];
  }

  if (Array.isArray(json.data)) {
    return json.data as LeaderboardRow[];
  }

  return [];
}

function getPoints(row: LeaderboardRow) {
  return row.total_points ?? row.points ?? row.total ?? 0;
}

function getExacts(row: LeaderboardRow) {
  return row.exacts ?? row.exact_scores ?? 0;
}

function getName(row: LeaderboardRow) {
  return row.display_name ?? row.name ?? "Participante";
}

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let leaderboard: LeaderboardRow[] = [];

  try {
    leaderboard = await getLeaderboardFromApi();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo obtener el leaderboard",
      },
      { status: 500 }
    );
  }

  if (leaderboard.length < 10) {
    return NextResponse.json(
      {
        error: "Se necesitan al menos 10 participantes para generar el draft.",
        participants_found: leaderboard.length,
      },
      { status: 400 }
    );
  }

  const topTen = leaderboard
    .filter((row) => Boolean(row.user_id))
    .sort((a, b) => {
      const pointsDiff = getPoints(b) - getPoints(a);

      if (pointsDiff !== 0) {
        return pointsDiff;
      }

      return getExacts(b) - getExacts(a);
    })
    .slice(0, 10);

  const picks = DRAFT_ORDER.map((leaderboardPosition, index) => {
    const participant = topTen[leaderboardPosition - 1];

    return {
      pick_number: index + 1,
      leaderboard_position: leaderboardPosition,
      user_id: participant.user_id,
      user_name: getName(participant),
      team_id: null,
      picked_at: null,
      picked_by: null,
    };
  });

  const { error: deleteError } = await supabase
    .from("draft_picks")
    .delete()
    .gte("pick_number", 1);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  const { data, error: insertError } = await supabase
    .from("draft_picks")
    .insert(picks)
    .select("*")
    .order("pick_number", { ascending: true });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Draft generado correctamente",
    total_picks: data?.length ?? 0,
    picks: data,
  });
}