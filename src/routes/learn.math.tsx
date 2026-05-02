import { createFileRoute } from "@tanstack/react-router";
import { WorldMap } from "@/components/WorldMap";
import { getWorldBySection } from "@/lib/content";
import { useHydration } from "@/lib/store";

export const Route = createFileRoute("/learn/math")({
  head: () => ({ meta: [{ title: "Math — ZenTest" }] }),
  component: MathMap,
});

function MathMap() {
  useHydration();
  return <WorldMap world={getWorldBySection("math")} />;
}
