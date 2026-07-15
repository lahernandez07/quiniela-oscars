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

function teamNamesMatch(left: string, right: string) {
  return normalizeTeamName(left) === normalizeTeamName(right);
}

function getFlagForTeam(teamName: string, matches: any[]) {
  const normalizedTeam = normalizeTeamName(teamName);

  for (const item of matches) {
    if (
      item.home &&
      normalizeTeamName(item.home) === normalizedTeam &&
      item.homeFlag &&
      item.homeFlag !== "un"
    ) {
      return item.homeFlag;
    }

    if (
      item.away &&
      normalizeTeamName(item.away) === normalizedTeam &&
      item.awayFlag &&
      item.awayFlag !== "un"
    ) {
      return item.awayFlag;
    }
  }

  const fallbackFlags: Record<string, string> = {
    francia: "fr",
    espana: "es",
    inglaterra: "gb-eng",
    belgica: "be",
    noruega: "no",
    marruecos: "ma",
    argentina: "ar",
    colombia: "co",
    suiza: "ch",
    egipto: "eg",
    paraguay: "py",
    canada: "ca",
    brasil: "br",
    mexico: "mx",
    portugal: "pt",
    "estados unidos": "us",
    "ee uu": "us",
  };

  return fallbackFlags[normalizedTeam] ?? "un";
}


function getReferencedMatchNumber(value?: string) {
  if (!value) return null;

  const match = value.match(/M(\d+)/i);

  if (!match) return null;

  return Number(match[1]);
}

type ResolvedTeam = {
  team: string;
  flag: string;
};

function getWinnerFromStoredResult(
  match: any,
  result: any,
  matches: any[]
): ResolvedTeam | null {
  if (!match || !result) return null;

  if (result.winner_team) {
    const normalizedWinner = normalizeTeamName(result.winner_team);

    if (teamNamesMatch(match.home, normalizedWinner)) {
      return {
        team: match.home,
        flag: match.homeFlag || getFlagForTeam(match.home, matches),
      };
    }

    if (teamNamesMatch(match.away, normalizedWinner)) {
      return {
        team: match.away,
        flag: match.awayFlag || getFlagForTeam(match.away, matches),
      };
    }
    return {
      team: result.winner_team,
      flag: getFlagForTeam(result.winner_team, matches),
    };
  }

  if (result.winner_side === "home") {
    return {
      team: match.home,
      flag: match.homeFlag || getFlagForTeam(match.home, matches),
    };
  }

  if (result.winner_side === "away") {
    return {
      team: match.away,
      flag: match.awayFlag || getFlagForTeam(match.away, matches),
    };
  }

  if (Number(result.home_score) > Number(result.away_score)) {
    return {
      team: match.home,
      flag: match.homeFlag || getFlagForTeam(match.home, matches),
    };
  }

  if (Number(result.away_score) > Number(result.home_score)) {
    return {
      team: match.away,
      flag: match.awayFlag || getFlagForTeam(match.away, matches),
    };
  }

  return null;
}

function getLoserFromStoredResult(
  match: any,
  result: any,
  matches: any[]
): ResolvedTeam | null {
  if (!match || !result) return null;

  const winner = getWinnerFromStoredResult(match, result, matches);

  if (!winner) return null;

  if (teamNamesMatch(winner.team, match.home)) {
    return {
      team: match.away,
      flag:
        match.awayFlag && match.awayFlag !== "un"
          ? match.awayFlag
          : getFlagForTeam(match.away, matches),
    };
  }

  if (teamNamesMatch(winner.team, match.away)) {
    return {
      team: match.home,
      flag:
        match.homeFlag && match.homeFlag !== "un"
          ? match.homeFlag
          : getFlagForTeam(match.home, matches),
    };
  }

  return null;
}

function resolveMatchSide(
  match: any,
  side: "home" | "away",
  matches: any[],
  storedResults: any[]
): ResolvedTeam | null {
  const currentTeam = side === "home" ? match.home : match.away;
  const currentFlag = side === "home" ? match.homeFlag : match.awayFlag;
  const placeholder =
    side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  const referenceValue = getReferencedMatchNumber(placeholder)
    ? placeholder
    : currentTeam;
  const shouldResolveLoser = /perdedor/i.test(referenceValue ?? "");

  const referenceMatchNumber = getReferencedMatchNumber(referenceValue);

  if (!referenceMatchNumber) {
    return {
      team: currentTeam,
      flag:
        currentFlag && currentFlag !== "un"
          ? currentFlag
          : getFlagForTeam(currentTeam ?? "", matches),
    };
  }

  const sourceMatch = matches.find(
    (item: any) => Number(item.matchNumber) === referenceMatchNumber
  );

  const sourceResult = storedResults.find(
    (item: any) => Number(item.match_id) === Number(sourceMatch?.id)
  );

  if (!sourceMatch || !sourceResult) {
    return null;
  }

  const resolvedSourceMatch = resolveMatchTeams(
    sourceMatch,
    matches,
    storedResults
  );

  return shouldResolveLoser
    ? getLoserFromStoredResult(resolvedSourceMatch, sourceResult, matches)
    : getWinnerFromStoredResult(resolvedSourceMatch, sourceResult, matches);
}

function resolveMatchTeams(
  match: any,
  matches: any[],
  storedResults: any[]
): any {
  const resolvedHome = resolveMatchSide(match, "home", matches, storedResults);
  const resolvedAway = resolveMatchSide(match, "away", matches, storedResults);

  if (!resolvedHome || !resolvedAway) {
    return match;
  }

  return {
    ...match,
    home: resolvedHome.team,
    away: resolvedAway.team,
    homeFlag: resolvedHome.flag,
    awayFlag: resolvedAway.flag,
  };
}

async function updateKnockoutElimination(match: any, eliminatedTeam: string) {
  const homeTeamName = resolveTeamNameForDatabase(match.home);
  const awayTeamName = resolveTeamNameForDatabase(match.away);
  const eliminatedTeamName = resolveTeamNameForDatabase(eliminatedTeam);

  const { data: teams, error: teamsError } = await supabase
    .from("knockout_teams")
    .select("id, team_name");

  if (teamsError) {
    return { error: teamsError };
  }

  const matchTeamIds = (teams ?? [])
    .filter(
      (team: any) =>
        teamNamesMatch(team.team_name, homeTeamName) ||
        teamNamesMatch(team.team_name, awayTeamName)
    )
    .map((team: any) => team.id);

  if (matchTeamIds.length > 0) {
    const { error: resetError } = await supabase
      .from("knockout_teams")
      .update({
        is_eliminated: false,
        eliminated_round: null,
      })
      .in("id", matchTeamIds);

    if (resetError) {
      return { error: resetError };
    }
  }

  const eliminatedRecord = (teams ?? []).find((team: any) =>
    teamNamesMatch(team.team_name, eliminatedTeamName)
  );

  if (!eliminatedRecord) {
    return {
      error: {
        message: `No se encontró el equipo eliminado en knockout_teams: ${eliminatedTeamName}`,
      },
    };
  }

  const { error: eliminationError } = await supabase
    .from("knockout_teams")
    .update({
      is_eliminated: true,
      eliminated_round: match.round ?? "knockout",
    })
    .eq("id", eliminatedRecord.id);

  if (eliminationError) {
    return { error: eliminationError };
  }

  return { error: null };
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
      const resolvedMatch = resolveMatchTeams(
        match,
        matches,
        results ?? []
      );

      const result = (results ?? []).find(
        (item: any) => Number(item.match_id) === Number(match.id)
      );

      return {
        ...resolvedMatch,
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

    const { data: storedResults, error: storedResultsError } = await supabase
      .from("results_dev")
      .select("*");

    if (storedResultsError) {
      console.error("SUPABASE STORED RESULTS ERROR:", storedResultsError);

      return NextResponse.json(
        {
          error: storedResultsError.message,
          details: storedResultsError,
        },
        { status: 500 }
      );
    }

    const resolvedMatch = resolveMatchTeams(
      match,
      matches,
      storedResults ?? []
    );

    const { winnerTeam, eliminatedTeam } = getWinnerAndEliminatedTeam(
      resolvedMatch,
      body
    );

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
      const { error: eliminationError } = await updateKnockoutElimination(
        resolvedMatch,
        eliminatedTeam
      );

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