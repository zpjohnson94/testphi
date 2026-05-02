// TestPhi logo — volt tile with a chunky Greek capital Phi (Φ).
// The Phi reads as a "test score" gauge: a vertical stem through an oval,
// quietly nodding to the golden-ratio symbol.

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-label="TestPhi logo"
    >
      {/* Rounded volt tile background */}
      <rect x="0" y="0" width="48" height="48" rx="11" fill="var(--volt)" />

      {/* Phi oval — thick ring, slightly taller than wide */}
      <ellipse
        cx="24"
        cy="24"
        rx="10"
        ry="8"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="4"
      />

      {/* Vertical stem extending above and below the oval */}
      <rect x="22" y="7" width="4" height="34" rx="1.6" fill="var(--ink)" />
    </svg>
  );
}
