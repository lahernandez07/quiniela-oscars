"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import TeamFlag from "@/components/TeamFlag";

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
    label: "Semana 3",
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
  }, [supabase]);

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

    if (prediction?.homeScore === "" || prediction?.awayScore === "") {
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

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Cargando...</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px 32px" }}>
      <section style={{ marginBottom: 30 }}>
        <h1
          style={{
            fontSize: "clamp(42px,6vw,72px)",
            fontWeight: 900,
            marginBottom: 20,
          }}
        >
          Quiniela Mundial 2026
        </h1>

        <p
          style={{
            fontSize: 18,
            opacity: 0.9,
            maxWidth: 900,
          }}
        >
          Captura tus pronósticos antes del inicio de cada partido y pelea por
          los cortes semanales y el campeonato general.
        </p>
      </section>

      <section
        style={{
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 28,
          padding: 24,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {(Object.keys(cuts) as CutFilter[]).map((cut) => (
            <button
              key={cut}
              onClick={() => setActiveCut(cut)}
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.15)",
                background:
                  activeCut === cut ? "limegreen" : "rgba(0,0,0,.4)",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {cuts[cut].label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 22 }}>{cuts[activeCut].description}</p>

        <p
          style={{
            color: "#FFCC00",
            fontWeight: 900,
            marginTop: 20,
          }}
        >
          Pronósticos capturados: {completedInFilter}/{filteredMatches.length}
        </p>
      </section>

      {filteredMatches.map((match) => {
        const prediction = predictions[match.id];
        const locked = isMatchLocked(match);
        const saved = savedMatches[match.id];

        return (
          <div
            key={match.id}
            style={{
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 28,
              padding: 24,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  background: "#7CFC00",
                  color: "black",
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontWeight: 800,
                }}
              >
                {match.group}
              </span>

              <span
                style={{
                  color: locked ? "#ff5555" : "#00ff66",
                  fontWeight: 800,
                }}
              >
                {locked ? "BLOQUEADO" : "DISPONIBLE"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 18,
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              <ScoreTeamRow
                score={prediction?.homeScore ?? ""}
                flag={match.homeFlag}
                team={match.home}
                locked={locked}
                onChange={(value) =>
                  updatePrediction(match.id, "homeScore", value)
                }
              />

              <div
                style={{
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#FFCC00",
                }}
              >
                VS
              </div>

              <ScoreTeamRow
                score={prediction?.awayScore ?? ""}
                flag={match.awayFlag}
                team={match.away}
                locked={locked}
                onChange={(value) =>
                  updatePrediction(match.id, "awayScore", value)
                }
              />
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,.12)",
                marginTop: 28,
                paddingTop: 20,
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <strong>Partido #{match.matchNumber}</strong>
                <p style={{ margin: "8px 0", opacity: 0.9 }}>
                  {match.date} · {match.time} · {match.city}
                </p>
                <p style={{ margin: 0, opacity: 0.7 }}>{match.stadium}</p>
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
        );
      })}
    </main>
  );
}

function ScoreTeamRow({
  score,
  flag,
  team,
  locked,
  onChange,
}: {
  score: string;
  flag: string;
  team: string;
  locked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "90px 64px 1fr",
        gap: 14,
        alignItems: "center",
      }}
    >
      <input
        type="number"
        min="0"
        disabled={locked}
        value={score}
        onChange={(e) => onChange(e.target.value)}
        style={scoreInput}
      />

      <TeamFlag
        code={flag}
        name={team}
        style={{
          width: 64,
          height: 48,
          objectFit: "cover",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      />

      <span
        style={{
          fontSize: "clamp(22px,4vw,32px)",
          fontWeight: 900,
        }}
      >
        {team}
      </span>
    </div>
  );
}

const scoreInput: CSSProperties = {
  width: 86,
  height: 72,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(0,0,0,.55)",
  color: "white",
  textAlign: "center",
  fontSize: 30,
  fontWeight: 900,
  outline: "none",
};