import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import HomeClient from "../../../components/HomeClient";
import { dbService } from "../../../lib/db";
import { isRareStickerVersion } from "../../../lib/albumRules";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/")({
  loader: async () => ({
    muralList: await dbService.getMural().catch(() => []),
  }),
  component: DashboardIndex,
});

function DashboardIndex() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const { muralList } = Route.useLoaderData();

  // Find owned sticker slugs
  const ownedStickers = parentData.userStickers.filter((us) => us.copies > 0);

  const ownedSlugs = ownedStickers
    .map((us) => {
      const s = parentData.stickers.find((st) => st.number === us.sticker_number);
      return s ? s.slug : "";
    })
    .filter(Boolean);

  const autoSlugs = ownedStickers
    .filter((us) => isRareStickerVersion(us.sticker_number, us))
    .map((us) => {
      const s = parentData.stickers.find((st) => st.number === us.sticker_number);
      return s ? s.slug : "";
    })
    .filter(Boolean);

  const duplicatesCount = parentData.userStickers.reduce((acc, us) => {
    if (us.copies > 1) {
      return acc + (us.copies - 1);
    }
    return acc;
  }, 0);

  const rareCount = parentData.userStickers.filter((us) => us.copies > 0 && isRareStickerVersion(us.sticker_number, us)).length;

  return (
    <HomeClient
      profile={parentData.profile}
      stickers={parentData.stickers}
      ownedSlugs={ownedSlugs}
      autoSlugs={autoSlugs}
      duplicatesCount={duplicatesCount}
      rareCount={rareCount}
      completedMissionIds={parentData.completedMissions}
      claimedToday={parentData.claimedToday}
      muralList={muralList}
      userStyles={parentData.userStyles}
      dailyClaimsCount={parentData.dailyClaimsCount}
      allElementsClaimed={parentData.allElementsClaimed}
      releaseDayNumber={parentData.releaseDayNumber}
      userRank={parentData.userRank}
      donations={parentData.donations}
    />
  );
}
