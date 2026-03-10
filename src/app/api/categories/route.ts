import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  const { data: nominees, error: nomError } = await supabase
    .from("nominees")
    .select("*");

  if (nomError) {
    return NextResponse.json({ error: nomError.message }, { status: 500 });
  }

  const { data: winners, error: winError } = await supabase
    .from("winners")
    .select("*");

  if (winError) {
    return NextResponse.json({ error: winError.message }, { status: 500 });
  }

  const result = categories.map((cat) => {
    const categoryNominees = nominees.filter((n) => n.category_id === cat.id);

    const winner = winners.find((w) => w.category_id === cat.id);

    return {
      id: cat.id,
      name: cat.name,
      sort_order: cat.sort_order,
      points: cat.points,
      winner_nominee_id: winner ? winner.nominee_id : null,
      nominees: categoryNominees.map((n) => ({
        id: n.id,
        label: n.label,
        image_url: n.image_url,
      })),
    };
  });

  return NextResponse.json(result);
}