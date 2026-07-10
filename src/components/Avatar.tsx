// Avatar — colored disc + animal illustration + accessory overlay.
// Config has three parts the user can customize: animal, color, accessory.

import type { CSSProperties } from "react";
import bear from "@/assets/avatars/bear.webp";
import bunny from "@/assets/avatars/bunny.webp";
import croc from "@/assets/avatars/croc.webp";
import eagle from "@/assets/avatars/eagle.webp";
import frog from "@/assets/avatars/frog.webp";
import koala from "@/assets/avatars/koala.webp";
import lion from "@/assets/avatars/lion.webp";
import panda from "@/assets/avatars/panda.webp";
import penguin from "@/assets/avatars/penguin.webp";
import pig from "@/assets/avatars/pig.webp";
import shiba from "@/assets/avatars/shiba.webp";
import tiger from "@/assets/avatars/tiger.webp";

export type AnimalId =
  | "bear" | "bunny" | "croc" | "eagle" | "frog" | "koala"
  | "lion" | "panda" | "penguin" | "pig" | "shiba" | "tiger";

export type AccessoryId =
  | "none" | "party" | "crown" | "tophat" | "grad"
  | "halo" | "headphones" | "flower" | "wizard" | "chef" | "cowboy";

const ANIMAL_IMAGES: Record<AnimalId, string> = {
  bear, bunny, croc, eagle, frog, koala, lion, panda, penguin, pig, shiba, tiger,
};

export interface AvatarConfig {
  animal: AnimalId;
  color: string;
  accessory: AccessoryId;
}

export const ANIMALS: { id: AnimalId; name: string; emoji: string }[] = [
  { id: "bear", name: "Bear", emoji: "🐻" },
  { id: "bunny", name: "Bunny", emoji: "🐰" },
  { id: "croc", name: "Croc", emoji: "🐊" },
  { id: "eagle", name: "Eagle", emoji: "🦅" },
  { id: "frog", name: "Frog", emoji: "🐸" },
  { id: "koala", name: "Koala", emoji: "🐨" },
  { id: "lion", name: "Lion", emoji: "🦁" },
  { id: "panda", name: "Panda", emoji: "🐼" },
  { id: "penguin", name: "Penguin", emoji: "🐧" },
  { id: "pig", name: "Pig", emoji: "🐷" },
  { id: "shiba", name: "Shiba", emoji: "🐕" },
  { id: "tiger", name: "Tiger", emoji: "🐯" },
];

export const COLOR_SWATCHES = [
  "#B8FF00", "#A855F7", "#FFE600", "#FF6FB5", "#5BE1FF",
  "#FF8A3D", "#7CF6B0", "#F6F0FA", "#FF4D6D", "#9DAEFF",
];

const ACCESSORY_EMOJI: Record<AccessoryId, string> = {
  none: "",
  crown: "👑",
  party: "🥳",
  tophat: "🎩",
  grad: "🎓",
  halo: "😇",
  headphones: "🎧",
  flower: "🌸",
  wizard: "🧙",
  chef: "🧑‍🍳",
  cowboy: "🤠",
};

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

export function Avatar({ config, size = 96, className = "", style, animate = false }: AvatarProps) {
  const cfg = config ?? defaultAvatar();
  const src = ANIMAL_IMAGES[cfg.animal] ?? ANIMAL_IMAGES.bear;
  const accessory = ACCESSORY_EMOJI[cfg.accessory] ?? "";
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "9999px",
        background: cfg.color,
        boxShadow: "0 6px 18px -8px rgba(0,0,0,0.45)",
        overflow: "visible",
        ...style,
      }}
      aria-label="Avatar"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "9999px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          draggable={false}
          style={{
            width: "88%",
            height: "88%",
            objectFit: "contain",
            transformOrigin: "50% 70%",
            animation: animate ? "blob-idle 3.2s ease-in-out infinite" : undefined,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      </div>
      {accessory && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: `-${Math.round(size * 0.18)}px`,
            left: "50%",
            transform: "translateX(-50%) rotate(-8deg)",
            fontSize: Math.round(size * 0.5),
            lineHeight: 1,
            pointerEvents: "none",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
          }}
        >
          {accessory}
        </span>
      )}
    </div>
  );
}

export function defaultAvatar(): AvatarConfig {
  return { animal: "bear", color: "#B8FF00", accessory: "crown" };
}
