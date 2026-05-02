import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { defaultDiag, loadDiag, saveDiag } from "@/lib/diagnostic";
import { Logo } from "@/components/Logo";
import { sfx } from "@/lib/sfx";
import { AVATAR_OPTIONS, AVATAR_IMAGES, DiagAvatar, type AvatarId } from "@/components/DiagAvatar";

export const Route = createFileRoute("/diagnostic/avatar")({
  head: () => ({ meta: [{ title: "Choose your character — TestPhi" }] }),
  component: DiagAvatarPage,
});

const COLORS = [
  "#B8FF00", "#A855F7", "#FFE600", "#FF6FB5", "#5BE1FF",
  "#FF8A3D", "#7CF6B0", "#FF4D6D", "#9DAEFF", "#F6F0FA",
];

function DiagAvatarPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"avatar" | "name">("avatar");
  const [avatarId, setAvatarId] = useState<AvatarId>("fox");
  const [color, setColor] = useState("#B8FF00");
  const [name, setName] = useState("");

  useEffect(() => {
    const s = loadDiag();
    if (s.avatarId && s.avatarId in AVATAR_IMAGES) setAvatarId(s.avatarId as AvatarId);
    if (s.color) setColor(s.color);
    if (s.name) setName(s.name);
  }, []);

  const start = () => {
    if (!name.trim()) return;
    const s = {
      ...defaultDiag(),
      name: name.trim(),
      avatarId,
      emoji: "",
      color,
      startedAt: Date.now(),
      answers: [],
    };
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
          <div className="rounded-3xl p-6 sm:p-8 animate-pop"
            style={{ background: "var(--lavender)", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)" }}>
            {step === "avatar" && (
              <>
                <h2 className="display text-2xl" style={{ color: "var(--ink)" }}>Pick your fighter</h2>
                <p className="mt-1 text-sm" style={{ color: "#5a4a72" }}>You can change this later.</p>

                <div className="mt-5 flex justify-center">
                  <DiagAvatar id={avatarId} color={color} size={128} />
                </div>

                <div className="mt-6 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Avatar</div>
                <div className="mt-2 grid grid-cols-4 gap-2.5">
                  {AVATAR_OPTIONS.map((a) => {
                    const active = avatarId === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => { setAvatarId(a.id); sfx.tap(); }}
                        className="aspect-square rounded-2xl flex items-center justify-center transition-transform hover:scale-105 p-1.5"
                        style={{
                          background: active ? "var(--violet-deep)" : "rgba(74, 6, 136, 0.06)",
                          border: active ? "2px solid var(--neon)" : "2px solid transparent",
                        }}
                        aria-label={a.name}
                      >
                        <img
                          src={AVATAR_IMAGES[a.id]}
                          alt={a.name}
                          className="w-full h-full object-contain rounded-full"
                          draggable={false}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 text-xs font-bold uppercase tracking-widest" style={{ color: "#5a4a72" }}>Color</div>
                <div className="mt-2 grid grid-cols-10 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); sfx.tap(); }}
                      aria-label={`Color ${c}`}
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
                  <DiagAvatar id={avatarId} color={color} size={104} />
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
