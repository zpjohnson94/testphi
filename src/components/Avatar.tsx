// Blob avatar system — SVG, color-customizable, with accessory unlocks.
// Each animal is a chubby round shape with big eyes; species-specific accents only.

import type { CSSProperties } from "react";

export type AnimalId =
  | "penguin" | "hippo" | "frog" | "cat" | "bear" | "fox"
  | "axolotl" | "giraffe" | "owl" | "capybara" | "duck" | "bunny";

export type AccessoryId =
  | "none" | "party" | "crown" | "tophat" | "grad"
  | "halo" | "headphones" | "flower" | "wizard" | "chef" | "cowboy";

export interface AvatarConfig {
  animal: AnimalId;
  color: string;       // hex
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
  "#B8FF00", // Volt
  "#A855F7", // Neon
  "#FFE600", // Spark
  "#FF6FB5", // Pink
  "#5BE1FF", // Cyan
  "#FF8A3D", // Orange
  "#7CF6B0", // Mint
  "#F6F0FA", // Lavender
  "#FF4D6D", // Coral
  "#9DAEFF", // Periwinkle
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

// Lightens / darkens a hex by amt (-100..100)
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
  const dark = shade(c, -28);
  const belly = shade(c, 30);
  const stroke = "#1D2900";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-label={`${config.animal} avatar`}
    >
      {/* shadow */}
      <ellipse cx="60" cy="108" rx="28" ry="5" fill="rgba(0,0,0,0.25)" />

      <g style={animate ? { transformOrigin: "60px 70px", animation: "blob-idle 3.2s ease-in-out infinite" } : undefined}>
        {/* body */}
        <ellipse cx="60" cy="68" rx="40" ry="38" fill={c} stroke={stroke} strokeWidth="3" />
        {/* belly */}
        <ellipse cx="60" cy="78" rx="22" ry="20" fill={belly} opacity="0.55" />
        {/* arms */}
        <ellipse cx="22" cy="74" rx="7" ry="10" fill={c} stroke={stroke} strokeWidth="2.5" />
        <ellipse cx="98" cy="74" rx="7" ry="10" fill={c} stroke={stroke} strokeWidth="2.5" />
        {/* feet */}
        <ellipse cx="46" cy="104" rx="9" ry="5" fill={dark} stroke={stroke} strokeWidth="2.5" />
        <ellipse cx="74" cy="104" rx="9" ry="5" fill={dark} stroke={stroke} strokeWidth="2.5" />

        <SpeciesFeatures animal={config.animal} color={c} dark={dark} stroke={stroke} />

        {/* eyes */}
        <ellipse cx="48" cy="58" rx="6.5" ry="7.5" fill="#fff" stroke={stroke} strokeWidth="2.5" />
        <ellipse cx="72" cy="58" rx="6.5" ry="7.5" fill="#fff" stroke={stroke} strokeWidth="2.5" />
        <circle cx="49" cy="60" r="3" fill={stroke} />
        <circle cx="73" cy="60" r="3" fill={stroke} />
        <circle cx="50.2" cy="58.8" r="1" fill="#fff" />
        <circle cx="74.2" cy="58.8" r="1" fill="#fff" />

        {/* mouth */}
        <path d="M55 70 Q60 73 65 70" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />

        {/* cheeks */}
        <ellipse cx="42" cy="68" rx="3.5" ry="2" fill="#FF6FB5" opacity="0.55" />
        <ellipse cx="78" cy="68" rx="3.5" ry="2" fill="#FF6FB5" opacity="0.55" />

        <Accessory id={config.accessory} stroke={stroke} />
      </g>
    </svg>
  );
}

function SpeciesFeatures({ animal, color, dark, stroke }: { animal: AnimalId; color: string; dark: string; stroke: string }) {
  switch (animal) {
    case "fox":
      return (
        <g>
          <polygon points="28,38 38,30 42,46" fill={color} stroke={stroke} strokeWidth="2.5" />
          <polygon points="92,38 82,30 78,46" fill={color} stroke={stroke} strokeWidth="2.5" />
          <polygon points="32,40 38,36 40,44" fill={dark} />
          <polygon points="88,40 82,36 80,44" fill={dark} />
        </g>
      );
    case "cat":
      return (
        <g>
          <polygon points="30,42 40,32 44,48" fill={color} stroke={stroke} strokeWidth="2.5" />
          <polygon points="90,42 80,32 76,48" fill={color} stroke={stroke} strokeWidth="2.5" />
          <polygon points="33,43 40,38 41,46" fill="#FF6FB5" opacity="0.7" />
          <polygon points="87,43 80,38 79,46" fill="#FF6FB5" opacity="0.7" />
        </g>
      );
    case "bear":
      return (
        <g>
          <circle cx="30" cy="40" r="9" fill={color} stroke={stroke} strokeWidth="2.5" />
          <circle cx="90" cy="40" r="9" fill={color} stroke={stroke} strokeWidth="2.5" />
          <circle cx="30" cy="40" r="4" fill={dark} />
          <circle cx="90" cy="40" r="4" fill={dark} />
        </g>
      );
    case "bunny":
      return (
        <g>
          <ellipse cx="46" cy="22" rx="6" ry="16" fill={color} stroke={stroke} strokeWidth="2.5" />
          <ellipse cx="74" cy="22" rx="6" ry="16" fill={color} stroke={stroke} strokeWidth="2.5" />
          <ellipse cx="46" cy="24" rx="2.5" ry="10" fill="#FF6FB5" opacity="0.7" />
          <ellipse cx="74" cy="24" rx="2.5" ry="10" fill="#FF6FB5" opacity="0.7" />
        </g>
      );
    case "frog":
      return (
        <g>
          <circle cx="44" cy="42" r="11" fill={color} stroke={stroke} strokeWidth="2.5" />
          <circle cx="76" cy="42" r="11" fill={color} stroke={stroke} strokeWidth="2.5" />
        </g>
      );
    case "penguin":
      return (
        <g>
          <ellipse cx="60" cy="68" rx="26" ry="32" fill="#fff" />
          <polygon points="54,72 66,72 60,82" fill="#FFB800" stroke={stroke} strokeWidth="2" />
        </g>
      );
    case "owl":
      return (
        <g>
          <circle cx="48" cy="58" r="11" fill="#fff" stroke={stroke} strokeWidth="2.5" />
          <circle cx="72" cy="58" r="11" fill="#fff" stroke={stroke} strokeWidth="2.5" />
          <polygon points="36,30 44,42 28,40" fill={color} stroke={stroke} strokeWidth="2" />
          <polygon points="84,30 76,42 92,40" fill={color} stroke={stroke} strokeWidth="2" />
        </g>
      );
    case "duck":
      return (
        <g>
          <ellipse cx="60" cy="74" rx="11" ry="6" fill="#FFB800" stroke={stroke} strokeWidth="2.5" />
        </g>
      );
    case "hippo":
      return (
        <g>
          <ellipse cx="60" cy="76" rx="20" ry="12" fill={belly_(color)} stroke={stroke} strokeWidth="2.5" />
          <circle cx="54" cy="74" r="2" fill={stroke} />
          <circle cx="66" cy="74" r="2" fill={stroke} />
        </g>
      );
    case "giraffe":
      return (
        <g>
          <circle cx="44" cy="46" r="4" fill={dark} />
          <circle cx="76" cy="46" r="4" fill={dark} />
          <circle cx="36" cy="62" r="3" fill={dark} />
          <circle cx="84" cy="62" r="3" fill={dark} />
          <line x1="46" y1="32" x2="46" y2="42" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="74" y1="32" x2="74" y2="42" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle cx="46" cy="30" r="3" fill={dark} />
          <circle cx="74" cy="30" r="3" fill={dark} />
        </g>
      );
    case "axolotl":
      return (
        <g>
          <path d="M22 56 q-8 4 -10 14 q12 -2 14 -8" fill={color} stroke={stroke} strokeWidth="2" />
          <path d="M98 56 q8 4 10 14 q-12 -2 -14 -8" fill={color} stroke={stroke} strokeWidth="2" />
        </g>
      );
    case "capybara":
      return (
        <g>
          <ellipse cx="32" cy="50" rx="5" ry="4" fill={dark} stroke={stroke} strokeWidth="2" />
          <ellipse cx="88" cy="50" rx="5" ry="4" fill={dark} stroke={stroke} strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}
function belly_(color: string) { return shade(color, 18); }

function Accessory({ id, stroke }: { id: AccessoryId; stroke: string }) {
  switch (id) {
    case "party":
      return (
        <g>
          <polygon points="60,8 50,32 70,32" fill="#FFE600" stroke={stroke} strokeWidth="2.5" />
          <polygon points="60,8 53,22 60,22" fill="#FF6FB5" />
          <circle cx="60" cy="8" r="3" fill="#FF6FB5" stroke={stroke} strokeWidth="2" />
        </g>
      );
    case "crown":
      return (
        <g>
          <polygon points="36,28 44,12 52,24 60,8 68,24 76,12 84,28" fill="#FFE600" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="36" y="28" width="48" height="6" fill="#FFE600" stroke={stroke} strokeWidth="2.5" />
          <circle cx="44" cy="14" r="2.5" fill="#FF6FB5" />
          <circle cx="60" cy="10" r="2.5" fill="#A855F7" />
          <circle cx="76" cy="14" r="2.5" fill="#B8FF00" />
        </g>
      );
    case "tophat":
      return (
        <g>
          <rect x="42" y="6" width="36" height="26" fill={stroke} stroke={stroke} strokeWidth="2" rx="2" />
          <rect x="34" y="30" width="52" height="5" fill={stroke} stroke={stroke} strokeWidth="2" rx="2" />
          <rect x="42" y="20" width="36" height="4" fill="#A855F7" />
        </g>
      );
    case "grad":
      return (
        <g>
          <polygon points="20,28 60,12 100,28 60,40" fill={stroke} />
          <rect x="50" y="28" width="20" height="8" fill={stroke} />
          <line x1="84" y1="22" x2="92" y2="36" stroke="#FFE600" strokeWidth="2.5" />
          <circle cx="92" cy="38" r="3" fill="#FFE600" />
        </g>
      );
    case "halo":
      return (
        <g>
          <ellipse cx="60" cy="14" rx="22" ry="6" fill="none" stroke="#FFE600" strokeWidth="3.5" />
          <ellipse cx="60" cy="14" rx="22" ry="6" fill="none" stroke="#fff" strokeWidth="1" opacity="0.7" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M22 48 Q22 14 60 14 Q98 14 98 48" fill="none" stroke={stroke} strokeWidth="4" />
          <rect x="14" y="44" width="14" height="20" rx="4" fill="#A855F7" stroke={stroke} strokeWidth="2.5" />
          <rect x="92" y="44" width="14" height="20" rx="4" fill="#A855F7" stroke={stroke} strokeWidth="2.5" />
        </g>
      );
    case "flower":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 30 + i * 15;
            return <circle key={i} cx={x} cy={20} r="6" fill={["#FF6FB5", "#FFE600", "#B8FF00", "#A855F7", "#5BE1FF"][i]} stroke={stroke} strokeWidth="2" />;
          })}
        </g>
      );
    case "wizard":
      return (
        <g>
          <polygon points="60,2 36,40 84,40" fill="#A855F7" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="50" cy="22" r="2" fill="#FFE600" />
          <circle cx="66" cy="14" r="1.5" fill="#FFE600" />
          <circle cx="70" cy="28" r="1.5" fill="#FFE600" />
        </g>
      );
    case "chef":
      return (
        <g>
          <ellipse cx="60" cy="14" rx="22" ry="14" fill="#fff" stroke={stroke} strokeWidth="2.5" />
          <rect x="42" y="26" width="36" height="10" fill="#fff" stroke={stroke} strokeWidth="2.5" />
        </g>
      );
    case "cowboy":
      return (
        <g>
          <ellipse cx="60" cy="32" rx="44" ry="6" fill="#8B5A2B" stroke={stroke} strokeWidth="2.5" />
          <path d="M40 32 Q40 10 60 10 Q80 10 80 32" fill="#8B5A2B" stroke={stroke} strokeWidth="2.5" />
          <rect x="40" y="26" width="40" height="3" fill={stroke} opacity="0.5" />
        </g>
      );
    default:
      return null;
  }
}

export function defaultAvatar(): AvatarConfig {
  return { animal: "fox", color: "#FF8A3D", accessory: "none" };
}
