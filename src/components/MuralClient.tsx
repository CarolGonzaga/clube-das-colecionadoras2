"use client";

import React, { useState, useEffect } from "react";
import { Profile } from "@/lib/types";
import { Trophy, Medal, Star, Heart, Crown } from "lucide-react";
import { dbService } from "../lib/db";

interface MuralUser {
  id: string;
  nick: string;
  avatar: string | null;
  count: number;
  pct: number;
  created_at?: string;
}

const STAR =
  "https://media.base44.com/images/public/user_69a2abcb8a8939a11e6399e5/6e31ff85f_star.png";

function isImageAvatar(avatar: string | null) {
  return Boolean(
    avatar &&
      (avatar.startsWith("http") || avatar.startsWith("/avatar/") || avatar.startsWith("data:image/")),
  );
}

interface MuralClientProps {
  profile: Profile;
  muralList: MuralUser[];
  pct: number;
}

export default function MuralClient({ profile, muralList, pct }: MuralClientProps) {
  const [list, setList] = useState<MuralUser[]>(muralList);

  useEffect(() => {
    let active = true;
    const fetchMural = async () => {
      try {
        const freshList = await dbService.getMural();
        if (active) {
          setList(freshList);
        }
      } catch (e) {
        console.error("Error fetching fresh mural list:", e);
      }
    };

    // Keep the ranking fresh without continuously downloading avatar payloads.
    // The database service also coalesces requests and caches the public mural
    // for one minute.
    fetchMural();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchMural();
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);
  // Status text and title icon mapping
  let statusText = "Coleção começando";
  let titleIcon = "/icons/iniciante.png";
  if (pct >= 100) {
    statusText = "Coleção Purpurina";
    titleIcon = "/icons/purpurina.png";
  } else if (pct >= 66) {
    statusText = "Coleção Ouro";
    titleIcon = "/icons/ouro.png";
  } else if (pct >= 41) {
    statusText = "Coleção Prata";
    titleIcon = "/icons/prata.png";
  } else if (pct >= 16) {
    statusText = "Coleção Bronze";
    titleIcon = "/icons/bronze.png";
  } else {
    statusText = "Coleção começando";
    titleIcon = "/icons/iniciante.png";
  }

  // Get Rank Icon/Color
  const getRankBadge = (index: number) => {
    const rank = index + 1;
    let badgeColor = "text-berry/60";
    let fontSize = "text-xs font-semibold";

    if (rank === 1) {
      badgeColor = "text-amber-500";
      fontSize = "text-xl font-black font-fredoka";
    } else if (rank === 2) {
      badgeColor = "text-slate-400";
      fontSize = "text-lg font-black font-fredoka";
    } else if (rank === 3) {
      badgeColor = "text-amber-700/80";
      fontSize = "text-base font-black font-fredoka";
    }

    return <span className={`w-6 text-center ${fontSize} ${badgeColor}`}>{rank}</span>;
  };

  return (
    <div className="screen">
      {/* Header section */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-extrabold text-berry flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-[#C2185B]" /> Mural das Colecionadoras
        </h1>
        <p className="text-xs text-primary font-semibold mt-1">
          as melhores posições no ranking oficial ✦
        </p>
      </div>

      {/* ===== CURRENT TITLE ===== */}
      <div className="mb-10">
        <p className="text-[11px] font-bold text-[#9e1b4a] mb-6 flex items-center gap-1">
          <img src={STAR} alt="" className="w-3 h-3 opacity-80" />
          Seu título atual
        </p>
        <div className="pl-8">
          <div className="relative mural-title-container rounded-full pl-0 pr-4 py-0 flex items-center border shadow-sm h-12">
            {/* Protruding Level Badge */}
            <div className="w-[84px] h-[84px] rounded-full mural-title-badge-outer border flex items-center justify-center shadow-sm -ml-8 flex-shrink-0 z-10">
              <div className="w-[66px] h-[66px] rounded-full mural-title-badge-inner flex items-center justify-center">
                <img src={titleIcon} alt={statusText} className="w-[42px] h-[42px] object-contain" />
              </div>
            </div>
            <h2 className="flex-1 text-center text-sm font-extrabold text-[#5c0d2b] tracking-wider uppercase px-2 font-fredoka">
              {statusText}
            </h2>
          </div>
        </div>
      </div>

      {/* ===== LEADERBOARD ===== */}
      <div className="mb-2 mt-5">
        <p className="text-[11px] font-bold text-[#9e1b4a] flex items-center gap-1">
          <img src={STAR} alt="" className="w-3 h-3 opacity-80" />
          Ranking Geral
        </p>
      </div>

      {/* Leaderboard Card Container */}
      <div className="bg-white rounded-2xl border border-pink-200/60 shadow-sm p-4 space-y-4">
        {list.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-[#9e1b4a]">
            Ninguém no mural ainda. Seja a primeira! ✦
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((m, index) => {
              const isCurrentUser = m.id === profile.id;
              const displayAvatar =
                isImageAvatar(m.avatar) ? (
                  <img
                    src={m.avatar || undefined}
                    alt={m.nick}
                    className="rounded-full w-full h-full object-cover"
                  />
                ) : (
                  m.avatar || (m.nick[0] || "?").toUpperCase()
                );

              const isFirstPlace = index === 0;
              let cardStyles = "bg-white border-pink-100/50 hover:bg-pink-50/20";
              if (isFirstPlace) {
                cardStyles =
                  "bg-white border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] first-place-card";
              }
              if (isCurrentUser) {
                cardStyles = isFirstPlace
                  ? "bg-white border-amber-400 shadow-md ring-2 ring-pink-300 first-place-card"
                  : "bg-rose-50/50 border-pink-300 shadow-sm ring-1 ring-pink-300";
              }

              return (
                <div
                  key={m.id || index}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${cardStyles} ${
                    isFirstPlace ? "hover:scale-[1.01]" : ""
                  }`}
                >
                  {/* Position Badge */}
                  <div className="flex-shrink-0 flex items-center justify-center w-8">
                    {getRankBadge(index)}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-[#9e1b4a] overflow-hidden flex-shrink-0 border border-pink-200/40">
                    {displayAvatar}
                  </div>

                  {/* Nickname & Progress details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <b className="text-xs text-berry truncate">{m.nick}</b>
                      {isFirstPlace && (
                        <Crown
                          className="w-3.5 h-3.5 text-amber-500 fill-amber-300/30 flex-shrink-0 animate-bounce"
                          style={{ animationDuration: "3s" }}
                        />
                      )}
                      {isCurrentUser && (
                        <span className="bg-[#bf2a5e] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          você
                        </span>
                      )}
                    </div>

                    {/* Progress Bar & Subtitle */}
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-pink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-[#bf2a5e] rounded-full"
                          style={{ width: `${Math.min(m.pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#bf2a5e] font-bold whitespace-nowrap flex-shrink-0">
                        {m.count}/100
                      </span>
                    </div>
                  </div>

                  {/* Percentage Column */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-sm font-extrabold text-berry">{m.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="mt-4 px-2 text-center">
        <p className="text-[10px] text-berry/60 leading-relaxed">
          Tire suas dúvidas ou troque figurinhas repetidas com outras colecionadoras. Em caso de
          empate no progresso, o desempate prioriza quem registrou a conta mais recentemente (maior
          eficiência).
        </p>
      </div>
    </div>
  );
}
