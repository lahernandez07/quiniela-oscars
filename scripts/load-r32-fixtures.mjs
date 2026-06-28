import fs from "fs";

const file = "public/data/worldcup2026-group-stage.json";
const matches = JSON.parse(fs.readFileSync(file, "utf8"));

const r32 = [
  { id: 73, matchNumber: 73, stage: "knockout", round: "R32", group: null, home: "Sudáfrica", away: "Canadá", homeFlag: "za", awayFlag: "ca", date: "2026-06-28", time: "13:00", stadium: "Estadio Los Angeles", city: "Los Ángeles", cut: "R32", defined: true },
  { id: 74, matchNumber: 74, stage: "knockout", round: "R32", group: null, home: "Brasil", away: "Japón", homeFlag: "br", awayFlag: "jp", date: "2026-06-29", time: "11:00", stadium: "Estadio Houston", city: "Houston", cut: "R32", defined: true },
  { id: 75, matchNumber: 75, stage: "knockout", round: "R32", group: null, home: "Alemania", away: "Paraguay", homeFlag: "de", awayFlag: "py", date: "2026-06-29", time: "14:30", stadium: "Estadio Boston", city: "Boston", cut: "R32", defined: true },
  { id: 76, matchNumber: 76, stage: "knockout", round: "R32", group: null, home: "Países Bajos", away: "Marruecos", homeFlag: "nl", awayFlag: "ma", date: "2026-06-29", time: "19:00", stadium: "Estadio Monterrey", city: "Monterrey", cut: "R32", defined: true },
  { id: 77, matchNumber: 77, stage: "knockout", round: "R32", group: null, home: "Costa de Marfil", away: "Noruega", homeFlag: "ci", awayFlag: "no", date: "2026-06-30", time: "11:00", stadium: "Estadio Dallas", city: "Dallas", cut: "R32", defined: true },
  { id: 78, matchNumber: 78, stage: "knockout", round: "R32", group: null, home: "Francia", away: "Suecia", homeFlag: "fr", awayFlag: "se", date: "2026-06-30", time: "15:00", stadium: "Estadio Nueva York/Nueva Jersey", city: "Nueva Jersey", cut: "R32", defined: true },
  { id: 79, matchNumber: 79, stage: "knockout", round: "R32", group: null, home: "México", away: "Ecuador", homeFlag: "mx", awayFlag: "ec", date: "2026-06-30", time: "19:00", stadium: "Estadio Ciudad de México", city: "Ciudad de México", cut: "R32", defined: true },
  { id: 80, matchNumber: 80, stage: "knockout", round: "R32", group: null, home: "Inglaterra", away: "RD Congo", homeFlag: "gb-eng", awayFlag: "cd", date: "2026-07-01", time: "10:00", stadium: "Estadio Atlanta", city: "Atlanta", cut: "R32", defined: true },
  { id: 81, matchNumber: 81, stage: "knockout", round: "R32", group: null, home: "Bélgica", away: "Senegal", homeFlag: "be", awayFlag: "sn", date: "2026-07-01", time: "14:00", stadium: "Estadio de Seattle", city: "Seattle", cut: "R32", defined: true },
  { id: 82, matchNumber: 82, stage: "knockout", round: "R32", group: null, home: "EE. UU.", away: "Bosnia y Herzegovina", homeFlag: "us", awayFlag: "ba", date: "2026-07-01", time: "18:00", stadium: "Estadio de la Bahía de San Francisco", city: "Área de la Bahía de San Francisco", cut: "R32", defined: true },
  { id: 83, matchNumber: 83, stage: "knockout", round: "R32", group: null, home: "España", away: "Austria", homeFlag: "es", awayFlag: "at", date: "2026-07-02", time: "13:00", stadium: "Estadio Los Angeles", city: "Los Ángeles", cut: "R32", defined: true },
  { id: 84, matchNumber: 84, stage: "knockout", round: "R32", group: null, home: "Portugal", away: "Croacia", homeFlag: "pt", awayFlag: "hr", date: "2026-07-02", time: "17:00", stadium: "Estadio de Toronto", city: "Toronto", cut: "R32", defined: true },
  { id: 85, matchNumber: 85, stage: "knockout", round: "R32", group: null, home: "Suiza", away: "Argelia", homeFlag: "ch", awayFlag: "dz", date: "2026-07-02", time: "21:00", stadium: "Estadio BC Place Vancouver", city: "Vancouver", cut: "R32", defined: true },
  { id: 86, matchNumber: 86, stage: "knockout", round: "R32", group: null, home: "Australia", away: "Egipto", homeFlag: "au", awayFlag: "eg", date: "2026-07-03", time: "12:00", stadium: "Estadio Dallas", city: "Dallas", cut: "R32", defined: true },
  { id: 87, matchNumber: 87, stage: "knockout", round: "R32", group: null, home: "Argentina", away: "Islas de Cabo Verde", homeFlag: "ar", awayFlag: "cv", date: "2026-07-03", time: "16:00", stadium: "Estadio Miami", city: "Miami", cut: "R32", defined: true },
  { id: 88, matchNumber: 88, stage: "knockout", round: "R32", group: null, home: "Colombia", away: "Ghana", homeFlag: "co", awayFlag: "gh", date: "2026-07-03", time: "19:30", stadium: "Estadio Kansas City", city: "Kansas City", cut: "R32", defined: true }
];

const withoutR32 = matches.filter((m) => Number(m.matchNumber) < 73);
const updated = [...withoutR32, ...r32].sort((a, b) => a.matchNumber - b.matchNumber);

fs.writeFileSync(file, JSON.stringify(updated, null, 2) + "\n");

console.log("✅ Dieciseisavos cargados correctamente");
console.log(`Total partidos: ${updated.length}`);
