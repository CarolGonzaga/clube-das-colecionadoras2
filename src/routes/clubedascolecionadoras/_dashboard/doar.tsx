import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import DoarClient from "../../../components/DoarClient";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/doar")({
  component: DashboardDoar,
});

function DashboardDoar() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });

  return (
      <DoarClient
        stickers={parentData.stickers}
        initialUserStickers={parentData.userStickers}
        profileId={parentData.profile.id}
      />
  );
}
