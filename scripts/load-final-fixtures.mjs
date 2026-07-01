
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();
const matchesPath = path.join(rootDir, "public/data/worldcup2026-group-stage.json");
const envPath = path.join(rootDir, ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['\"]|['\"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const rawMatches = fs.readFileSync(matchesPath, "utf8");
const matches = JSON.parse(rawMatches);

const finalFixtures = [
  {
    id: 103,
    matchNumber: 103,
    homeSource: 101,
    awaySource: 102,
    stage: "Third Place",
    round: "3P",
    cut: "8",
    sourceMode: "loser",
  },
  {
    id: 104,
    matchNumber: 104,
    homeSource: 101,
    awaySource: 102,
    stage: "Final",
    round: "F",
    cut: "8",
    sourceMode: "winner",
  },
];

const matchById = new Map(matches.map((match) => [Number(match.id), match]));

function getPenaltyValue(result, side) {
  const keys =
    side === "home"
      ? [
          "home_penalties",
          "penalties_home",
          "home_penalty_score",
          "home_penalty",
          "home_penalties_score",
          "penalty_home_score",
        ]
      : [
          "away_penalties",
          "penalties_away",
          "away_penalty_score",
          "away_penalty",
          "away_penalties_score",
          "penalty_away_score",
        ];

  for (const key of keys) {
    if (result[key] !== null && result[key] !== undefined && result[key] !== "") {
      return Number(result[key]);
    }
  }

  return null;
}

function getOutcomeFromResult(matchId, resultByMatchId) {
  const match = matchById.get(Number(matchId));
  const result = resultByMatchId.get(Number(matchId));

  if (!match || !result) {
    return null;
  }

  const homeScore = Number(result.home_score);
  const awayScore = Number(result.away_score);

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return null;
  }

  if (homeScore > awayScore) {
    return {
      winner: {
        team: match.home,
        flag: match.homeFlag,
        sourceMatch: matchId,
        method: "regular",
      },
      loser: {
        team: match.away,
        flag: match.awayFlag,
        sourceMatch: matchId,
        method: "regular",
      },
    };
  }

  if (awayScore > homeScore) {
    return {
      winner: {
        team: match.away,
        flag: match.awayFlag,
        sourceMatch: matchId,
        method: "regular",
      },
      loser: {
        team: match.home,
        flag: match.homeFlag,
        sourceMatch: matchId,
        method: "regular",
      },
    };
  }

  const homePenalties = getPenaltyValue(result, "home");
  const awayPenalties = getPenaltyValue(result, "away");

  if (homePenalties === null || awayPenalties === null) {
    console.warn(
      `⚠️ Partido ${matchId} terminó empatado (${homeScore}-${awayScore}) y no tiene penales capturados. No se puede definir ganador.`
    );
    return null;
  }

  if (homePenalties > awayPenalties) {
    return {
      winner: {
        team: match.home,
        flag: match.homeFlag,
        sourceMatch: matchId,
        method: "penalties",
        penalties: `${homePenalties}-${awayPenalties}`,
      },
      loser: {
        team: match.away,
        flag: match.awayFlag,
        sourceMatch: matchId,
        method: "penalties",
        penalties: `${homePenalties}-${awayPenalties}`,
      },
    };
  }

  if (awayPenalties > homePenalties) {
    return {
      winner: {
        team: match.away,
        flag: match.awayFlag,
        sourceMatch: matchId,
        method: "penalties",
        penalties: `${homePenalties}-${awayPenalties}`,
      },
      loser: {
        team: match.home,
        flag: match.homeFlag,
        sourceMatch: matchId,
        method: "penalties",
        penalties: `${homePenalties}-${awayPenalties}`,
      },
    };
  }

  console.warn(
    `⚠️ Partido ${matchId} tiene penales empatados (${homePenalties}-${awayPenalties}). Revisa la captura.`
  );
  return null;
}

function getTeamFromSource(matchId, mode, resultByMatchId) {
  const outcome = getOutcomeFromResult(matchId, resultByMatchId);

  if (!outcome) return null;

  return mode === "loser" ? outcome.loser : outcome.winner;
}

function teamLabel(team) {
  if (!team) return "Pendiente";

  if (team.method === "penalties") {
    return `${team.team} (penales ${team.penalties})`;
  }

  return team.team;
}

async function main() {
  const sourceMatchIds = Array.from(
    new Set(finalFixtures.flatMap((item) => [item.homeSource, item.awaySource]))
  );

  const { data: results, error } = await supabase
    .from("results_dev")
    .select("*")
    .in("match_id", sourceMatchIds);

  if (error) {
    console.error("❌ Error leyendo results_dev:", error.message);
    process.exit(1);
  }

  const resultByMatchId = new Map(
    (results ?? []).map((result) => [Number(result.match_id), result])
  );

  let generated = 0;
  let partial = 0;
  let pending = 0;

  const updatedMatches = matches.map((match) => {
    const fixture = finalFixtures.find(
      (item) => Number(item.id) === Number(match.id)
    );

    if (!fixture) return match;

    const homeTeam = getTeamFromSource(
      fixture.homeSource,
      fixture.sourceMode,
      resultByMatchId
    );
    const awayTeam = getTeamFromSource(
      fixture.awaySource,
      fixture.sourceMode,
      resultByMatchId
    );
    const isDefined = Boolean(homeTeam && awayTeam);

    if (isDefined) {
      generated += 1;
    } else if (homeTeam || awayTeam) {
      partial += 1;
    } else {
      pending += 1;
    }

    console.log(
      `M${fixture.matchNumber}: ${teamLabel(homeTeam)} vs ${teamLabel(
        awayTeam
      )}${isDefined ? " ✅" : " ⏳"}`
    );

    return {
      ...match,
      id: fixture.id,
      matchNumber: fixture.matchNumber,
      stage: fixture.stage,
      round: fixture.round,
      group: null,
      home: homeTeam?.team ?? "",
      away: awayTeam?.team ?? "",
      homeFlag: homeTeam?.flag ?? "",
      awayFlag: awayTeam?.flag ?? "",
      homePlaceholder: homeTeam ? "" : `${fixture.sourceMode === "loser" ? "Perdedor" : "Ganador"} M${fixture.homeSource}`,
      awayPlaceholder: awayTeam ? "" : `${fixture.sourceMode === "loser" ? "Perdedor" : "Ganador"} M${fixture.awaySource}`,
      cut: fixture.cut,
      defined: isDefined,
    };
  });

  fs.writeFileSync(matchesPath, JSON.stringify(updatedMatches, null, 2) + "\n");

  console.log("\n✅ Proceso terminado.");
  console.log(`Finales completas: ${generated}`);
  console.log(`Finales parciales: ${partial}`);
  console.log(`Finales pendientes: ${pending}`);
  console.log(`Archivo actualizado: ${matchesPath}`);

  if (generated === 0) {
    console.warn(
      "\n⚠️ No se completaron la Final y el Tercer Lugar. Revisa que los resultados de Semifinales estén capturados en results_dev."
    );
  }
}

main();
