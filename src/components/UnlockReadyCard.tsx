// Chartreuse "mastery ready to unlock" card. Gentle pulse + erratic
// electric flickers across the surface. Lightning bolt mark on the left.

interface Props {
  domainName: string;
  onOpen: () => void;
  compact?: boolean;
}

// Lightning bolt mark inspired by the site logo (bolt inside a broken ring).
export function BoltMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden fill="none">
      {/* broken ring */}
      <path
        d="M20 8 A26 26 0 0 0 20 56"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M44 8 A26 26 0 0 1 44 56"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* bolt */}
      <path d="M36 4 L18 34 L30 34 L26 60 L46 28 L34 28 L38 4 Z" fill="currentColor" />
    </svg>
  );
}

export function UnlockReadyCard({ domainName, onOpen, compact = false }: Props) {
  return (
    <button
      onClick={onOpen}
      className="unlock-pulse relative w-full overflow-hidden text-left rounded-2xl"
      style={{
        background: "var(--volt)",
        color: "var(--ink)",
        border: "2px solid #6e9c00",
        boxShadow: "0 0 40px -6px rgba(184,255,0,0.6), 0 6px 0 0 #6e9c00",
        padding: compact ? "14px 16px" : "18px 20px",
      }}
    >
      {/* Erratic electric flicker overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 300 100"
        aria-hidden
      >
        <defs>
          <filter id="glow-bolt">
            <feGaussianBlur stdDeviation="0.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          stroke="#FFE600"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#glow-bolt)"
        >
          <polyline
            points="10,18 24,10 32,22 46,14 58,26"
            style={{
              animation: "electric-flicker 0.9s steps(1,end) infinite",
              animationDelay: "0s",
            }}
          />
          <polyline
            points="80,72 92,60 102,78 118,66 130,82"
            style={{
              animation: "electric-flicker 1.1s steps(1,end) infinite",
              animationDelay: "0.15s",
            }}
          />
          <polyline
            points="150,20 162,32 176,14 188,30 204,18"
            style={{
              animation: "electric-flicker 0.7s steps(1,end) infinite",
              animationDelay: "0.3s",
            }}
          />
          <polyline
            points="210,78 224,64 238,84 252,68 268,82"
            style={{
              animation: "electric-flicker 1.3s steps(1,end) infinite",
              animationDelay: "0.45s",
            }}
          />
          <polyline
            points="260,20 274,10 286,26 298,14"
            style={{
              animation: "electric-flicker 0.85s steps(1,end) infinite",
              animationDelay: "0.6s",
            }}
          />
          <polyline
            points="40,50 56,42 70,58 88,46"
            style={{
              animation: "electric-flicker 1.05s steps(1,end) infinite",
              animationDelay: "0.2s",
            }}
          />
          <polyline
            points="180,54 196,46 210,60 224,48"
            style={{
              animation: "electric-flicker 0.95s steps(1,end) infinite",
              animationDelay: "0.5s",
            }}
          />
        </g>
      </svg>

      <div className="relative flex items-center gap-3">
        <div
          className="shrink-0 size-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(29,41,0,0.15)",
            border: "1.5px solid rgba(29,41,0,0.35)",
            color: "var(--ink)",
          }}
        >
          <BoltMark size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="display text-base sm:text-lg leading-tight">
            Mastery score ready to unlock!
          </div>
          <div className="text-sm font-bold opacity-80 leading-tight mt-0.5 truncate">
            {domainName}
          </div>
        </div>
        <div className="shrink-0 text-sm font-extrabold">→</div>
      </div>
    </button>
  );
}
