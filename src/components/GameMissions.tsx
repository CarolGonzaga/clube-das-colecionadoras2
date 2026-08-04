"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  BookOpenText,
  Brain,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Grid3X3,
  LockKeyhole,
  Puzzle,
} from "lucide-react";
import { getDailyGamesState, getPuzzleGameState } from "@/lib/games";
import { getMemoryGameState } from "@/lib/memoryGame";
import { getCoverGuesserState } from "@/lib/coverGuesser";
import type { WordSearchDifficulty } from "@/lib/wordSearchGenerator";

const bundledWordSearchArt = import.meta.glob("../../public/cacapalavras.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const WORD_SEARCH_ART_URL = Object.values(bundledWordSearchArt)[0] || "/cacapalavras.png";

const bundledPuzzleArt = import.meta.glob("../../public/puzzle.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const PUZZLE_ART_URL = Object.values(bundledPuzzleArt)[0] || "/puzzle.png";

const bundledAdivinhaArt = import.meta.glob("../../public/adivinha.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const ADIVINHA_ART_URL = Object.values(bundledAdivinhaArt)[0] || "/adivinha.png";

const SLIDES = [
  { key: "word_search", name: "Caça-Palavras", Icon: BookOpenText },
  { key: "memory_game", name: "Jogo da Memória", Icon: Grid3X3 },
  { key: "quick_quiz", name: "Quiz Relâmpago", Icon: Brain },
  { key: "puzzle", name: "Quebra-Cabeça", Icon: Puzzle },
  { key: "cover_guesser", name: "Adivinhe a Capa", Icon: BookOpen },
] as const;

const LEVELS: { id: WordSearchDifficulty; label: string }[] = [
  { id: "easy", label: "Fácil" },
  { id: "medium", label: "Médio" },
  { id: "hard", label: "Difícil" },
];

type WordState = {
  available: boolean;
  canPlay?: boolean;
  reward?: { game_key?: string; sticker_number: number } | null;
  usedDifficulties?: WordSearchDifficulty[];
  blockedByGame?: "word_search" | "memory_game" | "puzzle_game" | null;
  session?: {
    status: "in_progress" | "won" | "claimed";
    difficulty: WordSearchDifficulty;
    foundWords: number;
    totalWords: number;
  } | null;
};

type MemoryState = {
  available: boolean;
  canPlay?: boolean;
  reward?: { game_key?: string; sticker_number: number } | null;
  usedDifficulties?: ("easy" | "medium" | "hard")[];
  blockedByGame?: "word_search" | "memory_game" | "puzzle_game" | null;
  session?: {
    status: "in_progress" | "won" | "claimed";
    difficulty: "easy" | "medium" | "hard";
    matchedPairs: number;
    totalPairs: number;
  } | null;
};

type PuzzleState = {
  available: boolean;
  canPlay?: boolean;
  reward?: { game_key?: string; sticker_number: number } | null;
  usedDifficulties?: ("easy" | "medium" | "hard")[];
  blockedByGame?: "word_search" | "memory_game" | "puzzle_game" | null;
  session?: {
    status: "in_progress" | "won" | "claimed";
    difficulty: "easy" | "medium" | "hard";
    placedPieces: number;
    totalPieces: number;
  } | null;
};

type CoverGuesserState = {
  available: boolean;
  canPlay?: boolean;
  reward?: { game_key?: string; sticker_number: number } | null;
  usedDifficulties?: ("easy" | "medium" | "hard")[];
  blockedByGame?: "word_search" | "memory_game" | "puzzle_game" | "cover_guesser" | null;
  session?: {
    status: "in_progress" | "won" | "claimed";
    difficulty: "easy" | "medium" | "hard";
  } | null;
};

export default function GameMissions() {
  const router = useRouter();
  const [wordState, setWordState] = useState<WordState | null>(null);
  const [memoryState, setMemoryState] = useState<MemoryState | null>(null);
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [coverState, setCoverState] = useState<CoverGuesserState | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const currentDateKey = useRef(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }),
  );
  const slides = SLIDES.filter(
    (item) =>
      (item.key !== "memory_game" || Boolean(memoryState?.available)) &&
      (item.key !== "cover_guesser" || Boolean(coverState?.available)),
  );

  const refreshStates = useCallback(async () => {
    const [word, memory, puzzle, cover] = await Promise.allSettled([
      getDailyGamesState(),
      getMemoryGameState(),
      getPuzzleGameState(),
      getCoverGuesserState(),
    ]);
    const nextWordState = word.status === "fulfilled" ? word.value : { available: false };
    setWordState(nextWordState);
    setMemoryState(memory.status === "fulfilled" ? memory.value : { available: false });
    setPuzzleState(puzzle.status === "fulfilled" ? puzzle.value : { available: false });
    setCoverState(cover.status === "fulfilled" ? cover.value : { available: false });
  }, []);

  useEffect(() => {
    let active = true;
    refreshStates().catch(() => {
      if (!active) return;
      setWordState({ available: false });
      setMemoryState({ available: false });
      setPuzzleState({ available: false });
      setCoverState({ available: false });
    });
    return () => {
      active = false;
    };
  }, [refreshStates]);

  useEffect(() => {
    const checkForNewDay = () => {
      const nextDateKey = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      });
      if (nextDateKey !== currentDateKey.current) {
        currentDateKey.current = nextDateKey;
        void refreshStates();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkForNewDay();
        void refreshStates();
      }
    };
    let midnightTimer: number;
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 250);
      midnightTimer = window.setTimeout(() => {
        checkForNewDay();
        void refreshStates();
        scheduleMidnightRefresh();
      }, nextMidnight.getTime() - now.getTime());
    };
    scheduleMidnightRefresh();
    const timer = window.setInterval(checkForNewDay, 30_000);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(midnightTimer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshStates]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setSlideIndex((current) => (current + 1) % slides.length),
      12000,
    );
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    setSlideIndex((current) => current % slides.length);
  }, [slides.length]);

  const move = (direction: number) => {
    setSlideIndex((current) => (current + direction + slides.length) % slides.length);
  };

  const slide = slides[slideIndex % slides.length];

  return (
    <section className="home-dashboard-games mx-4 mb-4 min-w-0" aria-labelledby="daily-mission">
      <div className="mb-2 flex items-center justify-between">
        <p
          id="daily-mission"
          className="flex items-center gap-1 text-[11px] font-semibold text-[#9e1b4a] dark:text-[#ffd1e5]"
        >
          <Gamepad2 className="h-3.5 w-3.5" /> Jogos e missões
        </p>
        <span className="text-[10px] font-semibold text-[#bf2a5e] dark:text-[#f7a8cb]">
          1 resgate por dia
        </span>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
          setPaused(true);
        }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          const endX = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          setPaused(false);
          if (startX == null || endX == null || Math.abs(startX - endX) < 45) return;
          move(startX > endX ? 1 : -1);
        }}
        aria-roledescription="carrossel"
        aria-label="Jogos disponíveis"
      >
        <button
          type="button"
          aria-label="Jogo anterior"
          onClick={() => move(-1)}
          className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-pink-200 bg-white/95 text-[#9e1b4a] shadow-md max-sm:hidden dark:bg-[#260c20] dark:text-[#ffd1e5] sm:-left-3"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="overflow-hidden rounded-[28px]">
          {slide.key === "word_search" && (
            <WordSearchSlide
              state={wordState}
              onPlay={() => router.navigate({ to: "/clubedascolecionadoras/jogos/caca-palavras" })}
            />
          )}
          {slide.key === "memory_game" && (
            <MemoryGameSlide
              state={memoryState}
              onPlay={() => router.navigate({ to: "/clubedascolecionadoras/jogos/memoria" })}
            />
          )}
          {slide.key === "quick_quiz" && (
            <ComingSoonSlide
              name="Quiz Relâmpago"
              description="Responda antes que o tempo acabe."
              Icon={Brain}
            />
          )}
          {slide.key === "puzzle" && (
            <PuzzleGameSlide
              state={puzzleState}
              onPlay={() => router.navigate({ to: "/clubedascolecionadoras/jogos/quebra-cabeca" })}
            />
          )}
          {slide.key === "cover_guesser" && (
            <CoverGuesserSlide
              state={coverState}
              onPlay={() => router.navigate({ to: "/clubedascolecionadoras/jogos/adivinhe-a-capa" })}
            />
          )}
        </div>

        <button
          type="button"
          aria-label="Próximo jogo"
          onClick={() => move(1)}
          className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-pink-200 bg-white/95 text-[#9e1b4a] shadow-md max-sm:hidden dark:bg-[#260c20] dark:text-[#ffd1e5] sm:-right-3"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        className="mt-3 flex items-center justify-center gap-2"
        aria-label={`Slide ${slideIndex + 1} de ${slides.length}`}
      >
        {slides.map((item, index) => (
          <button
            key={item.key}
            type="button"
            aria-label={`Mostrar ${item.name}`}
            aria-current={index === slideIndex ? "true" : undefined}
            onClick={() => setSlideIndex(index)}
            className={`h-1.5 rounded-full transition-all ${index === slideIndex ? "w-6 bg-[#c2185b]" : "w-1.5 bg-pink-200 dark:bg-pink-900"}`}
          />
        ))}
      </div>
    </section>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <article className="relative min-h-[310px] overflow-hidden rounded-[28px] border border-pink-300/80 bg-gradient-to-br from-white via-[#fffafd] to-[#fff0f7] p-4 shadow-[0_12px_35px_rgba(158,27,74,0.09)] dark:from-[#1a0718] dark:via-[#180615] dark:to-[#22091b] sm:min-h-[285px] sm:p-7 lg:p-8">
      {children}
    </article>
  );
}

function WordSearchSlide({ state, onPlay }: { state: WordState | null; onPlay: () => void }) {
  const session = state?.session;
  const used = state?.usedDifficulties || [];
  const thisGameClaimed = Boolean(state?.reward);
  const available = Boolean(state?.available && state?.canPlay !== false) && !thisGameClaimed;
  const status = !state
    ? "Carregando..."
    : thisGameClaimed
      ? "Recompensa já resgatada hoje"
      : state.blockedByGame
        ? "Finalize a partida em andamento"
        : session?.status === "won"
          ? "Você venceu! Resgate sua figurinha"
          : session
            ? "Partida em andamento"
            : available
              ? "Pronto para jogar"
              : "Disponível em breve";
  return (
    <CardShell>
      <div className="relative z-10 grid min-h-[278px] min-w-0 lg:min-h-[221px] lg:grid-cols-[minmax(190px,28%)_minmax(0,1fr)] lg:gap-8">
        <img
          src={WORD_SEARCH_ART_URL}
          alt=""
          className="pointer-events-none h-full max-h-[230px] w-full self-stretch object-contain max-lg:hidden"
        />
        <img
          src={WORD_SEARCH_ART_URL}
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-[104px] w-[clamp(84px,29vw,116px)] object-contain object-right-top lg:hidden"
        />
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0 pr-[clamp(92px,32vw,124px)] lg:pr-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-[9px] font-black uppercase text-[#9e1b4a]">
              <BookOpenText className="h-3 w-3" /> Missão diária
            </span>
            <h3 className="mt-3 text-[clamp(1.05rem,5vw,1.25rem)] font-black leading-[1.08] text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
              Caça-Palavras
            </h3>
            <p className="mt-1.5 max-w-xl text-[clamp(0.68rem,3vw,0.8rem)] font-semibold leading-snug text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
              Encontre todas as palavras para resgatar a recompensa.
            </p>
          </div>
          <div className="mt-4 grid min-w-0 gap-1 border-y border-pink-100 py-3 text-center text-[10px] font-bold leading-snug text-[#9e1b4a] min-[330px]:grid-cols-[auto_minmax(0,1fr)] min-[330px]:items-center min-[330px]:gap-4 min-[330px]:text-left dark:text-[#f7a8cb] sm:text-xs">
            <span>
              {session
                ? `${session.foundWords} de ${session.totalWords} palavras`
                : "1 resgate por dia"}
            </span>
            <span className="min-w-0 min-[330px]:text-right">{status}</span>
          </div>
          <div className="mt-auto flex flex-col items-center gap-4 pt-5 lg:flex-row lg:justify-between">
            <div className="grid w-full max-w-[340px] grid-cols-3 gap-2">
              {LEVELS.map((level) => {
                const completed = used.includes(level.id);
                const current = session?.difficulty === level.id;
                return (
                  <div
                    key={level.id}
                    className={`flex min-h-[54px] min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center text-[9px] font-bold leading-tight ${completed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : current ? "border-pink-400 bg-pink-100 text-[#8e1745]" : "border-pink-200 bg-white/70 text-[#a52b59] dark:bg-[#240b1f]"}`}
                  >
                    <span>{level.label}</span>
                    <small className="mt-1 block text-[7px] leading-none">
                      {completed ? "Já usado" : current ? "Em andamento" : "Disponível"}
                    </small>
                  </div>
                );
              })}
            </div>
            <button
              disabled={!available}
              onClick={onPlay}
              className="mx-auto min-w-[150px] shrink-0 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-6 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 dark:shadow-none lg:mx-0 lg:ml-auto"
            >
              {!state
                ? "Carregando"
                : thisGameClaimed
                  ? "Concluído hoje"
                  : session
                    ? "Continuar"
                    : available
                      ? "Jogar agora"
                      : "Em breve"}
            </button>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function MemoryGameSlide({ state, onPlay }: { state: MemoryState | null; onPlay: () => void }) {
  const session = state?.session;
  const used = state?.usedDifficulties || [];
  const thisGameClaimed = Boolean(state?.reward);
  const available = Boolean(state?.available && state?.canPlay !== false) && !thisGameClaimed;
  const status = !state
    ? "Carregando..."
    : thisGameClaimed
      ? "Recompensa já resgatada hoje"
      : state.blockedByGame
        ? "Finalize a partida em andamento"
        : session
          ? "Partida em andamento"
          : available
            ? "Pronto para jogar"
            : "Disponível em breve";
  return (
    <CardShell>
      <div className="relative z-10 grid min-h-[278px] min-w-0 lg:min-h-[221px] lg:grid-cols-[minmax(190px,28%)_minmax(0,1fr)] lg:gap-8">
        <MemoryCardArt className="grid h-[160px] w-[190px] self-center justify-self-center max-lg:hidden" />
        <MemoryCardArt className="absolute right-0 top-0 grid h-[82px] w-[96px] lg:hidden" />
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0 pr-[clamp(100px,34vw,126px)] lg:pr-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-[9px] font-black uppercase text-[#9e1b4a]">
              <Grid3X3 className="h-3 w-3" /> Missão diária
            </span>
            <h3 className="mt-3 text-[clamp(1.05rem,5vw,1.25rem)] font-black leading-[1.08] text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
              Jogo da Memória
            </h3>
            <p className="mt-1.5 max-w-xl text-[clamp(0.68rem,3vw,0.8rem)] font-semibold leading-snug text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
              Encontre todos os pares de figurinhas para liberar a recompensa.
            </p>
          </div>
          <div className="mt-4 grid min-w-0 gap-1 border-y border-pink-100 py-3 text-center text-[10px] font-bold leading-snug text-[#9e1b4a] min-[330px]:grid-cols-[auto_minmax(0,1fr)] min-[330px]:items-center min-[330px]:gap-4 min-[330px]:text-left dark:text-[#f7a8cb] sm:text-xs">
            <span>
              {session
                ? `${session.matchedPairs} de ${session.totalPairs} pares`
                : "1 resgate por dia"}
            </span>
            <span className="min-w-0 min-[330px]:text-right">{status}</span>
          </div>
          <div className="mt-auto flex flex-col items-center gap-4 pt-5 lg:flex-row lg:justify-between">
            <div className="grid w-full max-w-[340px] grid-cols-3 gap-2">
              {[
                ["easy", "Fácil"],
                ["medium", "Médio"],
                ["hard", "Difícil"],
              ].map(([id, name]) => {
                const completed = used.includes(id as "easy" | "medium" | "hard");
                const current = session?.difficulty === id;
                return (
                  <div
                    key={name}
                    className={`flex min-h-[54px] min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center text-[9px] font-bold leading-tight ${completed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : current ? "border-pink-400 bg-pink-100 text-[#8e1745]" : "border-pink-200 bg-white/70 text-[#a52b59] dark:bg-[#240b1f]"}`}
                  >
                    <span>{name}</span>
                    <small className="mt-1 block text-[7px] leading-none">
                      {completed ? "Já usado" : current ? "Em andamento" : "Disponível"}
                    </small>
                  </div>
                );
              })}
            </div>
            <button
              disabled={!available}
              onClick={onPlay}
              className="mx-auto min-w-[150px] shrink-0 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-6 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 dark:shadow-none lg:mx-0 lg:ml-auto"
            >
              {!state
                ? "Carregando"
                : thisGameClaimed
                  ? "Concluído hoje"
                  : session
                    ? "Continuar"
                    : available
                      ? "Jogar agora"
                      : "Em breve"}
            </button>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function PuzzleGameSlide({ state, onPlay }: { state: PuzzleState | null; onPlay: () => void }) {
  const session = state?.session;
  const used = state?.usedDifficulties || [];
  const thisGameClaimed = Boolean(state?.reward);
  const available = Boolean(state?.available && state?.canPlay !== false) && !thisGameClaimed;
  const status = !state
    ? "Carregando..."
    : thisGameClaimed
      ? "Recompensa já resgatada hoje"
      : state.blockedByGame
        ? "Finalize a partida em andamento"
        : session
          ? "Partida em andamento"
          : available
            ? "Pronto para jogar"
            : "Disponível em breve";
  return (
    <CardShell>
      <div className="relative z-10 grid min-h-[278px] min-w-0 lg:min-h-[221px] lg:grid-cols-[minmax(190px,28%)_minmax(0,1fr)] lg:gap-8">
        <img
          src={PUZZLE_ART_URL}
          alt=""
          className="pointer-events-none h-full max-h-[230px] w-full self-stretch object-contain max-lg:hidden"
        />
        <img
          src={PUZZLE_ART_URL}
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-[104px] w-[clamp(84px,29vw,116px)] object-contain object-right-top lg:hidden"
        />
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0 pr-[clamp(92px,32vw,124px)] lg:pr-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-[9px] font-black uppercase text-[#9e1b4a]">
              <Puzzle className="h-3 w-3" /> Missão diária
            </span>
            <h3 className="mt-3 text-[clamp(1.05rem,5vw,1.25rem)] font-black leading-[1.08] text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
              Quebra-Cabeça
            </h3>
            <p className="mt-1.5 max-w-xl text-[clamp(0.68rem,3vw,0.8rem)] font-semibold leading-snug text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
              Encaixe todas as peças para liberar a recompensa.
            </p>
          </div>
          <div className="mt-4 grid min-w-0 gap-1 border-y border-pink-100 py-3 text-center text-[10px] font-bold leading-snug text-[#9e1b4a] min-[330px]:grid-cols-[auto_minmax(0,1fr)] min-[330px]:items-center min-[330px]:gap-4 min-[330px]:text-left dark:text-[#f7a8cb] sm:text-xs">
            <span>
              {session
                ? `${session.placedPieces} de ${session.totalPieces} peças`
                : "1 resgate por dia"}
            </span>
            <span className="min-w-0 min-[330px]:text-right">{status}</span>
          </div>
          <div className="mt-auto flex flex-col items-center gap-4 pt-5 lg:flex-row lg:justify-between">
            <div className="grid w-full max-w-[340px] grid-cols-3 gap-2">
              {[
                ["easy", "Fácil"],
                ["medium", "Médio"],
                ["hard", "Difícil"],
              ].map(([id, name]) => {
                const completed = used.includes(id as "easy" | "medium" | "hard");
                const current = session?.difficulty === id;
                return (
                  <div
                    key={name}
                    className={`flex min-h-[54px] min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center text-[9px] font-bold leading-tight ${completed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : current ? "border-pink-400 bg-pink-100 text-[#8e1745]" : "border-pink-200 bg-white/70 text-[#a52b59] dark:bg-[#240b1f]"}`}
                  >
                    <span>{name}</span>
                    <small className="mt-1 block text-[7px] leading-none">
                      {completed ? "Já usado" : current ? "Em andamento" : "Disponível"}
                    </small>
                  </div>
                );
              })}
            </div>
            <button
              disabled={!available}
              onClick={onPlay}
              className="mx-auto min-w-[150px] shrink-0 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-6 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 dark:shadow-none lg:mx-0 lg:ml-auto"
            >
              {!state
                ? "Carregando"
                : thisGameClaimed
                  ? "Concluído hoje"
                  : session
                    ? "Continuar"
                    : available
                      ? "Jogar agora"
                      : "Em breve"}
            </button>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function CoverGuesserSlide({ state, onPlay }: { state: CoverGuesserState | null; onPlay: () => void }) {
  const session = state?.session;
  const used = state?.usedDifficulties || [];
  const thisGameClaimed = Boolean(state?.reward);
  const available = Boolean(state?.available && state?.canPlay !== false) && !thisGameClaimed;
  const status = !state
    ? "Carregando..."
    : thisGameClaimed
      ? "Recompensa já resgatada hoje"
      : state.blockedByGame
        ? "Finalize a partida em andamento"
        : session
          ? "Partida em andamento"
          : available
            ? "Pronto para jogar"
            : "Disponível em breve";
  return (
    <CardShell>
      <div className="relative z-10 grid min-h-[278px] min-w-0 lg:min-h-[221px] lg:grid-cols-[minmax(190px,28%)_minmax(0,1fr)] lg:gap-8">
        <img
          src={ADIVINHA_ART_URL}
          alt=""
          className="pointer-events-none h-full max-h-[230px] w-full self-stretch object-contain max-lg:hidden"
        />
        <img
          src={ADIVINHA_ART_URL}
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-[104px] w-[clamp(84px,29vw,116px)] object-contain object-right-top lg:hidden"
        />
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0 pr-[clamp(92px,32vw,124px)] lg:pr-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-[9px] font-black uppercase text-[#9e1b4a]">
              <BookOpen className="h-3 w-3" /> Missão diária
            </span>
            <h3 className="mt-3 text-[clamp(1.05rem,5vw,1.25rem)] font-black leading-[1.08] text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
              Adivinhe a Capa
            </h3>
            <p className="mt-1.5 max-w-xl text-[clamp(0.68rem,3vw,0.8rem)] font-semibold leading-snug text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
              Acerte o nome para resgatar a recompensa.
            </p>
          </div>
          <div className="mt-4 grid min-w-0 gap-1 border-y border-pink-100 py-3 text-center text-[10px] font-bold leading-snug text-[#9e1b4a] min-[330px]:grid-cols-[auto_minmax(0,1fr)] min-[330px]:items-center min-[330px]:gap-4 min-[330px]:text-left dark:text-[#f7a8cb] sm:text-xs">
            <span>1 resgate por dia</span>
            <span className="min-w-0 min-[330px]:text-right">{status}</span>
          </div>
          <div className="mt-auto flex flex-col items-center gap-4 pt-5 lg:flex-row lg:justify-between">
            <div className="grid w-full max-w-[340px] grid-cols-3 gap-2">
              {[
                ["easy", "Fácil"],
                ["medium", "Médio"],
                ["hard", "Difícil"],
              ].map(([id, name]) => {
                const completed = used.includes(id as "easy" | "medium" | "hard");
                const current = session?.difficulty === id;
                return (
                  <div
                    key={name}
                    className={`flex min-h-[54px] min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center text-[9px] font-bold leading-tight ${completed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : current ? "border-pink-400 bg-pink-100 text-[#8e1745]" : "border-pink-200 bg-white/70 text-[#a52b59] dark:bg-[#240b1f]"}`}
                  >
                    <span>{name}</span>
                    <small className="mt-1 block text-[7px] leading-none">
                      {completed ? "Já usado" : current ? "Em andamento" : "Disponível"}
                    </small>
                  </div>
                );
              })}
            </div>
            <button
              disabled={!available}
              onClick={onPlay}
              className="mx-auto min-w-[150px] shrink-0 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-6 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 dark:shadow-none lg:mx-0 lg:ml-auto"
            >
              {!state
                ? "Carregando"
                : thisGameClaimed
                  ? "Concluído hoje"
                  : session
                    ? "Continuar"
                    : available
                      ? "Jogar agora"
                      : "Em breve"}
            </button>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function MemoryCardArt({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none grid-cols-3 gap-1.5 opacity-80 ${className}`}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="border border-pink-300 bg-[url('/verso-card.webp')] bg-cover bg-center shadow-sm"
        />
      ))}
    </div>
  );
}

function ComingSoonSlide({
  name,
  description,
  Icon,
}: {
  name: string;
  description: string;
  Icon: typeof Puzzle;
}) {
  return (
    <CardShell>
      <div className="flex min-h-[258px] flex-col items-center justify-center px-8 text-center sm:min-h-[221px]">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-100 text-[#a52b59]">
          <Icon className="h-10 w-10" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-[#6e1638] dark:text-[#ffd1e5]">{name}</h3>
        <p className="mt-2 text-sm text-[#a52b59] dark:text-[#f7a8cb]">{description}</p>
        <span className="mt-5 inline-flex items-center gap-1 rounded-full border border-pink-200 px-4 py-2 text-[10px] font-bold uppercase text-[#9e1b4a] dark:text-[#ffd1e5]">
          <LockKeyhole className="h-3.5 w-3.5" /> Em breve
        </span>
      </div>
    </CardShell>
  );
}
