import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Check, Star, Crown } from "lucide-react";
import { type World } from "@/lib/content";
import { useStore } from "@/lib/store";
import { sectionEloToSAT } from "@/lib/elo";

export function WorldMap({ world }: { world: World }) {
  const navigate = useNavigate();
  const progress = useStore((s) => s.progress);
  const elo = useStore((s) => (world.section === "rw" ? s.rwElo : s.mathElo));
  const avatar = useStore((s) => s.avatar);

  const gradient = world.section === "rw" ? "var(--gradient-rw)" : "var(--gradient-math)";
  const softBg = world.section === "rw" ? "var(--world-rw-soft)" : "var(--world-math-soft)";

  // Compute first incomplete index (where character sits / where unlock is)
  let firstIncomplete = world.nodes.findIndex((n) => (progress[n.id]?.best ?? 0) < 3);
  if (firstIncomplete === -1) firstIncomplete = world.nodes.length; // boss

  return (
    <div className="min-h-screen pb-24" style={{ background: softBg }}>
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur" style={{ background: "color-mix(in oklab, var(--background) 80%, transparent)" }}>
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-5 py-4">
          <Link to={"/dashboard" as any} className="size-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {world.section === "rw" ? "Reading & Writing" : "Math"}
            </div>
            <div className="text-lg font-extrabold leading-tight">{world.emoji} {world.name}</div>
          </div>
          <div className="rounded-2xl px-3 py-1.5 text-primary-foreground text-center" style={{ background: gradient }}>
            <div className="text-[10px] font-bold uppercase opacity-90">SAT</div>
            <div className="font-extrabold tabular-nums leading-none">{sectionEloToSAT(elo)}</div>
          </div>
        </div>
      </header>

      {/* Path */}
      <div className="mx-auto max-w-md px-5 pt-8 pb-6 relative">
        {/* Decorative path line */}
        <PathBackground gradient={gradient} count={world.nodes.length + 1} />

        <div className="relative space-y-10">
          {world.nodes.map((n, i) => {
            const p = progress[n.id];
            const completed = (p?.best ?? 0) >= 3;
            const partial = p && p.best > 0 && p.best < 3;
            const locked = i > firstIncomplete;
            const isCurrent = i === firstIncomplete;
            const offset = pathOffset(i);

            return (
              <div key={n.id} className="flex items-center" style={{ justifyContent: offset.justify }}>
                <div className="relative" style={{ transform: `translateX(${offset.x}px)` }}>
                  {isCurrent && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-3xl animate-bounce-soft">
                      {avatar}
                    </div>
                  )}
                  <button
                    disabled={locked}
                    onClick={() => navigate({ to: "/lesson/$nodeId" as any, params: { nodeId: n.id } as any })}
                    className="relative size-20 rounded-full font-extrabold text-primary-foreground transition-all hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: locked ? "var(--muted)" : completed ? "var(--gradient-xp)" : gradient,
                      color: locked ? "var(--muted-foreground)" : "white",
                      boxShadow: locked ? "none" : "var(--shadow-node)",
                    }}
                  >
                    {locked ? <Lock className="size-7 mx-auto" /> :
                      completed ? <Check className="size-8 mx-auto" /> :
                      <span className="text-2xl">{i + 1}</span>}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none" />
                    )}
                    {partial && !completed && (
                      <Star className="absolute -top-1 -right-1 size-5 fill-current" style={{ color: "var(--xp)" }} />
                    )}
                  </button>
                  <div className="mt-2 text-center text-xs font-bold max-w-[120px]">
                    {n.title}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Boss node */}
          <div className="flex justify-center pt-4">
            <button
              disabled={firstIncomplete < world.nodes.length}
              onClick={() => navigate({ to: "/lesson/$nodeId" as any, params: { nodeId: world.bossId } as any })}
              className="relative size-28 rounded-3xl font-extrabold text-primary-foreground transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: firstIncomplete < world.nodes.length ? "var(--muted)" : "var(--gradient-primary)",
                boxShadow: firstIncomplete < world.nodes.length ? "none" : "var(--shadow-node)",
              }}
            >
              <Crown className="size-10 mx-auto" />
              <div className="text-xs mt-1">{world.bossTitle}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function pathOffset(i: number): { justify: string; x: number } {
  // Snake left/center/right pattern
  const pattern = [0, 70, 0, -70, 0, 60, -60][i % 7];
  return { justify: "center", x: pattern };
}

function PathBackground({ gradient, count }: { gradient: string; count: number }) {
  // Simple decorative dots between nodes
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center pointer-events-none">
      {Array.from({ length: count - 1 }).map((_, i) => (
        <div key={i} className="flex-1 w-1.5 my-2 rounded-full opacity-30" style={{ background: gradient }} />
      ))}
    </div>
  );
}
