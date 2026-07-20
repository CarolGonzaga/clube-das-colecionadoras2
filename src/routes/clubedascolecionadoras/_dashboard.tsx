import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { dbService, supabase } from "../../lib/db";
import { isUserAllowedInMaintenance } from "../../lib/maintenance";
import { UIProvider, useUI } from "../../components/UIProvider";
import { ThemeProvider } from "../../components/ThemeProvider";
import TopBar from "../../components/TopBar";
import Navigation from "../../components/Navigation";
import { TOTAL_ALBUM_STICKERS } from "../../lib/albumRules";
import { POINTS_BALANCE_CHANGED } from "../../lib/walletEvents";

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
    if (!isUserAllowedInMaintenance(user.id)) {
      throw redirect({ to: "/clubedascolecionadoras/manutencao" as any });
    }
  },
  loader: async () => {
    if (typeof window === "undefined") {
      // Return structured skeleton data to server render safely without hitting local database
      return {
        profile: {
          id: "",
          nick: "Colecionadora",
          username: null,
          needs_username_update: false,
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
    if (!isUserAllowedInMaintenance(user.id)) {
      throw redirect({ to: "/clubedascolecionadoras/manutencao" as any });
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
        username: null,
        needs_username_update: false,
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
    if (typeof window === "undefined") return;
    const handlePointsChange = () => {
      router.invalidate();
    };
    window.addEventListener(POINTS_BALANCE_CHANGED, handlePointsChange);
    return () => window.removeEventListener(POINTS_BALANCE_CHANGED, handlePointsChange);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined" || !data.profile?.id) return;
    if (data.profile.needs_username_update) {
      const savedNotifs = JSON.parse(localStorage.getItem("trade_notifications") || "[]");
      const notifId = `welcome_username_${data.profile.id}`;
      if (!savedNotifs.some((n: any) => n.id === notifId)) {
        const welcomeNotif = {
          id: notifId,
          type: "welcome_username",
          message:
            "Boas vindas a versão 2.0 do Clube! Seu progresso foi migrado com sucesso. Geramos um apelido temporário para você. Por favor, vá em Configurações para definir seu apelido único definitivo!",
          date: new Date().toISOString(),
          seen: false,
        };
        localStorage.setItem("trade_notifications", JSON.stringify([welcomeNotif, ...savedNotifs]));
        window.dispatchEvent(new Event("trade_notifications_change"));
      }
    }
  }, [data.profile]);

  useEffect(() => {
    if (typeof window === "undefined" || !data.profile?.id) return;

    const handlePayload = async (payload: any) => {
      const newRow = payload.new as any;
      const oldRow = payload.old as any;
      const isReceiver = newRow?.receiver_id === data.profile.id;
      const isInitiator = newRow?.initiator_id === data.profile.id;

      if (payload.eventType === "INSERT" && isReceiver) {
        ui.toast(`Você recebeu uma nova solicitação de troca! 🔄`);
        router.invalidate();
      }

      if (payload.eventType === "UPDATE") {
        if (newRow.status === "accepted" && oldRow?.status === "pending") {
          ui.toast(`Troca realizada! Abra o histórico de trocas para resgatar sua figurinha. 🎁`);
          router.invalidate();

          const savedNotifs = JSON.parse(localStorage.getItem("trade_notifications") || "[]");
          const filtered = savedNotifs.filter((n: any) => n.id !== newRow.id);
          filtered.unshift({
            id: newRow.id,
            type: "trade_claim",
            message: "Troca realizada! Abra o histórico de trocas para resgatar sua figurinha.",
            date: new Date().toISOString(),
            seen: false
          });
          localStorage.setItem("trade_notifications", JSON.stringify(filtered));
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
    };

    // Client-side synchronization to local storage notifications
    const syncPendingClaims = async () => {
      try {
        const resolved = await dbService.getResolvedTrades().catch(() => []);
        if (!resolved || resolved.length === 0) return;

        let hasNew = false;
        const savedNotifs = JSON.parse(localStorage.getItem("trade_notifications") || "[]");
        
        for (const tr of resolved) {
          if (tr.status === "accepted") {
            const isMeInitiator = tr.initiator_id === data.profile.id;
            const isClaimed = isMeInitiator ? tr.initiator_claimed : tr.receiver_claimed;
            
            if (!isClaimed) {
              const exists = savedNotifs.some((n: any) => n.id === tr.id);
              if (!exists) {
                savedNotifs.unshift({
                  id: tr.id,
                  type: "trade_claim",
                  message: "Troca realizada! Abra o histórico de trocas para resgatar sua figurinha.",
                  date: tr.resolved_at || new Date().toISOString(),
                  seen: false
                });
                hasNew = true;
              }
            } else {
              const notifIndex = savedNotifs.findIndex((n: any) => n.id === tr.id);
              if (notifIndex !== -1 && !savedNotifs[notifIndex].seen) {
                savedNotifs[notifIndex].seen = true;
                hasNew = true;
              }
            }
          }
        }

        if (hasNew) {
          localStorage.setItem("trade_notifications", JSON.stringify(savedNotifs));
          window.dispatchEvent(new Event("trade_notifications_change"));
        }
      } catch (err) {
        console.error("Error syncing pending claims:", err);
      }
    };

    syncPendingClaims();

    const channelInitiator = supabase
      .channel(`trades-initiator-${data.profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trade_requests",
          filter: `initiator_id=eq.${data.profile.id}`,
        },
        handlePayload,
      )
      .subscribe();

    const channelReceiver = supabase
      .channel(`trades-receiver-${data.profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trade_requests",
          filter: `receiver_id=eq.${data.profile.id}`,
        },
        handlePayload,
      )
      .subscribe();

    const channelPoints = supabase
      .channel(`points-${data.profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_points",
          filter: `user_id=eq.${data.profile.id}`,
        },
        () => {
          window.dispatchEvent(new Event(POINTS_BALANCE_CHANGED));
          router.invalidate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelInitiator);
      supabase.removeChannel(channelReceiver);
      supabase.removeChannel(channelPoints);
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
  const baseStickersCount = data.stickers.filter((s: any) => s.type !== "bonus").length;
  const albumTotal = Math.max(baseStickersCount, TOTAL_ALBUM_STICKERS);
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
