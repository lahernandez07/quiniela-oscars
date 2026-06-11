"use client";

import { useEffect, useState } from "react";

type Participant = {
  name: string;
  captured: number;
  pending: number;
  progress: number;
};

export default function ParticipationPage() {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<{
    totalMatches: number;
    participants: Participant[];
  }>({
    totalMatches: 0,
    participants: [],
  });

  useEffect(() => {
    async function loadParticipation() {
      try {
        const response = await fetch("/api/participation", {
          cache: "no-store",
        });

        const json = await response.json();

        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadParticipation();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Cargando participación...</h1>
      </main>
    );
  }

  const orderedParticipants = [...data.participants].sort(
    (a, b) => b.progress - a.progress
  );

  return (
    <main
      style={{
        padding: "24px 32px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(42px,6vw,72px)",
          fontWeight: 900,
          marginBottom: 10,
        }}
      >
        Participación
      </h1>

      <p
        style={{
          fontSize: 20,
          opacity: 0.8,
          marginBottom: 30,
        }}
      >
        Seguimiento de captura de pronósticos.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        <StatCard
          title="Participantes"
          value={String(data.participants.length)}
        />

        <StatCard
          title="Partidos"
          value={String(data.totalMatches)}
        />
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,.06)",
              }}
            >
              <th style={th}>Participante</th>
              <th style={th}>Capturados</th>
              <th style={th}>Pendientes</th>
              <th style={th}>Avance</th>
            </tr>
          </thead>

          <tbody>
            {orderedParticipants.map((participant) => (
              <tr key={participant.name}>
                <td style={td}>{participant.name}</td>
                <td style={td}>{participant.captured}</td>
                <td style={td}>{participant.pending}</td>
                <td style={td}>{participant.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 20,
        padding: 20,
      }}
    >
      <div
        style={{
          opacity: 0.7,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const th = {
  textAlign: "left" as const,
  padding: 16,
};

const td = {
  padding: 16,
  borderTop: "1px solid rgba(255,255,255,.08)",
};