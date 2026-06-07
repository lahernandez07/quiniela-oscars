import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CUTS = {
  "1": { start: "2026-06-11", end: "2026-06-14" },
  "2": { start: "2026-06-15", end: "2026-06-21" },
  "3": { start: "2026-06-22", end: "2026-06-27" },
};

export async function GET(request: NextRequest) {
  try {
    const cut = request.nextUrl.searchParams.get("cut");

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "worldcup2026-group-stage.json"
    );

    const file = fs.readFileSync(filePath, "utf8");
    const matches = JSON.parse(file);

    let filteredMatches = matches;

    if (cut && cut !== "general" && CUTS[cut as keyof typeof CUTS]) {
      const selectedCut = CUTS[cut as keyof typeof CUTS];

      filteredMatches = matches.filter((match: any) => {
        return match.date >= selectedCut.start && match.date <= selectedCut.end;
      });
    }

    const validMatchIds = filteredMatches.map((match: any) => match.id);

    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions_dev")
      .select("*");

    if (predictionsError) {
      return NextResponse.json(
        { error: predictionsError.message },
        { status: 500 }
      );
    }

    const { data: results, error: resultsError } = await supabase
      .from("results_dev")
      .select("*");

    if (resultsError) {
      return NextResponse.json(
        { error: resultsError.message },
        { status: 500 }
      );
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const filteredPredictions = (predictions ?? []).filter((prediction: any) =>
      validMatchIds.includes(prediction.match_id)
    );

    const leaderboardMap: Record<
      string,
      {
        user_id: string;
        display_name: string;
        total_points: number;
        exact_scores: number;
      }
    > = {};

    for (const prediction of filteredPredictions) {
      const result = (results ?? []).find(
        (item: any) => item.match_id === prediction.match_id
      );

      if (!result) continue;

      const profile = (profiles ?? []).find(
        (item: any) => item.id === prediction.user_id
      );

      if (!leaderboardMap[prediction.user_id]) {
        leaderboardMap[prediction.user_id] = {
          user_id: prediction.user_id,
          display_name: profile?.name || "Participante",
          total_points: 0,
          exact_scores: 0,
        };
      }

      if (
        prediction.home_score === result.home_score &&
        prediction.away_score === result.away_score
      ) {
        leaderboardMap[prediction.user_id].total_points += 3;
        leaderboardMap[prediction.user_id].exact_scores += 1;
        continue;
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
        leaderboardMap[prediction.user_id].total_points += 1;
      }
    }

    const leaderboard = Object.values(leaderboardMap).sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }

      return b.exact_scores - a.exact_scores;
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}