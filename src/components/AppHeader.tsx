"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const ADMIN_EMAILS = [
  "la.hernandez07@gmail.com",
  "josetamezg@gmail.com",
];

export default function AppHeader() {
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-7 md:py-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 text-white no-underline"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-xl font-black text-black">
            🐾
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-black md:text-lg">
              Panteras Del ICC
            </div>

            <div className="truncate text-[10px] font-extrabold tracking-widest text-zinc-400 md:text-xs">
              QUINIELA MUNDIAL 2026
            </div>
          </div>
        </Link>

        {/* DESKTOP */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className={navButton}>
            Inicio
          </Link>

          {!loading && user && (
            <>
              <Link href="/quiniela" className={primaryButton}>
                Quiniela
              </Link>

              <Link href="/pronosticos" className={goldButton}>
                Pronósticos
              </Link>

              <Link href="/leaderboard" className={navButton}>
                Leaderboard
              </Link>

              {isAdmin && (
                <Link href="/admin" className={adminButton}>
                  Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className={logoutButton}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>

      {/* MOBILE */}
      <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 md:hidden">
        <Link href="/" className={mobileNavButton}>
          Inicio
        </Link>

        {!loading && user && (
          <>
            <Link
              href="/quiniela"
              className={mobilePrimaryButton}
            >
              Quiniela
            </Link>

            <Link
              href="/pronosticos"
              className={mobileGoldButton}
            >
              Pronósticos
            </Link>

            <Link
              href="/leaderboard"
              className={mobileNavButton}
            >
              Tabla
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={mobileAdminButton}
              >
                Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className={mobileLogoutButton}
            >
              Salir
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

const navButton =
  "rounded-full border border-white/20 bg-white/5 px-5 py-3 font-extrabold text-white no-underline";

const primaryButton =
  "rounded-full border border-lime-400 bg-lime-400 px-5 py-3 font-black text-black no-underline";

const goldButton =
  "rounded-full border border-yellow-400 bg-yellow-400 px-5 py-3 font-black text-black no-underline";

const adminButton =
  "rounded-full border border-yellow-300 bg-yellow-300 px-5 py-3 font-black text-black no-underline";

const logoutButton =
  "rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 font-black text-red-200";

const mobileNavButton =
  "shrink-0 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-extrabold text-white no-underline";

const mobilePrimaryButton =
  "shrink-0 rounded-full border border-lime-400 bg-lime-400 px-4 py-2 text-sm font-black text-black no-underline";

const mobileGoldButton =
  "shrink-0 rounded-full border border-yellow-400 bg-yellow-400 px-4 py-2 text-sm font-black text-black no-underline";

const mobileAdminButton =
  "shrink-0 rounded-full border border-yellow-300 bg-yellow-300 px-4 py-2 text-sm font-black text-black no-underline";

const mobileLogoutButton =
  "shrink-0 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200";