"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Profile, Sticker, UserSticker } from "@/lib/types";
import { useUI } from "@/components/UIProvider";
import { getClubAssetUrl } from "@/lib/urls";
import { getVisibleStickerTag, isExclusiveSticker, isRareStickerVersion } from "@/lib/albumRules";
import { claimCollectionRewardAction } from "@/lib/actions";
import { dbService } from "@/lib/db";
import Stamp from "./Stamp";
import StickerShareModal from "./StickerShareModal";
import {
  X,
  ShoppingCart,
  Send,
  Lock,
  BookOpen,
  Tag,
  Star,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Share2,
  Grid3X3,
  List,
} from "lucide-react";

function getAutographFilename(author: string | null): string | null {
  if (!author) return null;
  const normalized = author
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.includes("baldassari")) return "baldassari";
  if (normalized.includes("kader")) return "yasmim-m-kader";
  if (normalized.includes("giordanno")) return "camilla-giordanno";
  if (normalized.includes("englantine")) return "englantine";
  if (normalized.includes("fernanda-v")) return "fernanda-v";

  return normalized;
}

function getScallopedCirclePath(
  cx: number,
  cy: number,
  r: number,
  scallopCount: number,
  depth: number,
) {
  let path = "";
  for (let i = 0; i < scallopCount; i++) {
    const angle1 = (i * 2 * Math.PI) / scallopCount;
    const angle2 = ((i + 0.5) * 2 * Math.PI) / scallopCount;
    const angle3 = ((i + 1) * 2 * Math.PI) / scallopCount;

    const rOuter = r;
    const rInner = r - depth;

    const x1 = cx + rOuter * Math.cos(angle1);
    const y1 = cy + rOuter * Math.sin(angle1);
    const x2 = cx + rInner * Math.cos(angle2);
    const y2 = cy + rInner * Math.sin(angle2);
    const x3 = cx + rOuter * Math.cos(angle3);
    const y3 = cy + rOuter * Math.sin(angle3);

    if (i === 0) {
      path += `M ${x1} ${y1}`;
    }
    path += ` Q ${x2} ${y2} ${x3} ${y3}`;
  }
  path += " Z";
  return path;
}

function AutographSignature({ filename, large = false }: { filename: string; large?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const width = large ? "95%" : "90%";

  return (
    <div
      style={{
        position: "relative",
        width,
        maxHeight: large ? "75%" : "70%",
        minHeight: large ? "86px" : "42px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!loaded && (
        <span
          aria-label="Carregando assinatura"
          style={{
            position: "absolute",
            color: "#5a2030",
            opacity: 0.48,
            fontFamily: "'Dancing Script', cursive",
            fontSize: large ? "52px" : "30px",
            transform: "rotate(-12deg)",
            animation: "autograph-placeholder-pulse 0.9s ease-in-out infinite alternate",
          }}
        >
          ✍
        </span>
      )}
      <img
        src={getClubAssetUrl(`/autographs/${filename}.png`)}
        alt="Autógrafo"
        decoding="async"
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          filter: loaded ? "brightness(0)" : "brightness(0) blur(3px)",
          opacity: loaded ? 1 : 0.16,
          transform: `scale(${large ? 1.4 : 1.35})`,
          transition: "opacity 180ms ease, filter 180ms ease",
        }}
      />
    </div>
  );
}

function AutographSeal({ author, onZoom }: { author: string | null; onZoom?: () => void }) {
  const filename = getAutographFilename(author);
  if (!filename) return null;

  return (
    <div
      className="autograph-seal-container cursor-pointer transition-transform hover:scale-105 active:scale-95"
      onClick={onZoom}
      style={{ cursor: onZoom ? "zoom-in" : "default" }}
      title={onZoom ? "Clique para ver assinatura ampliada" : undefined}
    >
      {/* badge.png as background */}
      <img
        src={getClubAssetUrl("/badge.png")}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
      {/* Text + autograph overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "12% 10%",
        }}
      >
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontWeight: 600,
            fontSize: "15px",
            color: "#5a2030",
            lineHeight: 1.0,
            display: "block",
            marginBottom: "1px",
            textAlign: "center",
          }}
        >
          com carinho,
        </span>
        <AutographSignature filename={filename} />
      </div>
    </div>
  );
}

interface AlbumClientProps {
  profile: Profile;
  stickers: Sticker[];
  userStickers: UserSticker[];
}

export default function AlbumClient({ profile, stickers, userStickers }: AlbumClientProps) {
  const ui = useUI();
  const router = useRouter();
  type AlbumFilter = "todas" | "faltam" | "coladas" | "repetidas" | "raras" | "exclusivas";
  const [filter, setFilter] = useState<AlbumFilter>("todas");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [itemsChoice, setItemsChoice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"album" | "colecoes">(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("tab=colecoes")) return "colecoes";
    }
    return "album";
  });

  const [completedTags, setCompletedTags] = useState<{ tag_name: string; claimed: boolean }[]>([]);
  const [claimingTags, setClaimingTags] = useState<Record<string, boolean>>({});

  const loadCompletedTags = async () => {
    try {
      const tags = await dbService.getCompletedTags();
      setCompletedTags(tags);

      // Auto-populate notification for unclaimed completed collections
      tags.forEach((tag) => {
        if (!tag.claimed) {
          const stored = localStorage.getItem("trade_notifications");
          const notifications = stored ? JSON.parse(stored) : [];
          const notifId = `completed-tag-${tag.tag_name}`;
          if (!notifications.some((n: any) => n.id === notifId)) {
            const newNotif = {
              id: notifId,
              type: "collection_completed",
              message: `Parabéns! Você completou a coleção ${tag.tag_name}! Você possui prêmios a serem resgatados.`,
              seen: false,
              date: new Date().toISOString(),
            };
            localStorage.setItem("trade_notifications", JSON.stringify([newNotif, ...notifications]));
            window.dispatchEvent(new Event("trade_notifications_change"));
          }
        }
      });
    } catch (e) {
      console.warn("Error loading completed tags:", e);
    }
  };

  useEffect(() => {
    loadCompletedTags();
  }, [userStickers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("tab=colecoes")) {
        setActiveTab("colecoes");
      } else if (search.includes("tab=album")) {
        setActiveTab("album");
      }
    }
  }, [router.state.location.search]);

  // Fetch the user's rare signatures as soon as the Album opens. They are
  // small files and will already be in the browser cache when a rare sticker
  // is opened.
  useEffect(() => {
    const filenames = new Set(
      userStickers
        .filter((item) => item.copies > 0 && isRareStickerVersion(item.sticker_number, item))
        .map((item) => stickers.find((sticker) => sticker.number === item.sticker_number))
        .map((sticker) => getAutographFilename(sticker?.author || null))
        .filter((filename): filename is string => Boolean(filename)),
    );

    filenames.forEach((filename) => {
      const image = new Image();
      image.decoding = "async";
      image.src = getClubAssetUrl(`/autographs/${filename}.png`);
    });
  }, [stickers, userStickers]);
  const [page, setPage] = useState(1);

  const getOwnedInfo = (num: number) => {
    return userStickers.find((us) => us.sticker_number === num && us.copies > 0);
  };

  const getCopiesCount = (num: number) => {
    return userStickers.find((us) => us.sticker_number === num)?.copies || 0;
  };

  const isRareVersion = (num: number) => {
    const info = getOwnedInfo(num);
    return isRareStickerVersion(num, info);
  };

  const filteredStickers = stickers.filter((s) => {
    const info = getOwnedInfo(s.number);
    const copies = getCopiesCount(s.number);
    if (filter === "faltam") {
      return !info;
    }
    if (filter === "coladas") {
      return !!info;
    }
    if (filter === "repetidas") {
      return copies > 1;
    }
    if (filter === "raras") {
      return isRareVersion(s.number);
    }
    if (filter === "exclusivas") {
      return isExclusiveSticker(s);
    }
    return true;
  });

  // Responsive items per page: 9 mobile (3x3), 12 tablet (3x4), 16 desktop (4x4)
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 390,
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const pageSizeOptions = windowWidth >= 1200 ? [16, 20, 24] : windowWidth >= 540 ? [12, 16, 20] : [9, 12, 15];
  const defaultItemsPerPage = pageSizeOptions[0];
  const itemsPerPage = itemsChoice && pageSizeOptions.includes(itemsChoice) ? itemsChoice : defaultItemsPerPage;
  const gridColumns =
    viewMode === "list"
      ? "1fr"
      : windowWidth >= 1200
        ? `repeat(${itemsPerPage >= 24 ? 6 : itemsPerPage >= 20 ? 5 : 4}, minmax(0, 1fr))`
        : windowWidth >= 540
          ? `repeat(${itemsPerPage >= 20 ? 5 : 4}, minmax(0, 1fr))`
          : "repeat(3, minmax(0, 1fr))";

  // Pagination details
  const totalPages = Math.ceil(filteredStickers.length / itemsPerPage) || 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStickers = filteredStickers.slice(startIndex, startIndex + itemsPerPage);

  // Generate page numbers to display in a windowed window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const getFilterCount = (type: AlbumFilter) => {
    return stickers.filter((s) => {
      const info = getOwnedInfo(s.number);
      const copies = getCopiesCount(s.number);
      if (type === "faltam") return !info;
      if (type === "coladas") return !!info;
      if (type === "repetidas") return copies > 1;
      if (type === "raras") return isRareVersion(s.number);
      if (type === "exclusivas") return isExclusiveSticker(s);
      return true;
    }).length;
  };

  const renderFilterChip = (type: AlbumFilter, label: string) => {
    const active = filter === type;
    const count = getFilterCount(type);
    return (
      <button
        key={type}
        className={`chip ${active ? "active" : ""}`}
        onClick={() => {
          setFilter(type);
          setPage(1);
        }}
      >
        {label} <b>{count}</b>
      </button>
    );
  };

  const families = [
    { tag: "Baldaverso", stickers: [1, 53, 54] },
    { tag: "Frutaverso", stickers: [5, 59, 60] },
    { tag: "Bright Falls", stickers: [22, 51, 52] },
    { tag: "HQ", stickers: [84, 85, 87] },
    { tag: "Opostos Co.", stickers: [19, 73, 74] },
  ];

  const getStickerFamily = (number: number) => families.find((family) => family.stickers.includes(number));

  const openZoomedAutograph = (sticker: Sticker) => {
    const filename = getAutographFilename(sticker.author);
    if (!filename) return;

    ui.openModal(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "360px",
          padding: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            width: "100%",
            marginBottom: "4px",
          }}
        >
          <button
            onClick={() => openSticker(sticker)}
            style={{
              background: "none",
              border: "none",
              color: "var(--magenta)",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 0",
            }}
          >
            ← Voltar
          </button>
        </div>

        <h3
          style={{
            fontFamily: "Baloo 2",
            fontSize: "20px",
            color: "var(--wine)",
            marginBottom: "2px",
            marginTop: "10px",
          }}
        >
          Autógrafo Ampliado
        </h3>
        <p className="text-xs text-[#bf2a5e]/80 mb-6 text-center">
          Assinatura de <b>{sticker.author}</b> ✍️
        </p>

        {/* Large Seal */}
        <div
          style={{
            position: "relative",
            width: "280px",
            height: "280px",
            margin: "0 auto 20px",
          }}
        >
          <img
            src={getClubAssetUrl("/badge.png")}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "12% 10%",
            }}
          >
            <span
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontWeight: 600,
                fontSize: "22px",
                color: "#5a2030",
                lineHeight: 1.0,
                display: "block",
                marginBottom: "6px",
                textAlign: "center",
              }}
            >
              com carinho,
            </span>
            <AutographSignature filename={filename} large />
          </div>
        </div>

        <button
          className="btn soft"
          onClick={ui.closeModal}
          style={{ width: "100%", marginTop: "10px" }}
        >
          Fechar
        </button>
      </div>,
      { fullScreen: true },
    );
  };

  const openSticker = (sticker: Sticker) => {
    const info = getOwnedInfo(sticker.number);
    const isRare = isRareStickerVersion(sticker, info);
    const affiliateTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "lendosaficos-20";

    const getUnlockHint = (st: Sticker) => {
      if (st.type === "quiz") return "Responda o quiz pra desbloquear";
      if (st.type === "ls") return "Vem de recompensas por progresso, códigos ou missões";
      if (st.type === "frase") return "Vem de recompensas, códigos ou missões";
      return "Desbloqueie com códigos, missões ou doações";
    };

    const getAmazonLink = (st: Sticker) => {
      if (st.amazon_url) return st.amazon_url;
      const query = st.type === "quiz" ? `${st.name} ${st.author || ""}` : st.name;
      return `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}&tag=${affiliateTag}`;
    };

    if (!info) {
      const hint = getUnlockHint(sticker);
      const isQuiz = sticker.type === "quiz";
      const HintIcon = isQuiz ? BookOpen : Lock;
      ui.openModal(
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
              maxWidth: "360px",
              marginBottom: "10px",
            }}
          >
            <button
              onClick={ui.closeModal}
              style={{
                background: "none",
                border: "none",
                color: "var(--magenta)",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
                padding: "8px 4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <X size={18} /> Fechar
            </button>
          </div>
          <div
            className="reveal-card"
            style={{
              width: "90%",
              maxWidth: "320px",
              aspectRatio: "200 / 280",
              margin: "10px auto 20px",
              position: "relative",
            }}
          >
            <Stamp number={sticker.number} owned={false} auto={false} cover={null} />
          </div>
          <h2
            style={{
              textAlign: "center",
              fontFamily: "Baloo 2",
              fontSize: "22px",
              color: "var(--wine)",
              margin: "8px 0 2px",
            }}
          >
            Figurinha misteriosa #{String(sticker.number).padStart(3, "0")}
          </h2>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              justifyContent: "center",
              color: "var(--magenta)",
              fontWeight: 800,
              margin: "10px 0",
              fontSize: "14px",
            }}
          >
            <HintIcon size={16} /> {hint}
          </p>
          {!isQuiz && (
            <button
              className="btn"
              style={{
                width: "100%",
                maxWidth: "320px",
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              onClick={async () => {
                const askText = `alguém doando a figurinha #${sticker.number} no Clube das Colecionadoras do @LendoSaficos? 💗\ntô completando meu álbum!`;
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(askText);
                  ui.toast("Pedido copiado!");
                } else {
                  ui.toast("Erro ao copiar pedido.");
                }
                ui.closeModal();
              }}
            >
              <Send size={15} /> Pedir figurinha #{sticker.number}
            </button>
          )}
          <p className="note" style={{ marginTop: "12px", textAlign: "center", maxWidth: "320px" }}>
            Você só descobre qual figurinha é quando desbloqueá-la
          </p>
        </div>,
        { fullScreen: true },
      );
      return;
    }

    const stickerFamily = getStickerFamily(sticker.number);

    ui.openModal(
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "360px",
            marginBottom: "10px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              ui.openModal(
                <StickerShareModal
                  sticker={sticker}
                  isRare={isRare}
                  onClose={ui.closeModal}
                  onMessage={ui.toast}
                />,
                { fullScreen: true },
              )
            }
            aria-label={`Compartilhar figurinha ${sticker.number}`}
            title="Compartilhar figurinha"
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 0,
              flexShrink: 0,
              background: "var(--pink-soft)",
              border: "none",
              borderRadius: "50%",
              color: "var(--magenta)",
              cursor: "pointer",
            }}
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={ui.closeModal}
            style={{
              background: "none",
              border: "none",
              color: "var(--magenta)",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
              padding: "8px 4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <X size={18} /> Fechar
          </button>
        </div>
        <div
          className={`reveal-card ${isRare ? "foil" : ""}`}
          style={{
            width: isRare ? "75%" : "90%",
            maxWidth: isRare ? "260px" : "320px",
            aspectRatio: "200 / 280",
            margin: isRare ? "10px auto 48px" : "10px auto 20px",
            marginRight: isRare ? "calc(auto + 20px)" : "auto",
            position: "relative",
          }}
        >
          <Stamp number={sticker.number} owned={true} auto={isRare} cover={sticker.slug} />
          {isRare && (
            <AutographSeal author={sticker.author} onZoom={() => openZoomedAutograph(sticker)} />
          )}
        </div>
        <h2
          style={{
            textAlign: "center",
            fontFamily: "Baloo 2",
            fontSize: "18px",
            color: "var(--wine)",
            margin: "8px 0 2px",
          }}
        >
          #{String(sticker.number).padStart(3, "0")} · {sticker.name}
        </h2>
        {sticker.author && (
          <p
            style={{
              textAlign: "center",
              color: "var(--magenta)",
              fontWeight: 800,
              marginTop: "2px",
              marginBottom: "8px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span>{sticker.author}</span>
            {sticker.ilustrator && (
              <span
                style={{
                  background: "var(--blush)",
                  color: "var(--wine)",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  border: "1px solid rgba(216, 27, 122, 0.15)",
                }}
              >
                arte: {sticker.ilustrator}
              </span>
            )}
          </p>
        )}
        {isRare && (
          <p style={{ textAlign: "center", margin: "4px 0" }}>
            <span
              className="done-pill"
              style={{
                background: "var(--gold)",
                color: "#5a3a00",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Sparkles size={12} /> versão rara autografada
            </span>
          </p>
        )}

        {stickerFamily && (
          <div
            style={{
              background: "#FFF0F5",
              border: "1px solid #FFE4E1",
              borderRadius: "12px",
              padding: "10px",
              margin: "12px auto 4px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "left",
            }}
          >
            <span
              className="text-[#c2185b]"
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                fontWeight: "bold",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "4px",
              }}
            >
              <Tag size={11} /> Coleção Família: {stickerFamily.tag}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
              {stickerFamily.stickers.map((num) => {
                const isCurrent = num === sticker.number;
                const famSticker = stickers.find((s) => s.number === num);
                const isOwned = !!getOwnedInfo(num);
                return (
                  <div
                    key={num}
                    style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
                  >
                    {isOwned ? (
                      <CheckCircle size={14} color="#2e7d32" />
                    ) : (
                      <Circle size={14} color="#a0a0a0" />
                    )}
                    <span
                      style={{
                        fontWeight: isCurrent ? "800" : "normal",
                        color: isOwned ? "#5c0d2b" : "#a0a0a0",
                        textDecoration: isCurrent ? "underline" : "none",
                      }}
                    >
                      #{String(num).padStart(3, "0")}
                      {isOwned ? ` · ${famSticker?.name || "Figurinha"}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="note" style={{ marginTop: "8px", fontSize: "9px", lineHeight: "1.2" }}>
              Ao colecionar os 3 livros da família {stickerFamily.tag}, você ganha um pacote extra!
            </p>
          </div>
        )}
        <a
          className="btn sm soft"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            maxWidth: "200px",
            margin: "8px auto 6px",
          }}
          href={getAmazonLink(sticker)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ShoppingCart size={15} /> Ver na Amazon
        </a>
        <p className="note" style={{ marginTop: "10px", textAlign: "center", maxWidth: "320px" }}>
          Comprando pelo link do LS você não paga nada a mais e ajuda o projeto a divulgar
          literatura sáfica.
        </p>
      </div>,
      { fullScreen: true },
    );
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stickerNumStr = params.get("sticker");
      if (stickerNumStr) {
        const num = parseInt(stickerNumStr, 10);
        if (!isNaN(num)) {
          const stickerObj = stickers.find((s) => s.number === num);
          if (stickerObj) {
            setTimeout(() => {
              openSticker(stickerObj);
            }, 150);
          }
        }
      }
    }
  }, [stickers]);

  return (
    <div className="screen">
      <div className="album-title-row">
        {/* Tabs to toggle between Album and Collections */}
        <div className="album-tabs" style={{ display: "flex", gap: windowWidth < 360 ? "6px" : "12px", borderBottom: "2px solid var(--blush)", paddingBottom: "4px" }}>
          <button
            className={`tab-btn ${activeTab === "album" ? "active" : ""}`}
            onClick={() => setActiveTab("album")}
            style={{
              background: "none",
              border: "none",
              padding: windowWidth < 360 ? "8px 8px" : "8px 16px",
              fontSize: "clamp(14px, 4.5vw, 18px)",
              fontWeight: 800,
              color: activeTab === "album" ? "var(--magenta)" : "var(--wine)",
              borderBottom: activeTab === "album" ? "3px solid var(--magenta)" : "3px solid transparent",
              cursor: "pointer",
              fontFamily: "Baloo 2",
            }}
          >
            Álbum Completo
          </button>
          <button
            className={`tab-btn ${activeTab === "colecoes" ? "active" : ""}`}
            onClick={() => setActiveTab("colecoes")}
            style={{
              background: "none",
              border: "none",
              padding: windowWidth < 360 ? "8px 8px" : "8px 16px",
              fontSize: "clamp(14px, 4.5vw, 18px)",
              fontWeight: 800,
              color: activeTab === "colecoes" ? "var(--magenta)" : "var(--wine)",
              borderBottom: activeTab === "colecoes" ? "3px solid var(--magenta)" : "3px solid transparent",
              cursor: "pointer",
              fontFamily: "Baloo 2",
            }}
          >
            Coleções
          </button>
        </div>

        {activeTab === "album" && (
          <div className="album-view-toggle" aria-label="Modo de visualizacao">
            <button
              type="button"
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="Ver em grade"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="Ver em lista"
            >
              <List size={15} />
            </button>
          </div>
        )}
      </div>

      {activeTab === "colecoes" ? (
        <div className="collections-container" style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px" }}>
          {families.map((family) => {
            const ownedInFamilyCount = family.stickers.filter((num) => !!getOwnedInfo(num)).length;
            const isCompleted = ownedInFamilyCount === family.stickers.length;
            const completedTagInfo = completedTags.find((t) => t.tag_name === family.tag);
            const isClaimed = completedTagInfo?.claimed || false;
            const isClaiming = claimingTags[family.tag] || false;

            const handleClaim = async () => {
              setClaimingTags((prev) => ({ ...prev, [family.tag]: true }));
              const res = await claimCollectionRewardAction(family.tag);
              setClaimingTags((prev) => ({ ...prev, [family.tag]: false }));
              if (res.success && res.data) {
                ui.toast("Prêmio resgatado com sucesso! 🎉");
                ui.showReveals(res.data, `Prêmio da Coleção ${family.tag}`);
                await loadCompletedTags();
                router.invalidate();
              } else {
                ui.toast(res.message || "Erro ao resgatar prêmio.");
              }
            };

            return (
              <div key={family.tag} className="collection-row">
                {/* The Collection Card */}
                <div className="collection-card">
                  {/* Header */}
                  <div className="collection-header">
                    <span>{family.tag}</span>
                    <span style={{ color: "var(--magenta)" }}>
                      {ownedInFamilyCount}/{family.stickers.length}
                    </span>
                  </div>

                  {/* Reduced stickers grid */}
                  <div className="collection-stamps-grid">
                    {family.stickers.map((num) => {
                      const sticker = stickers.find((s) => s.number === num);
                      const info = getOwnedInfo(num);
                      const isRare = isRareStickerVersion(sticker, info);
                      return (
                        <div
                          key={num}
                          className="collection-stamp-wrapper"
                          onClick={() => sticker && openSticker(sticker)}
                        >
                          <Stamp
                            number={num}
                            owned={!!info}
                            auto={isRare}
                            cover={sticker?.slug}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Manual claim button when family is complete */}
                  {isCompleted && (
                    <div style={{ marginTop: "12px", borderTop: "1px dashed var(--blush)", paddingTop: "12px", display: "flex", justifyContent: "center" }}>
                      {isClaimed ? (
                        <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                          ✓ Prêmio Resgatado
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isClaiming}
                          onClick={handleClaim}
                          className="btn"
                          style={{
                            margin: 0,
                            padding: "8px 16px",
                            fontSize: "13px",
                            background: "var(--gradient-berry)",
                            borderRadius: "10px",
                          }}
                        >
                          {isClaiming ? "Resgatando..." : "Resgatar Prêmio 🎁"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Seal Container */}
                <div className={`collection-seal-container ${isCompleted ? "completed" : ""}`}>
                  <img
                    src={isCompleted ? "/icons/selo-super-fa.png" : "/icons/selo-super-fa-cinza.png"}
                    alt={isCompleted ? "Selo Super Fã" : "Espaço Vago Selo Super Fã"}
                    className="collection-seal-img"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Modern Filter Dropdown with counts */}
          <div className="filter-dropdown-container" style={{ margin: "14px 0", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--wine)", fontFamily: "Baloo 2" }}>Filtrar:</span>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as AlbumFilter);
                setPage(1);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                border: "1px solid var(--blush)",
                background: "#fff",
                color: "var(--magenta)",
                fontWeight: 800,
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(158, 27, 74, 0.04)",
                fontFamily: "Baloo 2",
              }}
            >
              <option value="todas">Todas as figurinhas</option>
              <option value="faltam">Faltam</option>
              <option value="coladas">Coladas</option>
              <option value="repetidas">Repetidas</option>
              <option value="raras">Raras</option>
              <option value="exclusivas">Exclusivas</option>
            </select>
            {/* Count badge shown outside dropdown */}
            <span style={{
              background: "var(--blush)",
              color: "var(--magenta)",
              fontWeight: 800,
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "10px",
              fontFamily: "Baloo 2",
            }}>
              {filteredStickers.length} figurinha{filteredStickers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Album Grid */}
          {filteredStickers.length === 0 ? (
            <div className="empty">Nenhuma figurinha encontrada com este filtro.</div>
          ) : (
            <>
              <div
                className={`album ${viewMode === "list" ? "album-list" : ""}`}
                id="album-grid"
                style={{ gridTemplateColumns: gridColumns }}
              >
                {paginatedStickers.map((sticker) => {
                  const info = getOwnedInfo(sticker.number);
                  const isRare = isRareStickerVersion(sticker, info);
                  const isExclusive = isExclusiveSticker(sticker);
                  const visibleTag = getVisibleStickerTag(sticker, info);
                  const stickerFamily = getStickerFamily(sticker.number);
                  const copies = getCopiesCount(sticker.number);
                  const revealListData = !!info;

                  return (
                    <div
                      key={sticker.number}
                      className={`cell ${!info ? "locked" : ""} ${isRare ? "foil" : ""} ${isExclusive && viewMode !== "list" ? "exclusive-cell" : ""}`}
                      onClick={() => openSticker(sticker)}
                    >
                      <Stamp
                        number={sticker.number}
                        owned={!!info}
                        auto={isRare}
                        cover={sticker.slug}
                      />

                      {isRare && (
                        <span className="auto-badge">
                          <Star size={10} fill="currentColor" />
                        </span>
                      )}
                      {isExclusive && (
                        <span className="auto-badge exclusive-auto-badge">
                          <Star size={10} fill="currentColor" />
                        </span>
                      )}
                      {copies > 1 && (
                        <span
                          className="qty"
                          style={{
                            position: "absolute",
                            bottom: "3px",
                            right: "3px",
                            width: "18px",
                            height: "18px",
                            fontSize: "9px",
                            minWidth: "18px",
                            borderRadius: "50%",
                          }}
                        >
                          +{copies - 1}
                        </span>
                      )}
                      {viewMode === "list" && (
                        <div className="album-list-info">
                          <b>
                            #{String(sticker.number).padStart(3, "0")} -{" "}
                            {revealListData ? sticker.name : "Figurinha misteriosa"}
                          </b>
                          <span>{revealListData ? visibleTag : "faltando"}</span>
                          {revealListData && (
                            <small>
                              {sticker.author || "Autoria a definir"}
                              {sticker.ilustrator && ` (arte: ${sticker.ilustrator})`}
                            </small>
                          )}
                          {revealListData && stickerFamily && (
                            <em>
                              {stickerFamily.tag}: {stickerFamily.stickers.length} itens (
                              {stickerFamily.stickers
                                .map((num) => {
                                  const owned = !!getOwnedInfo(num);
                                  const famSticker = stickers.find((item) => item.number === num);
                                  return owned ? `#${String(num).padStart(3, "0")} ${famSticker?.name || ""}` : `#${String(num).padStart(3, "0")}`;
                                })
                                .join(", ")}
                              )
                            </em>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Page size and pagination toolbar */}
              <div
                className="pager-toolbar"
                style={{
                  display: "flex",
                  flexDirection: windowWidth < 380 ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "24px",
                  width: "100%",
                }}
              >
                <div className="album-page-size" aria-label="Quantidade de figurinhas por página">
                  {pageSizeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={itemsPerPage === option ? "active" : ""}
                      onClick={() => {
                        setItemsChoice(option);
                        setPage(1);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pager" style={{ margin: 0 }}>
                    <button
                      className="pg-nav"
                      disabled={currentPage === 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers().map((p, i) => {
                      if (p === "...") {
                        return (
                          <span
                            key={`ellipsis-${i}`}
                            style={{
                              color: "var(--wine)",
                              fontWeight: 800,
                              padding: "0 4px",
                              fontSize: "14px",
                              fontFamily: "'Baloo 2', sans-serif",
                            }}
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={p}
                          className={`pg-num ${currentPage === p ? "active" : ""}`}
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      className="pg-nav"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
