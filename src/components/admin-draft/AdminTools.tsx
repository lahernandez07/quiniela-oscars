"use client";

type Props = {
  loading: boolean;
  onLoadDemoTeams: () => void;
  onResetDraft?: () => void;
  onLoadRealTeams?: () => void;
};

export default function AdminTools({
  loading,
  onLoadDemoTeams,
  onResetDraft,
  onLoadRealTeams,
}: Props) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-2xl">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-300">
            Herramientas del Draft
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Consola de control
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Usa estas opciones para preparar, reiniciar o cargar equipos antes
            de iniciar el Draft oficial.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={onLoadDemoTeams}
            disabled={loading}
            className="rounded-2xl border border-lime-300/40 bg-lime-300 px-4 py-3 text-sm font-black text-black shadow-lg shadow-lime-300/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🟢 Cargar Demo
          </button>

          <button
            onClick={onResetDraft}
            disabled={loading || !onResetDraft}
            className="rounded-2xl border border-yellow-300/40 bg-yellow-300/15 px-4 py-3 text-sm font-black text-yellow-100 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            🔄 Reiniciar
          </button>

          <button
            onClick={onLoadRealTeams}
            disabled={loading || !onLoadRealTeams}
            className="rounded-2xl border border-cyan-300/40 bg-cyan-300/15 px-4 py-3 text-sm font-black text-cyan-100 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            🏆 Clasificados
          </button>
        </div>
      </div>
    </section>
  );
}