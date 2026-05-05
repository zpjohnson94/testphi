// TestPhi logo — energetic stylized Phi (Φ) with volt bolt accent.

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="TestPhi logo"
    >
      <defs>
        <linearGradient id="phi-disc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C77DFF" />
          <stop offset="55%" stopColor="var(--neon)" />
          <stop offset="100%" stopColor="var(--violet-deep)" />
        </linearGradient>
        <linearGradient id="phi-stroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8FF8A" />
          <stop offset="100%" stopColor="var(--volt)" />
        </linearGradient>
      </defs>

      {/* Disc with subtle inner ring */}
      <circle cx="32" cy="32" r="30" fill="url(#phi-disc)" />
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />

      {/* Phi oval */}
      <ellipse
        cx="32"
        cy="33"
        rx="11"
        ry="13"
        fill="none"
        stroke="url(#phi-stroke)"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Phi vertical stem, slightly tilted for energy */}
      <rect
        x="29.25"
        y="6"
        width="5.5"
        height="52"
        rx="2.75"
        fill="url(#phi-stroke)"
        transform="rotate(-6 32 32)"
      />

      {/* Spark accent — tiny lightning notch at the top of the stem */}
      <path
        d="M36 8 L31 16 L34 16 L30 23"
        fill="none"
        stroke="var(--spark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
