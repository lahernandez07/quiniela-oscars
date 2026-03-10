"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAdmin } from "@/lib/admin";

export default function Home() {
  const supabase = supabaseBrowser();

  const [loadingUser, setLoadingUser] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUserEmail(user?.email ?? null);
      setLoadingUser(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setLoadingUser(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const canSeeAdmin = isAdmin(userEmail);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <header className="absolute top-0 left-0 z-20 flex w-full justify-end gap-4 p-6">
        {userEmail ? (
          <>
            <span className="text-sm opacity-80">{userEmail}</span>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="rounded-lg border border-white/30 px-3 py-1 text-sm transition hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-white/30 px-3 py-1 text-sm transition hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
        )}
      </header>

      <div className="absolute inset-0">
        <iframe
          className="h-full w-full scale-[1.35] md:scale-[1.15]"
          src="https://www.youtube-nocookie.com/embed/Rpg_wNgr3UQ?autoplay=1&mute=1&controls=0&loop=1&playlist=Rpg_wNgr3UQ&rel=0&modestbranding=1&playsinline=1"
          title="Oscars background video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/50" />

      <section className="relative z-10 flex min-h-screen items-start pt-32">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.45em] text-amber-300">
              Oscars 2026
            </p>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] md:text-7xl">
              Quiniela Oscars 2026
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-200 md:text-xl">
              Haz tus picks antes de la ceremonia, sigue el tablero en vivo y
              prepara el control del evento desde una sola aplicación.
            </p>

            {!loadingUser && !userEmail && (
              <div className="mt-10">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-4 text-base font-semibold text-black transition hover:bg-amber-300"
                >
                  Iniciar sesión con Google
                </Link>
              </div>
            )}

            {!loadingUser && userEmail && (
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link
                  href="/quiniela"
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-4 text-base font-semibold text-black transition hover:bg-amber-300"
                >
                  Ir a la Quiniela
                </Link>

                <Link
                  href="/leaderboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  Ver Tablero
                </Link>

                {canSeeAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-6 py-4 text-base font-semibold text-emerald-200 backdrop-blur-sm transition hover:bg-emerald-400/20"
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}