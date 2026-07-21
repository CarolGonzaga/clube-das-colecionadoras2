import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import MuralClient from "../../../components/MuralClient";
import { dbService } from "../../../lib/db";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/mural")({
  loader: async () => ({
    muralList: await dbService.getMural().catch(() => []),
  }),
  component: DashboardMural,
});

function DashboardMural() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const { muralList } = Route.useLoaderData();

  // Calculate ownedCount & pct
  const ownedCount = parentData.userStickers.filter((us: any) => us.copies > 0).length;
  return <MuralClient profile={parentData.profile} muralList={muralList} ownedCount={ownedCount} />;
}
