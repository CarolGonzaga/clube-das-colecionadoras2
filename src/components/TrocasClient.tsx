import React, { useState, useEffect, useCallback } from "react";
import { Sticker, UserSticker, TradeRequest, TradeUserLookup, Donation } from "@/lib/types";
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
  generateDonationAction,
  redeemDonationAction,
  getOutgoingDonationsAction,
} from "@/lib/actions";
import { POINTS_BALANCE_CHANGED, emitPointsBalanceChanged, readPointsBalanceFromEvent } from "@/lib/walletEvents";
import Stamp from "./Stamp";
import { isRareStickerVersion } from "@/lib/albumRules";
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
  CircleHelp,
  HeartHandshake,
  ShoppingBag,
  Repeat,
  Bell,
  Send,
  Inbox,
  Gift,
  ArrowLeft,
  Camera,
} from "lucide-react";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TrocasClientProps {
  stickers: Sticker[];
  initialUserStickers: UserSticker[];
  profileId: string;
  profileNick: string;
  initialIncoming: TradeRequest[];
  initialOutgoing: TradeRequest[];
  initialResolved: TradeRequest[];
  initialPointsBalance: number;
  initialDonations: Donation[];
  initialTab?: string;
}

type MainTab = "free" | "shop" | "requests";
type RequestsSubTab = "incoming" | "outgoing" | "history";
type TradeFlowStep = "idle" | "enter-nick" | "confirm-user" | "select-sticker" | "confirm-trade";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirada";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

const WINDOWS_1252_BYTES: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88,
  0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
  0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

function repairLegacyEmoji(value: string | null | undefined) {
  if (!value || !/[ÃÂðâ]/.test(value)) return value;
  try {
    const bytes = Array.from(value, (char) => {
      const point = char.codePointAt(0) || 0;
      return WINDOWS_1252_BYTES[point] ?? point;
    });
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    return repaired.includes("�") ? value : repaired;
  } catch {
    return value;
  }
}

function TradeAvatar({
  avatarUrl,
  avatarEmoji,
  nick,
}: {
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  nick: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const repairedEmoji = repairLegacyEmoji(avatarEmoji);
  const imageSource = avatarUrl || (repairedEmoji?.startsWith("/avatar/") ? repairedEmoji : null);

  if (imageSource && !imageFailed) {
    return (
      <img
        src={imageSource}
        alt={nick}
        className="w-9 h-9 rounded-full object-cover border-2 border-pink-200"
        onError={() => setImageFailed(true)}
      />
    );
  }

  const usableEmoji = repairedEmoji
    && !repairedEmoji.startsWith("/")
    && !/[ÃÂðâ]/.test(repairedEmoji)
    ? repairedEmoji
    : null;

  return (
    <div
      className="w-9 h-9 rounded-full bg-pink-100 border-2 border-pink-200 flex items-center justify-center text-lg"
      aria-label={`Avatar de ${nick}`}
    >
      {usableEmoji || <Camera className="w-4 h-4" aria-hidden="true" />}
    </div>
  );
}

function avatarDisplay(
  avatarUrl: string | null | undefined,
  avatarEmoji: string | null | undefined,
  nick: string,
) {
  return <TradeAvatar avatarUrl={avatarUrl} avatarEmoji={avatarEmoji} nick={nick} />;
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

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface StickerDupeCardProps {
  stickerNumber: number;
  stickerName: string;
  copies: number;
  isRare: boolean;
  onTrade?: () => void;
  onExchange?: () => void;
  exchangeLoading?: boolean;
  category: "free" | "shop";
  onDonate?: () => void;
  donateLoading?: boolean;
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
  onDonate,
  donateLoading,
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
        {category === "free" && onDonate && (
          <button
            className="btn sm soft trade-btn-donate"
            onClick={onDonate}
            disabled={donateLoading}
            title="Doar figurinha e gerar código"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Doar</span>
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

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function TrocasClient({
  stickers,
  initialUserStickers,
  profileId,
  profileNick,
  initialIncoming,
  initialOutgoing,
  initialResolved,
  initialPointsBalance,
  initialDonations,
  initialTab,
}: TrocasClientProps) {
  const ui = useUI();
  const router = useRouter();
  const hasShownTutorialRef = React.useRef(false);

  // State
  const [mainTab, setMainTab] = useState<MainTab>(
    initialTab === "history" || initialTab === "requests" ? "requests" : "free"
  );
  const [requestsSubTab, setRequestsSubTab] = useState<RequestsSubTab | "donations">(
    initialTab === "history" ? "history" : "incoming"
  );
  const [userStickers, setUserStickers] = useState<UserSticker[]>(initialUserStickers);
  const [incoming, setIncoming] = useState<TradeRequest[]>(initialIncoming);
  const [outgoing, setOutgoing] = useState<TradeRequest[]>(initialOutgoing);
  const [resolved, setResolved] = useState<TradeRequest[]>(initialResolved);
  const [pointsBalance, setPointsBalance] = useState(initialPointsBalance);
  const [donations, setDonations] = useState<Donation[]>(initialDonations);
  const [exchangeLoading, setExchangeLoading] = useState<Record<number, boolean>>({});
  const [respondLoading, setRespondLoading] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Donation state
  const [redeemCodeInput, setRedeemCodeInput] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [donateLoading, setDonateLoading] = useState<Record<number, boolean>>({});

  // Trade flow state
  const [flowStep, setFlowStep] = useState<TradeFlowStep>("idle");
  const [flowCategory, setFlowCategory] = useState<"free" | "shop">("free");
  const [flowMySticker, setFlowMySticker] = useState<number | null>(null);
  const [flowNickInput, setFlowNickInput] = useState("");
  const [flowNickLoading, setFlowNickLoading] = useState(false);
  const [flowLookup, setFlowLookup] = useState<TradeUserLookup | null>(null);
  const [flowDesiredSticker, setFlowDesiredSticker] = useState<number | null>(null);
  const [tradeSubmitting, setTradeSubmitting] = useState(false);

  const openPointsHelp = () => {
    ui.openModal(
      <div className="points-help-modal">
        <CircleHelp size={30} />
        <h2>Como funcionam os pontos?</h2>
        <p>
          Pontos são créditos internos do Clube. Você pode ganhar pontos ao trocar figurinhas de
          loja repetidas por créditos.
        </p>
        <p>
          Eles ficam salvos na sua conta e poderão ser usados em recursos da loja quando essa opção
          estiver disponível.
        </p>
        <button type="button" className="btn" onClick={ui.closeModal}>
          Entendi
        </button>
      </div>,
    );
  };

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
    if (typeof window === "undefined") return;

    const refreshBalance = async () => {
      const bal = await getPointsBalanceAction();
      if (bal.success) setPointsBalance(bal.balance);
    };

    const handlePointsChange = (event: Event) => {
      const nextBalance = readPointsBalanceFromEvent(event);
      if (typeof nextBalance === "number") {
        setPointsBalance(nextBalance);
      } else {
        refreshBalance();
      }
    };

    window.addEventListener(POINTS_BALANCE_CHANGED, handlePointsChange);
    window.addEventListener("focus", refreshBalance);
    return () => {
      window.removeEventListener(POINTS_BALANCE_CHANGED, handlePointsChange);
      window.removeEventListener("focus", refreshBalance);
    };
  }, []);

  useEffect(() => {
    setDonations(initialDonations);
  }, [initialDonations]);

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
      const [inc, out, res, bal, don] = await Promise.all([
        getIncomingTradesAction(),
        getOutgoingTradesAction(),
        getResolvedTradesAction(),
        getPointsBalanceAction(),
        getOutgoingDonationsAction(),
      ]);
      if (inc.success && inc.data) setIncoming(inc.data);
      if (out.success && out.data) setOutgoing(out.data);
      if (res.success && res.data) setResolved(res.data);
      if (bal.success) setPointsBalance(bal.balance);
      if (don.success && don.data) setDonations(don.data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Tutorial pop-up trigger
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasShownTutorialRef.current) return;
    const hideTutorial = localStorage.getItem("hide_trade_tutorial");
    if (!hideTutorial) {
      const showTutorial = () => {
        hasShownTutorialRef.current = true;
        let dontShowAgain = false;
        ui.openModal(
          <div style={{ padding: "8px 4px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <HeartHandshake className="w-12 h-12 text-[#C2185B] mx-auto mb-2 animate-bounce" />
              <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#5c0d2b" }}>Como funcionam as Trocas?</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", fontSize: "12px", color: "#5c0d2b" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>1.</span>
                <p style={{ margin: 0 }}><b>Troca por Pontos na Loja:</b> O usuário pode trocar figurinhas compradas por pontos que podem ser usados para adquirir novas.</p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>2.</span>
                <p style={{ margin: 0 }}><b>Regras de Troca:</b> Figurinhas Gratuitas podem ser trocadas por Gratuitas, e Pagas podem ser trocadas por Pagas.</p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>3.</span>
                <p style={{ margin: 0 }}><b>Como Trocar:</b> Basta escolher a figurinha que deseja trocar, informar o nick do usuário e selecionar a figurinha dele que deseja receber.</p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>4.</span>
                <p style={{ margin: 0 }}><b>Resgate:</b> Quando o usuário aceitar a troca, a nova figurinha ficará disponível para resgate.</p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #fecdd3", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#7a0c3b", fontWeight: "bold", cursor: "pointer", justifyContent: "center" }}>
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    dontShowAgain = e.target.checked;
                  }}
                  style={{ accentColor: "#C2185B", width: "14px", height: "14px" }}
                />
                Não mostrar este tutorial novamente
              </label>

              <button 
                className="btn" 
                onClick={() => {
                  if (dontShowAgain) {
                    localStorage.setItem("hide_trade_tutorial", "true");
                  }
                  ui.closeModal();
                }}
                style={{ width: "100%" }}
              >
                Entendi!
              </button>
            </div>
          </div>
        );
      };
      
      const timer = setTimeout(showTutorial, 500);
      return () => clearTimeout(timer);
    }
  }, [ui]);

  const handleRedeemDonation = async () => {
    if (!redeemCodeInput.trim()) return;
    setRedeemLoading(true);
    try {
      const res = await redeemDonationAction(redeemCodeInput.trim());
      if (res.success && res.data) {
        const reveals = res.data.reveals || [];
        if (reveals.length > 0) {
          const pendingObj = {
            reveals,
            title: "Figurinha recebida por doação!",
            flippedCards: [],
            isOpened: false,
          };
          localStorage.setItem("pending_pack", JSON.stringify(pendingObj));
          ui.triggerPendingPack();
        } else {
          ui.toast("Figurinha resgatada com sucesso!");
        }
        setRedeemCodeInput("");
        router.invalidate();
        refreshTrades();
      } else {
        ui.toast(res.message || "Erro ao resgatar código.");
      }
    } catch (e: any) {
      ui.toast("Erro ao resgatar código.");
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleDonateSticker = async (stickerNumber: number, stickerName: string) => {
    setDonateLoading((prev) => ({ ...prev, [stickerNumber]: true }));
    try {
      const res = await generateDonationAction(stickerNumber);
      if (res.success && res.code) {
        ui.toast("Código de doação gerado com sucesso! Copie-o abaixo.");
        
        ui.openModal(
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <Gift className="w-12 h-12 text-[#C2185B] mx-auto mb-2 animate-bounce" />
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#5c0d2b" }}>Código de doação gerado!</h2>
            <p style={{ fontSize: "12px", color: "#bf2a5e", margin: "8px 0 16px" }}>
              Envie este código para uma amiga. Ela poderá resgatar a figurinha <b>#{String(stickerNumber).padStart(3, "0")} · {stickerName}</b> imediatamente!
            </p>
            
            <div style={{ background: "#fff0f7", border: "1.5px dashed #fecdd3", borderRadius: "12px", padding: "12px", fontSize: "16px", fontWeight: "bold", color: "#9e1b4a", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              <span>{res.code}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(res.code || "");
                  ui.toast("Código copiado! 📋");
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#bf2a5e" }}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <p className="note" style={{ fontSize: "10px", margin: "0 0 16px" }}>
              Válido por 24h. Se não resgatado, a figurinha volta para seu deck.
            </p>

            <button className="btn" onClick={() => ui.closeModal()} style={{ width: "100%" }}>
              Fechar
            </button>
          </div>
        );

        router.invalidate();
        refreshTrades();
      } else {
        ui.toast(res.message || "Erro ao doar figurinha.");
      }
    } catch (e) {
      ui.toast("Erro ao doar figurinha.");
    } finally {
      setDonateLoading((prev) => ({ ...prev, [stickerNumber]: false }));
    }
  };

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
            isRare: isRareStickerVersion(res.data.sticker_number, { is_rare: res.data.is_rare } as UserSticker),
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

  // â”€â”€â”€ Computed duplicates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const buildDupes = (rangeMin: number, rangeMax: number) =>
    stickers
      .filter((s) => s.number >= rangeMin && s.number <= rangeMax)
      .map((s) => {
        const us = userStickers.find((u) => u.sticker_number === s.number);
        return us && us.copies > 1
          ? { sticker: s, copies: us.copies, isRare: isRareStickerVersion(s, us) }
          : null;
      })
      .filter(Boolean) as { sticker: Sticker; copies: number; isRare: boolean }[];

  const freeDupes = buildDupes(21, 193);
  const shopDupes = buildDupes(194, 319);
  const freeDuplicatesCount = freeDupes.reduce((sum, item) => sum + item.copies - 1, 0);
  const shopDuplicatesCount = shopDupes.reduce((sum, item) => sum + item.copies - 1, 0);

  // â”€â”€â”€ Trade flow handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ Exchange for points â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              emitPointsBalanceChanged(newBal);
              setUserStickers((prev) =>
                prev.map((us) =>
                  us.sticker_number === stickerNumber
                    ? { ...us, copies: Math.max(us.copies - 1, 0) }
                    : us,
                ),
              );
              ui.toast(`+45 pontos! Saldo: ${newBal} pts 🪙`);
              router.invalidate();
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

  // â”€â”€â”€ Respond to trade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              ui.toast(accept ? "Troca concluída!" : "Troca recusada.");
              router.invalidate();
              if (accept) {
                try {
                  const claimRes = await claimTradeRewardAction(tradeId);
                  if (claimRes.success && claimRes.data) {
                    ui.showReveals(
                      [
                        {
                          slug: `sticker-${claimRes.data.sticker_number}`,
                          number: claimRes.data.sticker_number,
                          wasNew: false,
                          isRare: isRareStickerVersion(claimRes.data.sticker_number, { is_rare: claimRes.data.is_rare } as UserSticker),
                          repeat: false,
                          reward: null,
                        },
                      ],
                      "Troca Recebida!",
                    );
                    router.invalidate();
                  }
                } catch (err: any) {
                  console.error("Erro ao resgatar figurinha da troca:", err);
                }
              }
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

  // â”€â”€â”€ Cancel trade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ Trade Flow Inline Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const mySticker = stickers.find((s) => s.number === flowMySticker);

  const renderTradeFlow = () => {
    if (flowStep === "enter-nick") {
      return (
        <div className="trade-flow-modal">
          <button className="trade-flow-back" onClick={resetFlow}>
            <ArrowLeft size={15} /> Voltar
          </button>
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
          <button className="trade-flow-back" onClick={() => setFlowStep("enter-nick")}>
            <ArrowLeft size={15} /> Voltar
          </button>
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
            <ArrowLeft size={15} /> Voltar
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

  // â”€â”€â”€ Render helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              onDonate={() => handleDonateSticker(sticker.number, sticker.name)}
              donateLoading={donateLoading[sticker.number]}
            />
          ))}
        </div>
      )}
      <p className="note" style={{ marginTop: 12 }}>
        Figurinhas de sorteio (21–193) podem ser trocadas entre colecionadoras por outras na mesma faixa.
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
        Figurinhas de loja (194–319) podem ser trocadas por pontos ou com outra usuária.
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
                {avatarDisplay(tr.receiver_avatar_url, tr.receiver_avatar_emoji, tr.receiver_nick || "")}
                <div className="trade-request-meta">
                  <b>@{tr.receiver_nick}</b>
                  <span className="trade-time-note">
                    {tr.status === "pending" ? (
                      <><Clock className="w-3 h-3 flex-shrink-0" />{timeLeft(tr.expires_at)}</>
                    ) : (
                      tr.status === "accepted" ? "Aceita ✓" : tr.status === "rejected" ? "Recusada ❌" : tr.status === "cancelled" ? "Cancelada ❌" : tr.status
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
                      {claimLoading[tr.id] ? "Resgatando..." : "Receber figurinha"}
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
            const avatarUrl = isMeInitiator ? tr.receiver_avatar_url : tr.initiator_avatar_url;
            const avatarEmoji = isMeInitiator ? tr.receiver_avatar_emoji : tr.initiator_avatar_emoji;
            return (
              <div key={tr.id} className="trade-request-card">
                <div className="trade-request-header">
                  {avatarDisplay(avatarUrl, avatarEmoji, otherParty || "")}
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
                        {claimLoading[tr.id] ? "Resgatando..." : "Receber figurinha"}
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

  const renderDonationsTab = () => {
    return (
      <div>
        {donations.length === 0 ? (
          <div className="trade-empty">
            <Gift className="w-8 h-8 text-pink-300 mx-auto mb-2" />
            <p>Nenhuma doação enviada ou recebida ainda.</p>
          </div>
        ) : (
          <div className="trade-requests-list">
            {donations.map((d) => {
              const sticker = stickers.find((s) => s.number === d.sticker_number);
              const isExpired = d.status === "expired" || (d.status === "active" && new Date() > new Date(d.expires_at));
              const currentStatus = isExpired ? "expired" : d.status;
              
              const isOutgoing = d.from_user === profileId;
              let statusLabel = "Ativo (Aguardando)";
              let statusCls = "badge-pending";
              if (currentStatus === "used") {
                if (isOutgoing) {
                  statusLabel = d.receiver_nick ? `Resgatado por @${d.receiver_nick}` : "Resgatado";
                } else {
                  statusLabel = d.donor_nick ? `Doado por @${d.donor_nick}` : "Recebido";
                }
                statusCls = "badge-accepted";
              } else if (currentStatus === "expired") {
                statusLabel = isOutgoing ? "Expirado (Devolvido)" : "Expirado";
                statusCls = "badge-expired";
              }

              return (
                <div key={d.code} className="trade-request-card">
                  <div className="trade-request-header">
                    <div className="w-9 h-9 rounded-full bg-pink-100 border-2 border-pink-200 flex items-center justify-center text-lg">
                      <Gift className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="trade-request-meta">
                      <b>Doação: {d.code} {isOutgoing ? "(Enviada)" : "(Resgatada)"}</b>
                      <span className="trade-time-note">
                        {currentStatus === "active" ? (
                          <>
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            Expira em: {new Date(d.expires_at).toLocaleString("pt-BR")}
                          </>
                        ) : (
                          <>Criado em: {new Date(d.created_at).toLocaleDateString("pt-BR")}</>
                        )}
                      </span>
                    </div>
                    <span className={`trade-status-badge ${statusCls}`}>{statusLabel}</span>
                  </div>

                  <div className="trade-request-stickers" style={{ padding: "8px 12px", background: "#fdf2f7" }}>
                    <div className="trade-req-sticker" style={{ flex: 1, textAlign: "left" }}>
                      <span className="note" style={{ margin: 0 }}>Figurinha doada:</span>
                      <b>#{String(d.sticker_number).padStart(3, "0")}</b>
                      <span style={{ fontSize: 11 }}>{sticker?.name || `Figurinha ${d.sticker_number}`}</span>
                    </div>
                  </div>

                  {currentStatus === "active" && (
                    <div className="trade-request-actions" style={{ marginTop: "4px" }}>
                      <button
                        className="btn sm"
                        style={{ width: "100%" }}
                        onClick={() => {
                          navigator.clipboard.writeText(d.code);
                          ui.toast("Código copiado! 📋");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Código novamente
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // â”€â”€â”€ Main render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

      {/* Header Row: User Info & Points Wallet */}
      <div className="trade-header-row flex flex-row gap-3 w-full mb-3">
        {/* My nick chip */}
        <div className="trade-my-nick-bar flex-1" style={{ margin: 0 }}>
          <div className="trade-my-nick-left">
            <span className="note" style={{ fontSize: 10, opacity: 0.8 }}>Seu usuário:</span>
            <div className="trade-my-nick-user-row">
              <span className="trade-my-nick-chip">@{profileNick}</span>
              <button
                className="trade-copy-btn"
                title="Copiar nome de usuário"
                onClick={async () => {
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(profileNick);
                    ui.toast("Nome copiado!");
                  }
                }}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <span className="note trade-share-note">
            compartilhe para receber trocas
          </span>
        </div>

        {/* Points wallet */}
        <div className="trade-wallet-bar flex-1" style={{ margin: 0 }}>
          <div className="trade-wallet-info">
            <Wallet className="w-4 h-4 text-amber-600" />
            <span className="trade-wallet-label">Carteira de Pontos:</span>
          </div>
          <div className="trade-wallet-value-row">
            <span className="trade-wallet-balance">{pointsBalance.toLocaleString("pt-BR")} pts</span>
            <button
              className="points-help-btn"
              onClick={openPointsHelp}
              aria-label="Como funcionam os pontos?"
              title="Como funcionam os pontos?"
            >
              ?
            </button>
            <button
              className="trade-refresh-btn"
              onClick={refreshTrades}
              disabled={refreshing}
              title="Atualizar"
            >
              <Repeat className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Donation Code Redemption Section */}
      <div className="trade-redeem-section bg-white rounded-2xl border border-pink-200/60 shadow-sm p-4 mb-4">
        <h3 className="text-xs font-bold text-[#5c0d2b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-[#C2185B]" /> Resgatar Figurinha Doada
        </h3>
        <p className="text-[11px] text-[#bf2a5e]/80 mb-3">
          Recebeu um código de doação de outra colecionadora? Cole o código de 8 caracteres abaixo para resgatar.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cole o código de doação aqui (ex: DON-XXXXX)"
            value={redeemCodeInput}
            onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase().trim())}
            style={{ height: "40px" }}
            className="flex-1 min-w-0 px-3 border border-pink-200/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          />
          <button
            onClick={handleRedeemDonation}
            disabled={redeemLoading || !redeemCodeInput}
            style={{ height: "40px" }}
            className="px-4 py-2 bg-gradient-to-r from-[#c1426d] to-[#9b2361] text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {redeemLoading ? "Verificando..." : "Resgatar"}
          </button>
        </div>
      </div>

      {/* Main tabs */}
      <div className="trade-main-tabs">
        <button className={`trade-main-tab ${mainTab === "free" ? "active" : ""}`} onClick={() => setMainTab("free")}>
          <HeartHandshake className="w-4 h-4" />
          Gratuitas
          {freeDuplicatesCount > 0 && <span className="trade-tab-count">{freeDuplicatesCount}</span>}
        </button>
        <button className={`trade-main-tab ${mainTab === "shop" ? "active" : ""}`} onClick={() => setMainTab("shop")}>
          <ShoppingBag className="w-4 h-4" />
          Loja
          {shopDuplicatesCount > 0 && <span className="trade-tab-count">{shopDuplicatesCount}</span>}
        </button>
        <button className={`trade-main-tab ${mainTab === "requests" ? "active" : ""}`} onClick={() => setMainTab("requests")}>
          <Bell className="w-4 h-4" />
          Trocas
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
              <button className={`trade-sub-tab ${requestsSubTab === "donations" ? "active" : ""}`} onClick={() => setRequestsSubTab("donations")}>
                <Gift className="w-3.5 h-3.5" />
                Doações
                {donations.filter((d) => d.status === "active").length > 0 && (
                  <span className="trade-tab-count">{donations.filter((d) => d.status === "active").length}</span>
                )}
              </button>
              <button className={`trade-sub-tab ${requestsSubTab === "history" ? "active" : ""}`} onClick={() => setRequestsSubTab("history")}>
                <Clock className="w-3.5 h-3.5" />
                Histórico
              </button>
            </div>
            {requestsSubTab === "incoming" && renderIncoming()}
            {requestsSubTab === "outgoing" && renderOutgoing()}
            {requestsSubTab === "donations" && renderDonationsTab()}
            {requestsSubTab === "history" && renderHistory()}
          </div>
        )}
      </div>
    </main>
  );
}
