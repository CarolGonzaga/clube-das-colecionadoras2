import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { dbService, supabase } from "../../lib/db";
import { isUserAllowedInMaintenance } from "../../lib/maintenance";
import { UIProvider, useUI } from "../../components/UIProvider";
import { ThemeProvider } from "../../components/ThemeProvider";
import TopBar from "../../components/TopBar";
import Navigation from "../../components/Navigation";
import { getCollectionStatus, TOTAL_ALBUM_STICKERS } from "../../lib/albumRules";
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
        albumRewardClaimed: false,
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
    const albumRewardClaimed = await dbService.getAlbumRewardClaimed(user.id);

    const rewardIds = ["lilac", "avatar-neon-frame", "new-icon", "theme-dark"];
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
      albumRewardClaimed,
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

      await syncActionableNotifications();
    };

    // Rebuild actionable notifications from the current database state. Local
    // storage only keeps presentation state (seen/dismissed); it is no longer
    // treated as the source of truth for collections or trades.
    const syncActionableNotifications = async () => {
      try {
        const [resolved, incoming, completedTags] = await Promise.all([
          dbService.getResolvedTrades().catch(() => []),
          dbService.getIncomingTrades().catch(() => []),
          dbService.getCompletedTags().catch(() => []),
        ]);
        let savedNotifs: any[] = [];
        try {
          const parsed = JSON.parse(localStorage.getItem("trade_notifications") || "[]");
          savedNotifs = Array.isArray(parsed) ? parsed : [];
        } catch {
          savedNotifs = [];
        }

        const previousById = new Map(savedNotifs.map((notification) => [notification.id, notification]));
        const managedTypes = new Set([
          "collection_completed",
          "trade_claim",
          "trade_request",
          "welcome_username",
        ]);
        const next = savedNotifs.filter((notification) => !managedTypes.has(notification.type));
        const addSynced = (notification: any) => {
          const previous = previousById.get(notification.id);
          next.push({
            ...notification,
            date: previous?.date || notification.date,
            seen: previous?.seen || false,
          });
        };

        if (data.profile.needs_username_update) {
          addSynced({
            id: `welcome_username_${data.profile.id}`,
            type: "welcome_username",
            message:
              "Boas-vindas à versão 2.0! Defina seu apelido definitivo na página de Configurações.",
            date: new Date().toISOString(),
          });
        }

        incoming
          .filter((trade) => trade.status === "pending")
          .forEach((trade) =>
            addSynced({
              id: `trade-request-${trade.id}`,
              type: "trade_request",
              message: `Você recebeu uma solicitação de troca de @${trade.initiator_nick || "colecionadora"}.`,
              date: trade.created_at,
            }),
          );

        resolved
          .filter((trade) => {
            if (trade.status !== "accepted") return false;
            const isInitiator = trade.initiator_id === data.profile.id;
            return !(isInitiator ? trade.initiator_claimed : trade.receiver_claimed);
          })
          .forEach((trade) =>
            addSynced({
              id: `trade-claim-${trade.id}`,
              type: "trade_claim",
              message: "Troca realizada! Abra o histórico de trocas para resgatar sua figurinha.",
              date: trade.resolved_at || trade.created_at,
            }),
          );

        const collectionByCanonicalName = new Map<string, (typeof completedTags)[number]>();
        completedTags.forEach((tag) => {
          if (tag.claimed) return;
          const canonicalName = tag.tag_name.startsWith("Coleção ")
            ? tag.tag_name
            : `Coleção ${tag.tag_name}`;
          collectionByCanonicalName.set(canonicalName, { ...tag, tag_name: canonicalName });
        });
        collectionByCanonicalName.forEach((tag) =>
          addSynced({
            id: `completed-tag-${tag.tag_name}`,
            type: "collection_completed",
            message: `Parabéns! Você completou a ${tag.tag_name}! Você possui um prêmio para resgatar.`,
            date: tag.completed_at || new Date().toISOString(),
          }),
        );

        next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const serialized = JSON.stringify(next);
        if (serialized !== JSON.stringify(savedNotifs)) {
          localStorage.setItem("trade_notifications", serialized);
          window.dispatchEvent(new Event("trade_notifications_change"));
        }
      } catch (err) {
        console.error("Error syncing notifications:", err);
      }
    };

    syncActionableNotifications();
    const notificationSyncInterval = window.setInterval(syncActionableNotifications, 180000);
    window.addEventListener("focus", syncActionableNotifications);

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
      window.clearInterval(notificationSyncInterval);
      window.removeEventListener("focus", syncActionableNotifications);
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
  const { pct, statusText } = getCollectionStatus(ownedCount);

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
