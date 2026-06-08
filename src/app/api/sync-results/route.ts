import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    const leagueId = process.env.API_FOOTBALL_LEAGUE_ID || "1";
    const season = process.env.API_FOOTBALL_SEASON || "2026";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API_FOOTBALL_KEY" },
        { status: 500 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "worldcup2026-group-stage.json"
    );

    const file = fs.readFileSync(filePath, "utf8");
    const localMatches = JSON.parse(file);

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`,
      {
        headers: {
          "x-apisports-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const apiData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "API-Football request failed",
          details: apiData,
        },
        { status: 500 }
      );
    }

    const fixtures = apiData.response ?? [];

    const updatedResults = [];

    for (const localMatch of localMatches) {
      const fixture = fixtures.find((item: any) => {
        const homeName = item.teams?.home?.name?.toLowerCase() ?? "";
        const awayName = item.teams?.away?.name?.toLowerCase() ?? "";

        const localHome = localMatch.home.toLowerCase();
        const localAway = localMatch.away.toLowerCase();

        return (
          homeName.includes(localHome) ||
          localHome.includes(homeName) ||
          awayName.includes(localAway) ||
          localAway.includes(awayName)
        );
      });

      if (!fixture) continue;

      const status = fixture.fixture?.status?.short;

      const isFinished = ["FT", "AET", "PEN"].includes(status);

      if (!isFinished) continue;

      const homeScore = fixture.goals?.home;
      const awayScore = fixture.goals?.away;

      if (homeScore === null || awayScore === null) continue;

      const { error } = await supabase.from("results_dev").upsert(
        {
          match_id: localMatch.id,
          home_score: homeScore,
          away_score: awayScore,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "match_id",
        }
      );

      if (!error) {
        updatedResults.push({
          match_id: localMatch.id,
          home: localMatch.home,
          away: localMatch.away,
          home_score: homeScore,
          away_score: awayScore,
          status,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedResults.length,
      results: updatedResults,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}