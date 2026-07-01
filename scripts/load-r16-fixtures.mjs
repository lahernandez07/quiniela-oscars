

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

const r16Sources = [
  {
    id: 89,
    matchNumber: 89,
    homeSource: 74,
    awaySource: 77,
  },
  {
    id: 90,
    matchNumber: 90,
    homeSource: 73,
    awaySource: 75,
  },
  {
    id: 91,
    matchNumber: 91,
    homeSource: 76,
    awaySource: 78,
  },
  {
    id: 92,
    matchNumber: 92,
    homeSource: 79,
    awaySource: 80,
  },
  {
    id: 93,
    matchNumber: 93,
    homeSource: 83,
    awaySource: 84,
  },
  {
    id: 94,
    matchNumber: 94,
    homeSource: 81,
    awaySource: 82,
  },
  {
    id: 95,
    matchNumber: 95,
    homeSource: 86,
    awaySource: 88,
  },
  {
    id: 96,
    matchNumber: 96,
    homeSource: 85,
    awaySource: 87,
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

function getWinnerFromResult(matchId, resultByMatchId) {
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
      team: match.home,
      flag: match.homeFlag,
      sourceMatch: matchId,
      method: "regular",
    };
  }

  if (awayScore > homeScore) {
    return {
      team: match.away,
      flag: match.awayFlag,
      sourceMatch: matchId,
      method: "regular",
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
      team: match.home,
      flag: match.homeFlag,
      sourceMatch: matchId,
      method: "penalties",
      penalties: `${homePenalties}-${awayPenalties}`,
    };
  }

  if (awayPenalties > homePenalties) {
    return {
      team: match.away,
      flag: match.awayFlag,
      sourceMatch: matchId,
      method: "penalties",
      penalties: `${homePenalties}-${awayPenalties}`,
    };
  }

  console.warn(
    `⚠️ Partido ${matchId} tiene penales empatados (${homePenalties}-${awayPenalties}). Revisa la captura.`
  );
  return null;
}

function winnerLabel(winner) {
  if (!winner) return "Pendiente";

  if (winner.method === "penalties") {
    return `${winner.team} (penales ${winner.penalties})`;
  }

  return winner.team;
}

async function main() {
  const sourceMatchIds = r16Sources.flatMap((item) => [
    item.homeSource,
    item.awaySource,
  ]);

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
    const r16 = r16Sources.find((item) => Number(item.id) === Number(match.id));

    if (!r16) return match;

    const homeWinner = getWinnerFromResult(r16.homeSource, resultByMatchId);
    const awayWinner = getWinnerFromResult(r16.awaySource, resultByMatchId);
    const isDefined = Boolean(homeWinner && awayWinner);

    if (isDefined) {
      generated += 1;
    } else if (homeWinner || awayWinner) {
      partial += 1;
    } else {
      pending += 1;
    }

    console.log(
      `M${r16.matchNumber}: ${winnerLabel(homeWinner)} vs ${winnerLabel(
        awayWinner
      )}${isDefined ? " ✅" : " ⏳"}`
    );

    return {
      ...match,
      id: r16.id,
      matchNumber: r16.matchNumber,
      stage: "Round of 16",
      round: "R16",
      group: null,
      home: homeWinner?.team ?? "",
      away: awayWinner?.team ?? "",
      homeFlag: homeWinner?.flag ?? "",
      awayFlag: awayWinner?.flag ?? "",
      homePlaceholder: homeWinner ? "" : `Ganador M${r16.homeSource}`,
      awayPlaceholder: awayWinner ? "" : `Ganador M${r16.awaySource}`,
      cut: "5",
      defined: isDefined,
    };
  });

  fs.writeFileSync(matchesPath, JSON.stringify(updatedMatches, null, 2) + "\n");

  console.log("\n✅ Proceso terminado.");
  console.log(`Octavos completos: ${generated}`);
  console.log(`Octavos parciales: ${partial}`);
  console.log(`Octavos pendientes: ${pending}`);
  console.log(`Archivo actualizado: ${matchesPath}`);

  if (generated === 0) {
    console.warn(
      "\n⚠️ No se completó ningún partido de Octavos. Revisa que los resultados de 16avos estén capturados en results_dev."
    );
  }
}

main();