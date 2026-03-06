"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const signInGoogle = async () => {
    const supabase = supabaseBrowser();
    const origin = window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/quiniela`,
      },
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm opacity-70">
          Inicia sesión para guardar tu quiniela.
        </p>

        <button
          onClick={signInGoogle}
          className="mt-6 w-full rounded-xl border px-4 py-3 hover:bg-white/10"
        >
          Continuar con Google
        </button>
      </div>
    </main>
  );
}