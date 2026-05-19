import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Avatar, defaultAvatar } from "@/components/Avatar";
import { AVATAR_IMAGES } from "@/components/DiagAvatar";
import { Logo } from "@/components/Logo";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/diagnostic/")({
  head: () => ({
    meta: [
      { title: "Predict your SAT score in 10 minutes — TestPhi" },
      { name: "description", content: "15 adaptive questions. Real-time score prediction. No account needed to start." },
    ],
  }),
  component: DiagnosticStart,
});

function DiagnosticStart() {
  useEffect(() => {
    // Warm the HTTP cache so the avatar picker renders instantly.
    Object.values(AVATAR_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
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
            <div className="flex justify-center">
              <Avatar config={defaultAvatar()} size={120} animate />
            </div>
            <h1 className="mt-4 display text-3xl sm:text-4xl text-center" style={{ color: "var(--ink)" }}>
              Welcome to <span style={{ color: "var(--neon)" }}>TestPhi</span>
            </h1>
            <p className="mt-2 text-center text-sm font-medium" style={{ color: "#5a4a72" }}>
              A 10-minute diagnostic and you'll have your predicted SAT score. No account needed to start.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold" style={{ color: "#5a4a72" }}>
              {["~10 minutes", "15 questions", "Instant results"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ background: "var(--neon)" }} />
                  {t}
                </span>
              ))}
            </div>

            <Link
              to={"/diagnostic/avatar" as any}
              onClick={() => trackEvent("diagnostic_start")}
              className="btn-volt w-full mt-6 py-4 text-base rounded-2xl inline-flex items-center justify-center"
              style={{ boxShadow: "0 8px 0 0 #6e9c00, 0 0 50px -8px rgba(184,255,0,0.55)" }}
            >
              Let's go →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
