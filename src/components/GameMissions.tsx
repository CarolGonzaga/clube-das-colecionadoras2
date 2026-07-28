"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  BookOpenText,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Gift,
  Grid3X3,
  Heart,
  LockKeyhole,
  Pencil,
  Puzzle,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { getDailyGamesState } from "@/lib/games";
import type { WordSearchDifficulty } from "@/lib/wordSearchGenerator";

const UPCOMING = [
  { name: "Jogo da Memória", description: "Encontre os pares de figurinhas.", Icon: Grid3X3 },
  { name: "Quiz Relâmpago", description: "Responda antes que o tempo acabe.", Icon: Brain },
  { name: "Quebra-Cabeça", description: "Monte a imagem da figurinha.", Icon: Puzzle },
  {
    name: "Adivinhe a Figurinha",
    description: "Descubra a obra pelas pistas.",
    Icon: BookOpenText,
  },
];

const LEVELS: { id: WordSearchDifficulty; label: string }[] = [
  { id: "easy", label: "Fácil" },
  { id: "medium", label: "Médio" },
  { id: "hard", label: "Difícil" },
];

type GamesState = {
  available: boolean;
  reward?: { sticker_number: number } | null;
  usedDifficulties?: WordSearchDifficulty[];
  availableDifficulties?: WordSearchDifficulty[];
  session?: {
    status: "in_progress" | "won" | "claimed";
    difficulty: WordSearchDifficulty;
    foundWords: number;
    totalWords: number;
  } | null;
};

export default function GameMissions() {
  const router = useRouter();
  const [state, setState] = useState<GamesState | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

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

  useEffect(() => {
    if (carouselPaused) return;
    const timer = window.setInterval(
      () => setCarouselIndex((current) => (current + 1) % UPCOMING.length),
      10000,
    );
    return () => window.clearInterval(timer);
  }, [carouselPaused]);

  if (!state?.available) return null;

  const session = state.session;
  const usedDifficulties = state.usedDifficulties || [];
  const status = state.reward
    ? "Recompensa já resgatada hoje"
    : session?.status === "won"
      ? "Você venceu! Resgate sua figurinha"
      : session?.status === "in_progress"
        ? "Partida em andamento"
        : "Recompensa disponível hoje";
  const progress = state.reward
    ? "Missão concluída"
    : session
      ? `${session.foundWords} de ${session.totalWords} palavras`
      : "Escolha um nível para começar";
  const upcoming = UPCOMING[carouselIndex];
  const UpcomingIcon = upcoming.Icon;

  const moveCarousel = (direction: number) => {
    setCarouselIndex((current) => (current + direction + UPCOMING.length) % UPCOMING.length);
  };

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

      <article className="relative overflow-hidden rounded-[28px] border border-pink-300/80 bg-gradient-to-br from-white via-[#fffafd] to-[#fff0f7] p-5 shadow-[0_12px_35px_rgba(158,27,74,0.09)] dark:from-[#1a0718] dark:via-[#180615] dark:to-[#22091b] sm:p-7 lg:p-9">
        <Heart className="pointer-events-none absolute right-7 top-7 h-7 w-7 rotate-12 text-pink-200 dark:text-pink-800" />
        <Star className="pointer-events-none absolute right-24 top-16 h-3 w-3 fill-pink-300 text-pink-300" />
        <Sparkles className="pointer-events-none absolute bottom-8 left-[29%] h-5 w-5 text-pink-300" />

        <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
          <div className="relative mx-auto hidden h-[220px] w-[220px] md:block" aria-hidden="true">
            <div className="absolute left-5 top-1 h-[188px] w-[168px] rotate-[-2deg] rounded-2xl border-2 border-pink-200 bg-white p-4 shadow-lg dark:bg-[#260c20]">
              <div className="mb-3 flex justify-around">
                {[0, 1, 2, 3, 4].map((ring) => (
                  <span
                    key={ring}
                    className="h-7 w-2 -translate-y-6 rounded-full border-2 border-pink-300 bg-white dark:bg-[#260c20]"
                  />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-sm font-black text-[#9e1b4a]">
                {"AMORXLIVROSAFICSONHOELAS".split("").map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    className="flex aspect-square items-center justify-center rounded border border-pink-200 bg-pink-50 dark:bg-[#351027]"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
            <Pencil className="absolute bottom-3 right-3 h-28 w-28 rotate-[18deg] fill-pink-400 text-[#9e1b4a]" />
            <BookOpenText className="absolute -right-4 top-5 h-12 w-12 rotate-12 text-pink-200" />
          </div>

          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fce4ec] px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-[#9e1b4a]">
              <Puzzle className="h-3.5 w-3.5" /> Missão diária
            </span>
            <h3 className="mt-4 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
              Caça-Palavras Sáfico
            </h3>
            <p className="mt-1.5 text-xs font-semibold text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
              Encontre todas as palavras e ganhe 1 figurinha.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#fce4ec] px-4 py-2 text-[10px] font-bold text-[#9e1b4a]">
              <Sparkles className="h-4 w-4" /> 1 figurinha por dia
            </span>

            <div className="mt-5 grid gap-2 border-y border-pink-100 py-3 text-[10px] font-bold sm:grid-cols-2 sm:text-xs">
              <span className="text-[#9e1b4a]">{progress}</span>
              <span className="flex items-center gap-1 text-[#bf2a5e] sm:justify-end">
                {state.reward && <Check className="h-3.5 w-3.5" />} {status}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <div className="grid flex-1 grid-cols-3 gap-2">
                {LEVELS.map((level) => {
                  const used = usedDifficulties.includes(level.id);
                  const current = session?.difficulty === level.id;
                  return (
                    <div
                      key={level.id}
                      className={`rounded-2xl border px-2 py-2.5 text-center text-[9px] font-bold sm:text-[10px] ${
                        used
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : current
                            ? "border-pink-400 bg-pink-100 text-[#8e1745]"
                            : "border-pink-200 bg-white/70 text-[#a52b59] dark:bg-[#240b1f]"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {used ? (
                          <Check className="h-3 w-3" />
                        ) : current ? (
                          <Puzzle className="h-3 w-3" />
                        ) : null}
                        {level.label}
                      </span>
                      <span className="mt-0.5 block text-[8px] font-semibold opacity-75">
                        {used ? "Concluído" : current ? "Em andamento" : "Disponível"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                disabled={Boolean(state.reward)}
                className="flex min-w-[170px] items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-7 py-3 text-xs font-black text-white shadow-lg shadow-pink-200/60 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:from-emerald-600 disabled:to-emerald-600 disabled:shadow-none md:ml-auto md:self-center"
                onClick={() => setShowRules(true)}
              >
                {state.reward ? (
                  <Check className="h-4 w-4" />
                ) : session ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
                {state.reward ? "Concluído hoje" : session ? "Continuar" : "Jogar agora"}
              </button>
            </div>
          </div>
        </div>
      </article>

      <div
        className="relative mt-4"
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
        aria-label="Próximos jogos"
      >
        <button
          type="button"
          aria-label="Jogo anterior"
          onClick={() => moveCarousel(-1)}
          className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-pink-200 bg-white text-[#9e1b4a] shadow-md dark:bg-[#260c20]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <article className="mx-5 flex min-h-[92px] items-center gap-4 rounded-2xl border border-pink-100 bg-white/80 px-12 py-4 dark:bg-[#1b0818]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#fcecf3] text-[#a52b59]">
            <UpcomingIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-[#6e1638] dark:text-[#ffd1e5]">
              {upcoming.name}
            </h4>
            <p className="mt-1 text-[10px] text-[#a52b59] dark:text-[#f7a8cb]">
              {upcoming.description}
            </p>
            <span className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase text-[#bf2a5e]">
              <LockKeyhole className="h-3 w-3" /> Em breve
            </span>
          </div>
        </article>

        <button
          type="button"
          aria-label="Próximo jogo"
          onClick={() => moveCarousel(1)}
          className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-pink-200 bg-white text-[#9e1b4a] shadow-md dark:bg-[#260c20]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="mt-2 flex justify-center gap-1.5">
          {UPCOMING.map((game, index) => (
            <button
              key={game.name}
              type="button"
              aria-label={`Mostrar ${game.name}`}
              onClick={() => setCarouselIndex(index)}
              className={`h-1.5 rounded-full transition-all ${index === carouselIndex ? "w-5 bg-[#c2185b]" : "w-1.5 bg-pink-200"}`}
            />
          ))}
        </div>
      </div>

      {showRules && !state.reward && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="word-search-rules-title"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#3f0b27]/65 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1c0819] sm:p-8">
            <button
              type="button"
              aria-label="Fechar regras"
              onClick={() => setShowRules(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#9e1b4a]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fce4ec] text-[#9e1b4a]">
              <BookOpenText className="h-6 w-6" />
            </div>
            <h3
              id="word-search-rules-title"
              className="mt-4 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5]"
            >
              Como jogar
            </h3>
            <ol className="mt-4 space-y-3 text-xs font-semibold text-[#7f3152] dark:text-[#f7a8cb]">
              <li>1. Escolha um dos níveis ainda disponíveis antes de começar.</li>
              <li>2. Selecione letras vizinhas em linha horizontal, vertical ou diagonal.</li>
              <li>3. No médio e difícil, algumas palavras podem estar ao contrário.</li>
              <li>4. Encontre todas as palavras para liberar a recompensa do dia.</li>
              <li>5. Cada nível concluído fica bloqueado até completar o ciclo dos três níveis.</li>
            </ol>
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-pink-50 p-3 text-[10px] font-bold text-[#9e1b4a] dark:bg-[#321027]">
              <Heart className="h-4 w-4 fill-pink-300 text-pink-400" />
              Você pode ganhar apenas uma figurinha por dia.
            </div>
            <button
              type="button"
              onClick={() => router.navigate({ to: "/clubedascolecionadoras/jogos/caca-palavras" })}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] py-3 text-xs font-black text-white"
            >
              <Sparkles className="h-4 w-4" />
              {session ? "Continuar partida" : "Escolher dificuldade"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
