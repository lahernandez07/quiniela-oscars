import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  name: string | null;
};

type PredictionRow = {
  user_id: string;
  match_id: number;
};

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const matchesResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/matches`,
    { cache: "no-store" }
  );

  const matches = await matchesResponse.json();
  const totalMatches = Array.isArray(matches) ? matches.length : 0;

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name")
    .order("name", { ascending: true });

  if (profilesError) {
    return NextResponse.json(
      { error: profilesError.message },
      { status: 500 }
    );
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions_dev")
    .select("user_id, match_id");

  if (predictionsError) {
    return NextResponse.json(
      { error: predictionsError.message },
      { status: 500 }
    );
  }

  const countByUser = new Map<string, number>();

  (predictions as PredictionRow[] | null)?.forEach((prediction) => {
    countByUser.set(
      prediction.user_id,
      (countByUser.get(prediction.user_id) ?? 0) + 1
    );
  });

  const participation = (profiles as ProfileRow[] | null)?.map((profile) => {
    const captured = countByUser.get(profile.id) ?? 0;
    const pending = Math.max(totalMatches - captured, 0);
    const progress =
      totalMatches > 0
        ? Math.round((captured / totalMatches) * 100)
        : 0;

    return {
      name: profile.name ?? "Sin nombre",
      captured,
      pending,
      progress,
    };
  });

  return NextResponse.json({
    totalMatches,
    participants: participation ?? [],
  });
}