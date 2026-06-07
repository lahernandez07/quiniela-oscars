"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/",
    label: "Inicio",
  },
  {
    href: "/quiniela",
    label: "Quiniela",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        backdropFilter: "blur(14px)",
        background: "rgba(0,0,0,0.72)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1250,
          margin: "0 auto",
          padding: "16px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, limegreen, gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: "0 0 18px rgba(50,205,50,0.35)",
              }}
            >
              🐾
            </div>

            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 22,
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                Panteras Del ICC
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 3,
                  letterSpacing: 1,
                }}
              >
                QUINIELA MUNDIAL 2026
              </div>
            </div>
          </div>
        </Link>

        <nav
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontWeight: 800,
                  background: active
                    ? "linear-gradient(135deg, limegreen, #7CFC00)"
                    : "rgba(255,255,255,0.04)",
                  color: active ? "black" : "white",
                  border: active
                    ? "1px solid limegreen"
                    : "1px solid rgba(255,255,255,0.14)",
                  transition: "all .2s ease",
                  boxShadow: active
                    ? "0 0 20px rgba(50,205,50,0.25)"
                    : "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}