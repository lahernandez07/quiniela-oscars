"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const ADMIN_EMAILS = [
  "la.hernandez07@gmail.com",
  "josetamezg@gmail.com",
];

export default function AppHeader() {
  const supabase = supabaseBrowser();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    !!user?.email &&
    ADMIN_EMAILS.includes(user.email.toLowerCase());

  function isActive(path: string) {
    return pathname === path;
  }

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function expireSession() {
      await supabase.auth.signOut();
      window.location.href = "/";
    }

    const remaining = getMillisecondsUntilEndOfDayMexicoCity();

    if (remaining <= 0) {
      expireSession();
      return;
    }

    const timeout = window.setTimeout(expireSession, remaining);

    return () => window.clearTimeout(timeout);
  }, [user]);

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
            📐
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-black md:text-lg">
              GAYOU
            </div>

            <div className="truncate text-[10px] font-extrabold tracking-widest text-zinc-400 md:text-xs">
              QUINIELA MUNDIAL 2026
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className={isActive("/") ? activePrimaryButton : navButton}
          >
            Inicio
          </Link>

          {!loading && user && (
            <>
              <Link
                href="/quiniela"
                className={
                  isActive("/quiniela") ? activePrimaryButton : navButton
                }
              >
                Quiniela
              </Link>

              <Link
                href="/calendario"
                className={
                  isActive("/calendario") ? activePrimaryButton : navButton
                }
              >
                Calendario
              </Link>

              <Link
                href="/grupos"
                className={
                  isActive("/grupos") ? activePrimaryButton : navButton
                }
              >
                Grupos
              </Link>

              <Link
                href="/pronosticos"
                className={
                  isActive("/pronosticos") ? activeGoldButton : navButton
                }
              >
                Pronósticos
              </Link>

              <Link
                href="/pagos"
                className={isActive("/pagos") ? activeGoldButton : navButton}
              >
                Pagos
              </Link>

              <Link
                href="/participation"
                className={
                  isActive("/participation") ? activePrimaryButton : navButton
                }
              >
                Participación
              </Link>

              <Link
                href="/leaderboard"
                className={
                  isActive("/leaderboard") ? activePrimaryButton : navButton
                }
              >
                Leaderboard
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={isActive("/admin") ? activeGoldButton : navButton}
                >
                  Admin
                </Link>
              )}

              <button onClick={handleLogout} className={logoutButton}>
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>

      <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 md:hidden">
        <Link
          href="/"
          className={isActive("/") ? mobileActivePrimaryButton : mobileNavButton}
        >
          Inicio
        </Link>

        {!loading && user && (
          <>
            <Link
              href="/quiniela"
              className={
                isActive("/quiniela")
                  ? mobileActivePrimaryButton
                  : mobileNavButton
              }
            >
              Quiniela
            </Link>

            <Link
              href="/calendario"
              className={
                isActive("/calendario")
                  ? mobileActivePrimaryButton
                  : mobileNavButton
              }
            >
              Calendario
            </Link>

            <Link
              href="/grupos"
              className={
                isActive("/grupos")
                  ? mobileActivePrimaryButton
                  : mobileNavButton
              }
            >
              Grupos
            </Link>

            <Link
              href="/pronosticos"
              className={
                isActive("/pronosticos")
                  ? mobileActiveGoldButton
                  : mobileNavButton
              }
            >
              Pronósticos
            </Link>

            <Link
              href="/pagos"
              className={
                isActive("/pagos")
                  ? mobileActiveGoldButton
                  : mobileNavButton
              }
            >
              Pagos
            </Link>

            <Link
              href="/participation"
              className={
                isActive("/participation")
                  ? mobileActivePrimaryButton
                  : mobileNavButton
              }
            >
              Participación
            </Link>

            <Link
              href="/leaderboard"
              className={
                isActive("/leaderboard")
                  ? mobileActivePrimaryButton
                  : mobileNavButton
              }
            >
              Tabla
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={
                  isActive("/admin")
                    ? mobileActiveGoldButton
                    : mobileNavButton
                }
              >
                Admin
              </Link>
            )}

            <button onClick={handleLogout} className={mobileLogoutButton}>
              Salir
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
function getMillisecondsUntilEndOfDayMexicoCity() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  const mexicoEndOfDayAsUTC = new Date(
    Date.UTC(year, month - 1, day + 1, 5, 59, 59, 999)
  );

  return mexicoEndOfDayAsUTC.getTime() - now.getTime();
}

const navButton =
  "rounded-full border border-white/20 bg-black px-5 py-3 font-extrabold text-white no-underline";

const activePrimaryButton =
  "rounded-full border border-lime-400 bg-lime-400 px-5 py-3 font-black text-black no-underline shadow-lg shadow-lime-400/20";

const activeGoldButton =
  "rounded-full border border-yellow-400 bg-yellow-400 px-5 py-3 font-black text-black no-underline shadow-lg shadow-yellow-400/20";

const logoutButton =
  "rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 font-black text-red-200";

const mobileNavButton =
  "shrink-0 rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-extrabold text-white no-underline";

const mobileActivePrimaryButton =
  "shrink-0 rounded-full border border-lime-400 bg-lime-400 px-4 py-2 text-sm font-black text-black no-underline";

const mobileActiveGoldButton =
  "shrink-0 rounded-full border border-yellow-400 bg-yellow-400 px-4 py-2 text-sm font-black text-black no-underline";

const mobileLogoutButton =
  "shrink-0 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200";