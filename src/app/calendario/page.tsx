"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Match = {
  id: number;
  matchNumber: number;
  stage: string;
  group: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  cut: string;
};

export default function CalendarioPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedCut, setSelectedCut] = useState("Todos");
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadMatches() {
      const response = await fetch("/data/worldcup2026-group-stage.json");
      const data = await response.json();

      setMatches(data);
    }

    loadMatches();
  }, []);

  const groups = useMemo(() => {
    return ["Todos", ...Array.from(new Set(matches.map((m) => m.group)))];
  }, [matches]);

  const dates = useMemo(() => {
    return ["Todos", ...Array.from(new Set(matches.map((m) => m.date)))];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const cutOk = selectedCut === "Todos" || match.cut === selectedCut;
      const groupOk =
        selectedGroup === "Todos" || match.group === selectedGroup;
      const dateOk =
        selectedDate === "Todos" || match.date === selectedDate;

      const text = `${match.home} ${match.away} ${match.city} ${match.stadium}`.toLowerCase();

      const searchOk =
        search.trim() === "" || text.includes(search.toLowerCase());

      return cutOk && groupOk && dateOk && searchOk;
    });
  }, [matches, selectedCut, selectedGroup, selectedDate, search]);

  const groupedByDate = useMemo(() => {
    const result: Record<string, Match[]> = {};

    filteredMatches.forEach((match) => {
      if (!result[match.date]) {
        result[match.date] = [];
      }

      result[match.date].push(match);
    });

    return result;
  }, [filteredMatches]);

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div>
            <div className="eyebrow">CALENDARIO OFICIAL</div>

            <h1>Mundial 2026</h1>

            <p>
              Consulta todos los partidos en horario CDMX certificados para la
              quiniela.
            </p>
          </div>

          <div className="actions">
            <Link href="/" className="secondaryButton">
              Inicio
            </Link>

            <Link href="/quiniela" className="primaryButton">
              Quiniela
            </Link>
          </div>
        </header>

        <section className="cuts">
          {["Todos", "1", "2", "3"].map((cut) => (
            <button
              key={cut}
              onClick={() => setSelectedCut(cut)}
              className={selectedCut === cut ? "cut active" : "cut"}
            >
              {cut === "Todos" ? "Todos" : `Semana ${cut}`}
            </button>
          ))}
        </section>

        <section className="filters">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {date === "Todos" ? "Todas las fechas" : formatDate(date)}
              </option>
            ))}
          </select>

          <input
            placeholder="Buscar equipo, ciudad o estadio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        <div className="counter">{filteredMatches.length} partidos</div>

        {Object.entries(groupedByDate).map(([date, dayMatches]) => (
          <section key={date} className="dateBlock">
            <h2>{formatDate(date)}</h2>

            <div className="grid">
              {dayMatches.map((match) => (
                <article key={match.id} className="card">
                  <div className="top">
                    <span>Partido {match.matchNumber}</span>
                    <strong>{match.group}</strong>
                  </div>

                  <div className="teams">
                  <div>
                  <span className="flag">{flagEmoji(match.homeFlag)}</span>
                  {match.home}
                  </div>

                  <div className="vs">VS</div>

                  <div>
                  <span className="flag">{flagEmoji(match.awayFlag)}</span>
                  {match.away}
                  </div>
                  </div>

                  <div className="time">{match.time} CDMX</div>

                  <div className="meta">
                    <div>{match.stadium}</div>
                    <div>{match.city}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 40px 16px;
          color: white;
          background:
            linear-gradient(rgba(0, 0, 0, 0.82), rgba(0, 0, 0, 0.92)),
            url("/worldcup-bg.jpg");
          background-size: cover;
          background-position: center;
        }

        .container {
          max-width: 1300px;
          margin: auto;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .eyebrow {
          color: gold;
          font-weight: 900;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 64px);
        }

        p {
          color: lightgray;
          line-height: 1.6;
          max-width: 720px;
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .primaryButton,
        .secondaryButton {
          padding: 14px 20px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 900;
        }

        .primaryButton {
          background: linear-gradient(135deg, limegreen, #7cfc00);
          color: black;
        }

        .secondaryButton {
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
        }

        .cuts {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .cut {
          border: none;
          padding: 12px 18px;
          border-radius: 999px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-weight: 800;
        }

        .active {
          background: gold;
          color: black;
          font-weight: 900;
        }

        .filters {
          display: grid;
          grid-template-columns: 220px 280px 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        select,
        input {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.75);
          color: white;
          font-size: 15px;
        }

        option {
          background: black;
        }

        .counter {
          color: lightgray;
          margin-bottom: 28px;
          font-weight: 800;
        }

        .dateBlock {
          margin-bottom: 36px;
        }

        .dateBlock h2 {
          color: gold;
          margin-bottom: 16px;
          text-transform: capitalize;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .card {
          border-radius: 24px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
        }

        .top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 14px;
          color: lightgray;
          font-size: 13px;
        }

        .top strong {
          color: limegreen;
        }

        .teams {
            text-align: center;
            font-size: 20px;
            font-weight: 900;
              }

              .teams div {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
              }

.flag {
  font-size: 26px;
}
        .vs {
          color: gold;
          margin: 8px 0;
          font-size: 13px;
          letter-spacing: 1px;
        }

        .time {
          text-align: center;
          font-size: 30px;
          font-weight: 900;
          color: limegreen;
          margin-top: 16px;
        }

        .meta {
          text-align: center;
          color: lightgray;
          margin-top: 14px;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .page {
            padding: 28px 12px;
          }

          .filters {
            grid-template-columns: 1fr;
          }

          .actions {
            width: 100%;
          }

          .primaryButton,
          .secondaryButton {
            flex: 1;
            text-align: center;
          }

          .time {
            font-size: 26px;
          }
        }
      `}</style>
    </main>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}
function flagEmoji(code: string) {
  const specialFlags: Record<string, string> = {
    "gb-eng": "🏴",
    "gb-sct": "🏴",
    un: "🏳️",
  };

  if (specialFlags[code]) {
    return specialFlags[code];
  }

  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}