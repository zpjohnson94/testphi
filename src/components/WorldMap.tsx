import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Check, Star, Crown } from "lucide-react";
import { type World } from "@/lib/content";
import { useStore } from "@/lib/store";
import { sectionEloToSAT } from "@/lib/elo";
import { Avatar } from "@/components/Avatar";

export function WorldMap({ world }: { world: World }) {
  const navigate = useNavigate();
  const progress = useStore((s) => s.progress);
  const elo = useStore((s) => (world.section === "rw" ? s.rwElo : s.mathElo));
  const avatar = useStore((s) => s.avatar);

  const accent = world.section === "rw" ? "var(--volt)" : "var(--neon)";

  let firstIncomplete = world.nodes.findIndex((n) => (progress[n.id]?.best ?? 0) < 3);
  if (firstIncomplete === -1) firstIncomplete = world.nodes.length;

  return (
    <div className="topo-bg topo-dim min-h-screen pb-24">
      <header className="sticky top-0 z-20 backdrop-blur" style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.1)" }}>
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-5 py-4">
          <Link to={"/dashboard" as any} className="size-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(246,240,250,0.08)", color: "var(--lavender)" }}>
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
              {world.section === "rw" ? "Reading & Writing" : "Math"}
            </div>
            <div className="display text-lg text-[var(--lavender)]">{world.name}</div>
          </div>
          <div className="score-pill text-base">{sectionEloToSAT(elo)}</div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 pt-8 pb-6 relative">
        <div className="relative space-y-12">
          {world.nodes.map((n, i) => {
            const p = progress[n.id];
            const completed = (p?.best ?? 0) >= 3;
            const partial = p && p.best > 0 && p.best < 3;
            const locked = i > firstIncomplete;
            const isCurrent = i === firstIncomplete;
            const offset = pathOffset(i);

            return (
              <div key={n.id} className="flex justify-center">
                <div className="relative" style={{ transform: `translateX(${offset}px)` }}>
                  {isCurrent && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2">
                      <Avatar config={avatar} size={64} animate />
                    </div>
                  )}
                  <button
                    disabled={locked}
                    onClick={() => navigate({ to: "/lesson/$nodeId" as any, params: { nodeId: n.id } as any })}
                    className="relative size-20 rounded-full font-extrabold transition-all hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: locked ? "rgba(246,240,250,0.08)" : completed ? "var(--volt)" : "var(--lavender)",
                      color: locked ? "rgba(246,240,250,0.4)" : "var(--ink)",
                      border: `3px solid ${locked ? "rgba(246,240,250,0.15)" : accent}`,
                      boxShadow: locked ? "none" : "0 6px 0 0 rgba(0,0,0,0.5)",
                    }}
                  >
                    {locked ? <Lock className="size-7 mx-auto" /> :
                      completed ? <Check className="size-8 mx-auto" /> :
                      <span className="display text-3xl">{i + 1}</span>}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none" />
                    )}
                    {partial && !completed && (
                      <Star className="absolute -top-1 -right-1 size-5 fill-current" style={{ color: "var(--spark)" }} />
                    )}
                  </button>
                  <div className="mt-2 text-center text-xs font-bold max-w-[140px] mx-auto" style={{ color: "var(--lavender)" }}>
                    {n.title}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center pt-6">
            <button
              disabled={firstIncomplete < world.nodes.length}
              onClick={() => navigate({ to: "/lesson/$nodeId" as any, params: { nodeId: world.bossId } as any })}
              className="relative size-28 rounded-3xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: firstIncomplete < world.nodes.length ? "rgba(246,240,250,0.08)" : "var(--gradient-spark)",
                color: "var(--ink)",
                border: `3px solid ${firstIncomplete < world.nodes.length ? "rgba(246,240,250,0.15)" : "var(--spark)"}`,
                boxShadow: firstIncomplete < world.nodes.length ? "none" : "0 8px 0 0 rgba(0,0,0,0.5)",
              }}
            >
              <Crown className="size-10 mx-auto" />
              <div className="display text-xs mt-1">{world.bossTitle}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function pathOffset(i: number): number {
  const pattern = [0, 70, 30, -50, -80, 0, 60, -60];
  return pattern[i % pattern.length];
}
