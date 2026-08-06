import { Lock } from "lucide-react";

interface Props {
  tierColor: string;
  onUnlock: () => void;
}

/**
 * Always-locked teaser. The blurred rows are static placeholder copy — no
 * per-user data is fetched or rendered here.
 */
export function PersonalizedRecommendationsCard({ tierColor, onUnlock }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: "var(--violet-deep)",
        border: `1.5px solid ${tierColor}`,
      }}
    >
      <div className="space-y-3" style={{ filter: "blur(6px)" }} aria-hidden>
        <div
          className="rounded-xl p-3 text-sm font-bold"
          style={{ background: "rgba(0,0,0,0.3)", color: "var(--lavender)" }}
        >
          Focus on: multi-step equations
        </div>
        <div
          className="rounded-xl p-3 text-sm font-bold"
          style={{ background: "rgba(0,0,0,0.3)", color: "var(--lavender)" }}
        >
          Try: 10 more Hard difficulty questions
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 gap-2">
        <Lock className="size-6" style={{ color: "var(--volt)" }} />
        <div className="display text-xl" style={{ color: "var(--lavender)" }}>
          Personalized recommendations
        </div>
        <p className="text-xs font-medium" style={{ color: "rgba(246,240,250,0.7)" }}>
          See exactly what to study next based on your mastery data
        </p>
        <button
          onClick={onUnlock}
          className="btn-volt mt-1 px-4 py-2.5 text-sm rounded-2xl"
        >
          Unlock with Power Up
        </button>
      </div>
    </div>
  );
}
