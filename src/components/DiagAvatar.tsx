// Avatar disc: animal PNGs with transparent backgrounds composited
// over a circular disc whose fill color is user-customizable.
import bear from "@/assets/avatars/bear.webp";
import frog from "@/assets/avatars/frog.webp";
import lion from "@/assets/avatars/lion.webp";
import panda from "@/assets/avatars/panda.webp";
import eagle from "@/assets/avatars/eagle.webp";
import croc from "@/assets/avatars/croc.webp";
import koala from "@/assets/avatars/koala.webp";
import bunny from "@/assets/avatars/bunny.webp";
import tiger from "@/assets/avatars/tiger.webp";
import penguin from "@/assets/avatars/penguin.webp";
import shiba from "@/assets/avatars/shiba.webp";
import pig from "@/assets/avatars/pig.webp";

export type AvatarId =
  | "bear" | "frog" | "lion" | "panda" | "eagle" | "croc"
  | "koala" | "bunny" | "tiger" | "penguin" | "shiba" | "pig";

export const AVATAR_IMAGES: Record<AvatarId, string> = {
  bear, frog, lion, panda, eagle, croc, koala, bunny, tiger, penguin, shiba, pig,
};

export const AVATAR_OPTIONS: { id: AvatarId; name: string }[] = [
  { id: "bear", name: "Bear" },
  { id: "frog", name: "Frog" },
  { id: "lion", name: "Lion" },
  { id: "panda", name: "Panda" },
  { id: "eagle", name: "Eagle" },
  { id: "croc", name: "Croc" },
  { id: "koala", name: "Koala" },
  { id: "bunny", name: "Bunny" },
  { id: "tiger", name: "Tiger" },
  { id: "penguin", name: "Penguin" },
  { id: "shiba", name: "Shiba" },
  { id: "pig", name: "Pig" },
];

interface Props {
  id: AvatarId;
  color: string;
  size?: number;
  ringWidth?: number;
}

export function DiagAvatar({ id, color, size = 96, ringWidth }: Props) {
  const src = AVATAR_IMAGES[id] ?? AVATAR_IMAGES.frog;
  const pad = ringWidth ?? 0;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: color,
        boxShadow: "0 6px 18px -8px rgba(0,0,0,0.45)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      aria-label="Avatar"
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: `calc(100% - ${pad * 2}px)`,
          height: `calc(100% - ${pad * 2}px)`,
          objectFit: "contain",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
