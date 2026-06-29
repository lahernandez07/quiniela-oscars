import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeTeamName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .trim();
}

function resolveTeamNameForDatabase(teamName: string) {
  const normalized = normalizeTeamName(teamName);

  if (normalized === "ee uu" || normalized === "estados unidos") {
    return "Estados Unidos";
  }

  return teamName;
}

function getWinnerAndEliminatedTeam(match: any, body: any) {
  const homeScore = Number(body.home_score);
  const awayScore = Number(body.away_score);

  if (body.winner_side === "home") {
    return {
      winnerTeam: match.home,
      eliminatedTeam: match.away,
    };
  }

  if (body.winner_side === "away") {
    return {
      winnerTeam: match.away,
      eliminatedTeam: match.home,
    };
  }

  if (homeScore > awayScore) {
    return {
      winnerTeam: match.home,
      eliminatedTeam: match.away,
    };
  }

  if (awayScore > homeScore) {
    return {
      winnerTeam: match.away,
      eliminatedTeam: match.home,
    };
  }

  return {
    winnerTeam: null,
    eliminatedTeam: null,
  };
}

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "worldcup2026-group-stage.json"
    );

    const file = fs.readFileSync(filePath, "utf8");
    const matches = JSON.parse(file);

    const { data: results, error } = await supabase
      .from("results_dev")
      .select("*");

    if (error) {
      console.error("SUPABASE GET ERROR:", error);

      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    const mergedMatches = matches.map((match: any) => {
      const result = (results ?? []).find(
        (item: any) => item.match_id === match.id
      );

      return {
        ...match,
        result: result || null,
      };
    });

    return NextResponse.json(mergedMatches);
  } catch (error) {
    console.error("GET INTERNAL ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      match_id,
      home_score,
      away_score,
      decided_by_penalties = false,
      home_penalty_score = null,
      away_penalty_score = null,
      winner_side = null,
    } = body;

    if (
      match_id === undefined ||
      home_score === undefined ||
      away_score === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields", body },
        { status: 400 }
      );
    }

    if (decided_by_penalties && !["home", "away"].includes(winner_side)) {
      return NextResponse.json(
        {
          error: "Penalty matches require winner_side as home or away",
          body,
        },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "worldcup2026-group-stage.json"
    );

    const file = fs.readFileSync(filePath, "utf8");
    const matches = JSON.parse(file);
    const match = matches.find((item: any) => Number(item.id) === Number(match_id));

    if (!match) {
      return NextResponse.json(
        { error: "Match not found", match_id },
        { status: 404 }
      );
    }

    const { winnerTeam, eliminatedTeam } = getWinnerAndEliminatedTeam(match, body);

    const { data, error } = await supabase
      .from("results_dev")
      .upsert(
        {
          match_id: Number(match_id),
          home_score: Number(home_score),
          away_score: Number(away_score),
          decided_by_penalties: Boolean(decided_by_penalties),
          home_penalty_score:
            home_penalty_score === null || home_penalty_score === ""
              ? null
              : Number(home_penalty_score),
          away_penalty_score:
            away_penalty_score === null || away_penalty_score === ""
              ? null
              : Number(away_penalty_score),
          winner_side,
          winner_team: winnerTeam,
          eliminated_team: eliminatedTeam,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "match_id",
        }
      )
      .select();

    if (error) {
      console.error("SUPABASE POST ERROR:", error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    if (eliminatedTeam && (match.round || Number(match.matchNumber) >= 73)) {
      const eliminatedTeamName = resolveTeamNameForDatabase(eliminatedTeam);

      const { error: eliminationError } = await supabase
        .from("knockout_teams")
        .update({
          is_eliminated: true,
          eliminated_round: match.round ?? "knockout",
        })
        .eq("team_name", eliminatedTeamName);

      if (eliminationError) {
        console.error("SUPABASE ELIMINATION UPDATE ERROR:", eliminationError);

        return NextResponse.json(
          {
            error: eliminationError.message,
            details: eliminationError,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("POST INTERNAL ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error,
      },
      { status: 500 }
    );
  }
}