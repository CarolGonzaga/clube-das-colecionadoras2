"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { Donation, Profile, Sticker, UserStyle, RevealItem } from "@/lib/types";
import { getClubAssetUrl, getPublicAlbumUrl } from "@/lib/urls";
import { ALL_RARE_STICKER_NUMBERS, getCollectionStatus, isExclusiveSticker, TOTAL_ALBUM_STICKERS } from "@/lib/albumRules";
import { dbService, getLocalDateStr } from "@/lib/db";
import { useUI } from "@/components/UIProvider";
import { claimDailyElementAction, completeMissionAction, logoutAction } from "@/lib/actions";
import PosterModal from "./PosterModal";
import PackOpener from "./PackOpener";
import {
  Instagram,
  Twitter,
  Music2,
  MessageSquare,
  Copy,
  Settings,
  Bell,
  Crown,
  Heart,
  Link2,
  Trophy,
  Gift,
  Sparkles,
  MessageCircleHeart,
  CircleFadingPlus,
  Book,
  Star,
  HelpCircle,
  Smartphone,
  LogOut,
  PartyPopper,
  ShoppingBag,
} from "lucide-react";

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

interface HomeClientProps {
  profile: Profile;
  stickers: Sticker[];
  ownedSlugs: string[];
  autoSlugs: string[];
  duplicatesCount: number;
  rareCount: number;
  completedMissionIds: string[];
  claimedToday: boolean;
  muralList: any[];
  userStyles: UserStyle[];
  dailyClaimsCount: number;
  releaseDayNumber: number;
  allElementsClaimed: boolean;
  userRank: number | null;
  donations: Donation[];
  albumRewardClaimed?: boolean;
}

const HOME =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/341328bd1_home.png";
const ALBUM =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/5c3fac339_album.png";
const QUIZ =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/b59bf6b09_quiz.png";
const CODIGOS =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/55bd49f98_codigos.png";
const REPETIDAS =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/431f9b427_repetidas.png";
const MURAL =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/d270e9745_mural.png";

const LOGO_TEXT =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/5e3c8d59f_logo_text.png";
const CARD_PINK = getClubAssetUrl("/card_pink.png");
const CARD_WINE = getClubAssetUrl("/card_wine.png");
const PURPURINA_EMBLEM = getClubAssetUrl("/icons/purpurina.png");
const STAR =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/6e31ff85f_star.png";

function getDonationTimeLeft(expiresAt: string) {
  const milliseconds = new Date(expiresAt).getTime() - Date.now();
  const minutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}min` : `${minutes}min`;
}

function getStoredDonations(profileId: string): Donation[] {
  try {
    const stored = JSON.parse(localStorage.getItem(`outgoing_donations:${profileId}`) || "[]");
    if (!Array.isArray(stored)) return [];
    const now = Date.now();
    const valid = stored.filter(
      (item): item is Donation =>
        item &&
        typeof item.code === "string" &&
        typeof item.sticker_number === "number" &&
        typeof item.expires_at === "string" &&
        new Date(item.expires_at).getTime() > now,
    );
    localStorage.setItem(`outgoing_donations:${profileId}`, JSON.stringify(valid));
    return valid;
  } catch {
    return [];
  }
}

function mergeDonations(databaseDonations: Donation[], storedDonations: Donation[]) {
  const byCode = new Map(databaseDonations.map((donation) => [donation.code, donation]));
  storedDonations.forEach((donation) => {
    if (!byCode.has(donation.code)) byCode.set(donation.code, donation);
  });
  return [...byCode.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function getSealPath(cx: number, cy: number, Rout: number, Rin: number, N: number) {
  let path = "";
  const step = (2 * Math.PI) / N;
  const halfStep = step / 2;

  for (let i = 0; i < N; i++) {
    const angle = i * step;
    const v1Angle = angle - halfStep;
    const v2Angle = angle + halfStep;

    const x_v1 = cx + Rin * Math.cos(v1Angle);
    const y_v1 = cy + Rin * Math.sin(v1Angle);
    const x_p = cx + Rout * Math.cos(angle);
    const y_p = cy + Rout * Math.sin(angle);
    const x_v2 = cx + Rin * Math.cos(v2Angle);
    const y_v2 = cy + Rin * Math.sin(v2Angle);

    if (i === 0) {
      path += `M ${x_v1} ${y_v1}`;
    }
    path += ` Q ${x_p} ${y_p} ${x_v2} ${y_v2}`;
  }
  path += " Z";
  return path;
}

interface StatBadgeProps {
  id: string;
  value: number | string;
  label: string;
}

function StatBadge({ id, value, label, theme }: StatBadgeProps & { theme?: "lilac" }) {
  const badgeFill = theme === "lilac" ? "#ecaedc" : "#FEB4C4";
  const textFill = theme === "lilac" ? "#82216d" : "#6e1638";
  const innerStrokeFill = theme === "lilac" ? "#f8e2f3" : "#ffcddc";
  return (
    <div className="stat-c">
      <svg viewBox="0 0 200 200" width="100%">
        <defs>
          <path id={`st-path-top-${id}`} d="M 46 100 A 54 54 0 0 1 154 100" fill="none" />
          <path id={`st-path-bottom-${id}`} d="M 34 100 A 66 66 0 0 0 166 100" fill="none" />
        </defs>

        {/* Seal Scalloped Shape */}
        <path d={getSealPath(100, 100, 98, 85, 24)} fill={badgeFill} />

        {/* Inner white circle outline */}
        <circle cx="100" cy="100" r="76" fill="none" stroke="white" strokeWidth="1.2" />

        {/* Left & Right separator dots */}
        <circle cx="34" cy="100" r="3" fill={textFill} />
        <circle cx="166" cy="100" r="3" fill={textFill} />

        {/* Top Curved Text (FIGURINHAS) */}
        <text
          fontFamily="'Fredoka', sans-serif"
          fontWeight="800"
          fontSize="14.5"
          letterSpacing="1.5"
          fill={textFill}
        >
          <textPath href={`#st-path-top-${id}`} startOffset="50%" textAnchor="middle">
            FIGURINHAS
          </textPath>
        </text>

        {/* Central Counter Value */}
        <text
          x="100"
          y="105"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Pacifico', cursive"
          fontWeight="400"
          fontSize="62"
          fill={innerStrokeFill}
          stroke={textFill}
          strokeWidth="2"
        >
          {value}
        </text>

        {/* Bottom Curved Text (COLADAS, REPETIDAS, RARAS) */}
        <text
          fontFamily="'Fredoka', sans-serif"
          fontWeight="800"
          fontSize="14.5"
          letterSpacing="1.2"
          fill={textFill}
        >
          <textPath href={`#st-path-bottom-${id}`} startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

const MISSIONS = [
  {
    id: "promotions-group",
    Icon: ShoppingBag,
    platform: "WhatsApp",
    label: "Entrar no grupo de promoções",
    url: "https://chat.whatsapp.com/JyHk9xvhnYUG3Q6kSJLxYI?s=cl&p=i&ilr=4",
  },
  {
    id: "whatsapp",
    Icon: MessageCircleHeart,
    platform: "WhatsApp",
    label: "Entrar no canal do WhatsApp",
    url: "https://whatsapp.com/channel/0029Vb6HNUhFHWptCJYOEF24",
  },
  {
    id: "x",
    Icon: Twitter,
    platform: "X",
    label: "Seguir no X (@lendosaficos)",
    url: "https://x.com/lendosaficos",
  },
  {
    id: "instagram",
    Icon: Instagram,
    platform: "Instagram",
    label: "Seguir no Instagram (@olendosaficos)",
    url: "https://www.instagram.com/olendosaficos/",
  },
  {
    id: "tiktok",
    Icon: Music2,
    platform: "TikTok",
    label: "Seguir no TikTok (@olendosaficos)",
    url: "https://www.tiktok.com/@olendosaficos?_r=1&_t=ZS-97gDxhCwscb",
  },
  {
    id: "copy-link",
    Icon: CircleFadingPlus,
    platform: "Compartilhar",
    label: "Copiar link do álbum para compartilhar",
    url: null,
  },
];

export default function HomeClient({
  profile,
  stickers,
  ownedSlugs,
  autoSlugs,
  duplicatesCount,
  rareCount,
  completedMissionIds,
  claimedToday: initialClaimedToday,
  muralList,
  userStyles,
  dailyClaimsCount,
  releaseDayNumber,
  allElementsClaimed,
  userRank: propUserRank,
  donations: initialDonations,
  albumRewardClaimed: initialAlbumRewardClaimed = false,
}: HomeClientProps) {
  const ui = useUI();
  const router = useRouter();
  const [claimedToday, setClaimedToday] = useState(initialClaimedToday);
  const [claimedStyleId, setClaimedStyleId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<string[]>(completedMissionIds);
  const [activeCountdown, setActiveCountdown] = useState<{ id: string; label: string; url: string; count: number } | null>(null);
  const [showPoster, setShowPoster] = useState(false);
  const [posterMode, setPosterMode] = useState<"final" | "progress">("progress");

  const [albumRewardClaimed, setAlbumRewardClaimed] = useState(initialAlbumRewardClaimed);
  const [claimingAlbumReward, setClaimingAlbumReward] = useState(false);
  const [packReveals, setPackReveals] = useState<RevealItem[]>([]);
  const [packTitle, setPackTitle] = useState("");
  const [showPackOpener, setShowPackOpener] = useState(false);

  const handleClaimAlbumReward = async () => {
    setClaimingAlbumReward(true);
    try {
      const res = await dbService.claimAlbumCompletionReward();
      setAlbumRewardClaimed(true);

      const rareNumbers = res.rare_numbers || ALL_RARE_STICKER_NUMBERS;
      const reveals: RevealItem[] = rareNumbers.map((num: number) => {
        const st = stickers.find((s: any) => s.number === num);
        return {
          number: num,
          name: st?.name || `Figurinha Rara #${num}`,
          slug: st?.slug || `rare-${num}`,
          author: st?.author || null,
          wasNew: true,
          isRare: true,
          repeat: false,
          reward: null,
        };
      });

      setPackReveals(reveals);
      setPackTitle("Recompensa de 100% do Álbum: 30 Raras");
      setShowPackOpener(true);
      ui.toast("Recompensa resgatada com sucesso! Todas as Raras foram coladas no seu álbum.");
    } catch (err: any) {
      ui.toast(err?.message || "Erro ao resgatar recompensa de 100% do álbum.");
    } finally {
      setClaimingAlbumReward(false);
    }
  };

  const ownedCount = ownedSlugs.length;
  const { pct, statusText, titleIcon } = getCollectionStatus(ownedCount);
  const exclusiveCount = ownedSlugs.filter((slug) => {
    const sticker = stickers.find((item) => item.slug === slug);
    return sticker ? isExclusiveSticker(sticker) : false;
  }).length;
  const commonCount = Math.max(0, ownedCount - rareCount - exclusiveCount);

  // Active category evolution achievements
  const [activeAchievements, setActiveAchievements] = useState<string[]>([]);
  const [donations, setDonations] = useState<Donation[]>(() =>
    typeof window === "undefined"
      ? initialDonations
      : mergeDonations(initialDonations, getStoredDonations(profile.id)),
  );

  useEffect(() => {
    setDonations(mergeDonations(initialDonations, getStoredDonations(profile.id)));
  }, [initialDonations, profile.id]);

  useEffect(() => {
    if (!claimedToday) {
      setClaimedStyleId(null);
      return;
    }

    const storageKey = `claimed_daily_style:${profile.id}:${getLocalDateStr()}`;
    const savedStyleId = localStorage.getItem(storageKey);
    if (savedStyleId) setClaimedStyleId(savedStyleId);

    dbService
      .getClaimedDailyStyle(profile.id)
      .then((styleId) => {
        if (styleId) {
          localStorage.setItem(storageKey, styleId);
          setClaimedStyleId(styleId);
        }
      })
      .catch((error) => console.error("Error loading claimed daily style:", error));
  }, [claimedToday, profile.id]);

  useEffect(() => {
    let cancelled = false;
    const refreshDonations = async () => {
      try {
        const current = await dbService.getOutgoingDonations(profile.id);
        if (!cancelled) setDonations(mergeDonations(current, getStoredDonations(profile.id)));
      } catch (error) {
        console.error("Error loading outgoing donations:", error);
      }
    };

    refreshDonations();
    const intervalId = window.setInterval(refreshDonations, 60_000);
    window.addEventListener("focus", refreshDonations);
    window.addEventListener("outgoing_donations_change", refreshDonations);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDonations);
      window.removeEventListener("outgoing_donations_change", refreshDonations);
    };
  }, [profile.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const acknowledged = JSON.parse(localStorage.getItem("acknowledged_achievements") || "[]");
    const active: string[] = [];
    if (ownedCount >= 16 && !acknowledged.includes("bronze")) active.push("bronze");
    if (ownedCount >= 41 && !acknowledged.includes("prata")) active.push("prata");
    if (ownedCount >= 66 && !acknowledged.includes("ouro")) active.push("ouro");
    if (ownedCount >= TOTAL_ALBUM_STICKERS && !acknowledged.includes("purpurina")) active.push("purpurina");
    setActiveAchievements(active);
  }, [ownedCount]);

  // Generate the 3x3 grid items based on user's progress
  const gridItems = (() => {
    // 1. Map owned slugs to objects with their stickers and rarity info
    const ownedStickersList = ownedSlugs
      .map((slug) => {
        const sticker = stickers.find((s) => s.slug === slug);
        const isAuto = autoSlugs.includes(slug);
        const index = ownedSlugs.indexOf(slug);
        return { slug, sticker, isAuto, index };
      })
      .filter(
        (item): item is { slug: string; sticker: Sticker; isAuto: boolean; index: number } =>
          item.sticker !== undefined,
      );

    // 2. Sort them: autographed (isAuto: true) first, then by index descending (most recent first)
    const sortedOwned = [...ownedStickersList].sort((a, b) => {
      if (a.isAuto && !b.isAuto) return -1;
      if (!a.isAuto && b.isAuto) return 1;
      return b.index - a.index; // index descending (most recent first)
    });

    // 3. Build the 9 slots
    const slots = [];
    for (let i = 0; i < 9; i++) {
      if (i < sortedOwned.length) {
        slots.push({
          type: sortedOwned[i].isAuto ? "rare" : "common",
          sticker: sortedOwned[i].sticker,
        });
      } else {
        slots.push({
          type: "empty",
          sticker: null,
        });
      }
    }
    return slots;
  })();

  const claimDaily = async () => {
    if (claiming || claimedToday) return;
    setClaiming(true);
    try {
      const res = await claimDailyElementAction();
      setClaiming(false);
      if (res.success && res.data) {
        setClaimedToday(true);
        if (res.data.style?.id) {
          setClaimedStyleId(res.data.style.id);
          localStorage.setItem(
            `claimed_daily_style:${profile.id}:${getLocalDateStr()}`,
            res.data.style.id,
          );
        }
        router.invalidate();
        if (res.data.unlocked) {
          localStorage.setItem("has_unseen_styles", "true");
          const claimedReward = res.data.style?.id
            ? styleIdToRewardMapping[res.data.style.id]
            : undefined;
          ui.toast(res.data.all_claimed
            ? `Estilização resgatada: ${claimedReward?.name || "novo elemento"}${claimedReward?.icon ? ` ${claimedReward.icon}` : ""}. Não há mais nenhum resgate novo; volte no próximo dia para mais novidades! ✦`
            : `Estilização resgatada: ${claimedReward?.name || "novo elemento"}${claimedReward?.icon ? ` ${claimedReward.icon}` : ""}. Volte amanhã para mais! ✦`);
        } else {
          ui.toast(res.data.message || "Elemento do dia resgatado! Volte amanhã para mais! ✦");
        }
        ui.triggerHearts();
      } else {
        ui.toast(res.message || "Erro ao resgatar o elemento do dia.");
      }
    } catch (e) {
      setClaiming(false);
      ui.toast("Erro ao resgatar o elemento do dia.");
    }
  };

  const doMission = async (id: string, url: string | null, label: string) => {
    if (completedMissions.includes(id)) return;

    const persistMissionPack = (reveals: RevealItem[]) => {
      if (!reveals || reveals.length === 0) return;
      const pendingObj = {
        reveals,
        title: "Missão concluída! ✦",
        flippedCards: [],
        isOpened: false,
      };
      localStorage.setItem("pending_pack", JSON.stringify(pendingObj));
      dbService.syncPendingPack(pendingObj).catch(() => undefined);
      window.dispatchEvent(new Event("pending_pack_change"));
    };

    if (id === "copy-link") {
      const shareUrl = getPublicAlbumUrl(profile.id);
      try {
        await navigator.clipboard.writeText(shareUrl);
        ui.toast("Link do seu álbum copiado! 🔗");
      } catch (err) {
        ui.toast("Erro ao copiar o link.");
      }

      try {
        const res = await completeMissionAction(id);
        if (res.success && res.data) {
          persistMissionPack(res.data.reveals || []);
          setCompletedMissions((prev) => (prev.includes(id) ? prev : [...prev, id]));
          setTimeout(() => {
            ui.triggerPendingPack();
          }, 300);
        } else {
          ui.toast(res.message || "Erro ao concluir missão.");
        }
      } catch (e) {
        ui.toast("Erro ao concluir missão.");
      }
    } else {
      if (url) {
        window.open(url, "_blank");
      }
      setActiveCountdown({ id, label, url: url || "", count: 10 });
    }
  };

  useEffect(() => {
    if (!activeCountdown) return;

    if (activeCountdown.count <= 0) {
      const finishMission = async () => {
        try {
          const res = await completeMissionAction(activeCountdown.id);
          if (res.success && res.data) {
            const reveals = res.data.reveals || [];
            if (reveals.length > 0) {
              const pendingObj = {
                reveals,
                title: "Missão concluída! ✦",
                flippedCards: [],
                isOpened: false,
              };
              localStorage.setItem("pending_pack", JSON.stringify(pendingObj));
              await dbService.syncPendingPack(pendingObj).catch(() => undefined);
              window.dispatchEvent(new Event("pending_pack_change"));

              ui.triggerPendingPack();
            }
            setCompletedMissions((prev) =>
              prev.includes(activeCountdown.id) ? prev : [...prev, activeCountdown.id],
            );
          } else {
            ui.toast(res.message || "Erro ao concluir missão.");
          }
        } catch (e) {
          ui.toast("Erro ao concluir missão.");
        } finally {
          setActiveCountdown(null);
        }
      };

      finishMission();
      return;
    }

    const timer = setTimeout(() => {
      setActiveCountdown((prev) => (prev ? { ...prev, count: prev.count - 1 } : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeCountdown, ui]);

  const getProgressShareTexts = () => {
    const publicAlbumUrl = getPublicAlbumUrl(profile.id);
    return {
      x: `Meu álbum do @lendosaficos está com ${commonCount} comuns, ${rareCount} raras e ${exclusiveCount} exclusivas. ${pct === 100 ? "Álbum completo! 🎉" : "Já criou seu álbum?"} Visite: ${publicAlbumUrl}`,
      whatsapp: `Meu álbum do Lendo Sáficos está com ${commonCount} comuns, ${rareCount} raras e ${exclusiveCount} exclusivas. ${pct === 100 ? "Álbum completo! 🎉" : "Já criou seu álbum?"} Visite: ${publicAlbumUrl}`,
    };
  };

  const shareModal = () => {
    const { x: shareTextX, whatsapp: shareTextWhatsApp } = getProgressShareTexts();
    ui.openModal(
      <div style={{ textAlign: "center" }}>
        <h2>Compartilhar meu progresso</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
          <button
            className="btn share-pill"
            onClick={() => {
              window.open(
                "https://x.com/intent/post?text=" + encodeURIComponent(shareTextX),
                "_blank",
              );
              ui.closeModal();
            }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <XIcon className="w-4 h-4" />
            Publicar no X
          </button>
          <button
            className="btn"
            onClick={() => {
              window.open(
                "https://api.whatsapp.com/send?text=" + encodeURIComponent(shareTextWhatsApp),
                "_blank",
              );
              ui.closeModal();
            }}
            style={{
              background: "#25D366",
              color: "#fff",
              borderRadius: "30px",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              border: "none",
            }}
          >
            <WhatsAppIcon className="w-5 h-5" />
            Compartilhar no WhatsApp
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              ui.closeModal();
              setPosterMode("progress");
              setShowPoster(true);
            }}
            style={{ marginTop: "4px" }}
          >
            Gerar imagem pro Story
          </button>
        </div>
      </div>,
    );
  };

  const shareOnX = () => {
    const { x: shareTextX } = getProgressShareTexts();
    window.open("https://x.com/intent/post?text=" + encodeURIComponent(shareTextX), "_blank");
  };

  const shareOnWhatsApp = () => {
    const { whatsapp: shareTextWhatsApp } = getProgressShareTexts();
    window.open(
      "https://api.whatsapp.com/send?text=" + encodeURIComponent(shareTextWhatsApp),
      "_blank",
    );
  };

  const shareOnStory = () => {
    setPosterMode("progress");
    setShowPoster(true);
  };

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.success) {
      localStorage.removeItem("recent_stickers");
      window.location.href = "/clubedascolecionadoras/login";
    } else {
      ui.toast("Erro ao sair da conta.");
    }
  };

  const isMuralActive = profile.mural_opt_in;
  const userRankIndex = muralList.findIndex((m) => m.id === profile.id);
  const userRank =
    propUserRank !== undefined && propUserRank !== null
      ? propUserRank
      : userRankIndex !== -1
        ? userRankIndex + 1
        : null;
  // Check active styles for UI theme and visual overrides
  const isNeonEnabled = userStyles?.find((s) => s.style_id === "avatar-neon-frame" && s.enabled);
  const isDarkEnabled = userStyles?.find((s) => s.style_id === "theme-dark" && s.enabled);
  const isStoryPremiumEnabled = ownedCount >= TOTAL_ALBUM_STICKERS;
  const isLilacEnabled = userStyles?.find((s) => s.style_id === "lilac" && s.enabled);

  // Discover next available reward based on what is unlocked
  const rewardOrderKeys = ["lilac", "avatar-neon-frame", "new-icon", "theme-dark", "story-layout"];
  const nextStyleId = rewardOrderKeys.find((id) => {
    const s = userStyles?.find((us) => us.style_id === id);
    return !s || !s.unlocked;
  });

  const styleIdToRewardMapping: { [key: string]: { name: string; icon: string; desc: string } } = {
    lilac: {
      name: "cor do álbum (lilás)",
      icon: "💜",
      desc: "Desbloqueia o tema lilás e roxo para o aplicativo!",
    },
    "avatar-neon-frame": {
      name: "moldura arco-íris pro avatar",
      icon: "🌈",
      desc: "Desbloqueia uma borda brilhante com as cores do arco-íris para o seu avatar!",
    },
    "new-icon": {
      name: "avatares extras",
      icon: "🖼️",
      desc: "Desbloqueia os avatares especiais 13 a 16 para usar no seu perfil!",
    },
    "theme-dark": {
      name: "cor do álbum (versão dark)",
      icon: "🌙",
      desc: "Desbloqueie o tema escuro plum/velvet de luxo para a sua leitura escuro!",
    },
    glitter: {
      name: "fundo glitter",
      icon: "✨",
      desc: "Desbloqueia o fundo com brilho suave para o aplicativo!",
    },
    "story-layout": {
      name: "layout de story premium",
      icon: "📱",
      desc: "Desbloqueia uma versão premium do card para compartilhar progresso no Instagram!",
    },
  };

  const displayedRewardId = claimedToday && claimedStyleId ? claimedStyleId : nextStyleId;
  const currentReward = displayedRewardId && styleIdToRewardMapping[displayedRewardId]
    ? styleIdToRewardMapping[displayedRewardId]
    : {
        name: "Concluído",
        icon: "✨",
        desc: "Todos os estilos desbloqueados.",
      };
  const dEl = currentReward.name;
  const emojiEl = currentReward.icon;
  const rewardDesc = currentReward.desc;
  const shareAccentColor = isLilacEnabled ? "#ab3292" : "#D4537E";
  const shareCardStyle: React.CSSProperties = isStoryPremiumEnabled
    ? {
        background: "linear-gradient(155deg, #16031f 0%, #4c126d 44%, #8b2bd6 72%, #e9b84e 100%)",
        border: "1px solid rgba(255,255,255,0.38)",
        boxShadow: "0 18px 42px rgba(76, 18, 109, 0.36), inset 0 0 0 1px rgba(255,255,255,0.14)",
      }
    : { background: shareAccentColor };

  const pendingMissions = MISSIONS.filter((m) => !completedMissions.includes(m.id));

  // Pending pack check
  const [pendingPack, setPendingPack] = useState<{
    reveals: RevealItem[];
    title: string;
    flippedCards: number[];
    rewardMsg?: string;
    rewardTag?: string;
  } | null>(null);

  useEffect(() => {
    const updatePendingPack = () => {
      const saved = localStorage.getItem("pending_pack");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.reveals && parsed.reveals.length > 0) {
            setPendingPack(parsed);
            return;
          }
        } catch (e) {
          console.error("Error parsing pending pack:", e);
        }
      }

      // Fallback: check if there's a queued pack in reveals_queue
      const savedQueue = localStorage.getItem("reveals_queue");
      if (savedQueue) {
        try {
          const parsedQueue = JSON.parse(savedQueue);
          if (Array.isArray(parsedQueue) && parsedQueue.length > 0) {
            const nextPack = parsedQueue[0];
            setPendingPack({
              reveals: nextPack.items,
              title: nextPack.title,
              flippedCards: [],
              rewardMsg: nextPack.rewardMsg,
              rewardTag: nextPack.rewardTag,
            });
            return;
          }
        } catch (e) {
          console.error("Error parsing reveals queue:", e);
        }
      }

      setPendingPack(null);
    };

    updatePendingPack();

    window.addEventListener("pending_pack_change", updatePendingPack);
    window.addEventListener("storage", updatePendingPack);

    return () => {
      window.removeEventListener("pending_pack_change", updatePendingPack);
      window.removeEventListener("storage", updatePendingPack);
    };
  }, []);

  // Recent stickers check
  const [recentStickers, setRecentStickers] = useState<number[]>([]);

  useEffect(() => {
    const updateRecentStickers = () => {
      const saved = localStorage.getItem(`recent_stickers:${profile.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRecentStickers(parsed);
            return;
          }
        } catch (e) {
          console.error("Error parsing recent stickers:", e);
        }
      }
      setRecentStickers(profile.recent_stickers || []);
    };

    updateRecentStickers();

    window.addEventListener("pending_pack_change", updateRecentStickers);
    window.addEventListener("storage", updateRecentStickers);

    return () => {
      window.removeEventListener("pending_pack_change", updateRecentStickers);
      window.removeEventListener("storage", updateRecentStickers);
    };
  }, [profile.id, profile.recent_stickers]);

  const [hasUnseenStyles, setHasUnseenStyles] = useState(false);

  useEffect(() => {
    const checkStyles = () => {
      setHasUnseenStyles(localStorage.getItem("has_unseen_styles") === "true");
    };
    checkStyles();
    window.addEventListener("storage", checkStyles);
    return () => window.removeEventListener("storage", checkStyles);
  }, []);

  const hasNotifications =
    (!claimedToday && !allElementsClaimed) ||
    pendingMissions.length > 0 ||
    !!pendingPack ||
    donations.length > 0 ||
    activeAchievements.length > 0 ||
    hasUnseenStyles;

  const openNotificationsModal = () => {
    ui.openModal(
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
          className="text-[#C2185B]"
        >
          <Bell className="w-5 h-5 text-[#C2185B] inline" /> Suas Notificações
        </h2>

        {activeAchievements.map((ach) => {
          let emoji = "🏵️";
          let title = "Coleção Bronze";
          let desc =
            "Parabéns! Você alcançou a categoria Coleção Bronze! Continue colecionando para subir de nível ✦";
          if (ach === "prata") {
            emoji = "🥈";
            title = "Coleção Prata";
            desc =
              "Parabéns! Você alcançou a categoria Coleção Prata! Suas conquistas estão brilhando ✦";
          } else if (ach === "ouro") {
            emoji = "🥇";
            title = "Coleção Ouro";
            desc =
              "Parabéns! Você alcançou a categoria Coleção Ouro! Você é uma colecionadora de elite ✦";
          } else if (ach === "purpurina") {
            emoji = "👑";
            title = "Coleção Purpurina";
            desc =
              "Parabéns! Você completou seu álbum e alcançou o nível lendário Coleção Purpurina! 🍾";
          }

          return (
            <div
              key={ach}
              className="notif-item active"
              style={{
                cursor: "pointer",
                border: "1px solid rgba(239, 159, 39, 0.4)",
                background: "#fffbf0",
                borderRadius: "12px",
                padding: "10px 14px",
                marginBottom: "10px",
              }}
              onClick={() => {
                const acknowledged = JSON.parse(
                  localStorage.getItem("acknowledged_achievements") || "[]",
                );
                const nextAck = [...acknowledged, ach];
                localStorage.setItem("acknowledged_achievements", JSON.stringify(nextAck));
                setActiveAchievements(activeAchievements.filter((x) => x !== ach));

                ui.closeModal();
                ui.triggerHearts();
                ui.toast(`Evolução confirmada: ${title}! ✦`);
              }}
            >
              <span className="bullet">{emoji}</span>
              <div
                className="text"
                style={{ color: "#855805", fontWeight: "600", fontSize: "11px", textAlign: "left" }}
              >
                <b>Nova Conquista!</b> {desc}
              </div>
            </div>
          );
        })}

        {pendingPack && (
          <div
            className="notif-item active animate-pulse"
            style={{
              cursor: "pointer",
              border: "1px dashed var(--magenta)",
              background: "#fff0f5",
              borderRadius: "12px",
              padding: "10px 14px",
              marginBottom: "10px",
            }}
            onClick={() => {
              ui.closeModal();
              ui.triggerPendingPack();
            }}
          >
            <span className="bullet">🎁</span>
            <div
              className="text"
              style={{
                color: "var(--magenta)",
                fontWeight: "700",
                fontSize: "11px",
                textAlign: "left",
              }}
            >
              {pendingPack.rewardMsg ? (
                <span>
                  <b>
                    {pendingPack.rewardTag
                      ? pendingPack.rewardTag === "Baldaverso"
                        ? "Kit Baldaverso Concluído!"
                        : `Saga ${pendingPack.rewardTag} Concluída!`
                      : "Saga Concluída!"}
                  </b>{" "}
                  {pendingPack.rewardMsg} Clique para abrir seu pacote.
                </span>
              ) : (
                <span>
                  Você tem um <b>pacote pendente</b> para revelar! Clique para continuar a abertura.
                </span>
              )}
            </div>
          </div>
        )}

        {donations.map((donation) => {
          const sticker = stickers.find((item) => item.number === donation.sticker_number);
          const isPending = donation.status === "active";
          const title = sticker?.name || "Figurinha";
          const number = String(donation.sticker_number).padStart(3, "0");

          return (
            <div
              key={donation.code}
              className="notif-item active"
              style={{
                border: `1px solid ${isPending ? "rgba(194, 24, 91, 0.28)" : "rgba(92, 118, 92, 0.3)"}`,
                background: isPending ? "#fff0f5" : "#f3faf1",
                borderRadius: "12px",
                padding: "11px 14px",
                marginBottom: "10px",
              }}
            >
              <span className="bullet">🎁</span>
              <div className="text" style={{ color: "var(--wine)", fontSize: "11px", textAlign: "left" }}>
                <b>Doação #{number} · {title}</b>
                <div style={{ marginTop: "3px" }}>
                  Código: <b style={{ letterSpacing: "1px" }}>{donation.code}</b> · {" "}
                  <b style={{ color: isPending ? "var(--magenta)" : "#47764a" }}>
                    {isPending ? "Pendente" : "Resgatado"}
                  </b>
                </div>
                {isPending && (
                  <div style={{ marginTop: "3px", opacity: 0.75 }}>
                    Disponível por mais {getDonationTimeLeft(donation.expires_at)}.
                  </div>
                )}
                {isPending && (
                  <button
                    type="button"
                    className="btn soft"
                    style={{ marginTop: "7px", padding: "5px 10px", fontSize: "10px" }}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(donation.code);
                        ui.toast("Código copiado! 💝");
                      } catch {
                        ui.toast("Não foi possível copiar o código.");
                      }
                    }}
                  >
                    <Copy className="w-3 h-3 inline-block mr-1" /> Copiar código
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {!claimedToday && !allElementsClaimed && (
          <div
            className="notif-item active"
            style={{ cursor: "pointer" }}
            onClick={() => {
              ui.closeModal();
              claimDaily();
            }}
          >
            <span className="bullet">✦</span>
            <div className="text">
              Você tem um <b>Elemento do Dia</b> gratuito para resgatar!
            </div>
          </div>
        )}

        {pendingMissions.length > 0 && (
          <div className="notif-item active">
            <span className="bullet">✦</span>
            <div className="text">
              Você tem <b>{pendingMissions.length} missões</b> disponíveis para ganhar figurinhas
              grátis!
            </div>
          </div>
        )}

        {hasUnseenStyles && (
          <div
            className="notif-item active"
            style={{ cursor: "pointer" }}
            onClick={() => {
              ui.closeModal();
              localStorage.removeItem("has_unseen_styles");
              setHasUnseenStyles(false);
              router.navigate({ to: "/clubedascolecionadoras/config" });
            }}
          >
            <span className="bullet">🔮</span>
            <div className="text">
              Você possui novas <b>Estilizações</b> disponíveis! Clique para ativá-las.
            </div>
          </div>
        )}

        {claimedToday &&
          pendingMissions.length === 0 &&
          !pendingPack &&
          donations.length === 0 &&
          activeAchievements.length === 0 &&
          !hasUnseenStyles &&
          recentStickers.length === 0 && (
            <div className="empty" style={{ padding: "20px 0" }}>
              Nenhuma notificação pendente. Você está em dia!{" "}
              <PartyPopper className="w-4 h-4 text-[#C2185B] inline-block align-text-bottom" />
            </div>
          )}

        {recentStickers.length > 0 && (
          <div style={{ marginTop: "16px", textAlign: "left" }}>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--wine)",
                opacity: 0.8,
                marginBottom: "8px",
                paddingLeft: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Últimas Figurinhas Recebidas
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentStickers.slice(0, 10).map((stickerNum, idx) => {
                const sticker = stickers.find((s) => s.number === stickerNum);
                if (!sticker) return null;
                return (
                  <div
                    key={`${stickerNum}-${idx}`}
                    className="notif-item active"
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1px solid #fce4ec",
                      background: "#fffbfd",
                    }}
                    onClick={() => {
                      ui.closeModal();
                      router.navigate({
                        to: "/clubedascolecionadoras/album",
                        search: { sticker: stickerNum } as any,
                      });
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>📖</span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: "var(--wine)",
                          fontWeight: 700,
                        }}
                      >
                        Figurinha Recebida!
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          color: "var(--magenta)",
                          opacity: 0.9,
                        }}
                      >
                        #{String(stickerNum).padStart(3, "0")} · {sticker.name}
                      </p>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--magenta)", fontWeight: 700 }}>
                      Ver →
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button className="btn soft" onClick={ui.closeModal} style={{ marginTop: "14px" }}>
          Fechar
        </button>
      </div>,
    );
  };

  const navGridItems = [
    { icon: ALBUM, label: "álbum", to: "/clubedascolecionadoras/album" },
    { icon: QUIZ, label: "quiz", to: "/clubedascolecionadoras/quiz" },
    { icon: CODIGOS, label: "códigos", to: "/clubedascolecionadoras/codigos" },
    { icon: REPETIDAS, label: "repetidas", to: "/clubedascolecionadoras/doar" },
    { icon: MURAL, label: "mural", to: "/clubedascolecionadoras/mural" },
  ];

  return (
    <div className="home-dashboard-page relative overflow-x-hidden">
      {/* ===== HERO SECTION ===== */}
      <div
        className="home-dashboard-hero relative overflow-hidden pt-4 pb-6"
        style={{
          background: isDarkEnabled
            ? "linear-gradient(180deg, #3d1425 0%, #1e0912 100%)"
            : userStyles?.find((s) => s.style_id === "lilac" && s.enabled)
              ? "linear-gradient(180deg, #f8e2f3 0%, #fdf7fc 100%)"
              : "linear-gradient(180deg, #ffcce0 0%, #fdf0f3 100%)",
        }}
      >
        {/* SVG background pattern */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 280"
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Left set of wavy lines */}
          <path
            d="M0 60 Q60 20 140 50 Q200 70 260 40 Q320 10 400 30"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
          <path
            d="M0 80 Q80 40 160 70 Q240 100 320 60 Q360 40 400 55"
            fill="none"
            stroke="white"
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          <path
            d="M0 100 Q100 60 180 90 Q260 120 340 80 Q370 60 400 75"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.35"
          />

          {/* Right set of wavy lines */}
          <path
            d="M400 50 Q340 10 260 45 Q200 65 140 35 Q80 5 0 25"
            fill="none"
            stroke="white"
            strokeWidth="0.7"
            strokeOpacity="0.6"
          />
          <path
            d="M400 70 Q320 30 240 65 Q160 95 80 55 Q40 35 0 50"
            fill="none"
            stroke="white"
            strokeWidth="0.55"
            strokeOpacity="0.45"
          />
          <path
            d="M400 90 Q300 50 220 85 Q140 115 60 75 Q30 55 0 70"
            fill="none"
            stroke="white"
            strokeWidth="0.45"
            strokeOpacity="0.3"
          />

          {/* Decorative stars */}
          <g filter="url(#glow)" fill="#ff99cc" opacity="0.7">
            <polygon points="160,20 162,27 169,27 163,31 165,38 160,34 155,38 157,31 151,27 158,27" />
            <polygon points="280,15 282,22 289,22 283,26 285,33 280,29 275,33 277,26 271,22 278,22" />
            <polygon points="340,55 342,62 349,62 343,66 345,73 340,69 335,73 337,66 331,62 338,62" />
            <polygon points="100,40 102,47 109,47 103,51 105,58 100,54 95,58 97,51 91,47 98,47" />
            <polygon points="210,10 211,15 216,15 212,18 213,23 210,20 207,23 208,18 204,15 209,15" />
          </g>
          <g fill="white" opacity="0.5">
            <polygon points="190,40 191,44 195,44 192,46 193,50 190,48 187,50 188,46 185,44 189,44" />
            <polygon points="310,35 311,39 315,39 312,41 313,45 310,43 307,45 308,41 305,39 309,39" />
            <polygon points="130,90 131,94 135,94 132,96 133,100 130,98 127,100 128,96 125,94 129,94" />
            <polygon points="250,80 251,83 254,83 252,85 252,88 250,86 248,88 248,85 246,83 249,83" />
            <polygon points="70,70 71,73 74,73 72,75 72,78 70,76 68,78 68,75 66,73 69,73" />
          </g>
        </svg>

        {/* Content */}
        <div className="relative z-10 px-5">
          {/* Extra sparkle stars */}
          <img src={STAR} alt="" className="absolute top-8 left-[50%] w-4 h-4 opacity-40" />
          <img src={STAR} alt="" className="absolute top-14 right-[18%] w-3 h-3 opacity-50" />
          <img src={STAR} alt="" className="absolute top-36 right-[12%] w-4 h-4 opacity-35" />

          {/* Logo + cards */}
          <div className="flex items-start">
            <div className="pt-1 z-10">
              <img src={LOGO_TEXT} alt="Clube das Colecionadoras" className="w-[264px] mb-0.5" />
              <div className="flex items-center gap-1.5 mt-0.5">
                <img src={STAR} alt="" className="w-2.5 h-2.5 opacity-60" />
                <p className="text-[9px] text-[#C2185B] font-semibold tracking-[0.15em] uppercase">
                  by Lendo Sáficos
                </p>
                <img src={STAR} alt="" className="w-2.5 h-2.5 opacity-60" />
              </div>
              <h1
                className="text-lg max-[425px]:text-[15px] max-[350px]:text-[13px] font-normal text-[#5c0d2b] mt-[44px] flex items-center gap-1.5 whitespace-nowrap"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Olá,{" "}
                <span className="capitalize font-normal">{profile.nick || "Leitora Sáfica"}</span>{" "}
                <span className="text-[#C2185B]">✦</span>
              </h1>
            </div>

            {/* Overlapping Cards */}
            <div className="relative w-[170px] h-[170px] flex-shrink-0 ml-auto mr-1">
              <img
                src={CARD_WINE}
                alt=""
                className="absolute left-1 top-3 w-[130px] h-auto rotate-0 drop-shadow-[0_6px_14px_rgba(194,24,91,0.25)]"
              />
              <img
                src={CARD_PINK}
                alt=""
                className="absolute right-0 top-0 w-[130px] h-auto rotate-0 drop-shadow-[0_6px_14px_rgba(194,24,91,0.2)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== PROGRESS CARD ===== */}
      <div className="home-dashboard-progress progress-card mx-4 -mt-8 mb-4 relative z-20">
        <div className="pc-layout">
          {/* Avatar Circle */}
          <div className="pc-left">
            <div className={`avatar ${isNeonEnabled ? "neon-frame" : ""}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nick} />
              ) : profile.avatar_emoji && profile.avatar_emoji.startsWith("/avatar/") ? (
                <img src={profile.avatar_emoji} alt={profile.nick} />
              ) : (
                <span>{profile.avatar_emoji || "📷"}</span>
              )}
              {/* Floating Heart Badge overlay */}
              <span className="heart">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="var(--magenta)">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Progress info */}
          <div className="pc-right">
            <p className="pc-count">{ownedCount}/{TOTAL_ALBUM_STICKERS} figurinhas</p>
            <div className="pc-progress-row">
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
              <span className="bar-pct">{pct}%</span>
            </div>
            <div className="status-tag">
              {statusText.toLowerCase()}{" "}
              <span>
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="var(--magenta)"
                  className="align-middle"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ELEMENT OF THE DAY ===== */}
      <div className="home-dashboard-daily mx-4 mb-4">
        {ownedCount >= 360 && !albumRewardClaimed && (
          <div className="bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl border-2 border-amber-400 p-4 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-300">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#9e1b4a]">
                  Recompensa do Álbum Completo (100%)
                </h3>
                <p className="text-[11px] text-[#bf2a5e] font-medium">
                  Parabéns! Você completou 100% do álbum (360/360). Resgate o seu pacote especial de Raras do Álbum!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClaimAlbumReward}
              disabled={claimingAlbumReward}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full text-[11px] font-bold text-white flex-shrink-0 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95 disabled:opacity-75"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
              }}
            >
              <Gift className="w-4 h-4" />
              {claimingAlbumReward ? "Resgatando Raras..." : "Resgatar Pacote de Raras"}
            </button>
          </div>
        )}

        <p className="text-[11px] font-semibold text-[#9e1b4a] mb-1.5 flex items-center gap-1">
          <img src={STAR} alt="" className="w-3 h-3" />
          Elemento do dia
        </p>
        {allElementsClaimed ? (
          <div className="bg-white rounded-2xl border border-pink-200/60 shadow-sm p-4 text-center">
            <p className="text-[12px] text-[#9e1b4a] font-bold leading-relaxed">
              Não há mais nenhum resgate novo. Volte no próximo dia para mais novidades! ✦
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-pink-200/60 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-yellow-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-pink-200/60">
                <span className="text-3xl">{emojiEl}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-[#9e1b4a] capitalize">{dEl}</h3>
                <p className="text-[11px] text-[#bf2a5e] font-medium mt-0.5">{rewardDesc}</p>
              </div>
            </div>
            <button
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full text-[11px] font-bold text-white flex-shrink-0 flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-transform active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
              style={{
                background: userStyles?.find((s) => s.style_id === "lilac" && s.enabled)
                  ? "linear-gradient(135deg, #c84ba9, #972c7e)"
                  : "linear-gradient(135deg, #d63384, #bf2a5e)",
              }}
              onClick={claimDaily}
              disabled={claiming || claimedToday}
            >
              {claiming ? "Resgatando..." : claimedToday ? "Resgatado" : <>
                Resgatar elemento <span className="text-sm leading-none">+</span>
              </>}
            </button>
          </div>
        )}
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="home-dashboard-stats mx-4 mb-4">
        <div className="stat-circles">
          <StatBadge
            id="coladas"
            value={ownedCount}
            label="COLADAS"
            theme={isLilacEnabled ? "lilac" : undefined}
          />
          <StatBadge
            id="repetidas"
            value={duplicatesCount}
            label="REPETIDAS"
            theme={isLilacEnabled ? "lilac" : undefined}
          />
          <StatBadge
            id="raras"
            value={rareCount}
            label="RARAS"
            theme={isLilacEnabled ? "lilac" : undefined}
          />
        </div>
      </div>

      {/* ===== POSTER SECTION ===== */}
      {pct === 100 && (
        <div className="home-dashboard-poster mx-4 mb-4">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-pink-200/60 shadow-sm p-4">
            <div className="relative z-10 pr-[92px] max-[335px]:pr-[70px]">
              <p className="text-[11px] font-semibold text-[#9e1b4a] flex items-center gap-1 mb-1">
                <Crown className="w-3.5 h-3.5 text-[#9e1b4a] inline" />{" "}
                <span className="font-extrabold">Pôster final</span>
              </p>
              <p className="text-[11px] text-[#bf2a5e] font-medium mb-3 leading-relaxed">
                Você desbloqueou o pôster final!
              </p>
              <button
                className="px-5 py-2 rounded-full text-[11px] font-bold text-white shadow-sm cursor-pointer transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, #d63384, #bf2a5e)" }}
                onClick={() => {
                  setPosterMode("final");
                  setShowPoster(true);
                }}
              >
                Ver meu pôster
              </button>
            </div>
            {/* Exclusive completion emblem */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-[104px] h-[104px] max-[335px]:w-[78px] max-[335px]:h-[78px] flex items-center justify-center pointer-events-none z-20">
              <span className="absolute inset-2 rounded-full bg-gradient-to-br from-[#ffe8a8]/75 via-[#ffd0e4]/65 to-[#f3b8e7]/60 blur-[2px]" />
              <span className="absolute top-0 right-2 text-[#f1b934] text-base leading-none">✦</span>
              <span className="absolute bottom-1 left-1 text-[#d63384] text-xs leading-none">✦</span>
              <img
                src={PURPURINA_EMBLEM}
                alt=""
                className="relative w-[92px] max-[335px]:w-[68px] h-auto drop-shadow-[0_9px_16px_rgba(158,27,74,0.22)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== CLICK MISSIONS ===== */}
      <div className="home-dashboard-missions mx-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-[#9e1b4a] flex items-center gap-1">
            <img src={STAR} alt="" className="w-3 h-3" />
            Missões de clique
          </p>
          <span className="text-[10px] font-semibold text-[#bf2a5e]">figurinhas grátis</span>
        </div>

        {(() => {
          const visibleMissions = MISSIONS.filter(
            (m) => !completedMissions.includes(m.id) || m.id === "copy-link",
          );

          if (visibleMissions.length === 0) {
            return (
              <div className="bg-white rounded-2xl border border-pink-200/60 shadow-sm p-5 text-center text-xs font-semibold text-[#9e1b4a]">
                Você já concluiu todas as missões! ✦
              </div>
            );
          }

          return (
            <div className="space-y-2">
              {visibleMissions.map((m) => {
                const isCompleted = completedMissions.includes(m.id);
                const isCopyLink = m.id === "copy-link";

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-pink-200/60 shadow-sm px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#fce4ec] flex items-center justify-center flex-shrink-0 border border-pink-200/60">
                      <m.Icon className="w-4 h-4 text-[#C2185B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#9e1b4a] leading-tight">
                        {m.label}
                      </p>
                      <p className="text-[10px] text-[#bf2a5e] font-medium flex items-center gap-1">
                        {isCompleted ? (
                          <>
                            missão concluída <span className="text-[#C2185B]">✦</span>
                          </>
                        ) : (
                          <>
                            ganha uma figurinha surpresa{" "}
                            <Gift className="w-3.5 h-3.5 text-[#bf2a5e] inline align-text-bottom" />
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      className="px-5 py-1.5 rounded-full text-[11px] font-bold text-white flex-shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: "var(--gradient-berry)" }}
                      disabled={activeCountdown !== null}
                      onClick={() => {
                        if (isCompleted && isCopyLink) {
                          const shareUrl = getPublicAlbumUrl(profile.id);
                          navigator.clipboard
                            .writeText(shareUrl)
                            .then(() => {
                              ui.toast("Link do seu álbum copiado! 🔗");
                            })
                            .catch(() => {
                              ui.toast("Erro ao copiar o link.");
                            });
                        } else {
                          doMission(m.id, m.url, m.label);
                        }
                      }}
                    >
                      {isCompleted && isCopyLink
                        ? "Compartilhar Link"
                        : activeCountdown && activeCountdown.id === m.id
                          ? `Aguardando (${activeCountdown.count}s)`
                          : "Fazer"}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ===== MURAL ===== */}
      <div className="home-dashboard-mural mx-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-[#9e1b4a] flex items-center gap-1">
            <img src={STAR} alt="" className="w-3 h-3" />
            Mural das colecionadoras
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-pink-200/60 shadow-sm p-4 text-center">
          {isMuralActive ? (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-[#C2185B] shadow-sm border border-pink-200 mb-2">
                <Trophy className="w-6 h-6 text-[#C2185B]" />
              </div>
              <p className="text-xs text-[#5c0d2b] font-bold">Sua posição atual no ranking:</p>
              <p className="text-2xl font-black text-[#C2185B] font-sans mt-1">
                {userRank ? `#${userRank}` : "Carregando..."}
              </p>
              <button
                className="mt-3 w-full py-2.5 rounded-2xl text-[11px] font-bold text-white shadow-md cursor-pointer transition-transform active:scale-[0.98]"
                style={{ background: "var(--gradient-berry)" }}
                onClick={() => router.navigate({ to: "/clubedascolecionadoras/mural" })}
              >
                Ver Ranking Completo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm border border-gray-200 mb-2">
                <Trophy className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-xs text-[#bf2a5e] leading-relaxed px-4 font-semibold">
                Você não está ativa no mural das colecionadoras.
              </p>
              <p className="text-[10px] text-[#bf2a5e]/70 mt-1 px-4 leading-relaxed font-medium">
                Ative a opção &quot;Aparecer no mural&quot; nas{" "}
                <span
                  className="font-bold text-[#C2185B] underline cursor-pointer"
                  onClick={() => router.navigate({ to: "/clubedascolecionadoras/config" })}
                >
                  Configurações
                </span>{" "}
                para ver sua posição e aparecer para as outras leitoras!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== SHARE ===== */}
      <div className="home-dashboard-share mx-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-[#9e1b4a] flex items-center gap-1">
            <img src={STAR} alt="" className="w-3 h-3" />
            Compartilhar progresso
          </p>
        </div>

        <div className="home-share-panel bg-gradient-to-br from-pink-50 to-[#fff0f5] border border-pink-200/50 shadow-sm p-4 relative overflow-hidden text-center rounded-2xl">
          <h3 className="font-script text-[#C2185B] text-xl font-bold mb-1 mt-1 tracking-wide">
            Espalhe a novidade!
          </h3>
          <p className="text-[10px] text-[#bf2a5e] font-semibold mb-3 px-4 leading-normal">
            {pct < 100
              ? `${ownedCount} coladas · ${pct}%`
              : "Album completo! Hora de celebrar."}
          </p>

          {/* Preview Card Mockup */}
          <div className="home-share-preview flex justify-center my-4">
            <div
              id="shareCard"
              className="rounded-[18px] p-4 w-[240px] text-white text-left shadow-md relative overflow-hidden"
              style={shareCardStyle}
            >
              {isStoryPremiumEnabled && (
                <>
                  <div className="absolute -top-12 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                </>
              )}
              {/* Header */}
              <div className="relative flex justify-between items-center mb-3">
                <span className="text-[8px] font-bold tracking-wider text-[#F4C0D1] uppercase">
                  LENDO SÁFICOS
                </span>
                <span className="text-[9px] px-2 py-[2px] rounded-full font-bold text-white bg-white/20 border border-white/20">
                  {pct === 100 ? "Coleção Purpurina" : statusText}
                </span>
              </div>
              {isStoryPremiumEnabled && (
                <div className="relative mb-3 inline-flex items-center rounded-full border border-[#f1cf74]/50 bg-[#f1cf74]/20 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-[#ffeaa0]">
                  story premium
                </div>
              )}

              {/* User Info Row */}
              <div className="relative flex items-center gap-[10px] mb-3">
                <div className="w-[34px] h-[34px] rounded-full bg-white/25 border-[1.5px] border-white/50 flex-shrink-0 flex items-center justify-center overflow-hidden text-lg">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.nick}
                      className="w-full h-full object-cover"
                    />
                  ) : profile.avatar_emoji && profile.avatar_emoji.startsWith("/avatar/") ? (
                    <img
                      src={profile.avatar_emoji}
                      alt={profile.nick}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profile.avatar_emoji || "📷"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-white truncate mb-1">
                    {profile.nick}
                  </div>
                  <div className="bg-white/25 rounded-[4px] h-[5px] w-full">
                    <div
                      className="bg-white rounded-[4px] h-[5px] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-[13px] font-bold text-white ml-1 flex-shrink-0">{pct}%</div>
              </div>

              {/* Badges representing sticker progress */}
              <div className="relative flex gap-2 mb-3">
                <div className="flex-1 bg-white/20 border border-white/30 backdrop-blur-sm rounded-[10px] py-[6px] px-[8px] flex items-center justify-center gap-1 text-white">
                  <span className="text-[10px] font-extrabold">
                    {commonCount} comuns
                  </span>
                </div>
                <div className="flex-1 bg-[#EF9F27] border border-[#BA7517] rounded-[10px] py-[6px] px-[8px] flex items-center justify-center gap-1 text-[#633806]">
                  <span className="text-[10px] font-bold">★</span>
                  <span className="text-[10px] font-extrabold">{rareCount} raras</span>
                </div>
                <div className="flex-1 bg-[linear-gradient(135deg,#f8fbff,#b8c1cb_52%,#eef3f8)] border border-[#f6fbff]/80 rounded-[10px] py-[6px] px-[8px] flex items-center justify-center gap-1 text-[#3d4652] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <span className="text-[10px] font-bold">✦</span>
                  <span className="text-[10px] font-extrabold">{exclusiveCount} exclusivas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Share Buttons Layout */}
          <div className="home-share-buttons grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={shareOnX}
              className="flex items-center justify-center gap-2 font-bold py-[10px] px-3 rounded-full text-xs cursor-pointer active:scale-95 transition-transform bg-transparent"
              style={{
                borderWidth: "1.5px",
                borderColor: shareAccentColor,
                color: shareAccentColor,
              }}
            >
              <XIcon className="w-[14px] h-[14px]" />
              Compartilhar
            </button>
            <button
              onClick={shareOnStory}
              className="flex items-center justify-center gap-2 font-bold py-[10px] px-3 rounded-full text-xs cursor-pointer active:scale-95 transition-transform bg-transparent"
              style={{
                borderWidth: "1.5px",
                borderColor: shareAccentColor,
                color: shareAccentColor,
              }}
            >
              <Smartphone size={14} />
              Salvar story
            </button>
          </div>
          <button
            onClick={shareOnWhatsApp}
            className="home-share-whatsapp w-full mt-2 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-full text-xs text-white cursor-pointer active:scale-95 transition-transform"
            style={{ background: shareAccentColor }}
          >
            <WhatsAppIcon className="w-[18px] h-[18px]" />
            Compartilhar no WhatsApp
          </button>
        </div>
      </div>

      <div className="home-dashboard-banner mx-4 mb-4">
        <a
          href="http://amzn.to/3SKQPnL"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir oferta em uma nova aba"
          className="block overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.99]"
        >
          <picture>
            <source media="(min-width: 768px)" srcSet="/banner/130x1080.jpg" />
            <img
              src="/banner/130x600.jpg"
              alt="Banner promocional"
              className="block w-full h-auto"
              loading="lazy"
            />
          </picture>
        </a>
      </div>

      {/* Poster Canvas Modal */}
      {showPoster && (
        <PosterModal
          mode={posterMode}
          nick={profile.nick}
          stickers={stickers}
          ownedSlugs={ownedSlugs}
          autoSlugs={autoSlugs}
          statusPhrase={statusText}
          userStyles={userStyles}
          avatarUrl={profile.avatar_url}
          avatarEmoji={profile.avatar_emoji}
          rareCount={rareCount}
          exclusiveCount={exclusiveCount}
          premiumLayout={!!isStoryPremiumEnabled}
          onClose={() => setShowPoster(false)}
        />
      )}

      {/* Full-screen Click Mission Countdown Overlay */}
      {activeCountdown && (
        <div className="fixed inset-0 bg-[#5c0d2b]/80 backdrop-blur-md flex flex-col items-center justify-center z-[9999] p-6 text-center animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-[340px] w-full shadow-2xl border border-pink-100 flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-[#fce4ec] flex items-center justify-center animate-bounce">
              <Gift className="w-8 h-8 text-[#C2185B]" />
            </div>
            
            <h3 className="text-sm font-extrabold text-[#5c0d2b] uppercase tracking-wider">
              Missão Ativa
            </h3>
            
            <p className="text-xs text-[#bf2a5e] font-semibold leading-snug">
              {activeCountdown.label}
            </p>
            
            <div className="relative w-24 h-24 flex items-center justify-center my-2">
              {/* Circular count */}
              <div className="text-4xl font-black text-[#C2185B] animate-pulse">
                {activeCountdown.count}s
              </div>
            </div>

            <p className="text-[11px] text-[#bf2a5e]/80 leading-normal">
              Aguarde a validação da visita para receber seu pacote de figurinhas!
            </p>

            <div className="w-full bg-pink-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-[#C2185B] h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(activeCountdown.count / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      {showPackOpener && (
        <PackOpener
          reveals={packReveals}
          title={packTitle}
          onClose={() => {
            setShowPackOpener(false);
            router.invalidate();
          }}
        />
      )}
    </div>
  );
}
