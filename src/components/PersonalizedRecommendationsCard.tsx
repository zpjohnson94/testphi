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
      className="relative overflow-hidden rounded-2xl p-6 min-h-[260px]"
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

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-8 gap-4">
        <div
          className="flex items-center justify-center rounded-full size-12"
          style={{
            background: "rgba(0,0,0,0.35)",
            border: `1.5px solid ${tierColor}`,
          }}
        >
          <Lock className="size-5" style={{ color: "var(--volt)" }} />
        </div>
        <div className="space-y-1.5">
          <div className="display text-xl" style={{ color: "var(--lavender)" }}>
            Personalized recommendations
          </div>
          <p
            className="text-sm font-medium leading-relaxed max-w-[18rem]"
            style={{ color: "rgba(246,240,250,0.7)" }}
          >
            See exactly what to study next based on your mastery data
          </p>
        </div>
        <button onClick={onUnlock} className="btn-volt px-5 py-2.5 text-sm font-bold rounded-2xl">
          Unlock with Power Up
        </button>
      </div>
    </div>
  );
}
