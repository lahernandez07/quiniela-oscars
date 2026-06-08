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

function calculatePoints(prediction: any, result: any) {
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

export async function GET(request: NextRequest) {
  try {
    const cut = request.nextUrl.searchParams.get("cut");
    const view = request.nextUrl.searchParams.get("view");

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "worldcup2026-group-stage.json"
    );

    const file = fs.readFileSync(filePath, "utf8");
    const matches = JSON.parse(file);

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

    // SUMMARY VIEW
    if (view === "summary") {
      const summaryMap: Record<
        string,
        {
          user_id: string;
          display_name: string;
          cut1: number;
          cut2: number;
          cut3: number;
          total: number;
          exact_scores: number;
        }
      > = {};

      for (const prediction of predictions ?? []) {
        const result = (results ?? []).find(
          (item: any) => item.match_id === prediction.match_id
        );

        if (!result) continue;

        const match = matches.find(
          (item: any) => item.id === prediction.match_id
        );

        if (!match) continue;

        const profile = (profiles ?? []).find(
          (item: any) => item.id === prediction.user_id
        );

        if (!summaryMap[prediction.user_id]) {
          summaryMap[prediction.user_id] = {
            user_id: prediction.user_id,
            display_name: profile?.name || "Participante",
            cut1: 0,
            cut2: 0,
            cut3: 0,
            total: 0,
            exact_scores: 0,
          };
        }

        const score = calculatePoints(prediction, result);

        if (match.date >= CUTS["1"].start && match.date <= CUTS["1"].end) {
          summaryMap[prediction.user_id].cut1 += score.points;
        }

        if (match.date >= CUTS["2"].start && match.date <= CUTS["2"].end) {
          summaryMap[prediction.user_id].cut2 += score.points;
        }

        if (match.date >= CUTS["3"].start && match.date <= CUTS["3"].end) {
          summaryMap[prediction.user_id].cut3 += score.points;
        }

        summaryMap[prediction.user_id].total += score.points;
        summaryMap[prediction.user_id].exact_scores += score.exact;
      }

      const summaryLeaderboard = Object.values(summaryMap).sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }

        return b.exact_scores - a.exact_scores;
      });

      return NextResponse.json(summaryLeaderboard);
    }

    // NORMAL CUT VIEW
    let filteredMatches = matches;

    if (cut && cut !== "general" && CUTS[cut as keyof typeof CUTS]) {
      const selectedCut = CUTS[cut as keyof typeof CUTS];

      filteredMatches = matches.filter((match: any) => {
        return match.date >= selectedCut.start && match.date <= selectedCut.end;
      });
    }

    const validMatchIds = filteredMatches.map((match: any) => match.id);

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

      const score = calculatePoints(prediction, result);

      leaderboardMap[prediction.user_id].total_points += score.points;
      leaderboardMap[prediction.user_id].exact_scores += score.exact;
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