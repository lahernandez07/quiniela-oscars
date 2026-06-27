import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  pick_id: string;
  team_id: number;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const body = (await request.json()) as Body;

  if (!body.pick_id || !body.team_id) {
    return NextResponse.json(
      { error: "Faltan pick_id o team_id" },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: pick, error: pickError } = await supabase
    .from("draft_picks")
    .select("id, pick_number, team_id")
    .eq("id", body.pick_id)
    .single();

  if (pickError || !pick) {
    return NextResponse.json(
      { error: pickError?.message ?? "Pick no encontrado" },
      { status: 404 }
    );
  }

  if (pick.team_id !== null) {
    return NextResponse.json(
      { error: "Este pick ya tiene equipo asignado" },
      { status: 400 }
    );
  }

  const { data: currentPick, error: currentPickError } = await supabase
    .from("draft_picks")
    .select("id, pick_number")
    .is("team_id", null)
    .order("pick_number", { ascending: true })
    .limit(1)
    .single();

  if (currentPickError || !currentPick) {
    return NextResponse.json(
      { error: "No hay picks pendientes" },
      { status: 400 }
    );
  }

  if (currentPick.id !== body.pick_id) {
    return NextResponse.json(
      {
        error: `No es el turno de este pick. El turno actual es el Pick #${currentPick.pick_number}`,
      },
      { status: 400 }
    );
  }

  const { data: team, error: teamError } = await supabase
    .from("knockout_teams")
    .select("id, team_name, is_available")
    .eq("id", body.team_id)
    .single();

  if (teamError || !team) {
    return NextResponse.json(
      { error: teamError?.message ?? "Equipo no encontrado" },
      { status: 404 }
    );
  }

  if (!team.is_available) {
    return NextResponse.json(
      { error: "Este equipo ya no está disponible" },
      { status: 400 }
    );
  }

  const { data: alreadyPicked } = await supabase
    .from("draft_picks")
    .select("id")
    .eq("team_id", body.team_id)
    .maybeSingle();

  if (alreadyPicked) {
    return NextResponse.json(
      { error: "Este equipo ya fue seleccionado" },
      { status: 400 }
    );
  }

  const { error: updatePickError } = await supabase
    .from("draft_picks")
    .update({
      team_id: body.team_id,
      picked_at: new Date().toISOString(),
    })
    .eq("id", body.pick_id);

  if (updatePickError) {
    return NextResponse.json(
      { error: updatePickError.message },
      { status: 500 }
    );
  }

  const { error: updateTeamError } = await supabase
    .from("knockout_teams")
    .update({
      is_available: false,
    })
    .eq("id", body.team_id);

  if (updateTeamError) {
    return NextResponse.json(
      { error: updateTeamError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Pick asignado correctamente",
    pick_id: body.pick_id,
    team_id: body.team_id,
    team_name: team.team_name,
  });
}