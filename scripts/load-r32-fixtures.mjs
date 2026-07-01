

import fs from "fs";
import path from "path";

const filePath = path.join(
  process.cwd(),
  "public/data/worldcup2026-group-stage.json"
);

const raw = fs.readFileSync(filePath, "utf8");
const matches = JSON.parse(raw);

const r32Fixtures = [
  {
    id: 73,
    matchNumber: 73,
    home: "Sudáfrica",
    away: "Canadá",
    homeFlag: "za",
    awayFlag: "ca",
    date: "2026-06-28",
    time: "13:00",
    stadium: "Los Angeles Stadium",
    city: "Los Ángeles",
  },
  {
    id: 74,
    matchNumber: 74,
    home: "Brasil",
    away: "Japón",
    homeFlag: "br",
    awayFlag: "jp",
    date: "2026-06-29",
    time: "11:00",
    stadium: "Houston Stadium",
    city: "Houston",
  },
  {
    id: 75,
    matchNumber: 75,
    home: "Alemania",
    away: "Paraguay",
    homeFlag: "de",
    awayFlag: "py",
    date: "2026-06-29",
    time: "14:30",
    stadium: "Boston Stadium",
    city: "Boston",
  },
  {
    id: 76,
    matchNumber: 76,
    home: "Países Bajos",
    away: "Marruecos",
    homeFlag: "nl",
    awayFlag: "ma",
    date: "2026-06-29",
    time: "19:00",
    stadium: "Monterrey Stadium",
    city: "Monterrey",
  },
  {
    id: 77,
    matchNumber: 77,
    home: "Costa de Marfil",
    away: "Noruega",
    homeFlag: "ci",
    awayFlag: "no",
    date: "2026-06-30",
    time: "11:00",
    stadium: "Dallas Stadium",
    city: "Dallas",
  },
  {
    id: 78,
    matchNumber: 78,
    home: "Francia",
    away: "Suecia",
    homeFlag: "fr",
    awayFlag: "se",
    date: "2026-06-30",
    time: "15:00",
    stadium: "New York New Jersey Stadium",
    city: "Nueva York / Nueva Jersey",
  },
  {
    id: 79,
    matchNumber: 79,
    home: "México",
    away: "Ecuador",
    homeFlag: "mx",
    awayFlag: "ec",
    date: "2026-06-30",
    time: "19:00",
    stadium: "Mexico City Stadium",
    city: "Ciudad de México",
  },
  {
    id: 80,
    matchNumber: 80,
    home: "Inglaterra",
    away: "RD Congo",
    homeFlag: "gb-eng",
    awayFlag: "cd",
    date: "2026-07-01",
    time: "10:00",
    stadium: "Atlanta Stadium",
    city: "Atlanta",
  },
  {
    id: 81,
    matchNumber: 81,
    home: "Bélgica",
    away: "Senegal",
    homeFlag: "be",
    awayFlag: "sn",
    date: "2026-07-01",
    time: "14:00",
    stadium: "Seattle Stadium",
    city: "Seattle",
  },
  {
    id: 82,
    matchNumber: 82,
    home: "EE. UU.",
    away: "Bosnia y Herzegovina",
    homeFlag: "us",
    awayFlag: "ba",
    date: "2026-07-01",
    time: "18:00",
    stadium: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
  },
  {
    id: 83,
    matchNumber: 83,
    home: "España",
    away: "Austria",
    homeFlag: "es",
    awayFlag: "at",
    date: "2026-07-02",
    time: "13:00",
    stadium: "Los Angeles Stadium",
    city: "Los Ángeles",
  },
  {
    id: 84,
    matchNumber: 84,
    home: "Portugal",
    away: "Croacia",
    homeFlag: "pt",
    awayFlag: "hr",
    date: "2026-07-02",
    time: "17:00",
    stadium: "Toronto Stadium",
    city: "Toronto",
  },
  {
    id: 85,
    matchNumber: 85,
    home: "Suiza",
    away: "Argelia",
    homeFlag: "ch",
    awayFlag: "dz",
    date: "2026-07-02",
    time: "21:00",
    stadium: "BC Place Vancouver",
    city: "Vancouver",
  },
  {
    id: 86,
    matchNumber: 86,
    home: "Australia",
    away: "Egipto",
    homeFlag: "au",
    awayFlag: "eg",
    date: "2026-07-03",
    time: "12:00",
    stadium: "Dallas Stadium",
    city: "Dallas",
  },
  {
    id: 87,
    matchNumber: 87,
    home: "Argentina",
    away: "Islas de Cabo Verde",
    homeFlag: "ar",
    awayFlag: "cv",
    date: "2026-07-03",
    time: "16:00",
    stadium: "Miami Stadium",
    city: "Miami",
  },
  {
    id: 88,
    matchNumber: 88,
    home: "Colombia",
    away: "Ghana",
    homeFlag: "co",
    awayFlag: "gh",
    date: "2026-07-03",
    time: "19:30",
    stadium: "Kansas City Stadium",
    city: "Kansas City",
  },
];

const fixtureMap = new Map(r32Fixtures.map((fixture) => [fixture.id, fixture]));

const updatedMatches = matches.map((match) => {
  const fixture = fixtureMap.get(Number(match.id));

  if (!fixture) return match;

  return {
    ...match,
    matchNumber: fixture.matchNumber,
    stage: "Round of 32",
    round: "R32",
    group: null,
    home: fixture.home,
    away: fixture.away,
    homeFlag: fixture.homeFlag,
    awayFlag: fixture.awayFlag,
    homePlaceholder: "",
    awayPlaceholder: "",
    date: fixture.date,
    time: fixture.time,
    stadium: fixture.stadium,
    city: fixture.city,
    cut: "4",
    defined: true,
  };
});

const updatedIds = updatedMatches
  .filter((match) => fixtureMap.has(Number(match.id)))
  .map((match) => match.id);

if (updatedIds.length !== r32Fixtures.length) {
  console.error(
    `❌ Se esperaban ${r32Fixtures.length} partidos actualizados, pero se actualizaron ${updatedIds.length}.`
  );
  process.exit(1);
}

fs.writeFileSync(filePath, JSON.stringify(updatedMatches, null, 2) + "\n");

console.log("✅ Dieciseisavos cargados correctamente.");
console.log(`Partidos actualizados: ${updatedIds.join(", ")}`);
console.log(`Archivo actualizado: ${filePath}`);