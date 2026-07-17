import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { dbService } from "../../../lib/db";
import TrocasClient from "../../../components/TrocasClient";
import type { TradeRequest } from "../../../lib/types";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/trocas")({
  loader: async (): Promise<{
    incomingTrades: TradeRequest[];
    outgoingTrades: TradeRequest[];
    resolvedTrades: TradeRequest[];
    pointsBalance: number;
  }> => {
    if (typeof window === "undefined") {
      return { incomingTrades: [], outgoingTrades: [], resolvedTrades: [], pointsBalance: 0 };
    }
    const [incomingTrades, outgoingTrades, resolvedTrades, pointsBalance] = await Promise.all([
      dbService.getIncomingTrades().catch(() => [] as TradeRequest[]),
      dbService.getOutgoingTrades().catch(() => [] as TradeRequest[]),
      dbService.getResolvedTrades().catch(() => [] as TradeRequest[]),
      dbService.getPointsBalance().catch(() => 0),
    ]);
    return { incomingTrades, outgoingTrades, resolvedTrades, pointsBalance };
  },
  component: DashboardTrocas,
});

function DashboardTrocas() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const localData = Route.useLoaderData();

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
    />
  );
}
