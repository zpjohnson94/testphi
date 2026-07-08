// Chartreuse "mastery ready to unlock" card. Continuous subtle vibration
// plus an animated lightning texture flowing across the surface.
import { Sparkles } from "lucide-react";

interface Props {
  domainName: string;
  onOpen: () => void;
  compact?: boolean;
}

export function UnlockReadyCard({ domainName, onOpen, compact = false }: Props) {
  return (
    <button
      onClick={onOpen}
      className="unlock-vibrate relative w-full overflow-hidden text-left rounded-2xl"
      style={{
        background: "var(--volt)",
        color: "var(--ink)",
        border: "2px solid #6e9c00",
        boxShadow: "0 0 40px -6px rgba(184,255,0,0.6), 0 6px 0 0 #6e9c00",
        padding: compact ? "14px 16px" : "18px 20px",
        animation: "unlock-vibrate 110ms linear infinite",
      }}
    >
      {/* Electric texture overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 300 100"
        style={{ mixBlendMode: "overlay", opacity: 0.7 }}
        aria-hidden
      >
        <defs>
          <filter id="glow-bolt">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polyline
          points="0,20 40,30 70,10 110,35 150,15 200,40 240,20 300,32"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 8"
          filter="url(#glow-bolt)"
          style={{ animation: "electric-flow 1.4s linear infinite" }}
        />
        <polyline
          points="0,75 45,60 80,85 130,65 180,90 220,70 270,88 300,72"
          fill="none"
          stroke="#1D2900"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 10"
          strokeOpacity="0.55"
          style={{ animation: "electric-flow 1.9s linear infinite reverse" }}
        />
      </svg>

      <div className="relative flex items-center gap-3">
        <div
          className="shrink-0 size-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(29,41,0,0.15)", border: "1.5px solid rgba(29,41,0,0.35)" }}
        >
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
            Mastery ready
          </div>
          <div className="display text-base sm:text-lg leading-tight">
            {domainName} mastery score ready to unlock
          </div>
        </div>
        <div className="shrink-0 text-sm font-extrabold">→</div>
      </div>
    </button>
  );
}
