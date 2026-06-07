import Link from "next/link";

type LeaderboardRow = {
  user_id?: string;
  display_name?: string | null;
  total_points?: number | null;
  exact_scores?: number | null;
  position?: number | null;
};

async function getMiniLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();

    return Array.isArray(data) ? data.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const miniLeaderboard = await getMiniLeaderboard();

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.88)), url('/worldcup-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        fontFamily: "sans-serif",
        padding: "40px 20px",
      }}
    >
      <section style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: 999,
            background: "darkgreen",
            color: "white",
            fontSize: 13,
            fontWeight: 800,
            marginBottom: 26,
          }}
        >
          PANTERAS DEL ICC · QUINIELA OFICIAL
        </div>

        <h1
          style={{
            fontSize: "clamp(44px, 8vw, 86px)",
            lineHeight: 1,
            margin: "0 0 22px",
            letterSpacing: "-2px",
          }}
        >
          Quiniela Mundial 2026
        </h1>

        <p
          style={{
            maxWidth: 760,
            fontSize: 21,
            lineHeight: 1.6,
            color: "lightgray",
            marginBottom: 34,
          }}
        >
          Captura tus pronósticos de la fase de grupos, compite por cortes
          semanales y pelea por el campeonato general de la quiniela.
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 48,
          }}
        >
          <Link
            href="/quiniela"
            style={{
              padding: "15px 24px",
              borderRadius: 12,
              background: "limegreen",
              color: "black",
              textDecoration: "none",
              fontWeight: 900,
            }}
          >
            Capturar pronósticos
          </Link>

          <Link
            href="/leaderboard"
            style={{
              padding: "15px 24px",
              borderRadius: 12,
              background: "black",
              color: "white",
              border: "1px solid gray",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            Ver tablero
          </Link>

          <Link
            href="/login"
            style={{
              padding: "15px 24px",
              borderRadius: 12,
              background: "black",
              color: "white",
              border: "1px solid gray",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            Iniciar sesión
          </Link>
        </div>

        <section
          style={{
            padding: 26,
            borderRadius: 22,
            background: "rgba(0,0,0,0.82)",
            border: "1px solid rgba(255,255,255,0.18)",
            marginBottom: 46,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  color: "gold",
                  fontWeight: 900,
                  fontSize: 13,
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                TABLA GENERAL
              </div>
              <h2 style={{ margin: 0 }}>Top 5 de la quiniela</h2>
            </div>

            <Link
              href="/leaderboard"
              style={{
                padding: "11px 16px",
                borderRadius: 12,
                background: "limegreen",
                color: "black",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              Ver tabla completa
            </Link>
          </div>

          {miniLeaderboard.length === 0 ? (
            <p style={{ color: "lightgray", margin: 0, lineHeight: 1.5 }}>
              Todavía no hay puntos registrados. Cuando se capturen resultados,
              aquí aparecerán los líderes.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {miniLeaderboard.map((player, index) => {
                const position = player.position ?? index + 1;

                return (
                  <div
                    key={player.user_id ?? `${player.display_name}-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 1fr auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "14px 16px",
                      borderRadius: 16,
                      background:
                        position === 1
                          ? "linear-gradient(90deg, rgba(255,215,0,0.24), rgba(105,105,105,0.55))"
                          : "rgba(105,105,105,0.65)",
                      border:
                        position === 1
                          ? "1px solid rgba(255,215,0,0.55)"
                          : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        background: position === 1 ? "gold" : "black",
                        color: position === 1 ? "black" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                      }}
                    >
                      #{position}
                    </div>

                    <div>
                      <div style={{ fontWeight: 900 }}>
                        {player.display_name || "Participante"}
                      </div>
                      <div style={{ color: "lightgray", fontSize: 13 }}>
                        Exactos: {player.exact_scores ?? 0}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 900,
                        fontSize: 22,
                      }}
                    >
                      {player.total_points ?? 0}
                      <div
                        style={{
                          color: "lightgray",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            marginBottom: 46,
          }}
        >
          <div style={cardStyle}>
            <div style={goldLabelStyle}>Premio general</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 34 }}>$6,000</h2>
            <p style={mutedTextStyle}>
              Para el campeón general de la quiniela.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={goldLabelStyle}>Subcampeón</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 34 }}>$3,000</h2>
            <p style={mutedTextStyle}>
              Premio para el segundo lugar general.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={goldLabelStyle}>Cortes semanales</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 34 }}>$2,000</h2>
            <p style={mutedTextStyle}>
              Premio semanal para el líder de cada corte.
            </p>
          </div>
        </div>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Cómo funciona</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            {[
              {
                step: "1",
                title: "Pronostica",
                text: "Captura marcador local y visitante antes del inicio de cada partido.",
              },
              {
                step: "2",
                title: "Suma puntos",
                text: "Marcador exacto da 3 puntos. Resultado correcto da 1 punto.",
              },
              {
                step: "3",
                title: "Compite por cortes",
                text: "Cada semana se paga al líder del periodo. Si hay empate, se divide.",
              },
              {
                step: "4",
                title: "Busca el campeonato",
                text: "Al final de fase de grupos se define campeón y subcampeón general.",
              },
            ].map((item) => (
              <div key={item.step} style={softCardStyle}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: "limegreen",
                    color: "black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    marginBottom: 12,
                  }}
                >
                  {item.step}
                </div>

                <h3 style={{ margin: "0 0 8px" }}>{item.title}</h3>
                <p style={{ margin: 0, color: "lightgray", lineHeight: 1.5 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...sectionStyle, marginBottom: 0 }}>
          <h2 style={{ marginTop: 0 }}>Cortes semanales</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                title: "Corte 1",
                dates: "11 al 14 de junio",
                pay: "Pago lunes 15",
              },
              {
                title: "Corte 2",
                dates: "15 al 21 de junio",
                pay: "Pago lunes 22",
              },
              {
                title: "Corte 3",
                dates: "22 al 27 de junio",
                pay: "Pago lunes 29",
              },
            ].map((cut) => (
              <div key={cut.title} style={softCardStyle}>
                <div style={goldLabelStyle}>{cut.title}</div>
                <h3 style={{ margin: "8px 0" }}>{cut.dates}</h3>
                <p style={{ color: "lightgray", margin: 0 }}>{cut.pay}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

const sectionStyle = {
  padding: 26,
  borderRadius: 22,
  background: "rgba(0,0,0,0.82)",
  border: "1px solid rgba(255,255,255,0.18)",
  marginBottom: 46,
} satisfies React.CSSProperties;

const cardStyle = {
  padding: 22,
  borderRadius: 20,
  background: "rgba(0,0,0,0.82)",
  border: "1px solid rgba(255,255,255,0.18)",
} satisfies React.CSSProperties;

const softCardStyle = {
  padding: 18,
  borderRadius: 16,
  background: "rgba(105,105,105,0.65)",
  border: "1px solid rgba(255,255,255,0.08)",
} satisfies React.CSSProperties;

const goldLabelStyle = {
  color: "gold",
  fontWeight: 900,
  marginBottom: 10,
} satisfies React.CSSProperties;

const mutedTextStyle = {
  color: "lightgray",
  margin: 0,
} satisfies React.CSSProperties;