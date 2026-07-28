"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Gamepad2, Gift, LockKeyhole, Puzzle } from "lucide-react";
import { getDailyGamesState } from "@/lib/games";
import { getClubAssetUrl } from "@/lib/urls";

const UPCOMING = [
  { name: "Jogo da Memória", cover: "a-namorada-do-meu-primo.jpg" },
  { name: "Quiz Relâmpago", cover: "a-espada-de-oleandro.jpg" },
  { name: "Quebra-Cabeça", cover: "6-am-a-hora-mais-curta.jpg" },
  { name: "Adivinhe a Figurinha", cover: "a-vinganca-do-cupido.jpg" },
];

type GamesState = {
  available: boolean;
  reward?: { sticker_number: number } | null;
  session?: {
    status: "in_progress" | "won" | "claimed";
    foundWords: number;
    totalWords: number;
  } | null;
};

export default function GameMissions() {
  const router = useRouter();
  const [state, setState] = useState<GamesState | null>(null);

  useEffect(() => {
    let active = true;
    getDailyGamesState()
      .then((result) => {
        if (active) setState(result);
      })
      .catch(() => {
        if (active) setState({ available: false });
      });
    return () => {
      active = false;
    };
  }, []);

  if (!state?.available) return null;
  const session = state.session;
  const status = state.reward
    ? "Recompensa já resgatada hoje"
    : session?.status === "won"
      ? "Recompensa pronta para resgate"
      : session
        ? "Continue jogando para vencer"
        : "Recompensa disponível hoje";

  return (
    <section className="mx-4 mb-4" aria-labelledby="new-game-missions">
      <div className="mb-2 flex items-center justify-between">
        <p
          id="new-game-missions"
          className="flex items-center gap-1 text-[11px] font-semibold text-[#9e1b4a]"
        >
          <Gamepad2 className="h-3.5 w-3.5" /> Novas missões
        </p>
        <span className="text-[10px] font-semibold text-[#bf2a5e]">1 figurinha por dia</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-pink-200/70 bg-white shadow-sm sm:col-span-2">
          <div className="flex min-h-32">
            <img
              src={getClubAssetUrl("/covers-jogos/a-vinganca-do-cupido.jpg")}
              alt=""
              className="w-28 object-cover sm:w-36"
            />
            <div className="flex flex-1 flex-col justify-center p-4">
              <span className="mb-1 w-fit rounded-full bg-[#fce4ec] px-2 py-0.5 text-[9px] font-bold uppercase text-[#9e1b4a]">
                Disponível
              </span>
              <h3 className="text-sm font-black text-[#6e1638]">Caça-Palavras Sáfico</h3>
              <p className="mt-1 text-[10px] font-semibold text-[#a52b59]">{status}</p>
              {session && (
                <p className="text-[10px] text-[#bf2a5e]">
                  {session.foundWords} de {session.totalWords} palavras
                </p>
              )}
              <button
                className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-[#9e1b4a] px-4 py-2 text-[11px] font-bold text-white shadow-sm active:scale-95"
                onClick={() =>
                  router.navigate({ to: "/clubedascolecionadoras/jogos/caca-palavras" })
                }
              >
                {session ? <Puzzle className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
                {session ? "Continuar" : "Jogar agora"}
              </button>
            </div>
          </div>
        </article>
        {UPCOMING.map((game) => (
          <article
            key={game.name}
            className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/80 p-3 opacity-75"
          >
            <img
              src={getClubAssetUrl(`/covers-jogos/${game.cover}`)}
              alt=""
              className="h-16 w-12 rounded-lg object-cover grayscale-[35%]"
            />
            <div>
              <h3 className="text-[11px] font-bold text-[#6e1638]">{game.name}</h3>
              <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold uppercase text-[#bf2a5e]">
                <LockKeyhole className="h-3 w-3" /> Em breve
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
