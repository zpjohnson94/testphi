import { createFileRoute } from "@tanstack/react-router";
import { ChestReveal } from "@/components/ChestReveal";

export const Route = createFileRoute("/test-chest")({
  component: () => (
    <ChestReveal
      domainName="Algebra"
      masteryPct={73}
      bonusSummary={{ correct: 2, total: 3, domainAnswered: 7 }}
      onDone={() => {}}
    />
  ),
});
