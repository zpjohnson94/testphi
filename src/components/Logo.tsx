// ZenTest logo — volt tile with a dark arc cradling a stylized chunky "Z".
// The Z is italicized forward and its diagonal flares wider toward the top,
// giving the mark an upward-momentum / arrow feel.

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
      aria-label="ZenTest logo"
    >
      {/* Rounded volt tile background */}
      <rect x="0" y="0" width="48" height="48" rx="11" fill="var(--volt)" />

      {/* Dark arc — opens at the bottom, cradling the Z */}
      <path
        d="M 8 28 A 16 16 0 0 1 40 28"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* Stylized Z — italic, with a wedge-shaped diagonal that flares
          wider toward the top so it reads as upward momentum.
          Single filled shape, drawn clockwise:
            top bar (left → right) → outer right edge of diagonal →
            bottom bar (right → left) → inner left edge of diagonal back up. */}
      <path
        d="
          M 17 16
          L 33 16
          L 33 21
          L 27 32
          L 33 32
          L 33 37
          L 15 37
          L 15 32
          L 21 21
          L 17 21
          Z
        "
        fill="var(--ink)"
      />
    </svg>
  );
}
