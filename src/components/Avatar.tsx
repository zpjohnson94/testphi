// Avatar — uses the chunky 3D crown-bear illustration with a gentle
// breathing animation. The customization config is preserved (so other
// screens still type-check) but currently every variant renders the bear.

import type { CSSProperties } from "react";
import bearImg from "@/assets/avatar-bear.png";

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
  { id: "bear", name: "Bear", emoji: "🐻" },
  { id: "penguin", name: "Penguin", emoji: "🐧" },
  { id: "hippo", name: "Hippo", emoji: "🦛" },
  { id: "frog", name: "Frog", emoji: "🐸" },
  { id: "cat", name: "Cat", emoji: "🐱" },
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
  { id: "crown", name: "Crown", unlock: "#1 weekly leaderboard" },
  { id: "party", name: "Party hat", unlock: "3-day streak" },
  { id: "tophat", name: "Top hat", unlock: "Complete 5 lessons" },
  { id: "grad", name: "Graduation cap", unlock: "Predicted 1400+" },
  { id: "halo", name: "Halo", unlock: "Perfect practice session" },
  { id: "headphones", name: "Headphones", unlock: "7-day streak" },
  { id: "flower", name: "Flower crown", unlock: "Complete 10 lessons" },
  { id: "wizard", name: "Wizard hat", unlock: "Reach Diamond tier" },
  { id: "chef", name: "Chef's hat", unlock: "Hidden" },
  { id: "cowboy", name: "Cowboy hat", unlock: "Hidden" },
];

interface AvatarProps {
  config?: AvatarConfig;
  size?: number;
  className?: string;
  style?: CSSProperties;
  animate?: boolean;
}

export function Avatar({ size = 96, className = "", style, animate = false }: AvatarProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      aria-label="Avatar"
    >
      <img
        src={bearImg}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transformOrigin: "50% 70%",
          animation: animate ? "blob-idle 3.2s ease-in-out infinite" : undefined,
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function defaultAvatar(): AvatarConfig {
  return { animal: "bear", color: "#8B5A2B", accessory: "crown" };
}
