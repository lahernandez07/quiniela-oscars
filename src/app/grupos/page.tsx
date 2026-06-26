"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TeamFlag from "@/components/TeamFlag";

type MatchResult = {
  match_id: number;
  home_score: number;
  away_score: number;
};

type Match = {
  id: number;
  matchNumber: number;
  group: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  result: MatchResult | null;
};

type TeamStanding = {
  team: string;
  flag: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export default function GruposPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch("/api/results", { cache: "no-store" });
        const data = await response.json();
        setMatches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  const standingsByGroup = useMemo(() => {
    const groups: Record<string, Record<string, TeamStanding>> = {};

    matches.forEach((match) => {
      if (!groups[match.group]) groups[match.group] = {};

      if (!groups[match.group][match.home]) {
        groups[match.group][match.home] = createEmptyTeam(
          match.home,
          match.homeFlag
        );
      }

      if (!groups[match.group][match.away]) {
        groups[match.group][match.away] = createEmptyTeam(
          match.away,
          match.awayFlag
        );
      }

      if (!match.result) return;

      const home = groups[match.group][match.home];
      const away = groups[match.group][match.away];

      const homeScore = match.result.home_score;
      const awayScore = match.result.away_score;

      home.played += 1;
      away.played += 1;

      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (homeScore < awayScore) {
        away.wins += 1;
        away.points += 3;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, teams]) => ({
        groupName,
        teams: Object.values(teams).sort(sortStandings),
      }));
  }, [matches]);

  if (loading) {
    return (
      <main className="page">
        <h1>Cargando grupos...</h1>
        <Styles />
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">TABLA DE POSICIONES</div>
          <h1>Grupos Mundial 2026</h1>
          <p>
            Posiciones actualizadas automáticamente conforme se capturan los
            resultados oficiales.
          </p>
        </div>

        <div className="actions">
          <Link href="/" className="secondaryButton">
            Inicio
          </Link>

          <Link href="/calendario" className="primaryButton">
            Calendario
          </Link>
        </div>
      </section>

      <section className="legend">
        <span>🟢 1.º y 2.º clasifican</span>
        <span>🟡 3.º con posibilidad</span>
        <span>🔴 4.º en riesgo</span>
      </section>

      <section className="grid">
        {standingsByGroup.map((group) => (
          <article key={group.groupName} className="groupCard">
            <header className="groupHeader">
              <div>
                <h2>{group.groupName}</h2>
                <p>
                  Clasifican actualmente:{" "}
                  <strong>
                    {group.teams[0]?.team ?? "-"} y{" "}
                    {group.teams[1]?.team ?? "-"}
                  </strong>
                </p>
              </div>

              <span className="badge">4 equipos</span>
            </header>

            <div className="teams">
              {group.teams.map((team, index) => (
                <TeamCard
                  key={team.team}
                  team={team}
                  position={index + 1}
                />
              ))}
            </div>
          </article>
        ))}
      </section>

      <Styles />
    </main>
  );
}

function TeamCard({
  team,
  position,
}: {
  team: TeamStanding;
  position: number;
}) {
  const status =
    position <= 2 ? "qualified" : position === 3 ? "possible" : "risk";

  const maxPoints = Math.max(team.played * 3, 1);
  const progress = Math.min((team.points / maxPoints) * 100, 100);

  return (
    <div className={`teamCard ${status}`}>
      <div className="topRow">
        <div className="identity">
          <span className="position">{getPositionIcon(position)}</span>

          <TeamFlag
            code={team.flag}
            name={team.team}
            style={{
              width: 44,
              height: 32,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.18)",
              flexShrink: 0,
            }}
          />

          <div className="teamText">
            <strong>{team.team}</strong>
            <span>
              PJ {team.played} · G {team.wins} · E {team.draws} · P{" "}
              {team.losses}
            </span>
          </div>
        </div>

        <div className="pointsBox">
          <strong>{team.points}</strong>
          <span>PTS</span>
        </div>
      </div>

      <div className="progressTrack">
        <div className="progressBar" style={{ width: `${progress}%` }} />
      </div>

      <div className="stats">
        <Stat label="GF" value={team.goalsFor} />
        <Stat label="GC" value={team.goalsAgainst} />
        <Stat
          label="DG"
          value={
            team.goalDifference > 0
              ? `+${team.goalDifference}`
              : team.goalDifference
          }
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getPositionIcon(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return "④";
}

function createEmptyTeam(team: string, flag: string): TeamStanding {
  return {
    team,
    flag,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function sortStandings(a: TeamStanding, b: TeamStanding) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

  return a.team.localeCompare(b.team);
}

function Styles() {
  return (
    <style jsx global>{`
      .page {
        min-height: 100vh;
        padding: 32px 18px 70px;
        color: white;
        background:
          radial-gradient(circle at top left, rgba(124, 252, 0, 0.16), transparent 34%),
          linear-gradient(180deg, #050505, #000);
      }

      .hero,
      .legend,
      .grid {
        max-width: 1500px;
        margin-left: auto;
        margin-right: auto;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }

      .eyebrow {
        display: inline-flex;
        padding: 9px 14px;
        border-radius: 999px;
        background: rgba(124, 252, 0, 0.14);
        color: #9dff00;
        border: 1px solid rgba(124, 252, 0, 0.28);
        font-size: 12px;
        font-weight: 1000;
        letter-spacing: 1.2px;
        margin-bottom: 14px;
      }

      h1 {
        margin: 0;
        font-size: clamp(38px, 6vw, 72px);
        font-weight: 1000;
        letter-spacing: -2px;
      }

      .hero p {
        margin-top: 14px;
        max-width: 760px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 18px;
        line-height: 1.55;
      }

      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .primaryButton,
      .secondaryButton {
        padding: 14px 20px;
        border-radius: 16px;
        text-decoration: none;
        font-weight: 1000;
      }

      .primaryButton {
        background: linear-gradient(135deg, #7cfc00, #d7ff4d);
        color: black;
        box-shadow: 0 0 24px rgba(124, 252, 0, 0.25);
      }

      .secondaryButton {
        background: rgba(255, 255, 255, 0.06);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.14);
      }

      .legend {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 26px;
      }

      .legend span {
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.82);
        font-weight: 800;
        font-size: 13px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
        gap: 22px;
      }

      .groupCard {
        border-radius: 28px;
        padding: 22px;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.075),
          rgba(255, 255, 255, 0.035)
        );
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(14px);
      }

      .groupHeader {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .groupHeader h2 {
        margin: 0;
        color: #ffcc00;
        font-size: 28px;
        font-weight: 1000;
      }

      .groupHeader p {
        margin: 8px 0 0;
        color: rgba(255, 255, 255, 0.68);
        font-size: 13px;
      }

      .badge {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 12px;
        font-weight: 900;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
      }

      .teams {
        display: grid;
        gap: 14px;
      }

      .teamCard {
        padding: 16px;
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.34);
      }

      .teamCard.qualified {
        border-color: rgba(124, 252, 0, 0.38);
        background: linear-gradient(
          90deg,
          rgba(124, 252, 0, 0.16),
          rgba(0, 0, 0, 0.28)
        );
      }

      .teamCard.possible {
        border-color: rgba(255, 204, 0, 0.34);
        background: linear-gradient(
          90deg,
          rgba(255, 204, 0, 0.13),
          rgba(0, 0, 0, 0.28)
        );
      }

      .teamCard.risk {
        border-color: rgba(255, 80, 80, 0.26);
        background: linear-gradient(
          90deg,
          rgba(255, 80, 80, 0.1),
          rgba(0, 0, 0, 0.28)
        );
      }

      .topRow {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .position {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.16);
        font-size: 19px;
        flex-shrink: 0;
      }

      .teamText {
        min-width: 0;
      }

      .teamText strong {
        display: block;
        font-size: 18px;
        font-weight: 1000;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .teamText span {
        display: block;
        margin-top: 4px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        font-weight: 850;
      }

      .pointsBox {
        min-width: 76px;
        padding: 10px 8px;
        border-radius: 18px;
        text-align: center;
        background: rgba(0, 0, 0, 0.42);
        border: 1px solid rgba(124, 252, 0, 0.2);
        box-shadow: inset 0 0 18px rgba(124, 252, 0, 0.07);
      }

      .pointsBox strong {
        display: block;
        color: #7cfc00;
        font-size: 32px;
        line-height: 0.9;
        font-weight: 1000;
      }

      .pointsBox span {
        display: block;
        margin-top: 5px;
        color: rgba(255, 255, 255, 0.58);
        font-size: 10px;
        font-weight: 1000;
      }

      .progressTrack {
        height: 7px;
        margin: 14px 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .progressBar {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #7cfc00, #ffcc00);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .stat {
        padding: 9px 8px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.055);
        text-align: center;
      }

      .stat span {
        display: block;
        color: rgba(255, 255, 255, 0.5);
        font-size: 10px;
        font-weight: 1000;
      }

      .stat strong {
        display: block;
        margin-top: 3px;
        font-size: 16px;
        font-weight: 1000;
      }

      @media (max-width: 768px) {
        .page {
          padding: 24px 12px 60px;
        }

        .actions {
          width: 100%;
        }

        .primaryButton,
        .secondaryButton {
          flex: 1;
          text-align: center;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        .groupCard {
          padding: 18px;
          border-radius: 24px;
        }

        .topRow {
          align-items: flex-start;
        }

        .identity {
          align-items: flex-start;
        }

        .teamText strong {
          font-size: 17px;
        }

        .pointsBox {
          min-width: 68px;
        }

        .pointsBox strong {
          font-size: 28px;
        }
      }

      @media (max-width: 420px) {
        .teamCard {
          padding: 14px;
        }

        .topRow {
          flex-direction: column;
          align-items: stretch;
        }

        .pointsBox {
          width: 100%;
        }

        .pointsBox strong {
          font-size: 34px;
        }
      }
    `}</style>
  );
}