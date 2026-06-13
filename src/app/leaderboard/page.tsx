"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SummaryRow = {
  user_id: string;
  display_name: string;
  cut1: number;
  cut2: number;
  cut3: number;
  total: number;
  exact_scores: number;
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);

        const response = await fetch("/api/leaderboard?view=summary");
        const json = await response.json();

        setRows(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-container">
        <header className="leaderboard-header">
          <div>
            <div className="eyebrow">TABLA GENERAL</div>

            <h1>Leaderboard Mundial 2026</h1>

            <p>
              Consulta el rendimiento acumulado por cortes semanales y el
              puntaje total del torneo.
            </p>
          </div>

          <nav className="actions">
            <Link href="/" className="btn secondary">
              Inicio
            </Link>

            <Link href="/quiniela" className="btn primary">
              Ir a Quiniela
            </Link>
          </nav>
        </header>

        {loading ? (
          <div className="loading-card">Cargando leaderboard...</div>
        ) : rows.length === 0 ? (
          <div className="loading-card">
            Todavía no hay resultados registrados.
          </div>
        ) : (
          <>
            <section className="podium-grid">
              {rows.slice(0, 3).map((row, index) => (
                <article
                  key={row.user_id}
                  className={`podium-card ${index === 0 ? "first" : ""}`}
                >
                  <div className="rank-label">#{index + 1}</div>

                  <h2>{row.display_name}</h2>

                  <div className="big-score">{row.total}</div>

                  <div className="exactos">
                    Marcadores exactos: {row.exact_scores}
                  </div>
                </article>
              ))}
            </section>

            <section className="desktop-table-card">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participante</th>
                    <th>Sem 1</th>
                    <th>Sem 2</th>
                    <th>Sem 3</th>
                    <th>Total</th>
                    <th>Marcadores exactos</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.user_id}>
                      <td>
                        <strong>#{index + 1}</strong>
                      </td>

                      <td>
                        <strong>{row.display_name}</strong>
                      </td>

                      <td>{row.cut1} pts</td>
                      <td>{row.cut2} pts</td>
                      <td>{row.cut3} pts</td>

                      <td className="total-cell">{row.total} pts</td>

                      <td>{row.exact_scores}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mobile-list">
              {rows.map((row, index) => (
                <article key={row.user_id} className="mobile-card">
                  <div className="mobile-card-top">
                    <div className="mobile-rank">#{index + 1}</div>

                    <div className="mobile-name">{row.display_name}</div>

                    <div className="mobile-total">
                      <span>Total</span>
                      <strong>{row.total}</strong>
                    </div>
                  </div>

                  <div className="mobile-stats">
                    <div>
                      <span>Sem 1</span>
                      <strong>{row.cut1} pts</strong>
                    </div>

                    <div>
                      <span>Sem 2</span>
                      <strong>{row.cut2} pts</strong>
                    </div>

                    <div>
                      <span>Sem 3</span>
                      <strong>{row.cut3} pts</strong>
                    </div>

                    <div>
                      <span>Marcadores exactos</span>
                      <strong>{row.exact_scores}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .leaderboard-page {
          min-height: 100vh;
          background:
            linear-gradient(rgba(0, 0, 0, 0.78), rgba(0, 0, 0, 0.92)),
            url("/worldcup-bg.jpg");
          background-size: cover;
          background-position: center;
          padding: 40px 16px;
          color: white;
          font-family: sans-serif;
          overflow-x: hidden;
        }

        .leaderboard-container {
          max-width: 1300px;
          margin: 0 auto;
        }

        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .eyebrow {
          color: gold;
          font-weight: 900;
          font-size: 13px;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 64px);
          line-height: 1.05;
        }

        p {
          color: lightgray;
          margin-top: 14px;
          line-height: 1.6;
          max-width: 700px;
        }

        .actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 14px 22px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 900;
        }

        .btn.primary {
          background: linear-gradient(135deg, limegreen, #7cfc00);
          color: black;
        }

        .btn.secondary {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: white;
        }

        .loading-card {
          padding: 50px;
          border-radius: 24px;
          background: rgba(0, 0, 0, 0.78);
          text-align: center;
        }

        .podium-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          margin-bottom: 30px;
        }

        .podium-card {
          border-radius: 24px;
          padding: 24px;
          background: rgba(0, 0, 0, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .podium-card.first {
          background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.22),
            rgba(0, 0, 0, 0.88)
          );
          border-color: gold;
        }

        .rank-label {
          color: lightgray;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .podium-card.first .rank-label {
          color: gold;
        }

        .podium-card h2 {
          margin-top: 0;
          margin-bottom: 8px;
          word-break: break-word;
        }

        .big-score {
          font-size: 42px;
          font-weight: 900;
          color: limegreen;
        }

        .exactos {
          color: lightgray;
          margin-top: 8px;
        }

        .desktop-table-card {
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(10px);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: linear-gradient(135deg, limegreen, #7cfc00);
          color: black;
        }

        th {
          padding: 18px 16px;
          text-align: left;
          font-size: 14px;
          letter-spacing: 1px;
        }

        td {
          padding: 18px 16px;
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .total-cell {
          color: limegreen;
          font-weight: 900;
          font-size: 22px;
        }

        .mobile-list {
          display: none;
        }

        @media (max-width: 760px) {
          .leaderboard-page {
            padding: 28px 12px 36px;
          }

          .leaderboard-header {
            gap: 16px;
            margin-bottom: 22px;
          }

          h1 {
            font-size: 34px;
          }

          p {
            font-size: 15px;
          }

          .actions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .btn {
            text-align: center;
            padding: 13px 10px;
          }

          .podium-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }

          .podium-card {
            padding: 20px;
          }

          .desktop-table-card {
            display: none;
          }

          .mobile-list {
            display: grid;
            gap: 14px;
          }

          .mobile-card {
            border-radius: 22px;
            padding: 18px;
            background: rgba(0, 0, 0, 0.82);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
          }

          .mobile-card-top {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 12px;
            align-items: center;
            margin-bottom: 16px;
          }

          .mobile-rank {
            font-weight: 900;
            color: gold;
            font-size: 18px;
          }

          .mobile-name {
            font-weight: 900;
            font-size: 18px;
            line-height: 1.25;
            word-break: break-word;
            min-width: 0;
          }

          .mobile-total {
            min-width: 62px;
            height: 62px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, limegreen, #7cfc00);
            color: black;
            font-weight: 1000;
            line-height: 1;
          }

          .mobile-total span {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .mobile-total strong {
            font-size: 24px;
          }

          .mobile-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .mobile-stats div {
            border-radius: 14px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.06);
          }

          .mobile-stats span {
            display: block;
            color: rgba(255, 255, 255, 0.64);
            font-size: 12px;
            margin-bottom: 6px;
          }

          .mobile-stats strong {
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  );
}