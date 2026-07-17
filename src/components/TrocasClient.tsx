import React, { useState, useEffect, useCallback } from "react";
import { Sticker, UserSticker, TradeRequest, TradeUserLookup } from "@/lib/types";
import { useUI } from "@/components/UIProvider";
import { useRouter } from "@tanstack/react-router";
import {
  lookupUserByNickAction,
  createTradeRequestAction,
  getIncomingTradesAction,
  getOutgoingTradesAction,
  respondToTradeAction,
  cancelTradeAction,
  getPointsBalanceAction,
  exchangeForPointsAction,
  getResolvedTradesAction,
  claimTradeRewardAction,
} from "@/lib/actions";
import Stamp from "./Stamp";
import {
  ArrowLeftRight,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Copy,
  Search,
  Wallet,
  HeartHandshake,
  ShoppingBag,
  Repeat,
  Bell,
  Send,
  Inbox,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrocasClientProps {
  stickers: Sticker[];
  initialUserStickers: UserSticker[];
  profileId: string;
  profileNick: string;
  initialIncoming: TradeRequest[];
  initialOutgoing: TradeRequest[];
  initialResolved: TradeRequest[];
  initialPointsBalance: number;
  initialTab?: string;
}

type MainTab = "free" | "shop" | "requests";
type RequestsSubTab = "incoming" | "outgoing" | "history";
type TradeFlowStep = "idle" | "enter-nick" | "confirm-user" | "select-sticker" | "confirm-trade";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirada";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function isImageAvatar(avatar: string | null | undefined) {
  if (!avatar) return false;
  return avatar.startsWith("http") || avatar.startsWith("/") || avatar.includes(".");
}

function avatarDisplay(
  avatarUrl: string | null | undefined,
  avatarEmoji: string | null | undefined,
  nick: string,
) {
  const avatar = avatarUrl || avatarEmoji;
  if (isImageAvatar(avatar)) {
    return (
      <img
        src={avatar!}
        alt={nick}
        className="w-9 h-9 rounded-full object-cover border-2 border-pink-200"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-pink-100 border-2 border-pink-200 flex items-center justify-center text-lg">
      {avatarEmoji || "📷"}
    </div>
  );
}

function statusBadge(status: TradeRequest["status"]) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "badge-pending" },
    accepted: { label: "Aceita ✓", cls: "badge-accepted" },
    rejected: { label: "Recusada", cls: "badge-rejected" },
    cancelled: { label: "Cancelada", cls: "badge-cancelled" },
    expired: { label: "Expirada", cls: "badge-expired" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <span className={`trade-status-badge ${s.cls}`}>{s.label}</span>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StickerDupeCardProps {
  stickerNumber: number;
  stickerName: string;
  copies: number;
  isRare: boolean;
  onTrade?: () => void;
  onExchange?: () => void;
  exchangeLoading?: boolean;
  category: "free" | "shop";
}

function StickerDupeCard({
  stickerNumber,
  stickerName,
  copies,
  isRare,
  onTrade,
  onExchange,
  exchangeLoading,
  category,
}: StickerDupeCardProps) {
  const qty = copies - 1;
  return (
    <div className="trade-dupe-card">
      <div className="trade-dupe-thumb">
        <Stamp number={stickerNumber} owned={true} auto={isRare} cover={null} />
      </div>
      <div className="trade-dupe-info">
        <b>
          #{String(stickerNumber).padStart(3, "0")} · {stickerName}
        </b>
        <span>{qty} repetida{qty !== 1 ? "s" : ""}</span>
        {category === "shop" && (
          <span className="trade-shop-tag">
            <ShoppingBag className="w-3 h-3 inline mr-0.5" />
            Loja
          </span>
        )}
      </div>
      <div className="trade-dupe-actions">
        {onTrade && (
          <button className="btn sm trade-btn-trade" onClick={onTrade} title="Trocar com outra usuária">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Trocar</span>
          </button>
        )}
        {onExchange && (
          <button
            className="btn sm trade-btn-points"
            onClick={onExchange}
            disabled={exchangeLoading}
            title="Trocar por 45 pontos"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{exchangeLoading ? "..." : "45 pts"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrocasClient({
  stickers,
  initialUserStickers,
  profileId,
  profileNick,
  initialIncoming,
  initialOutgoing,
  initialResolved,
  initialPointsBalance,
  initialTab,
}: TrocasClientProps) {
  const ui = useUI();
  const router = useRouter();

  // State
  const [mainTab, setMainTab] = useState<MainTab>(
    initialTab === "history" || initialTab === "requests" ? "requests" : "free"
  );
  const [requestsSubTab, setRequestsSubTab] = useState<RequestsSubTab>(
    initialTab === "history" ? "history" : "incoming"
  );
  const [userStickers, setUserStickers] = useState<UserSticker[]>(initialUserStickers);
  const [incoming, setIncoming] = useState<TradeRequest[]>(initialIncoming);
  const [outgoing, setOutgoing] = useState<TradeRequest[]>(initialOutgoing);
  const [resolved, setResolved] = useState<TradeRequest[]>(initialResolved);
  const [pointsBalance, setPointsBalance] = useState(initialPointsBalance);
  const [exchangeLoading, setExchangeLoading] = useState<Record<number, boolean>>({});
  const [respondLoading, setRespondLoading] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Trade flow state
  const [flowStep, setFlowStep] = useState<TradeFlowStep>("idle");
  const [flowCategory, setFlowCategory] = useState<"free" | "shop">("free");
  const [flowMySticker, setFlowMySticker] = useState<number | null>(null);
  const [flowNickInput, setFlowNickInput] = useState("");
  const [flowNickLoading, setFlowNickLoading] = useState(false);
  const [flowLookup, setFlowLookup] = useState<TradeUserLookup | null>(null);
  const [flowDesiredSticker, setFlowDesiredSticker] = useState<number | null>(null);
  const [tradeSubmitting, setTradeSubmitting] = useState(false);

  useEffect(() => {
    setUserStickers(initialUserStickers);
  }, [initialUserStickers]);

  useEffect(() => {
    setIncoming(initialIncoming);
  }, [initialIncoming]);

  useEffect(() => {
    setOutgoing(initialOutgoing);
  }, [initialOutgoing]);

  useEffect(() => {
    setResolved(initialResolved);
  }, [initialResolved]);

  useEffect(() => {
    setPointsBalance(initialPointsBalance);
  }, [initialPointsBalance]);

  useEffect(() => {
    if (initialTab === "history") {
      setMainTab("requests");
      setRequestsSubTab("history");
    } else if (initialTab === "requests") {
      setMainTab("requests");
      setRequestsSubTab("incoming");
    }
  }, [initialTab]);

  // Refresh incoming/outgoing/resolved trades
  const refreshTrades = useCallback(async () => {
    setRefreshing(true);
    try {
      const [inc, out, res, bal] = await Promise.all([
        getIncomingTradesAction(),
        getOutgoingTradesAction(),
        getResolvedTradesAction(),
        getPointsBalanceAction(),
      ]);
      if (inc.success && inc.data) setIncoming(inc.data);
      if (out.success && out.data) setOutgoing(out.data);
      if (res.success && res.data) setResolved(res.data);
      if (bal.success) setPointsBalance(bal.balance);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const [claimLoading, setClaimLoading] = useState<Record<string, boolean>>({});

  const handleClaimSticker = async (tradeId: string) => {
    setClaimLoading((prev) => ({ ...prev, [tradeId]: true }));
    const res = await claimTradeRewardAction(tradeId);
    setClaimLoading((prev) => ({ ...prev, [tradeId]: false }));

    if (res.success && res.data) {
      router.invalidate();
      ui.showReveals(
        [
          {
            slug: `sticker-${res.data.sticker_number}`,
            number: res.data.sticker_number,
            wasNew: false,
            isRare: res.data.is_rare,
            repeat: false,
            reward: null,
          },
        ],
        "Troca Recebida!",
      );
    } else {
      ui.toast(res.message || "Erro ao resgatar figurinha.");
    }
  };

  // ─── Computed duplicates ──────────────────────────────────────────────────

  const buildDupes = (rangeMin: number, rangeMax: number) =>
    stickers
      .filter((s) => s.number >= rangeMin && s.number <= rangeMax)
      .map((s) => {
        const us = userStickers.find((u) => u.sticker_number === s.number);
        return us && us.copies > 1
          ? { sticker: s, copies: us.copies, isRare: us.is_rare }
          : null;
      })
      .filter(Boolean) as { sticker: Sticker; copies: number; isRare: boolean }[];

  const freeDupes = buildDupes(1, 200);
  const shopDupes = buildDupes(201, 360);

  // ─── Trade flow handlers ──────────────────────────────────────────────────

  const startTradeFlow = (stickerNumber: number, category: "free" | "shop") => {
    setFlowMySticker(stickerNumber);
    setFlowCategory(category);
    setFlowNickInput("");
    setFlowLookup(null);
    setFlowDesiredSticker(null);
    setFlowStep("enter-nick");
  };

  const handleNickLookup = async () => {
    if (!flowNickInput.trim()) return;
    setFlowNickLoading(true);
    const res = await lookupUserByNickAction(flowNickInput.trim().toLowerCase());
    setFlowNickLoading(false);
    if (!res.success || !res.data) {
      ui.toast(res.message || "Usuária não encontrada.");
      return;
    }
    setFlowLookup(res.data);
    setFlowStep("confirm-user");
  };

  const handleSelectDesiredSticker = (stickerNumber: number) => {
    setFlowDesiredSticker(stickerNumber);
    setFlowStep("confirm-trade");
  };

  const handleConfirmTrade = async () => {
    if (!flowMySticker || !flowDesiredSticker || !flowLookup) return;
    setTradeSubmitting(true);
    const res = await createTradeRequestAction(
      flowLookup.nick,
      flowMySticker,
      flowDesiredSticker,
      flowCategory,
    );
    setTradeSubmitting(false);
    if (res.success) {
      setFlowStep("idle");
      ui.toast("Solicitação de troca enviada! ✨");
      refreshTrades();
    } else {
      ui.toast(res.message || "Erro ao criar solicitação de troca.");
    }
  };

  const resetFlow = () => {
    setFlowStep("idle");
    setFlowMySticker(null);
    setFlowNickInput("");
    setFlowLookup(null);
    setFlowDesiredSticker(null);
  };

  // ─── Exchange for points ──────────────────────────────────────────────────

  const handleExchangeForPoints = async (stickerNumber: number, stickerName: string) => {
    ui.openModal(
      <div style={{ textAlign: "center" }}>
        <Coins className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 style={{ marginBottom: 6 }}>Trocar por pontos?</h2>
        <p style={{ margin: "0 0 16px", color: "var(--wine)" }}>
          <b>
            #{String(stickerNumber).padStart(3, "0")} · {stickerName}
          </b>
        </p>
        <p style={{ margin: "0 0 20px", fontSize: 14 }}>
          Você receberá <b>45 pontos</b> por esta figurinha repetida.
        </p>
        <button
          className="btn"
          onClick={async () => {
            ui.closeModal();
            setExchangeLoading((p) => ({ ...p, [stickerNumber]: true }));
            const res = await exchangeForPointsAction(stickerNumber);
            setExchangeLoading((p) => ({ ...p, [stickerNumber]: false }));
            if (res.success) {
              const newBal = res.data?.new_balance ?? pointsBalance + 45;
              setPointsBalance(newBal);
              setUserStickers((prev) =>
                prev.map((us) =>
                  us.sticker_number === stickerNumber
                    ? { ...us, copies: Math.max(us.copies - 1, 0) }
                    : us,
                ),
              );
              ui.toast(`+45 pontos! Saldo: ${newBal} pts 🪙`);
            } else {
              ui.toast(res.message || "Erro ao trocar por pontos.");
            }
          }}
        >
          Confirmar troca
        </button>
        <button className="btn soft" style={{ marginTop: 8 }} onClick={() => ui.closeModal()}>
          Cancelar
        </button>
      </div>,
    );
  };

  // ─── Respond to trade ─────────────────────────────────────────────────────

  const handleRespond = async (tradeId: string, accept: boolean, trade: TradeRequest) => {
    ui.openModal(
      <div style={{ textAlign: "center" }}>
        {accept ? (
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
        ) : (
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        )}
        <h2 style={{ marginBottom: 6 }}>{accept ? "Aceitar troca?" : "Recusar troca?"}</h2>
        {accept && (
          <p style={{ fontSize: 13, margin: "0 0 16px", color: "var(--wine)" }}>
            Você dará <b>{trade.receiver_sticker_name || `#${trade.receiver_sticker}`}</b> e
            receberá <b>{trade.initiator_sticker_name || `#${trade.initiator_sticker}`}</b>.
          </p>
        )}
        <button
          className={`btn ${accept ? "" : "soft"}`}
          onClick={async () => {
            ui.closeModal();
            setRespondLoading((p) => ({ ...p, [tradeId]: true }));
            const res = await respondToTradeAction(tradeId, accept);
            setRespondLoading((p) => ({ ...p, [tradeId]: false }));
            if (res.success) {
              ui.toast(accept ? "Troca concluída! 🎉" : "Troca recusada.");
              router.invalidate();
            } else {
              ui.toast(res.message || "Erro ao responder.");
            }
          }}
        >
          {accept ? "Aceitar" : "Recusar"}
        </button>
        <button className="btn soft" style={{ marginTop: 8 }} onClick={() => ui.closeModal()}>
          Voltar
        </button>
      </div>,
    );
  };

  // ─── Cancel trade ─────────────────────────────────────────────────────────

  const handleCancel = async (tradeId: string) => {
    ui.openModal(
      <div style={{ textAlign: "center" }}>
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <h2 style={{ marginBottom: 6 }}>Cancelar solicitação?</h2>
        <p style={{ fontSize: 13, margin: "0 0 16px" }}>
          A solicitação será cancelada e a figurinha voltará como repetida.
        </p>
        <button
          className="btn soft"
          onClick={async () => {
            ui.closeModal();
            const res = await cancelTradeAction(tradeId);
            if (res.success) {
              ui.toast("Solicitação cancelada.");
              router.invalidate();
            } else {
              ui.toast(res.message || "Erro ao cancelar.");
            }
          }}
        >
          Cancelar solicitação
        </button>
        <button className="btn" style={{ marginTop: 8 }} onClick={() => ui.closeModal()}>
          Manter
        </button>
      </div>,
    );
  };

  // ─── Trade Flow Inline Steps ──────────────────────────────────────────────

  const mySticker = stickers.find((s) => s.number === flowMySticker);

  const renderTradeFlow = () => {
    if (flowStep === "enter-nick") {
      return (
        <div className="trade-flow-modal">
          <button className="trade-flow-back" onClick={resetFlow}>← Voltar</button>
          <ArrowLeftRight className="w-8 h-8 text-pink-500 mx-auto mb-2" />
          <h2>Trocar com outra usuária</h2>
          <p className="note" style={{ margin: "4px 0 16px", textAlign: "center" }}>
            Você está oferecendo:{" "}
            <b>#{String(flowMySticker).padStart(3, "0")} · {mySticker?.name}</b>
          </p>
          <div className="trade-flow-input-group">
            <label className="trade-flow-label">Nome de usuário da outra colecionadora</label>
            <div className="trade-flow-search-row">
              <input
                className="input"
                type="text"
                placeholder="ex: minhaamiga123"
                value={flowNickInput}
                onChange={(e) => setFlowNickInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleNickLookup()}
                autoFocus
              />
              <button
                className="trade-flow-search-btn"
                onClick={handleNickLookup}
                disabled={flowNickLoading || !flowNickInput.trim()}
              >
                {flowNickLoading ? "..." : <Search className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (flowStep === "confirm-user" && flowLookup) {
      const eligibleDupes = flowCategory === "free" ? flowLookup.free_dupes : flowLookup.shop_dupes;
      return (
        <div className="trade-flow-modal">
          <button className="trade-flow-back" onClick={() => setFlowStep("enter-nick")}>← Voltar</button>
          <div className="trade-flow-user-header">
            {avatarDisplay(flowLookup.avatar_url, flowLookup.avatar_emoji, flowLookup.nick)}
            <div>
              <b>@{flowLookup.nick}</b>
              <p className="note" style={{ margin: 0 }}>
                {eligibleDupes.length} repetida{eligibleDupes.length !== 1 ? "s" : ""} disponível{eligibleDupes.length !== 1 ? "eis" : ""}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, margin: "8px 0 4px" }}>Você quer receber qual figurinha?</p>
          <p className="note" style={{ margin: "0 0 10px" }}>
            Você dará: <b>#{String(flowMySticker).padStart(3, "0")} · {mySticker?.name}</b>
          </p>
          {eligibleDupes.length === 0 ? (
            <div className="empty" style={{ padding: "24px 0" }}>
              Esta usuária não tem repetidas elegíveis para troca.
            </div>
          ) : (
            <div className="trade-flow-sticker-list">
              {eligibleDupes.map((d) => {
                const isMine = d.sticker_number === flowMySticker;
                return (
                  <button
                    key={d.sticker_number}
                    className={`trade-flow-sticker-option ${isMine ? "trade-flow-sticker-same" : ""}`}
                    onClick={() => !isMine && handleSelectDesiredSticker(d.sticker_number)}
                    disabled={isMine}
                  >
                    <span className="trade-flow-sticker-num">#{String(d.sticker_number).padStart(3, "0")}</span>
                    <span className="trade-flow-sticker-name">{d.name}</span>
                    <span className="trade-flow-sticker-copies">{d.copies - 1} rep.</span>
                    {!isMine && <ChevronRight className="w-4 h-4 text-pink-400 ml-auto flex-shrink-0" />}
                    {isMine && <span className="note" style={{ marginLeft: "auto" }}>mesma</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (flowStep === "confirm-trade" && flowLookup && flowDesiredSticker) {
      const desiredName =
        flowCategory === "free"
          ? flowLookup.free_dupes.find((d) => d.sticker_number === flowDesiredSticker)?.name
          : flowLookup.shop_dupes.find((d) => d.sticker_number === flowDesiredSticker)?.name;
      return (
        <div className="trade-flow-modal" style={{ textAlign: "center" }}>
          <button className="trade-flow-back" style={{ textAlign: "left" }} onClick={() => setFlowStep("confirm-user")}>
            ← Voltar
          </button>
          <ArrowLeftRight className="w-8 h-8 text-pink-500 mx-auto mb-2" />
          <h2>Confirmar troca?</h2>
          <div className="trade-confirm-summary">
            <div className="trade-confirm-side">
              <span className="note">Você dá</span>
              <b>#{String(flowMySticker).padStart(3, "0")}</b>
              <span style={{ fontSize: 12 }}>{mySticker?.name}</span>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-pink-400 mx-2 flex-shrink-0 mt-4" />
            <div className="trade-confirm-side">
              <span className="note">Você recebe</span>
              <b>#{String(flowDesiredSticker).padStart(3, "0")}</b>
              <span style={{ fontSize: 12 }}>{desiredName}</span>
            </div>
          </div>
          <p style={{ fontSize: 13, margin: "8px 0 16px" }}>com <b>@{flowLookup.nick}</b></p>
          <p className="note" style={{ margin: "0 0 16px" }}>
            A troca só será concluída quando a outra usuária aceitar. Ela tem 48h para responder.
          </p>
          <button className="btn" onClick={handleConfirmTrade} disabled={tradeSubmitting}>
            {tradeSubmitting ? "Enviando..." : "Enviar solicitação ✨"}
          </button>
          <button className="btn soft" style={{ marginTop: 8 }} onClick={resetFlow}>
            Cancelar
          </button>
        </div>
      );
    }
    return null;
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderFreeDupes = () => (
    <div>
      {freeDupes.length === 0 ? (
        <div className="trade-empty">
          <img src="/icons/repetidas.png" alt="" />
          <p>Você ainda não tem figurinhas gratuitas repetidas.</p>
        </div>
      ) : (
        <div className="trade-dupes-list">
          {freeDupes.map(({ sticker, copies, isRare }) => (
            <StickerDupeCard
              key={sticker.number}
              stickerNumber={sticker.number}
              stickerName={sticker.name}
              copies={copies}
              isRare={isRare}
              category="free"
              onTrade={() => startTradeFlow(sticker.number, "free")}
            />
          ))}
        </div>
      )}
      <p className="note" style={{ marginTop: 12 }}>
        Figurinhas 1–200 podem ser trocadas entre colecionadoras por outras na mesma faixa.
      </p>
    </div>
  );

  const renderShopDupes = () => (
    <div>
      {shopDupes.length === 0 ? (
        <div className="trade-empty">
          <img src="/icons/loja.png" alt="" />
          <p>Você ainda não tem figurinhas de loja repetidas.</p>
        </div>
      ) : (
        <div className="trade-dupes-list">
          {shopDupes.map(({ sticker, copies, isRare }) => (
            <StickerDupeCard
              key={sticker.number}
              stickerNumber={sticker.number}
              stickerName={sticker.name}
              copies={copies}
              isRare={isRare}
              category="shop"
              exchangeLoading={exchangeLoading[sticker.number]}
              onTrade={() => startTradeFlow(sticker.number, "shop")}
              onExchange={() => handleExchangeForPoints(sticker.number, sticker.name)}
            />
          ))}
        </div>
      )}
      <p className="note" style={{ marginTop: 12 }}>
        Figurinhas 201–360 (Loja) podem ser trocadas por pontos (45 pts) ou com outra usuária.
      </p>
    </div>
  );

  const renderIncoming = () => (
    <div>
      {incoming.length === 0 ? (
        <div className="trade-empty"><p>Nenhuma solicitação de troca recebida.</p></div>
      ) : (
        <div className="trade-requests-list">
          {incoming.map((tr) => (
            <div key={tr.id} className="trade-request-card">
              <div className="trade-request-header">
                {avatarDisplay(tr.initiator_avatar_url, tr.initiator_avatar_emoji, tr.initiator_nick || "")}
                <div className="trade-request-meta">
                  <b>@{tr.initiator_nick}</b>
                  <span className="trade-time-note">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {timeLeft(tr.expires_at)}
                  </span>
                </div>
                {statusBadge(tr.status)}
              </div>
              <div className="trade-request-stickers">
                <div className="trade-req-sticker">
                  <span className="note">Ela dá</span>
                  <b>#{String(tr.initiator_sticker).padStart(3, "0")}</b>
                  <span style={{ fontSize: 11 }}>{tr.initiator_sticker_name}</span>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-pink-400 mx-1 mt-3 flex-shrink-0" />
                <div className="trade-req-sticker">
                  <span className="note">Você dá</span>
                  <b>#{String(tr.receiver_sticker).padStart(3, "0")}</b>
                  <span style={{ fontSize: 11 }}>{tr.receiver_sticker_name}</span>
                </div>
              </div>
              <div className="trade-request-actions">
                <button className="btn sm" disabled={respondLoading[tr.id]} onClick={() => handleRespond(tr.id, true, tr)}>
                  <CheckCircle className="w-3.5 h-3.5" /> Aceitar
                </button>
                <button className="btn sm soft" disabled={respondLoading[tr.id]} onClick={() => handleRespond(tr.id, false, tr)}>
                  <XCircle className="w-3.5 h-3.5" /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOutgoing = () => (
    <div>
      {outgoing.length === 0 ? (
        <div className="trade-empty"><p>Você ainda não enviou solicitações de troca.</p></div>
      ) : (
        <div className="trade-requests-list">
          {outgoing.map((tr) => (
            <div key={tr.id} className="trade-request-card">
              <div className="trade-request-header">
                {avatarDisplay(null, null, tr.receiver_nick || "")}
                <div className="trade-request-meta">
                  <b>@{tr.receiver_nick}</b>
                  <span className="trade-time-note">
                    {tr.status === "pending" ? (
                      <><Clock className="w-3 h-3 flex-shrink-0" />{timeLeft(tr.expires_at)}</>
                    ) : (
                      tr.status
                    )}
                  </span>
                </div>
                {statusBadge(tr.status)}
              </div>
              <div className="trade-request-stickers">
                <div className="trade-req-sticker">
                  <span className="note">Você dá</span>
                  <b>#{String(tr.initiator_sticker).padStart(3, "0")}</b>
                  <span style={{ fontSize: 11 }}>{tr.initiator_sticker_name}</span>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-pink-400 mx-1 mt-3 flex-shrink-0" />
                <div className="trade-req-sticker">
                  <span className="note">Você recebe</span>
                  <b>#{String(tr.receiver_sticker).padStart(3, "0")}</b>
                  <span style={{ fontSize: 11 }}>{tr.receiver_sticker_name}</span>
                </div>
              </div>
              {tr.status === "pending" && (
                <div className="trade-request-actions">
                  <button className="btn sm soft" onClick={() => handleCancel(tr.id)}>
                    <XCircle className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </div>
              )}
              {tr.status === "accepted" && (
                <div className="trade-request-actions" style={{ marginTop: "8px" }}>
                  {tr.initiator_claimed ? (
                    <button className="btn sm soft" disabled style={{ width: "100%" }}>
                      ✓ Resgatada
                    </button>
                  ) : (
                    <button
                      className="btn sm"
                      style={{ width: "100%" }}
                      onClick={() => handleClaimSticker(tr.id)}
                      disabled={claimLoading[tr.id]}
                    >
                      {claimLoading[tr.id] ? "Resgatando..." : "Receber Figurinha 🎁"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div>
      {resolved.length === 0 ? (
        <div className="trade-empty"><p>Nenhuma troca concluída no histórico.</p></div>
      ) : (
        <div className="trade-requests-list">
          {resolved.map((tr) => {
            const isMeInitiator = tr.initiator_id === profileId;
            const otherParty = isMeInitiator ? tr.receiver_nick : tr.initiator_nick;
            const isClaimed = isMeInitiator ? tr.initiator_claimed : tr.receiver_claimed;
            return (
              <div key={tr.id} className="trade-request-card">
                <div className="trade-request-header">
                  {avatarDisplay(null, null, otherParty || "")}
                  <div className="trade-request-meta">
                    <b>@{otherParty}</b>
                    <span className="trade-time-note">
                      Resolvido em: {tr.resolved_at ? new Date(tr.resolved_at).toLocaleDateString("pt-BR") : "-"}
                    </span>
                  </div>
                  {statusBadge(tr.status)}
                </div>
                <div className="trade-request-stickers">
                  <div className="trade-req-sticker">
                    <span className="note">Iniciador dá</span>
                    <b>#{String(tr.initiator_sticker).padStart(3, "0")}</b>
                    <span style={{ fontSize: 11 }}>{tr.initiator_sticker_name}</span>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-pink-400 mx-1 mt-3 flex-shrink-0" />
                  <div className="trade-req-sticker">
                    <span className="note">Receptor dá</span>
                    <b>#{String(tr.receiver_sticker).padStart(3, "0")}</b>
                    <span style={{ fontSize: 11 }}>{tr.receiver_sticker_name}</span>
                  </div>
                </div>
                {tr.status === "accepted" && (
                  <div className="trade-request-actions" style={{ marginTop: "8px" }}>
                    {isClaimed ? (
                      <button className="btn sm soft" disabled style={{ width: "100%" }}>
                        ✓ Resgatada
                      </button>
                    ) : (
                      <button
                        className="btn sm"
                        style={{ width: "100%" }}
                        onClick={() => handleClaimSticker(tr.id)}
                        disabled={claimLoading[tr.id]}
                      >
                        {claimLoading[tr.id] ? "Resgatando..." : "Receber Figurinha 🎁"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────

  if (flowStep !== "idle") {
    return (
      <main className="screen trade-screen">
        <div className="trade-flow-container">{renderTradeFlow()}</div>
      </main>
    );
  }

  const incomingCount = incoming.length;

  return (
    <main className="screen trade-screen">
      <h1 className="section-title">Trocas</h1>
      <p className="section-sub">
        troque figurinhas repetidas com outras colecionadoras{" "}
        <ArrowLeftRight className="w-3.5 h-3.5 inline-block align-text-top text-[#C2185B] ml-1" />
      </p>

      {/* My nick chip */}
      <div className="trade-my-nick-bar">
        <span className="note">Seu usuário:</span>
        <span className="trade-my-nick-chip">@{profileNick}</span>
        <button
          className="trade-copy-btn"
          title="Copiar nome de usuário"
          onClick={async () => {
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(profileNick);
              ui.toast("Nome copiado! 💝");
            }
          }}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <span className="note" style={{ fontSize: 10, marginLeft: 4 }}>
          compartilhe para receber trocas
        </span>
      </div>

      {/* Points wallet */}
      <div className="trade-wallet-bar">
        <Wallet className="w-4 h-4 text-amber-600" />
        <span className="trade-wallet-label">Carteira de Pontos:</span>
        <span className="trade-wallet-balance">{pointsBalance.toLocaleString("pt-BR")} pts</span>
        <button
          className="trade-refresh-btn"
          onClick={refreshTrades}
          disabled={refreshing}
          title="Atualizar"
        >
          <Repeat className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main tabs */}
      <div className="trade-main-tabs">
        <button className={`trade-main-tab ${mainTab === "free" ? "active" : ""}`} onClick={() => setMainTab("free")}>
          <HeartHandshake className="w-4 h-4" />
          Gratuitas
          {freeDupes.length > 0 && <span className="trade-tab-count">{freeDupes.length}</span>}
        </button>
        <button className={`trade-main-tab ${mainTab === "shop" ? "active" : ""}`} onClick={() => setMainTab("shop")}>
          <ShoppingBag className="w-4 h-4" />
          Loja
          {shopDupes.length > 0 && <span className="trade-tab-count">{shopDupes.length}</span>}
        </button>
        <button className={`trade-main-tab ${mainTab === "requests" ? "active" : ""}`} onClick={() => setMainTab("requests")}>
          <Bell className="w-4 h-4" />
          Pedidos
          {incomingCount > 0 && <span className="trade-tab-badge">{incomingCount}</span>}
        </button>
      </div>

      {/* Tab content */}
      <div className="trade-tab-content">
        {mainTab === "free" && renderFreeDupes()}
        {mainTab === "shop" && renderShopDupes()}
        {mainTab === "requests" && (
          <div>
            <div className="trade-sub-tabs">
              <button className={`trade-sub-tab ${requestsSubTab === "incoming" ? "active" : ""}`} onClick={() => setRequestsSubTab("incoming")}>
                <Inbox className="w-3.5 h-3.5" />
                Recebidas
                {incomingCount > 0 && <span className="trade-tab-badge">{incomingCount}</span>}
              </button>
              <button className={`trade-sub-tab ${requestsSubTab === "outgoing" ? "active" : ""}`} onClick={() => setRequestsSubTab("outgoing")}>
                <Send className="w-3.5 h-3.5" />
                Enviadas
                {outgoing.filter((t) => t.status === "pending").length > 0 && (
                  <span className="trade-tab-count">{outgoing.filter((t) => t.status === "pending").length}</span>
                )}
              </button>
              <button className={`trade-sub-tab ${requestsSubTab === "history" ? "active" : ""}`} onClick={() => setRequestsSubTab("history")}>
                <Clock className="w-3.5 h-3.5" />
                Histórico
              </button>
            </div>
            {requestsSubTab === "incoming" && renderIncoming()}
            {requestsSubTab === "outgoing" && renderOutgoing()}
            {requestsSubTab === "history" && renderHistory()}
          </div>
        )}
      </div>
    </main>
  );
}
