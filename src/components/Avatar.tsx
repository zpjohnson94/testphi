// Chibi avatar system — Boomerang Fu inspired.
// Chunky heads with thick outlines, gradient shading, glossy eyes, rim light,
// and species-specific silhouettes (not blobs with ears glued on).

import type { CSSProperties } from "react";

export type AnimalId =
  | "penguin" | "hippo" | "frog" | "cat" | "bear" | "fox"
  | "axolotl" | "giraffe" | "owl" | "capybara" | "duck" | "bunny";

export type AccessoryId =
  | "none" | "party" | "crown" | "tophat" | "grad"
  | "halo" | "headphones" | "flower" | "wizard" | "chef" | "cowboy";

export interface AvatarConfig {
  animal: AnimalId;
  color: string;
  accessory: AccessoryId;
}

export const ANIMALS: { id: AnimalId; name: string; emoji: string }[] = [
  { id: "penguin", name: "Penguin", emoji: "🐧" },
  { id: "hippo", name: "Hippo", emoji: "🦛" },
  { id: "frog", name: "Frog", emoji: "🐸" },
  { id: "cat", name: "Cat", emoji: "🐱" },
  { id: "bear", name: "Bear", emoji: "🐻" },
  { id: "fox", name: "Fox", emoji: "🦊" },
  { id: "axolotl", name: "Axolotl", emoji: "🪼" },
  { id: "giraffe", name: "Giraffe", emoji: "🦒" },
  { id: "owl", name: "Owl", emoji: "🦉" },
  { id: "capybara", name: "Capybara", emoji: "🦫" },
  { id: "duck", name: "Duck", emoji: "🦆" },
  { id: "bunny", name: "Bunny", emoji: "🐰" },
];

export const COLOR_SWATCHES = [
  "#B8FF00", "#A855F7", "#FFE600", "#FF6FB5", "#5BE1FF",
  "#FF8A3D", "#7CF6B0", "#F6F0FA", "#FF4D6D", "#9DAEFF",
];

export const ACCESSORIES: { id: AccessoryId; name: string; unlock: string }[] = [
  { id: "none", name: "None", unlock: "Default" },
  { id: "party", name: "Party hat", unlock: "3-day streak" },
  { id: "crown", name: "Crown", unlock: "#1 weekly leaderboard" },
  { id: "tophat", name: "Top hat", unlock: "Complete 5 lessons" },
  { id: "grad", name: "Graduation cap", unlock: "Predicted 1400+" },
  { id: "halo", name: "Halo", unlock: "Perfect practice session" },
  { id: "headphones", name: "Headphones", unlock: "7-day streak" },
  { id: "flower", name: "Flower crown", unlock: "Complete 10 lessons" },
  { id: "wizard", name: "Wizard hat", unlock: "Reach Diamond tier" },
  { id: "chef", name: "Chef's hat", unlock: "Hidden" },
  { id: "cowboy", name: "Cowboy hat", unlock: "Hidden" },
];

function shade(hex: string, amt: number) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const adj = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * 255)));
  return `rgb(${adj(r)}, ${adj(g)}, ${adj(b)})`;
}

interface AvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  style?: CSSProperties;
  animate?: boolean;
}

export function Avatar({ config, size = 96, className = "", style, animate = false }: AvatarProps) {
  const c = config.color;
  const light = shade(c, 22);
  const dark = shade(c, -22);
  const deep = shade(c, -38);
  const stroke = "#1a1a2e";
  // unique per-render gradient ids so multiple avatars don't collide
  const uid = `${config.animal}-${c.replace("#", "")}`;

  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-label={`${config.animal} avatar`}
    >
      <defs>
        <radialGradient id={`body-${uid}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={c} />
          <stop offset="100%" stopColor={deep} />
        </radialGradient>
        <radialGradient id={`belly-${uid}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor={light} stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id={`rim-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="70" cy="128" rx="34" ry="5" fill="rgba(0,0,0,0.35)" />

      <g style={animate ? { transformOrigin: "70px 80px", animation: "blob-idle 3.2s ease-in-out infinite" } : undefined}>
        <SpeciesBack animal={config.animal} c={c} dark={dark} stroke={stroke} uid={uid} />

        {/* main head/body shape */}
        <HeadShape animal={config.animal} uid={uid} stroke={stroke} />

        {/* belly patch */}
        <BellyShape animal={config.animal} uid={uid} />

        {/* rim light highlight */}
        <HeadHighlight animal={config.animal} uid={uid} />

        <SpeciesFront animal={config.animal} c={c} light={light} dark={dark} stroke={stroke} />

        {/* eyes — chunky with bright catchlights */}
        <Eyes animal={config.animal} stroke={stroke} />

        {/* mouth */}
        <Mouth animal={config.animal} stroke={stroke} />

        {/* cheeks */}
        <ellipse cx="44" cy="84" rx="5" ry="3" fill="#FF6FB5" opacity="0.55" />
        <ellipse cx="96" cy="84" rx="5" ry="3" fill="#FF6FB5" opacity="0.55" />

        <Accessory id={config.accessory} stroke={stroke} />
      </g>
    </svg>
  );
}

function HeadShape({ animal, uid, stroke }: { animal: AnimalId; uid: string; stroke: string }) {
  const fill = `url(#body-${uid})`;
  // Different silhouette per species — head + small body suggestion
  switch (animal) {
    case "frog":
      return <path d="M28 78 C 28 50, 52 32, 70 32 C 88 32, 112 50, 112 78 C 112 104, 92 118, 70 118 C 48 118, 28 104, 28 78 Z" fill={fill} stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" />;
    case "owl":
      return <path d="M30 70 C 30 44, 48 30, 70 30 C 92 30, 110 44, 110 70 C 110 100, 92 120, 70 120 C 48 120, 30 100, 30 70 Z" fill={fill} stroke={stroke} strokeWidth="3.5" />;
    case "bunny":
      return <path d="M34 82 C 34 58, 50 42, 70 42 C 90 42, 106 58, 106 82 C 106 106, 90 120, 70 120 C 50 120, 34 106, 34 82 Z" fill={fill} stroke={stroke} strokeWidth="3.5" />;
    case "giraffe":
      return <path d="M36 80 C 36 58, 52 44, 70 44 C 88 44, 104 58, 104 80 C 104 104, 88 120, 70 120 C 52 120, 36 104, 36 80 Z" fill={fill} stroke={stroke} strokeWidth="3.5" />;
    case "penguin":
      return <path d="M34 76 C 34 50, 50 34, 70 34 C 90 34, 106 50, 106 76 C 106 106, 92 120, 70 120 C 48 120, 34 106, 34 76 Z" fill={fill} stroke={stroke} strokeWidth="3.5" />;
    default:
      return <path d="M30 78 C 30 52, 48 36, 70 36 C 92 36, 110 52, 110 78 C 110 106, 92 120, 70 120 C 48 120, 30 106, 30 78 Z" fill={fill} stroke={stroke} strokeWidth="3.5" />;
  }
}

function BellyShape({ animal, uid }: { animal: AnimalId; uid: string }) {
  const fill = `url(#belly-${uid})`;
  if (animal === "penguin") {
    return <ellipse cx="70" cy="92" rx="26" ry="24" fill="#fff" />;
  }
  return <ellipse cx="70" cy="96" rx="22" ry="18" fill={fill} />;
}

function HeadHighlight({ animal, uid }: { animal: AnimalId; uid: string }) {
  return (
    <path
      d="M42 54 C 50 42, 64 36, 80 38 C 72 40, 60 46, 52 56 Z"
      fill={`url(#rim-${uid})`}
      opacity="0.9"
    />
  );
}

function SpeciesBack({ animal, c, dark, stroke, uid }: { animal: AnimalId; c: string; dark: string; stroke: string; uid: string }) {
  // Things drawn BEHIND the head (ears on sides, etc.)
  switch (animal) {
    case "bunny":
      return (
        <g>
          <path d="M48 16 C 44 30, 46 50, 54 56 C 58 50, 58 30, 54 16 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M92 16 C 96 30, 94 50, 86 56 C 82 50, 82 30, 86 16 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M50 26 C 49 36, 50 48, 54 52" stroke="#FF6FB5" strokeWidth="3" fill="none" opacity="0.7" />
          <path d="M90 26 C 91 36, 90 48, 86 52" stroke="#FF6FB5" strokeWidth="3" fill="none" opacity="0.7" />
        </g>
      );
    case "fox":
      return (
        <g>
          <path d="M28 38 L 44 30 L 48 56 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M112 38 L 96 30 L 92 56 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 40 L 43 36 L 46 50 Z" fill={dark} />
          <path d="M106 40 L 97 36 L 94 50 Z" fill={dark} />
        </g>
      );
    case "cat":
      return (
        <g>
          <path d="M30 44 L 46 30 L 50 56 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M110 44 L 94 30 L 90 56 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M36 44 L 46 36 L 48 52 Z" fill="#FF6FB5" opacity="0.65" />
          <path d="M104 44 L 94 36 L 92 52 Z" fill="#FF6FB5" opacity="0.65" />
        </g>
      );
    case "bear":
      return (
        <g>
          <circle cx="34" cy="44" r="11" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" />
          <circle cx="106" cy="44" r="11" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" />
          <circle cx="34" cy="44" r="5" fill={dark} />
          <circle cx="106" cy="44" r="5" fill={dark} />
        </g>
      );
    case "owl":
      return (
        <g>
          <path d="M28 30 L 44 50 L 32 52 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M112 30 L 96 50 L 108 52 Z" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        </g>
      );
    case "giraffe":
      return (
        <g>
          {/* horns */}
          <line x1="54" y1="30" x2="52" y2="44" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <line x1="86" y1="30" x2="88" y2="44" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="52" cy="28" r="4" fill={dark} stroke={stroke} strokeWidth="2.5" />
          <circle cx="88" cy="28" r="4" fill={dark} stroke={stroke} strokeWidth="2.5" />
        </g>
      );
    case "capybara":
      return (
        <g>
          <ellipse cx="40" cy="58" rx="6" ry="5" fill={dark} stroke={stroke} strokeWidth="2.5" />
          <ellipse cx="100" cy="58" rx="6" ry="5" fill={dark} stroke={stroke} strokeWidth="2.5" />
        </g>
      );
    case "hippo":
      return (
        <g>
          <ellipse cx="40" cy="58" rx="7" ry="5" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="2.5" />
          <ellipse cx="100" cy="58" rx="7" ry="5" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="2.5" />
        </g>
      );
    case "frog":
      return (
        <g>
          <circle cx="48" cy="46" r="13" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" />
          <circle cx="92" cy="46" r="13" fill={`url(#body-${uid})`} stroke={stroke} strokeWidth="3" />
        </g>
      );
    case "axolotl":
      return (
        <g>
          <path d="M22 60 C 12 64, 8 76, 14 86 C 22 84, 28 76, 30 68 Z" fill={c} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" opacity="0.95" />
          <path d="M118 60 C 128 64, 132 76, 126 86 C 118 84, 112 76, 110 68 Z" fill={c} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" opacity="0.95" />
          <path d="M14 64 C 12 70, 14 78, 18 82" stroke="#FF6FB5" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M126 64 C 128 70, 126 78, 122 82" stroke="#FF6FB5" strokeWidth="2" fill="none" opacity="0.7" />
        </g>
      );
    default:
      return null;
  }
}

function SpeciesFront({ animal, light, dark, stroke }: { animal: AnimalId; c: string; light: string; dark: string; stroke: string }) {
  // Beaks, snouts, etc. drawn over the head
  switch (animal) {
    case "duck":
      return <path d="M58 88 Q 70 96, 82 88 Q 80 98, 70 100 Q 60 98, 58 88 Z" fill="#FFB800" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />;
    case "penguin":
      return <path d="M62 88 L 78 88 L 70 100 Z" fill="#FFB800" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />;
    case "owl":
      return <path d="M64 78 L 76 78 L 70 88 Z" fill="#FFB800" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />;
    case "hippo":
      return (
        <g>
          <ellipse cx="70" cy="92" rx="22" ry="13" fill={light} stroke={stroke} strokeWidth="2.5" />
          <circle cx="62" cy="88" r="2" fill={stroke} />
          <circle cx="78" cy="88" r="2" fill={stroke} />
        </g>
      );
    case "bear":
    case "capybara":
      return (
        <g>
          <ellipse cx="70" cy="92" rx="14" ry="9" fill={light} stroke={stroke} strokeWidth="2.5" />
          <ellipse cx="70" cy="86" rx="3" ry="2.2" fill={stroke} />
        </g>
      );
    case "fox":
    case "cat":
      return <ellipse cx="70" cy="86" rx="3" ry="2.2" fill={stroke} />;
    case "bunny":
      return (
        <g>
          <ellipse cx="70" cy="86" rx="3" ry="2.2" fill={stroke} />
          {/* front teeth */}
          <rect x="67" y="93" width="3" height="5" fill="#fff" stroke={stroke} strokeWidth="1.2" />
          <rect x="70" y="93" width="3" height="5" fill="#fff" stroke={stroke} strokeWidth="1.2" />
        </g>
      );
    case "giraffe":
      return (
        <g>
          <ellipse cx="70" cy="92" rx="14" ry="9" fill={light} stroke={stroke} strokeWidth="2.5" />
          {/* spots on head */}
          <circle cx="50" cy="64" r="4" fill={dark} opacity="0.7" />
          <circle cx="92" cy="62" r="3.5" fill={dark} opacity="0.7" />
          <circle cx="58" cy="50" r="3" fill={dark} opacity="0.7" />
        </g>
      );
    default:
      return null;
  }
}

function Eyes({ animal, stroke }: { animal: AnimalId; stroke: string }) {
  // Larger, glossier eyes — the Boomerang Fu hallmark
  const big = animal === "frog" || animal === "owl";
  const ry = big ? 10 : 8;
  const rx = big ? 9 : 7;
  return (
    <g>
      {/* eye whites */}
      <ellipse cx="56" cy="70" rx={rx} ry={ry} fill="#fff" stroke={stroke} strokeWidth="3" />
      <ellipse cx="84" cy="70" rx={rx} ry={ry} fill="#fff" stroke={stroke} strokeWidth="3" />
      {/* pupils */}
      <ellipse cx="58" cy="72" rx="3.6" ry="4.4" fill={stroke} />
      <ellipse cx="86" cy="72" rx="3.6" ry="4.4" fill={stroke} />
      {/* big catchlight */}
      <circle cx="60" cy="69" r="1.8" fill="#fff" />
      <circle cx="88" cy="69" r="1.8" fill="#fff" />
      {/* small secondary catchlight */}
      <circle cx="56.5" cy="73.5" r="0.9" fill="#fff" opacity="0.85" />
      <circle cx="84.5" cy="73.5" r="0.9" fill="#fff" opacity="0.85" />
    </g>
  );
}

function Mouth({ animal, stroke }: { animal: AnimalId; stroke: string }) {
  if (animal === "duck" || animal === "penguin" || animal === "owl") return null;
  if (animal === "frog") {
    return <path d="M50 92 Q 70 104, 90 92" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
  }
  return <path d="M62 90 Q 70 96, 78 90" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />;
}

function Accessory({ id, stroke }: { id: AccessoryId; stroke: string }) {
  switch (id) {
    case "party":
      return (
        <g>
          <polygon points="70,8 58,38 82,38" fill="#FFE600" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="70,8 62,28 70,28" fill="#FF6FB5" />
          <circle cx="70" cy="8" r="3.5" fill="#FF6FB5" stroke={stroke} strokeWidth="2" />
        </g>
      );
    case "crown":
      return (
        <g>
          <polygon points="42,34 52,14 62,28 70,8 78,28 88,14 98,34" fill="#FFE600" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <rect x="42" y="33" width="56" height="7" fill="#FFE600" stroke={stroke} strokeWidth="3" />
          <circle cx="52" cy="16" r="3" fill="#FF6FB5" />
          <circle cx="70" cy="11" r="3" fill="#A855F7" />
          <circle cx="88" cy="16" r="3" fill="#B8FF00" />
        </g>
      );
    case "tophat":
      return (
        <g>
          <rect x="50" y="4" width="40" height="30" fill={stroke} stroke={stroke} strokeWidth="2" rx="2" />
          <rect x="40" y="32" width="60" height="6" fill={stroke} stroke={stroke} strokeWidth="2" rx="2" />
          <rect x="50" y="22" width="40" height="5" fill="#A855F7" />
        </g>
      );
    case "grad":
      return (
        <g>
          <polygon points="22,32 70,12 118,32 70,42" fill={stroke} />
          <rect x="58" y="32" width="24" height="10" fill={stroke} />
          <line x1="100" y1="24" x2="108" y2="40" stroke="#FFE600" strokeWidth="3" />
          <circle cx="108" cy="42" r="3.5" fill="#FFE600" />
        </g>
      );
    case "halo":
      return (
        <g>
          <ellipse cx="70" cy="14" rx="26" ry="6" fill="none" stroke="#FFE600" strokeWidth="4" />
          <ellipse cx="70" cy="14" rx="26" ry="6" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.7" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M28 56 Q 28 14, 70 14 Q 112 14, 112 56" fill="none" stroke={stroke} strokeWidth="5" />
          <rect x="18" y="50" width="16" height="22" rx="5" fill="#A855F7" stroke={stroke} strokeWidth="3" />
          <rect x="106" y="50" width="16" height="22" rx="5" fill="#A855F7" stroke={stroke} strokeWidth="3" />
        </g>
      );
    case "flower":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 36 + i * 17;
            return <circle key={i} cx={x} cy={22} r="7" fill={["#FF6FB5", "#FFE600", "#B8FF00", "#A855F7", "#5BE1FF"][i]} stroke={stroke} strokeWidth="2.5" />;
          })}
        </g>
      );
    case "wizard":
      return (
        <g>
          <polygon points="70,2 42,46 98,46" fill="#A855F7" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="58" cy="26" r="2.2" fill="#FFE600" />
          <circle cx="78" cy="16" r="1.8" fill="#FFE600" />
          <circle cx="82" cy="32" r="1.8" fill="#FFE600" />
        </g>
      );
    case "chef":
      return (
        <g>
          <ellipse cx="70" cy="16" rx="26" ry="16" fill="#fff" stroke={stroke} strokeWidth="3" />
          <rect x="50" y="30" width="40" height="12" fill="#fff" stroke={stroke} strokeWidth="3" />
        </g>
      );
    case "cowboy":
      return (
        <g>
          <ellipse cx="70" cy="38" rx="50" ry="7" fill="#8B5A2B" stroke={stroke} strokeWidth="3" />
          <path d="M46 38 Q 46 12, 70 12 Q 94 12, 94 38" fill="#8B5A2B" stroke={stroke} strokeWidth="3" />
          <rect x="46" y="32" width="48" height="3.5" fill={stroke} opacity="0.5" />
        </g>
      );
    default:
      return null;
  }
}

export function defaultAvatar(): AvatarConfig {
  return { animal: "fox", color: "#FF8A3D", accessory: "none" };
}
