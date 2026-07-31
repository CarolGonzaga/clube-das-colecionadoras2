import { createFileRoute } from "@tanstack/react-router";
import MemoryGameClient from "@/components/MemoryGameClient";
import { getMemoryGameState } from "@/lib/memoryGame";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/jogos/memoria")({
  loader: async () => {
    try {
      return await getMemoryGameState();
    } catch {
      return { available: false, session: null, reward: null };
    }
  },
  component: MemoryGamePage,
});
function MemoryGamePage() {
  return <MemoryGameClient initialState={Route.useLoaderData()} />;
}
