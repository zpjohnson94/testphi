// ZenTest logo — a chunky "Z" whose diagonal doubles as an upward arrow.
// The Z's diagonal runs from bottom-left to top-right; an arrowhead caps
// the top-right corner so the mark reads as both "Z" and "↗".

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-label="ZenTest logo"
    >
      <rect x="0" y="0" width="40" height="40" rx="10" fill="var(--volt)" />

      <g
        fill="none"
        stroke="var(--ink)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Bottom bar → diagonal up to top-right → top bar back to left.
            Drawing the Z "in reverse" so the diagonal arrives at the top-right,
            where the arrowhead lives. */}
        <path d="M10 30 L29 30 L11 11 L28 11" />
        {/* Arrowhead at the top of the diagonal — tip points up & right */}
        <path d="M21 7 L29 7 L29 15" />
      </g>
    </svg>
  );
}
