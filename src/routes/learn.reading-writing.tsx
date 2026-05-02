import { createFileRoute } from "@tanstack/react-router";
import { WorldMap } from "@/components/WorldMap";
import { getWorldBySection } from "@/lib/content";
import { useHydration } from "@/lib/store";

export const Route = createFileRoute("/learn/reading-writing")({
  head: () => ({ meta: [{ title: "Reading & Writing — ZenTest" }] }),
  component: RWMap,
});

function RWMap() {
  useHydration();
  return <WorldMap world={getWorldBySection("rw")} />;
}
