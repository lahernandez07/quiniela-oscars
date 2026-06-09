import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isMatchLocked(match: any) {
  const mexicoDate = new Date(`${match.date}T${match.time}:00-06:00`);
  const now = new Date();

  return true;
}

function calculatePoints(prediction: any, result: any | null) {
  if (!result) {
    return {
      points: null,
      exact: 0,
    };
  }

  if (
    prediction.home_score === result.home_score &&
    prediction.away_score === result.away_score
  ) {
    return {
      points: 3,
      exact: 1,
    };
  }

  const predictionOutcome =
    prediction.home_score > prediction.away_score
      ? "home"
      : prediction.home_score < prediction.away_score
        ? "away"
        : "draw";

  const resultOutcome =
    result.home_score > result.away_score
      ? "home"
      : result.home_score < result.away_score
        ? "away"
        : "draw";

  if (predictionOutcome === resultOutcome) {
    return {
      points: 1,
      exact: 0,
    };
  }

  return {
    points: 0,
    exact: 0,
  };
}

export async function GET() {
  try {
    console.log(
      "SUPABASE URL existe:",
      !!process.env.NEXT_PUBLIC_SUPABASE_URL
    );

    console.log(
      "SERVICE ROLE existe:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(
      "SUPABASE URL inicio:",
      process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 25)
    );

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "worldcup2026-group-stage.json"
    );

    const file = fs.readFileSync(filePath, "utf8");
    const matches = JSON.parse(file);

    const lockedMatches = matches.filter((match: any) =>
      isMatchLocked(match)
    );

    const lockedMatchIds = lockedMatches.map((match: any) => match.id);

    console.log("PARTIDOS CERRADOS:", lockedMatchIds.length);

    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions_dev")
      .select("*")
      .in("match_id", lockedMatchIds);

    if (predictionsError) {
      console.error("ERROR predictions:", predictionsError);

      return NextResponse.json(
        { error: predictionsError.message },
        { status: 500 }
      );
    }

    const { data: results, error: resultsError } = await supabase
      .from("results_dev")
      .select("*")
      .in("match_id", lockedMatchIds);

    if (resultsError) {
      console.error("ERROR results:", resultsError);

      return NextResponse.json(
        { error: resultsError.message },
        { status: 500 }
      );
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("ERROR profiles:", profilesError);

      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const response = lockedMatches.map((match: any) => {
      const matchPredictions = (predictions ?? [])
        .filter((prediction: any) => prediction.match_id === match.id)
        .map((prediction: any) => {
          const profile = (profiles ?? []).find(
            (item: any) => item.id === prediction.user_id
          );

          const result =
            (results ?? []).find((item: any) => item.match_id === match.id) ||
            null;

          const score = calculatePoints(prediction, result);

          return {
            user_id: prediction.user_id,
            display_name:
              profile?.name ||
              profile?.email ||
              "Participante",
            home_score: prediction.home_score,
            away_score: prediction.away_score,
            points: score.points,
            exact: score.exact,
          };
        })
        .sort((a: any, b: any) =>
          a.display_name.localeCompare(b.display_name, "es")
        );

      const result =
        (results ?? []).find(
          (item: any) => item.match_id === match.id
        ) || null;

      return {
  match_id: match.id,
  match_number: match.matchNumber,
  group: match.group,
  date: match.date,
  time: match.time,
  city: match.city,
  stadium: match.stadium,
  home_team: match.home,
  away_team: match.away,
  home_flag: match.homeFlag,
  away_flag: match.awayFlag,
        result: result
          ? {
              home_score: result.home_score,
              away_score: result.away_score,
            }
          : null,
        predictions: matchPredictions,
      };
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(
      "ERROR REAL match-predictions:",
      error
    );

    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
        name: error?.name,
        cause: error?.cause,
      },
      { status: 500 }
    );
  }
}