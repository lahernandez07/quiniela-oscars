import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type AllowedUserRow = {
  user_id: string;
  email: string | null;
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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://panteras2026.vercel.app";

  const matchesResponse = await fetch(`${siteUrl}/api/matches`, {
    cache: "no-store",
  });

  const matches = await matchesResponse.json();
  const totalMatches = Array.isArray(matches) ? matches.length : 0;

  const { data: allowedUsers, error: allowedUsersError } = await supabase
    .from("allowed_users")
    .select("user_id, email")
    .order("email", { ascending: true });

  if (allowedUsersError) {
    return NextResponse.json(
      { error: allowedUsersError.message },
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

  const participants = (allowedUsers as AllowedUserRow[] | null)?.map(
    (allowedUser) => {
      const captured = countByUser.get(allowedUser.user_id) ?? 0;
      const pending = Math.max(totalMatches - captured, 0);
      const progress =
        totalMatches > 0
          ? Math.round((captured / totalMatches) * 100)
          : 0;

      return {
        name: allowedUser.email ?? "Sin nombre",
        captured,
        pending,
        progress,
      };
    }
  );

  return NextResponse.json({
    totalMatches,
    participants: participants ?? [],
  });
}