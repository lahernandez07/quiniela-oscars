"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const ADMIN_EMAILS = [
  "la.hernandez07@gmail.com",
  "josetamezg@gmail.com",
];

export default function AppHeader() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    !!user?.email &&
    ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    loadUser();
  }, []);

  async function handleLogout() {
  await supabase.auth.signOut();

  window.location.href = "/";
}

  return (
    <header
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.92)",
        padding: "18px 28px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            color: "white",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#9cff00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "black",
              fontWeight: 900,
            }}
          >
            🐾
          </div>

          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              Panteras Del ICC
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#bdbdbd",
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              QUINIELA MUNDIAL 2026
            </div>
          </div>
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={navButton}>
            Inicio
          </Link>

          <Link href="/quiniela" style={primaryButton}>
            Quiniela
          </Link>

          <Link href="/pronosticos" style={goldButton}>
            Pronósticos
          </Link>

          <Link href="/leaderboard" style={navButton}>
            Leaderboard
          </Link>

          {!loading && isAdmin && (
            <Link href="/admin" style={adminButton}>
              Admin
            </Link>
          )}

          {!loading && user && (
            <button onClick={handleLogout} style={logoutButton}>
              Cerrar sesión
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

const navButton: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.04)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.2)",
  textDecoration: "none",
  fontWeight: 800,
};

const primaryButton: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 999,
  background: "#39ff14",
  color: "black",
  border: "1px solid #39ff14",
  textDecoration: "none",
  fontWeight: 900,
};

const goldButton: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 999,
  background: "#f5b400",
  color: "black",
  border: "1px solid #f5b400",
  textDecoration: "none",
  fontWeight: 900,
};

const adminButton: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 999,
  background: "gold",
  color: "black",
  border: "1px solid gold",
  textDecoration: "none",
  fontWeight: 900,
};

const logoutButton: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 999,
  background: "rgba(255,0,0,0.08)",
  color: "#ff9b9b",
  border: "1px solid rgba(255,0,0,0.35)",
  fontWeight: 900,
  cursor: "pointer",
};