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
  Grid3X3,
  LockKeyhole,
  Puzzle,
  X,
} from "lucide-react";
import { getDailyGamesState } from "@/lib/games";
import type { WordSearchDifficulty } from "@/lib/wordSearchGenerator";

const GAME_IMAGE = "/cacapalavras.png";

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
      : "Partida em andamento";
  const progress = state.reward
    ? "Missão concluída"
    : `${session?.foundWords || 0} de ${session?.totalWords || 0} palavras`;
  const upcoming = UPCOMING[carouselIndex];
  const UpcomingIcon = upcoming.Icon;

  const moveCarousel = (direction: number) => {
    setCarouselIndex((current) => (current + direction + UPCOMING.length) % UPCOMING.length);
  };

  return (
    <section
      className="game-mission-section home-dashboard-games mx-4 mb-4 min-w-0"
      aria-labelledby="daily-mission"
    >
      <div className="mb-2 flex items-center justify-between">
        <p
          id="daily-mission"
          className="flex items-center gap-1 text-[11px] font-semibold text-[#9e1b4a]"
        >
          <Gamepad2 className="h-3.5 w-3.5" /> Missão diária
        </p>
        <span className="text-[10px] font-semibold text-[#bf2a5e]">1 resgate por dia</span>
      </div>

      <article className="relative overflow-hidden rounded-[28px] border border-pink-300/80 bg-gradient-to-br from-white via-[#fffafd] to-[#fff0f7] p-5 shadow-[0_12px_35px_rgba(158,27,74,0.09)] dark:from-[#1a0718] dark:via-[#180615] dark:to-[#22091b] sm:p-7 lg:p-8">
        <img
          src={GAME_IMAGE}
          alt=""
          aria-hidden="true"
          className="game-mission-hero-image absolute right-3 top-3 h-[112px] w-[112px] object-contain"
        />

        <div className="game-mission-layout">
          <div className="game-mission-content min-w-0">
            <div className="game-mission-heading min-h-[112px] pr-[122px]">
              <h3 className="text-xl font-black text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
                Caça-Palavras Sáfico
              </h3>
              <p className="mt-1.5 text-xs font-semibold text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
                Encontre todas as palavras para resgatar a recompensa.
              </p>
              <span className="mt-4 inline-flex rounded-full bg-[#fce4ec] px-4 py-2 text-[10px] font-bold text-[#9e1b4a]">
                1 resgate por dia
              </span>
            </div>

            {(state.reward || session) && (
              <div className="mt-5 grid gap-2 border-y border-pink-100 py-3 text-[10px] font-bold sm:grid-cols-2 sm:text-xs">
                <span className="text-[#9e1b4a]">{progress}</span>
                <span className="flex items-center gap-1 text-[#bf2a5e] sm:justify-end">
                  {state.reward && <Check className="h-3.5 w-3.5" />} {status}
                </span>
              </div>
            )}

            <div className="game-mission-actions mt-5 flex flex-col gap-4">
              <div className="game-mission-levels grid min-w-0 flex-1 grid-cols-3 gap-2">
                {LEVELS.map((level) => {
                  const used = usedDifficulties.includes(level.id);
                  const current = session?.difficulty === level.id;
                  return (
                    <div
                      key={level.id}
                      className={`min-w-0 rounded-xl border px-1.5 py-2 text-center text-[9px] font-bold sm:px-2 sm:text-[10px] ${
                        used
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : current
                            ? "border-pink-400 bg-pink-100 text-[#8e1745]"
                            : "border-pink-200 bg-white/70 text-[#a52b59] dark:bg-[#240b1f]"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {used ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : current ? (
                          <Puzzle className="h-3 w-3 shrink-0" />
                        ) : null}
                        <span className="truncate">{level.label}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[8px] font-semibold opacity-80">
                        {used ? "Já usado" : current ? "Em andamento" : "Disponível"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                disabled={Boolean(state.reward)}
                className="game-mission-action-button mx-auto flex min-w-[170px] items-center justify-center self-center rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-7 py-3 text-xs font-black text-white shadow-lg shadow-pink-200/60 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:from-emerald-600 disabled:to-emerald-600 disabled:shadow-none"
                onClick={() => setShowRules(true)}
              >
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
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1c0819] sm:p-8">
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
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-xs font-semibold leading-relaxed text-[#7f3152] dark:text-[#f7a8cb]">
              <li>
                Escolha um nível disponível antes de iniciar a partida: Fácil, Médio ou Difícil.
              </li>
              <li>
                Clique nas letras em sequência, sempre escolhendo células vizinhas na horizontal,
                vertical ou diagonal.
              </li>
              <li>
                A seleção deve seguir uma única direção, sem pular letras ou mudar de sentido
                durante a palavra.
              </li>
              <li>
                Nos níveis Médio e Difícil, algumas palavras podem aparecer de trás para frente.
              </li>
              <li>
                Encontre todas as palavras da partida para concluir o nível e liberar a recompensa
                diária.
              </li>
              <li>
                Não conseguiu terminar hoje? Tudo bem! Seu progresso ficará salvo e você poderá
                continuar a mesma partida no dia seguinte, exatamente de onde parou.
              </li>
              <li>
                Você pode receber apenas 1 recompensa por dia, mesmo que conclua mais de um nível.
              </li>
              <li>
                Depois de concluído, o nível ficará bloqueado até você completar os outros dois. Ao
                finalizar o ciclo de Fácil, Médio e Difícil, todos os níveis serão liberados
                novamente.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => router.navigate({ to: "/clubedascolecionadoras/jogos/caca-palavras" })}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] py-3 text-xs font-black text-white"
            >
              {session ? "Continuar partida" : "Escolher dificuldade"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
