// Avatar — colored disc + animal illustration + accessory overlay.
// Config has three parts the user can customize: animal, color, accessory.

import type { CSSProperties } from "react";
import bear from "@/assets/avatars/bear.png";
import eagle from "@/assets/avatars/eagle.png";
import frog from "@/assets/avatars/frog.png";
import panda from "@/assets/avatars/panda.png";
import pig from "@/assets/avatars/pig.png";
import shiba from "@/assets/avatars/shiba.png";

export type AnimalId = "bear" | "eagle" | "frog" | "panda" | "pig" | "shiba";

export type AccessoryId =
  | "none"
  | "tophat"
  | "brain"
  | "crown"
  | "grad"
  | "cap"
  | "star"
  | "flower"
  | "fire"
  | "poop"
  | "goggles"
  | "bolt"
  | "ice"
  | "bulb"
  | "disco";

const ANIMAL_IMAGES: Record<AnimalId, string> = {
  bear,
  eagle,
  frog,
  panda,
  pig,
  shiba,
};

export interface AvatarConfig {
  animal: AnimalId;
  color: string;
  accessory: AccessoryId;
}

export const ANIMALS: { id: AnimalId; name: string; emoji: string }[] = [
  { id: "bear", name: "Bear", emoji: "🐻" },
  { id: "eagle", name: "Eagle", emoji: "🦅" },
  { id: "frog", name: "Frog", emoji: "🐸" },
  { id: "panda", name: "Panda", emoji: "🐼" },
  { id: "pig", name: "Pig", emoji: "🐷" },
  { id: "shiba", name: "Shiba", emoji: "🐕" },
];

export const COLOR_SWATCHES = [
  "#B8FF00",
  "#A855F7",
  "#FFE600",
  "#FF6FB5",
  "#5BE1FF",
  "#FF8A3D",
  "#7CF6B0",
  "#F6F0FA",
  "#FF4D6D",
  "#9DAEFF",
];

const ACCESSORY_EMOJI: Record<AccessoryId, string> = {
  none: "",
  tophat: "🎩",
  brain: "🧠",
  crown: "👑",
  grad: "🎓",
  cap: "🧢",
  star: "⭐",
  flower: "🌸",
  fire: "🔥",
  poop: "💩",
  goggles: "🥽",
  bolt: "⚡",
  ice: "🧊",
  bulb: "💡",
  disco: "🪩",
};

export const ACCESSORIES: { id: AccessoryId; name: string; unlock: string }[] = [
  { id: "none", name: "None", unlock: "Default" },
  { id: "cap", name: "Baseball cap", unlock: "Complete the Daily 5 for the first time" },
  { id: "tophat", name: "Top hat", unlock: "Reach a 1200+ predicted score" },
  { id: "brain", name: "Brain", unlock: "Reach a 1400+ predicted score" },
  { id: "crown", name: "Crown", unlock: "Reach a 1600 predicted score" },
  { id: "grad", name: "Graduation cap", unlock: "Unlock mastery for every domain" },
  { id: "star", name: "Gold star", unlock: "Reach 100% mastery in a domain" },
  { id: "flower", name: "Flower", unlock: "Answer 50 questions" },
  { id: "bolt", name: "Lightning bolt", unlock: "Answer 100 questions" },
  { id: "fire", name: "Fire", unlock: "Reach a momentum score of 10" },
  { id: "ice", name: "Ice cube", unlock: "Lose a momentum point" },
  { id: "goggles", name: "Goggles", unlock: "Hit a 5-day streak" },
  { id: "bulb", name: "Lightbulb", unlock: "Answer every Daily 5 question correctly" },
  { id: "poop", name: "Poop", unlock: "Miss every Daily 5 question" },
  { id: "disco", name: "Disco ball", unlock: "Raise your predicted score by 100+" },
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
            width: "115%",
            height: "115%",
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
            top: `-${Math.round(size * 0.02)}px`,
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
