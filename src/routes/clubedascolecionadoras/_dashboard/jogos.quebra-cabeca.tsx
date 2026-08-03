import { createFileRoute } from "@tanstack/react-router";
import PuzzleGameClient from "@/components/PuzzleGameClient";
import { getPuzzleGameState } from "@/lib/games";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/jogos/quebra-cabeca")({
  loader: async () => {
    try {
      return await getPuzzleGameState();
    } catch {
      return { available: false, session: null, reward: null };
    }
  },
  component: PuzzleGamePage,
});

function PuzzleGamePage() {
  return <PuzzleGameClient />;
}
