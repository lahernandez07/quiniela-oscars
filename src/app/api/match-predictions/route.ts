import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import matches from "../../../../public/data/worldcup2026-group-stage.json";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isMatchStarted(match: any) {
  const kickoff = new Date(`${match.date}T${match.time}:00-06:00`);
  return new Date() >= kickoff;
}

export async function GET() {
  try {
    // SOLO partidos que ya iniciaron
    const closedMatches = matches.filter((match: any) =>
      isMatchStarted(match)
    );

    const response = [];

    for (const match of closedMatches) {
      // Obtener resultado
      const { data: resultData } = await supabase
        .from("match_results")
        .select("*")
        .eq("match_id", match.id)
        .single();

      // Obtener pronósticos
      const { data: predictionsData } = await supabase
        .from("predictions")
        .select(
          `
          user_id,
          home_score,
          away_score,
          profiles (
            display_name
          )
        `
        )
        .eq("match_id", match.id);

      const predictions =
        predictionsData?.map((prediction: any) => {
          let points: number | null = null;
          let exact = 0;

          if (resultData) {
            const exactMatch =
              prediction.home_score === resultData.home_score &&
              prediction.away_score === resultData.away_score;

            const predictedWinner =
              prediction.home_score > prediction.away_score
                ? "home"
                : prediction.home_score < prediction.away_score
                  ? "away"
                  : "draw";

            const actualWinner =
              resultData.home_score > resultData.away_score
                ? "home"
                : resultData.home_score < resultData.away_score
                  ? "away"
                  : "draw";

            if (exactMatch) {
              points = 3;
              exact = 1;
            } else if (predictedWinner === actualWinner) {
              points = 1;
            } else {
              points = 0;
            }
          }

          return {
            user_id: prediction.user_id,
            display_name:
              prediction.profiles?.display_name || "Participante",
            home_score: prediction.home_score,
            away_score: prediction.away_score,
            points,
            exact,
          };
        }) || [];

      response.push({
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
        result: resultData
          ? {
              home_score: resultData.home_score,
              away_score: resultData.away_score,
            }
          : null,
        predictions,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error loading match predictions:", error);

    return NextResponse.json(
      { error: "Error loading predictions" },
      { status: 500 }
    );
  }
}