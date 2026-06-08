import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      return NextResponse.json(
        { error: error.message },
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
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
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
    } = body;

    if (
      match_id === undefined ||
      home_score === undefined ||
      away_score === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("results_dev")
      .upsert(
        {
          match_id,
          home_score,
          away_score,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "match_id",
        }
      )
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}