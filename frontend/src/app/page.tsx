export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-white">
          CINE<span className="text-primary">VERSE</span>
        </h1>
        <p className="text-lg text-gray-400">
          Unified media discovery across movies, television series, anime, and documentaries.
        </p>
        <div className="pt-4 flex items-center justify-center gap-4">
          <div className="rounded-full bg-surface-elevated px-4 py-2 text-sm border border-surface-border text-gray-300">
            Phase 1: Foundation Active
          </div>
        </div>
      </div>
    </main>
  );
}

