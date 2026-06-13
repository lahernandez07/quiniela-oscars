"use client";

import Link from "next/link";

const groups = [
  {
    name: "Grupo A",
    teams: ["🇲🇽 México", "🇰🇷 Corea del Sur", "🇿🇦 Sudáfrica", "🇨🇿 Chequia"],
  },
  {
    name: "Grupo B",
    teams: ["🇨🇦 Canadá", "🇨🇭 Suiza", "🇧🇦 Bosnia y Herzegovina", "🇶🇦 Qatar"],
  },
  {
    name: "Grupo C",
    teams: ["🇧🇷 Brasil", "🏴 Escocia", "🇲🇦 Marruecos", "🇭🇹 Haití"],
  },
  {
    name: "Grupo D",
    teams: ["🇺🇸 Estados Unidos", "🇹🇷 Turquía", "🇵🇾 Paraguay", "🇦🇺 Australia"],
  },
  {
    name: "Grupo E",
    teams: ["🇩🇪 Alemania", "🇪🇨 Ecuador", "🇨🇮 Costa de Marfil", "🇨🇼 Curazao"],
  },
  {
    name: "Grupo F",
    teams: ["🇳🇱 Países Bajos", "🇯🇵 Japón", "🇸🇪 Suecia", "🇹🇳 Túnez"],
  },
  {
    name: "Grupo G",
    teams: ["🇧🇪 Bélgica", "🇳🇿 Nueva Zelanda", "🇮🇷 Irán", "🇪🇬 Egipto"],
  },
  {
    name: "Grupo H",
    teams: ["🇪🇸 España", "🇺🇾 Uruguay", "🇸🇦 Arabia Saudita", "🇨🇻 Cabo Verde"],
  },
  {
    name: "Grupo I",
    teams: ["🇫🇷 Francia", "🇳🇴 Noruega", "🇸🇳 Senegal", "🇮🇶 Irak"],
  },
  {
    name: "Grupo J",
    teams: ["🇦🇷 Argentina", "🇩🇿 Argelia", "🇦🇹 Austria", "🇯🇴 Jordania"],
  },
  {
    name: "Grupo K",
    teams: ["🇵🇹 Portugal", "🇨🇴 Colombia", "🇺🇿 Uzbekistán", "🇨🇩 RD Congo"],
  },
  {
    name: "Grupo L",
    teams: ["🏴 Inglaterra", "🇭🇷 Croacia", "🇬🇭 Ghana", "🇵🇦 Panamá"],
  },
];

export default function GruposPage() {
  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div>
            <div className="eyebrow">FASE DE GRUPOS</div>

            <h1>Grupos Mundial 2026</h1>

            <p>
              Consulta la distribución oficial de selecciones participantes
              del Mundial 2026.
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
        </header>

        <div className="grid">
          {groups.map((group) => (
            <div key={group.name} className="card">
              <h2>{group.name}</h2>

              <ol>
                {group.teams.map((team, index) => (
                  <li key={team}>
                    <span className="position">
                      {index + 1}
                    </span>

                    <span>{team}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 40px 16px;
          color: white;
          background:
            linear-gradient(
              rgba(0, 0, 0, 0.85),
              rgba(0, 0, 0, 0.95)
            ),
            url("/worldcup-bg.jpg");
          background-size: cover;
          background-position: center;
        }

        .container {
          max-width: 1400px;
          margin: auto;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 36px;
        }

        .eyebrow {
          color: gold;
          font-weight: 900;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0;
          font-size: clamp(36px, 6vw, 64px);
        }

        p {
          color: #cfcfcf;
          max-width: 700px;
          line-height: 1.6;
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
          background: linear-gradient(
            135deg,
            #8fff00,
            #c5ff3d
          );
          color: black;
        }

        .secondaryButton {
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.05);
          color: white;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(280px, 1fr)
          );
          gap: 20px;
        }

        .card {
          background: rgba(0,0,0,.75);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 24px;
          padding: 24px;
          backdrop-filter: blur(12px);
        }

        .card h2 {
          margin: 0 0 18px 0;
          color: gold;
          font-size: 24px;
        }

        ol {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        li {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        li:last-child {
          border-bottom: none;
        }

        .position {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: limegreen;
          color: black;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .page {
            padding: 24px 12px;
          }

          .actions {
            width: 100%;
          }

          .primaryButton,
          .secondaryButton {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}