const fs = require("fs");
const path = require("path");

const outputPath = path.join(
  process.cwd(),
  "public",
  "data",
  "worldcup2026-group-stage.json"
);

const matches = [
  {
    id: 1,
    matchNumber: 1,
    stage: "group",
    group: "Grupo A",
    home: "México",
    away: "Sudáfrica",
    homeFlag: "mx",
    awayFlag: "za",
    date: "2026-06-11",
    time: "13:00",
    stadium: "Mexico City Stadium",
    city: "Ciudad de México",
    cut: "1",
  },
  {
    id: 2,
    matchNumber: 2,
    stage: "group",
    group: "Grupo A",
    home: "Corea del Sur",
    away: "Chequia",
    homeFlag: "kr",
    awayFlag: "cz",
    date: "2026-06-11",
    time: "20:00",
    stadium: "Guadalajara Stadium",
    city: "Guadalajara",
    cut: "1",
  },
  {
    id: 3,
    matchNumber: 3,
    stage: "group",
    group: "Grupo B",
    home: "Canadá",
    away: "Bosnia y Herzegovina",
    homeFlag: "ca",
    awayFlag: "ba",
    date: "2026-06-12",
    time: "13:00",
    stadium: "Toronto Stadium",
    city: "Toronto",
    cut: "1",
  },
  {
    id: 4,
    matchNumber: 4,
    stage: "group",
    group: "Grupo D",
    home: "Estados Unidos",
    away: "Paraguay",
    homeFlag: "us",
    awayFlag: "py",
    date: "2026-06-12",
    time: "19:00",
    stadium: "Los Angeles Stadium",
    city: "Los Ángeles",
    cut: "1",
  },
];

for (let i = 5; i <= 72; i++) {
  matches.push({
    id: i,
    matchNumber: i,
    stage: "group",
    group: `Grupo ${String.fromCharCode(65 + ((i - 1) % 12))}`,
    home: `Equipo ${i}A`,
    away: `Equipo ${i}B`,
    homeFlag: "un",
    awayFlag: "un",
    date: "2026-06-20",
    time: "13:00",
    stadium: "Por confirmar",
    city: "Por confirmar",
    cut: i <= 24 ? "1" : i <= 48 ? "2" : "3",
  });
}

fs.writeFileSync(outputPath, JSON.stringify(matches, null, 2) + "\n");

console.log(`JSON generado correctamente.`);
console.log(`Total partidos: ${matches.length}`);