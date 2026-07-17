import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import AlbumClient from "../../../components/AlbumClient";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/album")({
  component: DashboardAlbum,
});

function DashboardAlbum() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });

  return (
    <AlbumClient
      profile={parentData.profile}
      stickers={parentData.stickers}
      userStickers={parentData.userStickers}
    />
  );
}
