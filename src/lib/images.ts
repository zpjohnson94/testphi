// Shared image URLs and a helper for warming them ahead of use.
//
// Art that appears at the start of an animation must already be in the browser
// cache by the time it mounts, otherwise the animation stalls on the download.
// Screens that lead into such a moment call `preloadImage` while the user is
// still busy with something else.
import chestBuried from "@/assets/chest-buried.png";

export const CHEST_IMAGE = chestBuried;

export function preloadImage(src: string): void {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.src = src;
}
