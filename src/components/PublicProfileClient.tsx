import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { User2, BookOpen, Star, Trophy, Sparkles, Layers } from "lucide-react";
import { Profile, Sticker, UserSticker } from "../lib/types";
import { dbService } from "../lib/db";

interface PublicProfileClientProps {
  profile: Profile;
  userStickers: UserSticker[];
  stickers: Sticker[];
  muralList: any[];
}

export default function PublicProfileClient({
  profile,
  userStickers: initialUserStickers,
  stickers,
  muralList: initialMuralList,
}: PublicProfileClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [userStickers, setUserStickers] = useState<UserSticker[]>(initialUserStickers);
  const [muralList, setMuralList] = useState<any[]>(initialMuralList);

  useEffect(() => {
    setIsMounted(true);

    // Re-fetch live data after mount (handles cases where loader ran before SQL patch)
    let active = true;
    Promise.all([
      dbService.getPublicUserStickers(profile.id).catch(() => null),
      dbService.getPublicMural().catch(() => null),
    ]).then(([freshStickers, freshMural]) => {
      if (!active) return;
      if (freshStickers) setUserStickers(freshStickers);
      if (freshMural) setMuralList(freshMural);
    });

    return () => {
      active = false;
    };
  }, [profile.id]);

  // Compute stats from live data
  const ownedUniqueStickers = userStickers.filter((s) => s.copies > 0).length;

  const duplicatesCount = userStickers.reduce((acc, s) => {
    return s.copies > 1 ? acc + (s.copies - 1) : acc;
  }, 0);

  const rareCount = userStickers.filter((us) => us.copies > 0 && us.is_rare).length;

  const quizStickersTotal = stickers.filter((s) => s.type === "quiz").length;
  const quizStickersOwned = userStickers.filter((us) => {
    if (us.copies === 0) return false;
    const stickerDef = stickers.find((s) => s.number === us.sticker_number);
    return stickerDef?.type === "quiz";
  }).length;

  // Mural ranking position
  const rankingIndex = muralList.findIndex((m) => m.id === profile.id);
  const rankingPosition = rankingIndex !== -1 ? rankingIndex + 1 : null;
  const inTop20 = rankingPosition !== null && rankingPosition <= 20;

  // Visual Theme based on completion
  const pct = Math.round((ownedUniqueStickers / 100) * 100);
  let themeColor = "var(--magenta)";
  let themeGradient = "var(--gradient-berry)";
  if (pct >= 100) {
    themeColor = "#FFD700";
    themeGradient = "linear-gradient(135deg, #FFD700, #FDB931)";
  } else if (pct >= 50) {
    themeColor = "#9b59b6";
    themeGradient = "linear-gradient(135deg, #9b59b6, #8e44ad)";
  }

  let statusText = "Coleção começando";
  if (pct >= 100) statusText = "Coleção Purpurina";
  else if (pct >= 66) statusText = "Coleção Ouro";
  else if (pct >= 41) statusText = "Coleção Prata";
  else if (pct >= 16) statusText = "Coleção Bronze";

  if (!isMounted) return null;

  return (
    <div className="mx-auto w-full max-w-[490px] min-h-[100svh] flex flex-col p-0 sm:px-6 sm:py-8 relative overflow-x-hidden bg-rose-soft/20">
      {/* Decorative Sparkles */}
      <span className="absolute top-10 right-10 text-primary opacity-30 select-none pointer-events-none text-2xl animate-pulse">
        ✦
      </span>
      <span
        className="absolute top-40 left-6 text-primary opacity-20 select-none pointer-events-none text-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      >
        ✦
      </span>

      <div className="surface-card p-6 sm:rounded-2xl rounded-none min-h-[100svh] sm:min-h-0 shadow-[var(--shadow-soft)] flex flex-col relative overflow-y-auto animate-in fade-in zoom-in-95 duration-500">
        <header className="flex flex-col items-center mb-8 relative">
          <img
            src="/logo_text.png"
            alt="Clube das Colecionadoras"
            className="w-40 mx-auto mb-6 mt-2 drop-shadow-[0_4px_10px_rgba(220,80,140,0.18)]"
          />

          <div className="flex items-center gap-4 w-full justify-center">
            <div className="relative flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.nick || "Avatar"}
                  className="w-16 h-16 rounded-full object-cover border-[3px] shadow-lg relative z-10"
                  style={{ borderColor: themeColor }}
                />
              ) : profile.avatar_emoji && profile.avatar_emoji.startsWith("/avatar/") ? (
                <img
                  src={profile.avatar_emoji}
                  alt={profile.nick || "Avatar"}
                  className="w-16 h-16 rounded-full object-cover border-[3px] shadow-lg relative z-10"
                  style={{ borderColor: themeColor }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-[3px] bg-white relative z-10"
                  style={{ borderColor: themeColor }}
                >
                  {profile.avatar_emoji || "📷"}
                </div>
              )}
              {pct >= 100 && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1 rounded-full shadow-lg z-20 animate-bounce">
                  <Trophy size={12} />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h2
                className="text-xl truncate"
                style={{ fontFamily: "'Fredoka', sans-serif", color: "#5c0d2b", fontWeight: 400 }}
              >
                {profile.nick || "Leitora Sáfica"}
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C2185B] mt-0.5 flex items-center gap-1">
                {statusText}
              </p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
            <BookOpen size={20} className="text-[#C2185B] mb-2" />
            <span className="text-2xl font-black text-berry">{ownedUniqueStickers}</span>
            <span className="text-[10px] font-bold text-berry/60 uppercase tracking-wider text-center">
              Figurinhas Coladas
            </span>
          </div>

          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
            <Layers size={20} className="text-purple-500 mb-2" />
            <span className="text-2xl font-black text-purple-700">{duplicatesCount}</span>
            <span className="text-[10px] font-bold text-berry/60 uppercase tracking-wider text-center">
              Repetidas
            </span>
          </div>

          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
            <Star size={20} className="text-yellow-500 mb-2" />
            <span className="text-2xl font-black text-yellow-600">{rareCount}</span>
            <span className="text-[10px] font-bold text-berry/60 uppercase tracking-wider text-center">
              Figurinhas Raras
            </span>
          </div>

          <div className="bg-white/80 border border-pink-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
            <Sparkles size={20} className="text-blue-500 mb-2" />
            <span className="text-xl font-black text-blue-600">
              {quizStickersOwned} / {quizStickersTotal}
            </span>
            <span className="text-[10px] font-bold text-berry/60 uppercase tracking-wider text-center">
              Progresso do Quiz
            </span>
          </div>
        </div>

        {inTop20 && (
          <div className="w-full bg-gradient-to-r from-yellow-100 to-amber-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-white shadow-md">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider">
                  Ranking do Mural
                </p>
                <p className="text-sm font-semibold text-yellow-900">
                  Posição: <span className="font-black text-lg">#{rankingPosition}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/clubedascolecionadoras/album/u/$id"
            params={{ id: profile.id }}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: themeGradient }}
          >
            <BookOpen size={16} /> Ver Álbum Completo
          </Link>

          <Link
            to="/clubedascolecionadoras/signup"
            className="w-full py-4 rounded-2xl text-sm font-bold text-[#C2185B] bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <User2 size={16} /> Criar meu próprio álbum
          </Link>
        </div>
      </div>
    </div>
  );
}
