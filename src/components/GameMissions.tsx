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
import { getMemoryGameState } from "@/lib/memoryGame";
import type { WordSearchDifficulty } from "@/lib/wordSearchGenerator";
import { getClubAssetUrl } from "@/lib/urls";

const SLIDES = [
  { key: "word_search", name: "Caça-Palavras Sáfico", Icon: BookOpenText },
  { key: "memory_game", name: "Jogo da Memória", Icon: Grid3X3 },
  { key: "quick_quiz", name: "Quiz Relâmpago", Icon: Brain },
  { key: "puzzle", name: "Quebra-Cabeça", Icon: Puzzle },
] as const;

const LEVELS: { id: WordSearchDifficulty; label: string }[] = [
  { id: "easy", label: "Fácil" },
  { id: "medium", label: "Médio" },
  { id: "hard", label: "Difícil" },
];

type WordState = {
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

type MemoryState = {
  available: boolean;
  reward?: { sticker_number: number } | null;
  session?: {
    status: "in_progress" | "won" | "claimed";
    difficulty: "easy" | "medium" | "hard";
    matchedPairs: number;
    totalPairs: number;
  } | null;
};

export default function GameMissions() {
  const router = useRouter();
  const [wordState, setWordState] = useState<WordState | null>(null);
  const [memoryState, setMemoryState] = useState<MemoryState | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getDailyGamesState(), getMemoryGameState()]).then(([word, memory]) => {
      if (!active) return;
      setWordState(word.status === "fulfilled" ? word.value : { available: false });
      setMemoryState(memory.status === "fulfilled" ? memory.value : { available: false });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setSlideIndex((current) => (current + 1) % SLIDES.length),
      12000,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) => {
    setSlideIndex((current) => (current + direction + SLIDES.length) % SLIDES.length);
  };

  const slide = SLIDES[slideIndex];

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
        aria-roledescription="carrossel"
        aria-label="Jogos disponíveis"
      >
        <button
          type="button"
          aria-label="Jogo anterior"
          onClick={() => move(-1)}
          className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-pink-200 bg-white/95 text-[#9e1b4a] shadow-md dark:bg-[#260c20] dark:text-[#ffd1e5] sm:-left-3"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="overflow-hidden rounded-[28px]">
          {slide.key === "word_search" && (
            <WordSearchSlide state={wordState} onPlay={() => setShowRules(true)} />
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
            <ComingSoonSlide
              name="Quebra-Cabeça"
              description="Monte a imagem de uma figurinha."
              Icon={Puzzle}
            />
          )}
        </div>

        <button
          type="button"
          aria-label="Próximo jogo"
          onClick={() => move(1)}
          className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-pink-200 bg-white/95 text-[#9e1b4a] shadow-md dark:bg-[#260c20] dark:text-[#ffd1e5] sm:-right-3"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        className="mt-3 flex items-center justify-center gap-2"
        aria-label={`Slide ${slideIndex + 1} de ${SLIDES.length}`}
      >
        {SLIDES.map((item, index) => (
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

      {showRules && wordState?.available && !wordState.reward && (
        <WordSearchRules
          continuing={Boolean(wordState.session)}
          onClose={() => setShowRules(false)}
          onContinue={() => router.navigate({ to: "/clubedascolecionadoras/jogos/caca-palavras" })}
        />
      )}
    </section>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <article className="relative min-h-[310px] overflow-hidden rounded-[28px] border border-pink-300/80 bg-gradient-to-br from-white via-[#fffafd] to-[#fff0f7] p-6 shadow-[0_12px_35px_rgba(158,27,74,0.09)] dark:from-[#1a0718] dark:via-[#180615] dark:to-[#22091b] sm:min-h-[285px] sm:p-8">
      {children}
    </article>
  );
}

function WordSearchSlide({ state, onPlay }: { state: WordState | null; onPlay: () => void }) {
  const session = state?.session;
  const used = state?.usedDifficulties || [];
  const available = Boolean(state?.available);
  const status = state?.reward
    ? "Recompensa já resgatada hoje"
    : session?.status === "won"
      ? "Você venceu! Resgate sua figurinha"
      : session
        ? "Partida em andamento"
        : available
          ? "Pronto para jogar"
          : "Disponível em breve";
  return (
    <CardShell>
      <img
        src={getClubAssetUrl("/cacapalavras.png")}
        alt=""
        className="pointer-events-none absolute right-5 top-5 h-[78px] w-[108px] object-contain object-right-top sm:bottom-6 sm:left-6 sm:top-auto sm:h-[190px] sm:w-[230px] sm:object-left-bottom"
      />
      <div className="relative z-10 flex min-h-[258px] flex-col pr-[105px] sm:ml-[250px] sm:min-h-[221px] sm:pr-0">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-[9px] font-black uppercase text-[#9e1b4a]">
            <Gamepad2 className="h-3 w-3" /> Missão diária
          </span>
          <h3 className="mt-3 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
            Caça-Palavras Sáfico
          </h3>
          <p className="mt-1.5 text-xs font-semibold text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
            Encontre todas as palavras para resgatar a recompensa.
          </p>
        </div>
        <div className="mt-4 border-y border-pink-100 py-3 text-[10px] font-bold text-[#9e1b4a] dark:text-[#f7a8cb] sm:flex sm:justify-between sm:text-xs">
          <span>
            {session
              ? `${session.foundWords} de ${session.totalWords} palavras`
              : "1 resgate por dia"}
          </span>
          <span className="mt-1 flex items-center gap-1 sm:mt-0">
            {state?.reward && <Check className="h-3.5 w-3.5" />}
            {status}
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-1.5">
            {LEVELS.map((level) => {
              const completed = used.includes(level.id);
              const current = session?.difficulty === level.id;
              return (
                <div
                  key={level.id}
                  className={`rounded-xl border px-2 py-2 text-center text-[9px] font-bold ${completed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : current ? "border-pink-400 bg-pink-100 text-[#8e1745]" : "border-pink-200 bg-white/70 text-[#a52b59] dark:bg-[#240b1f]"}`}
                >
                  {completed && <Check className="mx-auto h-3 w-3" />}
                  <span>{level.label}</span>
                  <small className="block text-[7px]">
                    {completed ? "Já usado" : current ? "Em andamento" : "Disponível"}
                  </small>
                </div>
              );
            })}
          </div>
          <button
            disabled={!available || Boolean(state?.reward)}
            onClick={onPlay}
            className="mx-auto min-w-[150px] rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-6 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 dark:shadow-none sm:mx-0"
          >
            {state?.reward
              ? "Concluído hoje"
              : session
                ? "Continuar"
                : available
                  ? "Jogar agora"
                  : "Em breve"}
          </button>
        </div>
      </div>
    </CardShell>
  );
}

function MemoryGameSlide({ state, onPlay }: { state: MemoryState | null; onPlay: () => void }) {
  const session = state?.session;
  const available = Boolean(state?.available);
  return (
    <CardShell>
      <div className="pointer-events-none absolute right-7 top-7 grid h-[92px] w-[110px] grid-cols-3 gap-1 opacity-80 sm:bottom-7 sm:left-8 sm:top-auto sm:h-[195px] sm:w-[235px] sm:gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border border-pink-300 bg-[url('/verso-card.webp')] bg-cover bg-center shadow-sm"
          />
        ))}
      </div>
      <div className="relative z-10 flex min-h-[258px] flex-col pr-[120px] sm:ml-[270px] sm:min-h-[221px] sm:pr-0">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-[9px] font-black uppercase text-[#9e1b4a]">
            <Gamepad2 className="h-3 w-3" /> Missão diária
          </span>
          <h3 className="mt-3 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5] sm:text-2xl">
            Jogo da Memória
          </h3>
          <p className="mt-1.5 text-xs font-semibold text-[#a52b59] dark:text-[#f7a8cb] sm:text-sm">
            Encontre todos os pares de figurinhas para liberar a recompensa.
          </p>
        </div>
        <div className="mt-4 border-y border-pink-100 py-3 text-[10px] font-bold text-[#9e1b4a] dark:text-[#f7a8cb] sm:flex sm:justify-between sm:text-xs">
          <span>
            {session
              ? `${session.matchedPairs} de ${session.totalPairs} pares`
              : "1 resgate por dia"}
          </span>
          <span className="mt-1 flex items-center gap-1 sm:mt-0">
            {state?.reward && <Check className="h-3.5 w-3.5" />}
            {state?.reward
              ? "Recompensa já resgatada hoje"
              : session
                ? "Partida em andamento"
                : available
                  ? "Pronto para jogar"
                  : "Disponível em breve"}
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ["Fácil", "6 pares"],
              ["Médio", "8 pares"],
              ["Difícil", "12 pares"],
            ].map(([name, pairs]) => (
              <div
                key={name}
                className="rounded-xl border border-pink-200 bg-white/70 px-2 py-2 text-center text-[9px] font-bold text-[#a52b59] dark:bg-[#240b1f]"
              >
                <span>{name}</span>
                <small className="block text-[7px]">{pairs}</small>
              </div>
            ))}
          </div>
          <button
            disabled={!available || Boolean(state?.reward)}
            onClick={onPlay}
            className="mx-auto min-w-[150px] rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-6 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 dark:shadow-none sm:mx-0"
          >
            {state?.reward
              ? "Concluído hoje"
              : session
                ? "Continuar"
                : available
                  ? "Jogar agora"
                  : "Em breve"}
          </button>
        </div>
      </div>
    </CardShell>
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

function WordSearchRules({
  continuing,
  onClose,
  onContinue,
}: {
  continuing: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
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
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#9e1b4a]"
        >
          <X className="h-5 w-5" />
        </button>
        <h3
          id="word-search-rules-title"
          className="text-xl font-black text-[#6e1638] dark:text-[#ffd1e5]"
        >
          Como jogar
        </h3>
        <div className="mt-4 space-y-3 text-xs font-semibold leading-relaxed text-[#7f3152] dark:text-[#f7a8cb]">
          <p>Escolha um nível disponível: Fácil, Médio ou Difícil.</p>
          <p>
            Selecione letras vizinhas na horizontal, vertical ou diagonal, seguindo uma única
            direção.
          </p>
          <p>Nos níveis Médio e Difícil, algumas palavras aparecem de trás para frente.</p>
          <p>
            Encontre todas as palavras para liberar a recompensa diária. Seu progresso fica salvo se
            você sair.
          </p>
          <p>Você pode receber apenas uma recompensa por dia entre todos os jogos.</p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] py-3 text-xs font-black text-white"
        >
          {continuing ? "Continuar partida" : "Escolher dificuldade"}
        </button>
      </div>
    </div>
  );
}
