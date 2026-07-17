import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { dbService } from "../../../lib/db";
import TrocasClient from "../../../components/TrocasClient";
import type { TradeRequest, Donation } from "../../../lib/types";
import { z } from "zod";

const searchSchema = z.object({
  tab: z.string().optional(),
});

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/trocas")({
  validateSearch: searchSchema,
  loader: async (): Promise<{
    incomingTrades: TradeRequest[];
    outgoingTrades: TradeRequest[];
    resolvedTrades: TradeRequest[];
    pointsBalance: number;
    donations: Donation[];
  }> => {
    if (typeof window === "undefined") {
      return { incomingTrades: [], outgoingTrades: [], resolvedTrades: [], pointsBalance: 0, donations: [] };
    }
    const user = await dbService.getCurrentUser();
    const userId = user ? user.id : "";
    const [incomingTrades, outgoingTrades, resolvedTrades, pointsBalance, donations] = await Promise.all([
      dbService.getIncomingTrades().catch(() => [] as TradeRequest[]),
      dbService.getOutgoingTrades().catch(() => [] as TradeRequest[]),
      dbService.getResolvedTrades().catch(() => [] as TradeRequest[]),
      dbService.getPointsBalance().catch(() => 0),
      userId ? dbService.getOutgoingDonations(userId).catch(() => [] as Donation[]) : Promise.resolve([] as Donation[]),
    ]);
    return { incomingTrades, outgoingTrades, resolvedTrades, pointsBalance, donations };
  },
  component: DashboardTrocas,
});

function DashboardTrocas() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const localData = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <TrocasClient
      stickers={parentData.stickers}
      initialUserStickers={parentData.userStickers}
      profileId={parentData.profile.id}
      profileNick={parentData.profile.nick}
      initialIncoming={localData?.incomingTrades ?? []}
      initialOutgoing={localData?.outgoingTrades ?? []}
      initialResolved={localData?.resolvedTrades ?? []}
      initialPointsBalance={localData?.pointsBalance ?? 0}
      initialDonations={localData?.donations ?? []}
      initialTab={search.tab}
    />
  );
}
