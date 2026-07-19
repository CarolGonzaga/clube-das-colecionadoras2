"use client";

import React, { useState, useEffect } from "react";
import { Profile, Sticker, UserSticker } from "@/lib/types";
import Stamp from "./Stamp";
import AutographSeal from "./AutographSeal";
import { Star, Sparkles } from "lucide-react";
import { isExclusiveSticker, isRareStickerVersion } from "@/lib/albumRules";

interface PublicAlbumClientProps {
  profile: Profile;
  stickers: Sticker[];
  userStickers: UserSticker[];
  ownerStyles: string[];
}

export default function PublicAlbumClient({
  profile,
  stickers,
  userStickers,
  ownerStyles,
}: PublicAlbumClientProps) {
  const [filter, setFilter] = useState<"todas" | "faltam" | "coladas">("todas");
  const [page, setPage] = useState(1);

  // Apply target owner's custom styles directly to the body on mount / layout
  useEffect(() => {
    const appContainer = document.getElementById("app");
    if (appContainer) {
      if (ownerStyles.includes("lilac")) {
        document.documentElement.style.setProperty("--accent", "var(--lilac)");
        document.documentElement.style.setProperty("--magenta", "var(--lilac)");
      }
      if (ownerStyles.includes("glitter")) {
        document.body.classList.add("glitter");
      }
      if (ownerStyles.includes("goldframe")) {
        document.body.classList.add("goldframe");
      }
    }

    return () => {
      // Clean up styles when navigating away
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--magenta");
      document.body.classList.remove("glitter");
      document.body.classList.remove("goldframe");
    };
  }, [ownerStyles]);

  // Helpers
  const getOwnedInfo = (num: number) => {
    return userStickers.find((us) => us.sticker_number === num && us.copies > 0);
  };

  const getCopiesCount = (num: number) => {
    return userStickers.find((us) => us.sticker_number === num)?.copies || 0;
  };

  // Filters
  const filteredStickers = stickers.filter((s) => {
    const info = getOwnedInfo(s.number);
    if (filter === "faltam") return !info;
    if (filter === "coladas") return !!info;
    return true; // 'todas'
  });

  const ownedCount = userStickers.filter((us) => us.copies > 0).length;
  const pct = Math.round((ownedCount / 100) * 100);

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

  const itemsPerPage = 9;
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

  const renderFilterChip = (type: typeof filter, label: string) => {
    const count = stickers.filter((s) => {
      const info = getOwnedInfo(s.number);
      if (type === "faltam") return !info;
      if (type === "coladas") return !!info;
      return true;
    }).length;

    return (
      <button
        key={type}
        className={`chip ${filter === type ? "active" : ""}`}
        onClick={() => {
          setFilter(type);
          setPage(1);
        }}
      >
        {label} <b>{count}</b>
      </button>
    );
  };

  return (
    <div className="screen">
      {/* Header bar / Brand stack for public route */}
      <div className="topbar" style={{ position: "relative", margin: "-16px -16px 16px -16px" }}>
        <img
          src="/logo_text.png"
          alt="Clube das Colecionadoras"
          className="h-[31px] w-auto object-contain"
        />
        <div className="sp"></div>
        <div className="mini-stat">
          {ownedCount}/100
          <small>
            {pct}% • {statusText}
          </small>
        </div>
      </div>

      <div className="section-title">Coleção de {profile.nick} ✦</div>
      <div className="section-sub">álbum público compartilhado</div>

      {/* Progress card */}
      <div className="progress-card">
        <div className="pc-layout">
          <div className="pc-left">
            <div className="avatar">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nick} />
              ) : profile.avatar_emoji && profile.avatar_emoji.startsWith("/avatar/") ? (
                <img src={profile.avatar_emoji} alt={profile.nick} />
              ) : profile.avatar_emoji ? (
                <span style={{ fontSize: "32px" }}>{profile.avatar_emoji}</span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="100%"
                  height="100%"
                  fill="currentColor"
                  style={{ opacity: 0.85, padding: "10px" }}
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
              <span className="heart">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#c2185b">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </div>
          </div>
          <div className="pc-right">
            <div className="pc-name">{profile.nick}</div>
            <div className="pc-count">{ownedCount}/100 figurinhas coladas</div>
            <div className="pc-progress-row">
              <div className="bar">
                <i style={{ width: `${pct}%` }}></i>
              </div>
              <span className="bar-pct">{pct}%</span>
            </div>
            <div className="status-tag">
              {statusText}{" "}
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="#c2185b"
                style={{ display: "inline-block", verticalAlign: "middle" }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="filters">
        {renderFilterChip("todas", "Todas")}
        {renderFilterChip("coladas", "Conquistadas")}
        {renderFilterChip("faltam", "Faltam")}
      </div>

      {/* Stickers Grid */}
      {filteredStickers.length === 0 ? (
        <div className="empty">Nenhuma figurinha nesta categoria.</div>
      ) : (
        <>
          <div className="album">
            {paginatedStickers.map((sticker) => {
              const info = getOwnedInfo(sticker.number);
              const isRare = isRareStickerVersion(sticker, info);
              const isExclusive = isExclusiveSticker(sticker);
              const copies = getCopiesCount(sticker.number);

              return (
                <div
                  key={sticker.number}
                  className={`cell ${!info ? "locked" : ""} ${isRare ? "foil" : ""} ${isExclusive ? "exclusive-cell" : ""}`}
                  style={{ cursor: "default" }}
                >
                  <Stamp
                    number={sticker.number}
                    owned={!!info}
                    auto={isRare}
                    cover={sticker.slug}
                  />
                  {isRare && <AutographSeal author={sticker.author} />}

                  {isRare && (
                    <span className="auto-badge flex items-center justify-center">
                      <Star size={8} fill="currentColor" stroke="none" />
                    </span>
                  )}
                  {isExclusive && (
                    <span className="exclusive-badge">
                      <Sparkles size={10} />
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
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pager" style={{ marginTop: "24px" }}>
              <button
                className="pg-nav"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                &lt;
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
                &gt;
              </button>
            </div>
          )}
        </>
      )}

      {/* CTA at bottom for visitors */}
      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <a
          href="/clubedascolecionadoras/signup"
          className="btn flex items-center justify-center gap-1.5"
          style={{ textDecoration: "none" }}
        >
          <Sparkles size={14} fill="#FFD700" stroke="none" />
          Começar Minha Coleção
        </a>
      </div>
    </div>
  );
}
