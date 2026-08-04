import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import AlbumClient from "../../../components/AlbumClient";
import { getGameAlbum } from "@/lib/gameAlbum";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/album")({
  loader: () => getGameAlbum(),
  component: DashboardAlbum,
});

function DashboardAlbum() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const gameAlbum = Route.useLoaderData();

  return (
    <AlbumClient
      profile={parentData.profile}
      stickers={parentData.stickers}
      userStickers={parentData.userStickers}
      gameAlbum={gameAlbum}
    />
  );
}
