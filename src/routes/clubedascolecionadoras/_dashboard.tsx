import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { dbService, supabase } from "../../lib/db";
import { UIProvider, useUI } from "../../components/UIProvider";
import { ThemeProvider } from "../../components/ThemeProvider";
import TopBar from "../../components/TopBar";
import Navigation from "../../components/Navigation";
import { TOTAL_ALBUM_STICKERS } from "../../lib/albumRules";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return; // Skip auth checks on SSR to avoid redirecting to login on refresh
    const user = await dbService.getCurrentUser();
    if (!user) {
      throw redirect({
        to: "/clubedascolecionadoras/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: async () => {
    if (typeof window === "undefined") {
      // Return structured skeleton data to server render safely without hitting local database
      return {
        profile: {
          id: "",
          nick: "Colecionadora",
          avatar_url: null,
          avatar_emoji: "📷",
          mural_opt_in: true,
          created_at: "",
        },
        stickers: [],
        userStickers: [],
        userStyles: [],
        claimedToday: false,
        completedMissions: [],
        dailyClaimsCount: 0,
        releaseDayNumber: 1,
        allElementsClaimed: false,
        userRank: null,
        donations: [],
        pendingTradesCount: 0,
        pointsBalance: 0,
      };
    }

    const user = await dbService.getCurrentUser();
    if (!user) {
      throw redirect({ to: "/clubedascolecionadoras/login" });
    }
    const profile = await dbService.getProfile(user.id);
    const stickers = await dbService.getStickers();
    const userStickers = await dbService.getUserStickers(user.id);
    const userStyles = await dbService.getUserStyles(user.id);
    const claimedToday = await dbService.getClaimedToday(user.id);
    const completedMissions = await dbService.getCompletedMissions(user.id);
    const dailyClaimsCount = await dbService.getDailyClaimsCount(user.id);
    const releaseDayNumber = await dbService.getReleaseDayNumber();
    const userRank = await dbService.getUserMuralRank(user.id);
    const donations = await dbService.getOutgoingDonations(user.id);
    const pendingTradesCount = await dbService.countIncomingPendingTrades().catch(() => 0);
    const pointsBalance = await dbService.getPointsBalance().catch(() => 0);

    const rewardIds = ["lilac", "avatar-neon-frame", "new-icon", "theme-dark", "story-layout"];
    const allElementsClaimed = rewardIds.every((id) =>
      userStyles.some((s) => s.style_id === id && s.unlocked),
    );

    return {
      profile: profile || {
        id: user.id,
        nick: "Colecionadora",
        avatar_url: null,
        avatar_emoji: "📷",
        mural_opt_in: true,
        created_at: new Date().toISOString(),
      },
      stickers,
      userStickers,
      userStyles,
      claimedToday,
      completedMissions,
      dailyClaimsCount,
      releaseDayNumber,
      allElementsClaimed,
      userRank,
      donations,
      pendingTradesCount,
      pointsBalance,
    };
  },
  component: DashboardLayout,
});

function DashboardInner({ data, ownedCount, pct, statusText }: any) {
  const router = useRouter();
  const ui = useUI();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = setInterval(() => {
      router.invalidate();
    }, 180000); // 3 minutes
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined" || !data.profile?.id) return;

    const channel = supabase
      .channel("realtime-trades")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_requests" },
        async (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          const isReceiver = newRow?.receiver_id === data.profile.id;
          const isInitiator = newRow?.initiator_id === data.profile.id;

          if (!isReceiver && !isInitiator) return;

          if (payload.eventType === "INSERT" && isReceiver) {
            ui.toast(`Você recebeu uma nova solicitação de troca! 🔄`);
            router.invalidate();
          }

          if (payload.eventType === "UPDATE") {
            if (newRow.status === "accepted" && oldRow?.status === "pending") {
              const gainedSticker = isInitiator ? newRow.receiver_sticker : newRow.initiator_sticker;
              const formattedNumber = String(gainedSticker).padStart(3, "0");
              
              ui.toast(`Troca realizada! Você recebeu a figurinha #${formattedNumber} 🎉`);
              
              if (ui.triggerHearts) ui.triggerHearts();
              router.invalidate();

              const savedNotifs = JSON.parse(localStorage.getItem("trade_notifications") || "[]");
              savedNotifs.unshift({
                id: newRow.id,
                message: `Troca realizada! Você recebeu a figurinha #${formattedNumber}`,
                date: new Date().toISOString(),
                seen: false
              });
              localStorage.setItem("trade_notifications", JSON.stringify(savedNotifs));
              window.dispatchEvent(new Event("trade_notifications_change"));
            } else if (newRow.status === "rejected" && oldRow?.status === "pending") {
              if (isInitiator) {
                ui.toast(`Sua solicitação de troca foi recusada. ❌`);
                router.invalidate();
              }
            } else if (newRow.status === "cancelled" && oldRow?.status === "pending") {
              if (isReceiver) {
                ui.toast(`Uma solicitação de troca foi cancelada pelo iniciador. ❌`);
                router.invalidate();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data.profile?.id, router, ui]);

  return (
    <div className="club-dashboard-shell mx-auto max-w-[460px] h-screen overflow-hidden bg-background text-foreground relative">
      <Navigation pendingTradesCount={data.pendingTradesCount} />
      <div className="club-dashboard-main flex min-w-0 flex-col">
        <TopBar ownedCount={ownedCount} pct={pct} statusText={statusText} />
        <div className="club-dashboard-scroll flex-1 overflow-y-auto pb-[106px] min-h-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const data = Route.useLoaderData();

  // Calculate active styles for ThemeProvider
  const initialStyles = data.userStyles.filter((s) => s.enabled).map((s) => s.style_id);

  // Compute values for TopBar
  const ownedCount = data.userStickers.filter((us) => us.copies > 0).length;
  const albumTotal = Math.max(data.stickers.length, TOTAL_ALBUM_STICKERS);
  const pct = Math.round((ownedCount / albumTotal) * 100);

  // Status phrases mapping
  const statusPhrases = [
    [1, "Coleção começando"],
    [16, "Coleção Bronze"],
    [41, "Coleção Prata"],
    [66, "Coleção Ouro"],
    [100, "Coleção Purpurina"],
  ];
  let statusText = "Coleção começando";
  for (const [min, txt] of statusPhrases) {
    if (pct >= (min as number)) {
      statusText = txt as string;
    }
  }
  if (pct === 0) statusText = "Coleção começando";

  return (
    <ThemeProvider initialStyles={initialStyles}>
      <UIProvider>
        <DashboardInner
          data={data}
          ownedCount={ownedCount}
          pct={pct}
          statusText={statusText}
        />
      </UIProvider>
    </ThemeProvider>
  );
}

