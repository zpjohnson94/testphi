// Avatar disc: animal PNGs with transparent backgrounds composited
// over a circular disc whose fill color is user-customizable.
import bear from "@/assets/avatars/bear.png";
import frog from "@/assets/avatars/frog.png";
import panda from "@/assets/avatars/panda.png";
import eagle from "@/assets/avatars/eagle.png";
import shiba from "@/assets/avatars/shiba.png";
import pig from "@/assets/avatars/pig.png";

export type AvatarId = "bear" | "frog" | "panda" | "eagle" | "shiba" | "pig";

export const AVATAR_IMAGES: Record<AvatarId, string> = {
  bear,
  frog,
  panda,
  eagle,
  shiba,
  pig,
};

export const AVATAR_OPTIONS: { id: AvatarId; name: string }[] = [
  { id: "bear", name: "Bear" },
  { id: "frog", name: "Frog" },
  { id: "panda", name: "Panda" },
  { id: "eagle", name: "Eagle" },
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
          width: `calc(115% - ${pad * 2}px)`,
          height: `calc(115% - ${pad * 2}px)`,
          objectFit: "contain",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
