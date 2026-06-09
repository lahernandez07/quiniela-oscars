const fs = require("fs");
const path = require("path");

const jsonPath = path.join(
  process.cwd(),
  "public",
  "data",
  "worldcup2026-group-stage.json"
);

const officialTimes = [
  { id: 1, date: "2026-06-11", time: "13:00" },
  { id: 2, date: "2026-06-11", time: "20:00" },
  { id: 3, date: "2026-06-12", time: "13:00" },
  { id: 4, date: "2026-06-12", time: "19:00" },
  { id: 5, date: "2026-06-13", time: "19:00" },
  { id: 6, date: "2026-06-13", time: "22:00" },
  { id: 7, date: "2026-06-13", time: "16:00" },
  { id: 8, date: "2026-06-13", time: "13:00" },
  { id: 9, date: "2026-06-14", time: "17:00" },
  { id: 10, date: "2026-06-14", time: "11:00" },
  { id: 11, date: "2026-06-14", time: "14:00" },
  { id: 12, date: "2026-06-14", time: "20:00" },
  { id: 13, date: "2026-06-15", time: "16:00" },
  { id: 14, date: "2026-06-15", time: "10:00" },
  { id: 15, date: "2026-06-15", time: "19:00" },
  { id: 16, date: "2026-06-15", time: "13:00" },
  { id: 17, date: "2026-06-16", time: "13:00" },
  { id: 18, date: "2026-06-16", time: "16:00" },
  { id: 19, date: "2026-06-16", time: "19:00" },
  { id: 20, date: "2026-06-16", time: "22:00" },
  { id: 21, date: "2026-06-17", time: "17:00" },
  { id: 22, date: "2026-06-17", time: "14:00" },
  { id: 23, date: "2026-06-17", time: "11:00" },
  { id: 24, date: "2026-06-17", time: "20:00" },
  { id: 25, date: "2026-06-18", time: "10:00" },
  { id: 26, date: "2026-06-18", time: "13:00" },
  { id: 27, date: "2026-06-18", time: "16:00" },
  { id: 28, date: "2026-06-18", time: "19:00" },
  { id: 29, date: "2026-06-19", time: "18:30" },
  { id: 30, date: "2026-06-19", time: "16:00" },
  { id: 31, date: "2026-06-19", time: "21:00" },
  { id: 32, date: "2026-06-19", time: "13:00" },
  { id: 33, date: "2026-06-20", time: "14:00" },
  { id: 34, date: "2026-06-20", time: "18:00" },
  { id: 35, date: "2026-06-20", time: "11:00" },
  { id: 36, date: "2026-06-20", time: "22:00" },
  { id: 37, date: "2026-06-21", time: "16:00" },
  { id: 38, date: "2026-06-21", time: "10:00" },
  { id: 39, date: "2026-06-21", time: "13:00" },
  { id: 40, date: "2026-06-21", time: "19:00" },
  { id: 41, date: "2026-06-22", time: "18:00" },
  { id: 42, date: "2026-06-22", time: "15:00" },
  { id: 43, date: "2026-06-22", time: "11:00" },
  { id: 44, date: "2026-06-22", time: "21:00" },
  { id: 45, date: "2026-06-23", time: "14:00" },
  { id: 46, date: "2026-06-23", time: "17:00" },
  { id: 47, date: "2026-06-23", time: "11:00" },
  { id: 48, date: "2026-06-23", time: "20:00" },
  { id: 49, date: "2026-06-24", time: "16:00" },
  { id: 50, date: "2026-06-24", time: "16:00" },
  { id: 51, date: "2026-06-24", time: "13:00" },
  { id: 52, date: "2026-06-24", time: "13:00" },
  { id: 53, date: "2026-06-24", time: "19:00" },
  { id: 54, date: "2026-06-24", time: "19:00" },
  { id: 55, date: "2026-06-25", time: "14:00" },
  { id: 56, date: "2026-06-25", time: "14:00" },
  { id: 57, date: "2026-06-25", time: "17:00" },
  { id: 58, date: "2026-06-25", time: "17:00" },
  { id: 59, date: "2026-06-25", time: "20:00" },
  { id: 60, date: "2026-06-25", time: "20:00" },
  { id: 61, date: "2026-06-26", time: "13:00" },
  { id: 62, date: "2026-06-26", time: "13:00" },
  { id: 63, date: "2026-06-26", time: "21:00" },
  { id: 64, date: "2026-06-26", time: "21:00" },
  { id: 65, date: "2026-06-26", time: "18:00" },
  { id: 66, date: "2026-06-26", time: "18:00" },
  { id: 67, date: "2026-06-27", time: "15:00" },
  { id: 68, date: "2026-06-27", time: "15:00" },
  { id: 69, date: "2026-06-27", time: "20:00" },
  { id: 70, date: "2026-06-27", time: "20:00" },
  { id: 71, date: "2026-06-27", time: "17:30" },
  { id: 72, date: "2026-06-27", time: "17:30" },
];

const matches = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const timeMap = new Map(officialTimes.map((item) => [item.id, item]));

let updated = 0;
const missing = [];

const updatedMatches = matches.map((match) => {
  const official = timeMap.get(match.id);

  if (!official) {
    missing.push(match.id);
    return match;
  }

  if (match.date !== official.date || match.time !== official.time) {
    updated++;
  }

  return {
    ...match,
    date: official.date,
    time: official.time,
  };
});

fs.writeFileSync(jsonPath, JSON.stringify(updatedMatches, null, 2) + "\n");

console.log(`Partidos revisados: ${matches.length}`);
console.log(`Partidos actualizados: ${updated}`);

if (missing.length > 0) {
  console.log(`Partidos sin horario oficial: ${missing.join(", ")}`);
}

console.log("JSON actualizado correctamente con horarios CDMX.");