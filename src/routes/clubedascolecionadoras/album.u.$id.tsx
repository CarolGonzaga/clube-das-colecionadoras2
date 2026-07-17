import { createFileRoute } from "@tanstack/react-router";
import PublicAlbumClient from "../../components/PublicAlbumClient";
import { dbService } from "../../lib/db";

export const Route = createFileRoute("/clubedascolecionadoras/album/u/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const { id } = params;

    // All calls are non-fatal — errors return empty/null data instead of crashing
    let profile = null;
    try {
      profile = await dbService.getProfile(id);
    } catch (_) {}

    if (!profile) {
      return { profile: null, stickers: [], userStickers: [], ownerStyles: [] };
    }

    const [stickers, userStickers] = await Promise.all([
      dbService.getStickers().catch(() => []),
      dbService.getPublicUserStickers(id).catch(() => []),
    ]);

    let ownerStyles: string[] = [];
    try {
      const userStyles = await dbService.getUserStyles(id);
      ownerStyles = userStyles.filter((s) => s.enabled).map((s) => s.style_id);
    } catch (_) {}

    return { profile, stickers, userStickers, ownerStyles };
  },
  component: PublicAlbum,
});

function PublicAlbum() {
  const data = Route.useLoaderData();

  if (!data.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p
            className="text-2xl font-bold"
            style={{ fontFamily: "'Fredoka', sans-serif", color: "#5c0d2b" }}
          >
            Álbum não encontrado 🌸
          </p>
          <p className="mt-2 text-sm" style={{ color: "#bf2a5e" }}>
            O link pode estar desatualizado ou a conta foi removida.
          </p>
          <a href="/" className="btn mt-6 inline-block" style={{ textDecoration: "none" }}>
            Ir para o início
          </a>
        </div>
      </div>
    );
  }

  return (
    <PublicAlbumClient
      profile={data.profile}
      stickers={data.stickers}
      userStickers={data.userStickers}
      ownerStyles={data.ownerStyles}
    />
  );
}
