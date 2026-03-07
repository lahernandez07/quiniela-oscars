"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const signInGoogle = async () => {
    const supabase = supabaseBrowser();

    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("Error iniciando sesión:", error);
      alert("No se pudo iniciar sesión con Google.");
    }
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
          className="mt-6 w-full rounded-xl border px-4 py-3 hover:bg-white/10 transition"
        >
          Continuar con Google
        </button>
      </div>
    </main>
  );
}
