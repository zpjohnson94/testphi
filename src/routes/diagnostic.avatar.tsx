import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ANIMAL_OPTIONS, COLOR_OPTIONS, defaultDiag, loadDiag, saveDiag } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/diagnostic/avatar")({
  head: () => ({ meta: [{ title: "Choose your character — TestPhi" }] }),
  component: DiagAvatar,
});

function DiagAvatar() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"avatar" | "name">("avatar");
  const [emoji, setEmoji] = useState("🐸");
  const [color, setColor] = useState("#B8FF00");
  const [name, setName] = useState("");

  useEffect(() => {
    const s = loadDiag();
    if (s.emoji) setEmoji(s.emoji);
    if (s.color) setColor(s.color);
    if (s.name) setName(s.name);
  }, []);

  const start = () => {
    if (!name.trim()) return;
    const s = { ...defaultDiag(), name: name.trim(), emoji, color, startedAt: Date.now(), answers: [] };
    saveDiag(s);
    navigate({ to: "/diagnostic/question/$n" as any, params: { n: "1" } as any });
  };

  return (
    <div className="topo-bg topo-violet min-h-screen relative">
      <header className="absolute top-0 inset-x-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="display text-base text-[var(--lavender)]">TestPhi</span>
          </Link>
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="rounded-3xl p-6 sm:p-8 animate-pop" style={{ background: "var(--lavender)", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)" }}>
            {step === "avatar" && (
              <>
                <h2 className="display text-2xl" style={{ color: "var(--ink)" }}>Pick your fighter</h2>
                <p className="mt-1 text-sm" style={{ color: "#5a4a72" }}>You can change this later.</p>

                <div className="mt-4 flex justify-center">
                  <div
                    className="size-24 rounded-full flex items-center justify-center text-5xl"
                    style={{ background: color, border: "3px solid var(--ink)" }}
                  >
                    {emoji}
                  </div>
                </div>

                <div className="mt-5 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Animal</div>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {ANIMAL_OPTIONS.map((a) => {
                    const active = emoji === a.emoji;
                    return (
                      <button
                        key={a.id}
                        onClick={() => { setEmoji(a.emoji); sfx.tap(); }}
                        className="aspect-square rounded-2xl flex items-center justify-center text-2xl transition-transform hover:scale-110"
                        style={{
                          background: active ? "var(--violet-deep)" : "rgba(74, 6, 136, 0.08)",
                          border: active ? "2px solid var(--neon)" : "2px solid transparent",
                        }}
                      >
                        {a.emoji}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Color</div>
                <div className="mt-2 grid grid-cols-10 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); sfx.tap(); }}
                      className="aspect-square rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        border: color === c ? "3px solid var(--ink)" : "2px solid rgba(0,0,0,0.15)",
                        boxShadow: color === c ? "0 0 0 2px var(--neon)" : "none",
                      }}
                    />
                  ))}
                </div>

                <button onClick={() => setStep("name")} className="btn-volt w-full mt-6 py-4">Continue →</button>
              </>
            )}

            {step === "name" && (
              <>
                <h2 className="display text-2xl" style={{ color: "var(--ink)" }}>What's your name?</h2>
                <p className="mt-1 text-sm" style={{ color: "#5a4a72" }}>So we can personalize your results.</p>

                <div className="mt-4 flex justify-center">
                  <div
                    className="size-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: color, border: "3px solid var(--ink)" }}
                  >
                    {emoji}
                  </div>
                </div>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  maxLength={24}
                  autoFocus
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-semibold text-[var(--ink)] focus:outline-none focus:ring-2"
                  style={{ border: "2px solid #d6cce0" }}
                  onKeyDown={(e) => { if (e.key === "Enter") start(); }}
                />

                <button
                  onClick={start}
                  disabled={!name.trim()}
                  className="btn-volt w-full mt-6 py-4"
                  style={{ opacity: name.trim() ? 1 : 0.4, cursor: name.trim() ? "pointer" : "not-allowed" }}
                >
                  Start diagnostic →
                </button>
                <button onClick={() => setStep("avatar")} className="w-full mt-2 py-2 text-xs font-bold" style={{ color: "#5a4a72" }}>
                  ← Back
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
