import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ANIMAL_OPTIONS, COLOR_OPTIONS, defaultDiag, loadDiag, saveDiag } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/diagnostic/avatar")({
  head: () => ({ meta: [{ title: "Choose your character — TestPhi" }] }),
  component: DiagAvatar,
});

function DiagAvatar() {
  const navigate = useNavigate();
  const [emoji, setEmoji] = useState("🐸");
  const [color, setColor] = useState("#B8FF00");
  const [name, setName] = useState("");

  useEffect(() => {
    const s = loadDiag();
    if (s.emoji) setEmoji(s.emoji);
    if (s.color) setColor(s.color);
    if (s.name) setName(s.name);
  }, []);

  const canStart = name.trim().length > 0 && emoji && color;

  const start = () => {
    if (!canStart) return;
    const s = { ...defaultDiag(), name: name.trim(), emoji, color, startedAt: Date.now(), answers: [] };
    saveDiag(s);
    navigate({ to: "/diagnostic/question/$n" as any, params: { n: "1" } as any });
  };

  return (
    <div className="topo-bg min-h-screen relative">
      <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="display text-base text-[var(--lavender)]">TestPhi</span>
          </Link>
          {/* Floating preview */}
          <div className="flex items-center gap-2">
            <div
              className="size-10 rounded-full flex items-center justify-center text-2xl"
              style={{ background: color, border: "2px solid rgba(255,255,255,0.3)" }}
            >
              {emoji}
            </div>
            {name && <div className="text-sm font-bold text-[var(--lavender)]">{name}</div>}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[480px] px-5 pt-8 pb-16">
        <StepLabel>Step 1 of 2 — Choose your character</StepLabel>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {ANIMAL_OPTIONS.map((a) => {
            const active = emoji === a.emoji;
            return (
              <button
                key={a.id}
                onClick={() => setEmoji(a.emoji)}
                aria-pressed={active}
                className="aspect-square rounded-2xl flex items-center justify-center text-3xl transition-transform hover:scale-105"
                style={{
                  background: active ? "rgba(184,255,0,0.15)" : "rgba(246,240,250,0.05)",
                  border: active ? "2px solid var(--volt)" : "2px solid transparent",
                }}
              >
                {a.emoji}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
          Pick a color
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => {
            const active = color === c;
            return (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className="rounded-full transition-transform hover:scale-110"
                style={{
                  width: 26, height: 26, background: c,
                  boxShadow: active ? "0 0 0 2px var(--ink), 0 0 0 4px #fff" : "0 0 0 1px rgba(255,255,255,0.2)",
                }}
              />
            );
          })}
        </div>

        <div className="mt-8">
          <StepLabel>Step 2 of 2 — What's your name?</StepLabel>
          <div
            className="mt-3 rounded-2xl p-1"
            style={{ background: "rgba(246,240,250,0.05)", border: "1.5px solid rgba(246,240,250,0.12)" }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your first name"
              maxLength={24}
              className="w-full bg-transparent outline-none px-4 py-3 text-[var(--lavender)] placeholder:text-[rgba(246,240,250,0.35)] font-semibold"
              onFocus={(e) => e.currentTarget.parentElement!.style.borderColor = "var(--volt)"}
              onBlur={(e) => e.currentTarget.parentElement!.style.borderColor = "rgba(246,240,250,0.12)"}
            />
          </div>
        </div>

        <button
          onClick={start}
          disabled={!canStart}
          className="btn-volt w-full mt-8 py-5 text-lg rounded-2xl"
          style={{ opacity: canStart ? 1 : 0.4, cursor: canStart ? "pointer" : "not-allowed" }}
        >
          Start diagnostic →
        </button>
      </main>
    </div>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(246,240,250,0.6)" }}>
      {children}
    </div>
  );
}
