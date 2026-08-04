import { createFileRoute } from "@tanstack/react-router";
import CoverGuesserClient from "@/components/CoverGuesserClient";
import { getCoverGuesserState } from "@/lib/coverGuesser";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/jogos/adivinhe-a-capa")({
  loader: async () => {
    try {
      return await getCoverGuesserState();
    } catch {
      return { available: false, session: null, reward: null };
    }
  },
  component: CoverGuesserPage,
});

function CoverGuesserPage() {
  return <CoverGuesserClient />;
}
