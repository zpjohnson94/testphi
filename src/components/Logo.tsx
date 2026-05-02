// ZenTest logo — a chunky "Z" whose diagonal doubles as an upward arrow.
// The top bar feeds into a thick diagonal that pierces up & right into an
// arrowhead, then the bottom bar grounds it. Reads as both "Z" and "↗".

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
      {/* Rounded square background tile */}
      <rect x="0" y="0" width="40" height="40" rx="10" fill="var(--volt)" />

      {/* The Z / up-arrow mark — single continuous stroke */}
      <g
        fill="none"
        stroke="var(--ink)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* top bar → diagonal up-right → arrowhead, then bottom bar */}
        <path d="M10 11 L26 11 L11 30 L30 30" />
        {/* arrowhead at the top of the diagonal (tip up & right) */}
        <path d="M20 6 L29 6 L29 15" />
      </g>
    </svg>
  );
}
