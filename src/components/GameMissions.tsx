"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  BookOpenText,
  Brain,
  Check,
  Gamepad2,
  Gift,
  Grid3X3,
  LockKeyhole,
  Puzzle,
} from "lucide-react";
import { getDailyGamesState } from "@/lib/games";

const UPCOMING = [
  { name: "Jogo da Memória", Icon: Grid3X3 },
  { name: "Quiz Relâmpago", Icon: Brain },
  { name: "Quebra-Cabeça", Icon: Puzzle },
  { name: "Adivinhe a Figurinha", Icon: BookOpenText },
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
    <section className="home-dashboard-games mx-4 mb-4 min-w-0" aria-labelledby="new-game-missions">
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
        <article className="rounded-2xl border border-pink-200/70 bg-white p-4 shadow-sm sm:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-pink-200 bg-[#fce4ec] text-[#9e1b4a]">
              <BookOpenText className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-1 block w-fit rounded-full bg-[#fce4ec] px-2 py-0.5 text-[9px] font-bold uppercase text-[#9e1b4a]">
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
                disabled={Boolean(state.reward)}
                className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-[#9e1b4a] px-4 py-2 text-[11px] font-bold text-white shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:bg-emerald-600 disabled:opacity-80"
                onClick={() =>
                  router.navigate({ to: "/clubedascolecionadoras/jogos/caca-palavras" })
                }
              >
                {state.reward ? (
                  <Check className="h-3.5 w-3.5" />
                ) : session ? (
                  <Puzzle className="h-3.5 w-3.5" />
                ) : (
                  <Gift className="h-3.5 w-3.5" />
                )}
                {state.reward ? "Concluído hoje" : session ? "Continuar" : "Jogar agora"}
              </button>
            </div>
          </div>
        </article>

        {UPCOMING.map(({ name, Icon }) => (
          <article
            key={name}
            className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/80 p-3 opacity-75"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#fcecf3] text-[#a52b59]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-[#6e1638]">{name}</h3>
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
