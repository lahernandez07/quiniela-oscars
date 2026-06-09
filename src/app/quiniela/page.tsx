"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Match = {
  id: number;
  matchNumber: number;
  stage: "group";
  group: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  cut: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
};

type Prediction = {
  homeScore: string;
  awayScore: string;
};

type CutFilter = "all" | "cut1" | "cut2" | "cut3";

const cuts = {
  all: {
    label: "Todos",
    description: "Todos los partidos disponibles",
  },
  cut1: {
    label: "Semana 1",
    description:
      "Semana 1 · 11 al 14 junio · $1,500 1er lugar / $500 2do lugar - Pago lunes 15",
    start: "2026-06-11",
    end: "2026-06-14",
  },
  cut2: {
    label: "Semana 2",
    description:
      "Semana 2 - 15 al 21 de junio · $1,500 1er lugar / $500 2do lugar - Pago lunes 22",
    start: "2026-06-15",
    end: "2026-06-21",
  },
  cut3: {
    label:
      "Semana 3",
    description:
      "Semana 3 - 22 al 27 de junio · $1,500 1er lugar / $500 2do lugar - Pago lunes 29",
    start: "2026-06-22",
    end: "2026-06-27",
  },
};

function isMatchLocked(match: Match) {
  const mexicoDate = new Date(`${match.date}T${match.time}:00-06:00`);
  const now = new Date();

  return now >= mexicoDate;
}

function isMatchInCut(match: Match, cut: CutFilter) {
  if (cut === "all") return true;

  const selectedCut = cuts[cut];

  return match.date >= selectedCut.start && match.date <= selectedCut.end;
}

export default function QuinielaPage() {
  const supabase = supabaseBrowser();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCut, setActiveCut] = useState<CutFilter>("all");

  const [predictions, setPredictions] =
    useState<Record<number, Prediction>>({});

  const [savedMatches, setSavedMatches] =
    useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadPageData() {
      try {
        const response = await fetch("/api/matches");
        const data = await response.json();

        setMatches(data);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: savedPredictions } = await supabase
          .from("predictions_dev")
          .select("match_id, home_score, away_score")
          .eq("user_id", user.id);

        const predictionsMap: Record<number, Prediction> = {};
        const savedMap: Record<number, boolean> = {};

        savedPredictions?.forEach((item) => {
          predictionsMap[item.match_id] = {
            homeScore: String(item.home_score),
            awayScore: String(item.away_score),
          };

          savedMap[item.match_id] = true;
        });

        setPredictions(predictionsMap);
        setSavedMatches(savedMap);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => isMatchInCut(match, activeCut));
  }, [matches, activeCut]);

  const completedInFilter = filteredMatches.filter(
    (match) => !!predictions[match.id]
  ).length;

  function updatePrediction(
    matchId: number,
    field: "homeScore" | "awayScore",
    value: string
  ) {
    setSavedMatches((prev) => ({
      ...prev,
      [matchId]: false,
    }));

    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        homeScore: prev[matchId]?.homeScore ?? "",
        awayScore: prev[matchId]?.awayScore ?? "",
        [field]: value,
      },
    }));
  }

  async function savePrediction(matchId: number) {
    const prediction = predictions[matchId];

    if (!prediction?.homeScore || !prediction?.awayScore) {
      return;
    }

    const match = matches.find((m) => m.id === matchId);

    if (match && isMatchLocked(match)) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase.from("predictions_dev").upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score: Number(prediction.homeScore),
        away_score: Number(prediction.awayScore),
      },
      {
        onConflict: "user_id,match_id",
      }
    );

    if (error) {
      console.error(error);
      return;
    }

    setSavedMatches((prev) => ({
      ...prev,
      [matchId]: true,
    }));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,.78), rgba(0,0,0,.92)), url('/worldcup-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "32px 16px",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 30,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 999,
                background: "limegreen",
                color: "black",
                fontWeight: 900,
                marginBottom: 18,
                fontSize: 13,
              }}
            >
              🐾 PANTERAS DEL ICC
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(36px, 9vw, 70px)",
                lineHeight: 1,
              }}
            >
              Quiniela Mundial 2026
            </h1>

            <p
              style={{
                color: "lightgray",
                marginTop: 18,
                maxWidth: 760,
                lineHeight: 1.6,
                fontSize: 18,
              }}
            >
              Captura tus pronósticos antes del inicio de cada partido y pelea
              por los cortes semanales y el campeonato general.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/" style={secondaryButton}>
              Inicio
            </Link>

            <Link href="/leaderboard" style={primaryButton}>
              Ver leaderboard
            </Link>
          </div>
        </div>

        <section style={filterCard}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            {(Object.keys(cuts) as CutFilter[]).map((cutKey) => {
              const active = activeCut === cutKey;

              return (
                <button
                  key={cutKey}
                  onClick={() => setActiveCut(cutKey)}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 999,
                    border: active
                      ? "1px solid limegreen"
                      : "1px solid rgba(255,255,255,0.15)",
                    background: active
                      ? "limegreen"
                      : "rgba(255,255,255,0.04)",
                    color: active ? "black" : "white",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {cuts[cutKey].label}
                </button>
              );
            })}
          </div>

          <div style={{ color: "lightgray", lineHeight: 1.6 }}>
            {cuts[activeCut].description}
          </div>

          <div
            style={{
              marginTop: 14,
              color: "gold",
              fontWeight: 800,
            }}
          >
            Pronósticos capturados: {completedInFilter}/{filteredMatches.length}
          </div>
        </section>

        {loading ? (
          <div style={loadingCard}>Cargando partidos...</div>
        ) : (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {filteredMatches.map((match) => {
              const prediction = predictions[match.id];
              const locked = isMatchLocked(match);
              const saved = savedMatches[match.id];

              return (
                <div
                  key={match.id}
                  style={{
                    borderRadius: 28,
                    overflow: "hidden",
                    border: locked
                      ? "1px solid rgba(255,165,0,0.35)"
                      : "1px solid rgba(255,255,255,0.12)",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.88))",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0 30px rgba(0,0,0,0.35)",
                    opacity: locked ? 0.72 : 1,
                  }}
                >
                  <div style={{ padding: 24 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 14px",
                          borderRadius: 999,
                          background: "rgba(255,215,0,0.12)",
                          color: "gold",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {match.group}
                      </div>

                      <div
                        style={{
                          color: locked ? "orange" : "limegreen",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {locked ? "PARTIDO BLOQUEADO" : "DISPONIBLE"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-[18px]">
                      <TeamSide
                        name={match.home}
                        flag={match.homeFlag}
                        align="right"
                      />

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 14,
                        }}
                      >
                        <input
                          type="number"
                          placeholder="L"
                          min="0"
                          disabled={locked}
                          value={prediction?.homeScore ?? ""}
                          onChange={(e) =>
                            updatePrediction(
                              match.id,
                              "homeScore",
                              e.target.value
                            )
                          }
                          style={scoreInput}
                        />

                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 900,
                          }}
                        >
                          -
                        </div>

                        <input
                          type="number"
                          placeholder="V"
                          min="0"
                          disabled={locked}
                          value={prediction?.awayScore ?? ""}
                          onChange={(e) =>
                            updatePrediction(
                              match.id,
                              "awayScore",
                              e.target.value
                            )
                          }
                          style={scoreInput}
                        />
                      </div>

                      <TeamSide
                        name={match.away}
                        flag={match.awayFlag}
                        align="left"
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 22,
                        paddingTop: 18,
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 18,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            marginBottom: 6,
                          }}
                        >
                          Partido #{match.matchNumber}
                        </div>

                        <div
                          style={{
                            color: "lightgray",
                            fontSize: 14,
                          }}
                        >
                          {match.date} · {match.time} · {match.city}
                        </div>

                        <div
                          style={{
                            color: "darkgray",
                            fontSize: 13,
                            marginTop: 6,
                          }}
                        >
                          {match.stadium}
                        </div>
                      </div>

                      <button
                        onClick={() => savePrediction(match.id)}
                        disabled={locked}
                        style={{
                          padding: "14px 22px",
                          borderRadius: 14,
                          border: "none",
                          background: locked
                            ? "dimgray"
                            : saved
                              ? "linear-gradient(135deg, #00c853, #69f0ae)"
                              : "linear-gradient(135deg, limegreen, #7CFC00)",
                          color: "black",
                          fontWeight: 900,
                          cursor: locked ? "not-allowed" : "pointer",
                          minWidth: 180,
                          transition: "all .25s ease",
                          boxShadow: saved
                            ? "0 0 24px rgba(0,200,83,0.45)"
                            : "0 0 20px rgba(50,205,50,0.35)",
                        }}
                      >
                        {locked
                          ? "Bloqueado"
                          : saved
                            ? "✓ Guardado"
                            : "Guardar pronóstico"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function TeamSide({
  name,
  flag,
  align,
}: {
  name: string;
  flag: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-4 ${
        align === "right"
          ? "flex-row-reverse justify-center text-center md:justify-start md:text-right"
          : "flex-row justify-center text-center md:justify-start md:text-left"
      }`}
    >
      <img
        src={`https://flagcdn.com/w80/${flag}.png`}
        alt={name}
        style={{
          width: 64,
          height: 48,
          objectFit: "cover",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      />

      <div
        style={{
          fontSize: "clamp(22px, 6vw, 28px)",
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {name}
      </div>
    </div>
  );
}

const scoreInput: React.CSSProperties = {
  width: "clamp(64px, 20vw, 82px)",
  height: "clamp(64px, 20vw, 82px)",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.72)",
  color: "white",
  fontSize: 28,
  fontWeight: 900,
  textAlign: "center",
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  padding: "14px 20px",
  borderRadius: 14,
  background: "linear-gradient(135deg, limegreen, #7CFC00)",
  color: "black",
  textDecoration: "none",
  fontWeight: 900,
};

const secondaryButton: React.CSSProperties = {
  padding: "14px 20px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.72)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const filterCard: React.CSSProperties = {
  padding: 24,
  borderRadius: 24,
  background: "rgba(0,0,0,0.72)",
  border: "1px solid rgba(255,255,255,0.1)",
  marginBottom: 30,
};

const loadingCard: React.CSSProperties = {
  padding: 50,
  borderRadius: 24,
  background: "rgba(0,0,0,0.72)",
  textAlign: "center",
};