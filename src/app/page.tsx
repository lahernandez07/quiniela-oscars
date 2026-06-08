"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const ADMIN_EMAILS = [
  "la.hernandez07@gmail.com",
  "josetamezg@gmail.com",
];

export default function HomePage() {
  const supabase = supabaseBrowser();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setChecking(false);
    }

    loadUser();
  }, []);

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.9)), url('/worldcup-bg.jpg')",
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
          Captura tus pronósticos de la fase de grupos, compite por semanas
          y pelea por el campeonato general de la quiniela.
        </p>

        {!checking && (
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 48,
            }}
          >
            {user ? (
              <>
                <Link href="/quiniela" style={primaryButton}>
                  Capturar pronósticos
                </Link>

                <Link href="/leaderboard" style={secondaryButton}>
                  Ver tablero
                </Link>

                {isAdmin && (
                  <Link href="/admin" style={adminButton}>
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <button onClick={handleLogin} style={primaryButton}>
                Iniciar sesión con Google
              </button>
            )}
          </div>
        )}

        {user && (
          <section
            style={{
              padding: 26,
              borderRadius: 22,
              background: "rgba(0,0,0,0.82)",
              border: "1px solid rgba(255,255,255,0.18)",
              marginBottom: 46,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                alignItems: "center",
                flexWrap: "wrap",
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
                <p style={{ color: "lightgray" }}>
                  Consulta la tabla general de participantes.
                </p>
              </div>

              <Link href="/leaderboard" style={primaryButton}>
                Ver tabla completa
              </Link>
            </div>
          </section>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            marginBottom: 46,
          }}
        >
          <PrizeCard title="Premio general" amount="$6,000">
            Para el campeón general de la quiniela.
          </PrizeCard>

          <PrizeCard title="Subcampeón" amount="$3,000">
            Premio para el segundo lugar general.
          </PrizeCard>

          <PrizeCard title="Semanas" amount="$2,000">
            Premio semanal para el líder de cada semana.
          </PrizeCard>
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
                title: "Compite por semanas",
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
      </section>
    </main>
  );
}

function PrizeCard({
  title,
  amount,
  children,
}: {
  title: string;
  amount: string;
  children: React.ReactNode;
}) {
  return (
    <div style={cardStyle}>
      <div style={goldLabelStyle}>{title}</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 34 }}>{amount}</h2>
      <p style={{ color: "lightgray", margin: 0 }}>{children}</p>
    </div>
  );
}

const primaryButton: React.CSSProperties = {
  padding: "15px 24px",
  borderRadius: 12,
  background: "limegreen",
  color: "black",
  border: "none",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const adminButton: React.CSSProperties = {
  padding: "15px 24px",
  borderRadius: 12,
  background: "gold",
  color: "black",
  border: "none",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  padding: "15px 24px",
  borderRadius: 12,
  background: "black",
  color: "white",
  border: "1px solid gray",
  textDecoration: "none",
  fontWeight: 800,
};

const sectionStyle: React.CSSProperties = {
  padding: 26,
  borderRadius: 22,
  background: "rgba(0,0,0,0.82)",
  border: "1px solid rgba(255,255,255,0.18)",
  marginBottom: 46,
};

const cardStyle: React.CSSProperties = {
  padding: 22,
  borderRadius: 20,
  background: "rgba(0,0,0,0.82)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const softCardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: "rgba(105,105,105,0.65)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const goldLabelStyle: React.CSSProperties = {
  color: "gold",
  fontWeight: 900,
  marginBottom: 10,
};