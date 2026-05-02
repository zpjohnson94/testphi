// Decorative isometric "puzzle map" — chess.com puzzle-map vibe
// reinterpreted in TestPhi's volt/violet/lavender palette. Pure decoration:
// a winding path of numbered tiles with stylized trees and a pond, set behind
// the hero so the page feels like the start of a learning journey.

interface PuzzleMapDecorProps {
  className?: string;
}

const VOLT = "var(--volt)";
const VOLT_DIM = "rgba(184,255,0,0.18)";
const NEON = "var(--neon)";
const VIOLET = "var(--violet-deep)";
const LAV = "var(--lavender)";
const INK = "var(--ink)";

// Isometric tile: rhombus top with two side faces for depth.
function Tile({
  x,
  y,
  label,
  done = false,
  current = false,
  size = 56,
}: {
  x: number;
  y: number;
  label?: string;
  done?: boolean;
  current?: boolean;
  size?: number;
}) {
  const w = size;
  const h = size * 0.55;
  const depth = size * 0.22;
  const top = done ? VOLT : current ? LAV : "rgba(246,240,250,0.92)";
  const side = done ? "#6e9c00" : "#8a7da0";
  const front = done ? "#557a00" : "#5d4f74";
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* right face */}
      <path d={`M ${w / 2} ${h / 2} L ${w} 0 L ${w} ${depth} L ${w / 2} ${h / 2 + depth} Z`} fill={side} />
      {/* left/front face */}
      <path d={`M 0 0 L ${w / 2} ${h / 2} L ${w / 2} ${h / 2 + depth} L 0 ${depth} Z`} fill={front} />
      {/* top */}
      <path
        d={`M ${w / 2} ${-h / 2} L ${w} 0 L ${w / 2} ${h / 2} L 0 0 Z`}
        fill={top}
        stroke={current ? VOLT : "rgba(0,0,0,0.25)"}
        strokeWidth={current ? 2 : 1}
      />
      {done ? (
        // Clean centered checkmark on completed tiles (no doubled label).
        <path
          d={`M ${w * 0.30} ${-h * 0.05} l ${w * 0.14} ${w * 0.12} l ${w * 0.30} -${w * 0.22}`}
          fill="none"
          stroke={INK}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        label && (
          <text
            x={w / 2}
            y={2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Exo 2, sans-serif"
            fontWeight={900}
            fontSize={size * 0.32}
            fill={INK}
          >
            {label}
          </text>
        )
      )}
    </g>
  );
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="38" rx="26" ry="6" fill="rgba(0,0,0,0.35)" />
      <rect x="-4" y="10" width="8" height="22" rx="2" fill="#3a2a18" />
      <ellipse cx="0" cy="0" rx="26" ry="22" fill={NEON} opacity="0.85" />
      <ellipse cx="-12" cy="-6" rx="14" ry="12" fill={NEON} />
      <ellipse cx="12" cy="-4" rx="14" ry="12" fill={NEON} opacity="0.9" />
      <circle cx="-8" cy="-2" r="2.4" fill={VOLT} />
      <circle cx="10" cy="6" r="2.4" fill={VOLT} />
      <circle cx="0" cy="-12" r="2.4" fill={VOLT} />
    </g>
  );
}

function Pond({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="6" rx="64" ry="10" fill="rgba(0,0,0,0.35)" />
      <ellipse cx="0" cy="0" rx="62" ry="22" fill={VIOLET} />
      <ellipse cx="0" cy="0" rx="62" ry="22" fill="none" stroke={NEON} strokeWidth="2" opacity="0.7" />
      <ellipse cx="-22" cy="-2" rx="10" ry="4" fill={VOLT} opacity="0.5" />
      <circle cx="-22" cy="-2" r="2" fill={VOLT} />
      <ellipse cx="18" cy="4" rx="9" ry="3.5" fill={VOLT} opacity="0.5" />
      <circle cx="18" cy="4" r="2" fill={VOLT} />
      {/* highlight */}
      <ellipse cx="-10" cy="-10" rx="22" ry="3" fill={LAV} opacity="0.18" />
    </g>
  );
}

// Cabin (the "you are here" anchor at the trail's end)
function Cabin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="34" rx="42" ry="6" fill="rgba(0,0,0,0.35)" />
      <rect x="-30" y="-4" width="60" height="34" rx="3" fill="#5b3a1f" />
      <path d="M -34 -4 L 0 -28 L 34 -4 Z" fill="#3a230f" />
      <path d="M -34 -4 L 0 -28 L 34 -4 Z" fill="none" stroke={INK} strokeWidth="1" />
      <rect x="-8" y="6" width="16" height="24" fill={VOLT} />
      <rect x="-8" y="6" width="16" height="24" fill="none" stroke={INK} strokeWidth="1.5" />
      <circle cx="5" cy="18" r="1.2" fill={INK} />
      {/* chimney puff */}
      <circle cx="20" cy="-30" r="4" fill={LAV} opacity="0.5" />
      <circle cx="24" cy="-38" r="5" fill={LAV} opacity="0.35" />
    </g>
  );
}

export function PuzzleMapDecor({ className = "" }: PuzzleMapDecorProps) {
  // Path of tiles winding diagonally — completed at bottom, current mid-trail,
  // future tiles fade upward into the distance.
  const tiles = [
    { x: 60, y: 560, done: true },
    { x: 150, y: 540, done: true },
    { x: 240, y: 520, done: true },
    { x: 330, y: 500, label: "9", current: true },
    { x: 420, y: 470, label: "10" },
    { x: 510, y: 430, label: "11" },
    { x: 580, y: 380, label: "12" },
    { x: 640, y: 320, label: "13" },
    { x: 700, y: 260, label: "14" },
    { x: 760, y: 200, label: "15" },
    { x: 820, y: 140, label: "16" },
    { x: 880, y: 80, label: "17" },
  ];

  return (
    <svg
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mapFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={INK} stopOpacity="1" />
          <stop offset="40%" stopColor={INK} stopOpacity="0.35" />
          <stop offset="100%" stopColor={INK} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mapGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor={VOLT} stopOpacity="0.10" />
          <stop offset="100%" stopColor={VOLT} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* faint radial warmth under the trail */}
      <rect x="0" y="0" width="1000" height="700" fill="url(#mapGlow)" />

      {/* Pond off to the right of the trail */}
      <Pond x={620} y={500} />

      {/* Trees scattered along the path */}
      <Tree x={120} y={460} scale={1.1} />
      <Tree x={460} y={580} scale={0.9} />
      <Tree x={780} y={340} scale={0.85} />
      <Tree x={300} y={380} scale={0.7} />
      <Tree x={900} y={260} scale={0.95} />

      {/* Cabin at the start (bottom-left), the "you are here" */}
      <Cabin x={60} y={640} />

      {/* The dotted path connecting tiles */}
      <path
        d="M 90 600 Q 200 590, 270 560 T 460 510 Q 540 475, 610 410 T 770 240 Q 830 170, 900 110"
        fill="none"
        stroke={VOLT_DIM}
        strokeWidth="6"
        strokeDasharray="2 12"
        strokeLinecap="round"
      />

      {/* Tiles on top */}
      {tiles.map((t, i) => (
        <Tile key={i} {...t} />
      ))}

      {/* Top fade so the scene dissolves into the hero background */}
      <rect x="0" y="0" width="1000" height="500" fill="url(#mapFade)" />
    </svg>
  );
}
