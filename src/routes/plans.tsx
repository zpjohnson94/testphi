import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Choose your plan — TestPhi" },
      { name: "description", content: "Pick Free or Pro and start improving your SAT score today." },
    ],
  }),
  component: Plans,
});

function Plans() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div className="topo-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(29,41,0,0.85)", borderBottom: "1px solid rgba(246,240,250,0.08)" }}>
        <div className="mx-auto max-w-5xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="display text-base text-[var(--lavender)]">TestPhi</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-12 pb-20">
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--volt)" }}>
            Power up to master your weak spots
          </div>
          <h1 className="mt-3 display text-4xl sm:text-5xl text-[var(--lavender)]">Choose your plan</h1>

          {/* Toggle */}
          <div className="mt-6 inline-flex rounded-full p-1" style={{ background: "rgba(246,240,250,0.06)", border: "1px solid rgba(246,240,250,0.12)" }}>
            <ToggleBtn active={billing === "monthly"} onClick={() => setBilling("monthly")}>Monthly</ToggleBtn>
            <ToggleBtn active={billing === "annual"} onClick={() => setBilling("annual")}>
              Annual
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{ background: "var(--spark)", color: "var(--ink)" }}>Save 40%</span>
            </ToggleBtn>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-3xl p-6 sm:p-7"
            style={{ background: "rgba(246,240,250,0.04)", border: "1.5px solid rgba(246,240,250,0.15)" }}>
            <h3 className="display text-2xl text-[var(--lavender)]">Free</h3>
            <div className="mt-2 score-num text-3xl text-[var(--lavender)]">$0 <span className="text-base font-semibold opacity-60">/ forever</span></div>
            <ul className="mt-5 space-y-2.5">
              <Feat>1 diagnostic test per day</Feat>
              <Feat>Predicted score tracking</Feat>
              <Feat>Score improvement graph</Feat>
            </ul>
            <Link to={"/dashboard" as any}
              className="block text-center mt-6 py-3.5 text-base font-bold rounded-2xl"
              style={{ border: "1.5px solid rgba(246,240,250,0.25)", color: "var(--lavender)" }}>
              Continue with Free
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-3xl p-6 sm:p-7 relative"
            style={{ background: "var(--violet-deep)", border: "2px solid var(--volt)", boxShadow: "0 0 60px -10px rgba(184,255,0,0.5)" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "var(--volt)", color: "var(--ink)" }}>
              Recommended
            </div>
            <h3 className="display text-2xl text-[var(--lavender)]">Power Up</h3>
            <div className="mt-2">
              {billing === "monthly" ? (
                <div className="score-num text-3xl text-[var(--lavender)]">$30 <span className="text-base font-semibold opacity-70">/ mo</span></div>
              ) : (
                <>
                  <div className="score-num text-3xl text-[var(--lavender)]">$12 <span className="text-base font-semibold opacity-70">/ mo</span></div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: "rgba(246,240,250,0.6)" }}>billed annually</div>
                </>
              )}
            </div>
            <ul className="mt-5 space-y-2.5">
              <Feat pro>Everything in Free</Feat>
              <Feat pro>Weak spot detection</Feat>
              <Feat pro>Adaptive training targeting weak spots</Feat>
              <Feat pro>Unlimited practice questions</Feat>
              <Feat pro>Specific training across all 8 SAT domains</Feat>
              <Feat pro>Detailed answer explanations</Feat>
            </ul>
            <Link to={"/dashboard" as any}
              className="btn-volt block text-center mt-6 py-3.5 text-base rounded-2xl">
              Get Power Up →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="px-5 py-2 rounded-full text-sm font-bold transition-colors inline-flex items-center"
      style={{ background: active ? "var(--volt)" : "transparent", color: active ? "var(--ink)" : "var(--lavender)" }}>
      {children}
    </button>
  );
}

function Feat({ children, pro }: { children: React.ReactNode; pro?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm font-medium" style={{ color: pro ? "var(--lavender)" : "rgba(246,240,250,0.85)" }}>
      <Check className="size-4 mt-0.5 shrink-0" style={{ color: pro ? "var(--volt)" : "var(--volt)" }} />
      <span>{children}</span>
    </li>
  );
}
