// TestPhi logo — neon violet disc with a chunky volt Phi (Φ).

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
      <circle cx="24" cy="24" r="23" fill="var(--neon)" />
      <ellipse
        cx="24"
        cy="24"
        rx="9"
        ry="10.5"
        fill="none"
        stroke="var(--volt)"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <rect x="21.75" y="6.5" width="4.5" height="35" rx="2" fill="var(--volt)" />
    </svg>
  );
}
