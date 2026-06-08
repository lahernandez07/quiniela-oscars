"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function Navbar() {
  const supabase = supabaseBrowser();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
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
        width: "100%",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: "linear-gradient(135deg, limegreen, gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🐾
          </div>

          <div>
            <div
              style={{
                color: "white",
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              Panteras Del ICC
            </div>

            <div
              style={{
                color: "darkgray",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              QUINIELA MUNDIAL 2026
            </div>
          </div>
        </Link>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {user && (
          <Link href="/" style={secondaryButton}>
            Inicio
          </Link>
            )}

          {user && (
            <>
              <Link href="/quiniela" style={primaryButton}>
                Quiniela
              </Link>

              <Link href="/leaderboard" style={secondaryButton}>
                Leaderboard
              </Link>

              <button onClick={handleLogout} style={logoutButton}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const primaryButton: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 999,
  background: "linear-gradient(135deg, limegreen, #7CFC00)",
  color: "black",
  textDecoration: "none",
  fontWeight: 900,
  border: "none",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const logoutButton: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 999,
  border: "1px solid rgba(255,80,80,0.25)",
  background: "rgba(255,0,0,0.08)",
  color: "#ff8080",
  fontWeight: 800,
  cursor: "pointer",
};