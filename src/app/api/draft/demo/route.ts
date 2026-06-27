import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_TEAMS = [
  { team_name: "Argentina", team_flag: "ar", group_name: "Demo", seed_label: "A1" },
  { team_name: "México", team_flag: "mx", group_name: "Demo", seed_label: "A2" },
  { team_name: "Brasil", team_flag: "br", group_name: "Demo", seed_label: "B1" },
  { team_name: "Países Bajos", team_flag: "nl", group_name: "Demo", seed_label: "B2" },
  { team_name: "Francia", team_flag: "fr", group_name: "Demo", seed_label: "C1" },
  { team_name: "Japón", team_flag: "jp", group_name: "Demo", seed_label: "C2" },
  { team_name: "España", team_flag: "es", group_name: "Demo", seed_label: "D1" },
  { team_name: "Marruecos", team_flag: "ma", group_name: "Demo", seed_label: "D2" },
  { team_name: "Alemania", team_flag: "de", group_name: "Demo", seed_label: "E1" },
  { team_name: "Suiza", team_flag: "ch", group_name: "Demo", seed_label: "E2" },
  { team_name: "Portugal", team_flag: "pt", group_name: "Demo", seed_label: "F1" },
  { team_name: "Estados Unidos", team_flag: "us", group_name: "Demo", seed_label: "F2" },
  { team_name: "Inglaterra", team_flag: "gb-eng", group_name: "Demo", seed_label: "G1" },
  { team_name: "Dinamarca", team_flag: "dk", group_name: "Demo", seed_label: "G2" },
  { team_name: "Uruguay", team_flag: "uy", group_name: "Demo", seed_label: "H1" },
  { team_name: "Croacia", team_flag: "hr", group_name: "Demo", seed_label: "H2" },
  { team_name: "Bélgica", team_flag: "be", group_name: "Demo", seed_label: "I1" },
  { team_name: "Serbia", team_flag: "rs", group_name: "Demo", seed_label: "I2" },
  { team_name: "Colombia", team_flag: "co", group_name: "Demo", seed_label: "J1" },
  { team_name: "Ecuador", team_flag: "ec", group_name: "Demo", seed_label: "J2" },
  { team_name: "Canadá", team_flag: "ca", group_name: "Demo", seed_label: "K1" },
  { team_name: "Australia", team_flag: "au", group_name: "Demo", seed_label: "K2" },
  { team_name: "Turquía", team_flag: "tr", group_name: "Demo", seed_label: "L1" },
  { team_name: "Suecia", team_flag: "se", group_name: "Demo", seed_label: "L2" },
  { team_name: "Nigeria", team_flag: "ng", group_name: "Demo", seed_label: "M1" },
  { team_name: "Costa de Marfil", team_flag: "ci", group_name: "Demo", seed_label: "M2" },
  { team_name: "Chile", team_flag: "cl", group_name: "Demo", seed_label: "N1" },
  { team_name: "Noruega", team_flag: "no", group_name: "Demo", seed_label: "N2" },
  { team_name: "Polonia", team_flag: "pl", group_name: "Demo", seed_label: "O1" },
  { team_name: "Corea del Sur", team_flag: "kr", group_name: "Demo", seed_label: "O2" },
  { team_name: "Túnez", team_flag: "tn", group_name: "Demo", seed_label: "P1" },
  { team_name: "Senegal", team_flag: "sn", group_name: "Demo", seed_label: "P2" },
];

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error: resetPicksError } = await supabase
    .from("draft_picks")
    .update({
      team_id: null,
      picked_at: null,
      picked_by: null,
    })
    .gte("pick_number", 1);

  if (resetPicksError) {
    return NextResponse.json(
      { error: resetPicksError.message },
      { status: 500 }
    );
  }

  const { error: deleteTeamsError } = await supabase
    .from("knockout_teams")
    .delete()
    .gte("id", 1);

  if (deleteTeamsError) {
    return NextResponse.json(
      { error: deleteTeamsError.message },
      { status: 500 }
    );
  }

  const { data, error: insertTeamsError } = await supabase
    .from("knockout_teams")
    .insert(
      DEMO_TEAMS.map((team) => ({
        ...team,
        is_available: true,
        is_eliminated: false,
        eliminated_round: null,
      }))
    )
    .select("*")
    .order("team_name", { ascending: true });

  if (insertTeamsError) {
    return NextResponse.json(
      { error: insertTeamsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Equipos demo cargados correctamente",
    total_teams: data?.length ?? 0,
    teams: data,
  });
}