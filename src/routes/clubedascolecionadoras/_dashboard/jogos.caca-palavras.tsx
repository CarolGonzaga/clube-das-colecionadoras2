import { createFileRoute } from "@tanstack/react-router";
import WordSearchClient from "@/components/WordSearchClient";
import { getDailyGamesState } from "@/lib/games";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/jogos/caca-palavras")({
  loader: async () => {
    try {
      return await getDailyGamesState();
    } catch {
      return { available: false, session: null, reward: null };
    }
  },
  component: WordSearchPage,
});

function WordSearchPage() {
  return <WordSearchClient initialState={Route.useLoaderData()} />;
}
