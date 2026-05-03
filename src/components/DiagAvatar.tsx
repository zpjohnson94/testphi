// Avatar disc: animal PNGs with transparent backgrounds composited
// over a circular disc whose fill color is user-customizable.
import bear from "@/assets/avatars/bear.png";
import fox from "@/assets/avatars/fox.png";
import lion from "@/assets/avatars/lion.png";
import panda from "@/assets/avatars/panda.png";
import owl from "@/assets/avatars/owl.png";
import croc from "@/assets/avatars/croc.png";
import koala from "@/assets/avatars/koala.png";
import bunny from "@/assets/avatars/bunny.png";
import tiger from "@/assets/avatars/tiger.png";
import penguin from "@/assets/avatars/penguin.png";
import shiba from "@/assets/avatars/shiba.png";
import pig from "@/assets/avatars/pig.png";

export type AvatarId =
  | "bear" | "fox" | "lion" | "panda" | "owl" | "croc"
  | "koala" | "bunny" | "tiger" | "penguin" | "shiba" | "pig";

export const AVATAR_IMAGES: Record<AvatarId, string> = {
  bear, fox, lion, panda, owl, croc, koala, bunny, tiger, penguin, shiba, pig,
};

export const AVATAR_OPTIONS: { id: AvatarId; name: string }[] = [
  { id: "bear", name: "Bear" },
  { id: "fox", name: "Fox" },
  { id: "lion", name: "Lion" },
  { id: "panda", name: "Panda" },
  { id: "owl", name: "Owl" },
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
  const rw = ringWidth ?? Math.max(3, Math.round(size * 0.06));
  const src = AVATAR_IMAGES[id] ?? AVATAR_IMAGES.fox;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: color,
        padding: rw,
        boxShadow: "0 6px 18px -8px rgba(0,0,0,0.45)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Avatar"
    >
      <img
        src={src}
        alt=""
        width={size - rw * 2}
        height={size - rw * 2}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "9999px",
          objectFit: "cover",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
