"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Gamepad2, Gift, Trophy } from "lucide-react";
import { useUI } from "@/components/UIProvider";
import {
  claimMemoryGameReward,
  compareMemoryCards,
  getMemoryGameState,
  startMemoryGame,
  type MemoryDifficulty,
} from "@/lib/memoryGame";
import { getClubAssetUrl } from "@/lib/urls";
import { getBundledMemoryCoverUrl } from "@/lib/memoryCoverAssets";

type Card = {
  id: string;
  position: number;
  matched: boolean;
  frontImage?: string;
  backImage: string;
};
type Session = {
  id: string;
  difficulty: MemoryDifficulty;
  status: "in_progress" | "won" | "claimed";
  totalPairs: number;
  matchedPairs: number;
  cards: Card[];
};
type State = {
  available: boolean;
  canPlay?: boolean;
  blockedByGame?: "word_search" | "memory_game" | null;
  session?: Session | null;
  reward?: { sticker_number: number } | null;
  availableDifficulties?: MemoryDifficulty[];
  usedDifficulties?: MemoryDifficulty[];
};
const levels: { id: MemoryDifficulty; label: string; pairs: number }[] = [
  { id: "easy", label: "Fácil", pairs: 6 },
  { id: "medium", label: "Médio", pairs: 8 },
  { id: "hard", label: "Difícil", pairs: 12 },
];

export default function MemoryGameClient({ initialState }: { initialState: State }) {
  const router = useRouter();
  const ui = useUI();
  const [session, setSession] = useState<Session | null>(initialState.session || null);
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>(session?.difficulty || "easy");
  const [open, setOpen] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reward, setReward] = useState(initialState.reward || null);
  const availableDifficulties =
    initialState.availableDifficulties || levels.map((level) => level.id);
  const usedDifficulties = initialState.usedDifficulties || [];
  const [errorCards, setErrorCards] = useState<Set<string>>(() => new Set());
  const [matchedCards, setMatchedCards] = useState<Set<string>>(() => new Set());
  const feedbackTimers = useRef<number[]>([]);

  useEffect(
    () => () => {
      feedbackTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const clearFeedbackAfter = (kind: "error" | "match", delay: number) => {
    const timer = window.setTimeout(() => {
      if (kind === "error") setErrorCards(new Set());
      else setMatchedCards(new Set());
      feedbackTimers.current = feedbackTimers.current.filter((item) => item !== timer);
    }, delay);
    feedbackTimers.current.push(timer);
  };

  if (!initialState.available)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center p-5 text-center">
        <div className="rounded-3xl border border-pink-200 bg-white p-8 dark:bg-[#1c0819]">
          <h1 className="text-xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
            Recurso indisponível
          </h1>
          <p className="mt-2 text-sm text-[#9e1b4a] dark:text-[#f7a8cb]">
            Este jogo ainda não está disponível para sua conta.
          </p>
        </div>
      </main>
    );

  const start = async (nextDifficulty = difficulty) => {
    setBusy(true);
    setMessage("");
    try {
      setSession((await startMemoryGame({ data: { difficulty: nextDifficulty } })) as Session);
      setOpen({});
      setSelected([]);
      setErrorCards(new Set());
      setMatchedCards(new Set());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar.");
    } finally {
      setBusy(false);
    }
  };
  const flip = async (card: Card) => {
    if (!session || busy || card.matched || selected.includes(card.id) || selected.length >= 2)
      return;
    if (!card.frontImage) {
      setMessage("A imagem desta carta não está disponível.");
      return;
    }
    const next = [...selected, card.id];
    setOpen((old) => ({ ...old, [card.id]: card.frontImage as string }));
    setSelected(next);
    setMessage("");
    if (next.length < 2) return;

    const firstCard = session.cards.find((candidate) => candidate.id === next[0]);
    const appearsMatched = firstCard?.frontImage === card.frontImage;
    if (appearsMatched) {
      setMatchedCards(new Set(next));
      clearFeedbackAfter("match", 680);
    } else {
      setErrorCards(new Set(next));
    }

    setBusy(true);
    try {
      const [result] = await Promise.all([
        compareMemoryCards({
          data: { sessionId: session.id, firstCardId: next[0], secondCardId: next[1] },
        }),
        appearsMatched
          ? Promise.resolve()
          : new Promise((resolve) => window.setTimeout(resolve, 560)),
      ]);
      if (!result.matched) {
        setMessage("Ainda não! Tente outro par.");
        setOpen((old) => {
          const copy = { ...old };
          delete copy[next[0]];
          delete copy[next[1]];
          return copy;
        });
        clearFeedbackAfter("error", 120);
      } else {
        setMessage(result.won ? "Você encontrou todos os pares!" : "Par encontrado!");
        setSession(result.session as Session);
        if (result.won) ui.triggerHearts();
      }
      setSelected([]);
    } catch (error) {
      setOpen((old) => {
        const copy = { ...old };
        next.forEach((cardId) => delete copy[cardId]);
        return copy;
      });
      setSelected([]);
      setErrorCards(new Set());
      setMatchedCards(new Set());
      setMessage(
        error instanceof Error
          ? error.message
          : "Falha de conexão. O progresso oficial será mantido.",
      );
      try {
        const official = await getMemoryGameState();
        if (official.session) setSession(official.session as Session);
      } catch {
        // Mantém a última projeção segura; uma nova entrada na rota recarrega o estado oficial.
      }
    } finally {
      setBusy(false);
    }
  };
  const claim = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const result = await claimMemoryGameReward({ data: { sessionId: session.id } });
      setReward({ sticker_number: result.number });
      setSession({ ...session, status: "claimed" });
      ui.triggerHearts();
      ui.showReveals(
        [
          {
            slug: `sticker-${result.number}`,
            number: result.number,
            wasNew: result.wasNew,
            isRare: result.isRare,
            repeat: !result.wasNew,
            reward: null,
          },
        ],
        result.isRare ? "Figurinha Rara Desbloqueada! ✦" : "Figurinha Desbloqueada!",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível resgatar.");
    } finally {
      setBusy(false);
    }
  };

  const boardColumns = session?.difficulty === "hard" ? 6 : 4;
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-3 pb-16 pt-3 sm:px-6">
      <button
        className="mb-4 flex items-center gap-1 text-xs font-bold text-[#9e1b4a]"
        onClick={() => router.navigate({ to: "/clubedascolecionadoras" })}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <section className="rounded-[28px] border border-pink-200 bg-white p-3 shadow-sm dark:bg-[#180615] sm:p-5">
        <header className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-[10px] font-bold uppercase text-[#9e1b4a]">
            <Gamepad2 className="h-3 w-3" /> Missão diária
          </span>
          <h1 className="mt-2 text-2xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
            Jogo da Memória
          </h1>
          <p className="mt-1 text-xs text-[#a52b59] dark:text-[#f7a8cb]">
            Encontre todos os pares para liberar a recompensa diária.
          </p>
        </header>
        {!session && !reward && initialState.canPlay === false && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-pink-200 bg-pink-50 p-5 text-center text-xs font-semibold text-[#8e1745] dark:bg-[#260c20] dark:text-[#f7a8cb]">
            Você já tem uma partida em andamento. Conclua o jogo atual antes de iniciar outro.
          </div>
        )}
        {!session && !reward && initialState.canPlay !== false && (
          <div className="mt-6">
            <details className="mb-5 rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-left text-xs text-[#7f3152] dark:bg-[#260c20] dark:text-[#f7a8cb]">
              <summary className="cursor-pointer font-black">Como jogar</summary>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                <li>Escolha Fácil (6 pares), Médio (8 pares) ou Difícil (12 pares).</li>
                <li>Vire duas cartas por vez. Se forem iguais, elas permanecem abertas.</li>
                <li>Encontre todos os pares para liberar a recompensa diária.</li>
                <li>Ao iniciar, o nível escolhido fica bloqueado até o fim da partida.</li>
                <li>Você pode vencer somente uma partida por dia, considerando todos os jogos.</li>
                <li>
                  Se sair, seu progresso fica salvo até o fim do dia. Na virada do dia, partidas não
                  concluídas são reiniciadas e o nível volta a ficar disponível.
                </li>
                <li>Conclua e resgate a recompensa antes da virada do dia.</li>
              </ul>
            </details>
            <h2 className="text-center text-sm font-bold text-[#6e1638] dark:text-[#ffd1e5]">
              Escolha a dificuldade
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {levels.map((level) => (
                <button
                  key={level.id}
                  disabled={
                    !availableDifficulties.includes(level.id) || initialState.canPlay === false
                  }
                  onClick={() => setDifficulty(level.id)}
                  className={`rounded-2xl border p-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${difficulty === level.id ? "border-pink-500 bg-pink-100 text-[#8e1745]" : "border-pink-200 text-[#a52b59] dark:bg-[#260c20]"}`}
                >
                  {level.label}
                  <span className="mt-1 block text-[9px] font-medium">
                    {usedDifficulties.includes(level.id) ? "Já usado" : `${level.pairs} pares`}
                  </span>
                </button>
              ))}
            </div>
            <button
              disabled={
                busy ||
                initialState.canPlay === false ||
                !availableDifficulties.includes(difficulty)
              }
              onClick={() => start()}
              className="mx-auto mt-5 block rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-8 py-3 text-xs font-black text-white disabled:opacity-60"
            >
              Iniciar partida
            </button>
          </div>
        )}
        {reward && (
          <div className="mx-auto mt-3 max-w-sm rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-700">
            <Trophy className="mr-1 inline h-4 w-4" /> Recompensa diária já resgatada. Uma nova
            partida estará disponível no próximo dia.
          </div>
        )}
        {session && (
          <>
            <div className="mt-5 flex items-center justify-between gap-3 border-y border-pink-100 py-3">
              <div>
                <strong className="text-sm text-[#6e1638] dark:text-[#ffd1e5]">
                  {session.matchedPairs} de {session.totalPairs} pares
                </strong>
                <span className="ml-2 text-[10px] text-[#a52b59]">
                  {levels.find((l) => l.id === session.difficulty)?.label}
                </span>
              </div>
              {session.status === "in_progress" && (
                <span className="text-[10px] font-bold text-[#9e1b4a] dark:text-[#f7a8cb]">
                  Nível bloqueado nesta partida
                </span>
              )}
            </div>
            <div
              className="mx-auto mt-3 grid w-fit gap-[clamp(4px,1vh,8px)]"
              style={{
                gridTemplateColumns: `repeat(${boardColumns}, clamp(42px, calc((100dvh - 300px) / 6), 70px))`,
              }}
              aria-busy={busy}
            >
              {session.cards.map((card) => {
                const faceUrl = getBundledMemoryCoverUrl(card.frontImage);
                const faceIsVisible = card.matched || Boolean(open[card.id]);
                return (
                  <button
                    key={card.id}
                    disabled={busy || card.matched}
                    aria-label={
                      card.matched
                        ? `Carta ${card.position + 1}, par encontrado`
                        : face
                          ? `Carta ${card.position + 1}, revelada`
                          : `Virar carta ${card.position + 1}`
                    }
                    onClick={() => flip(card)}
                    className={`memory-card group aspect-[2/3] w-full min-w-0 focus:outline-none focus:ring-4 focus:ring-pink-300 ${errorCards.has(card.id) ? "memory-card--error" : ""} ${matchedCards.has(card.id) ? "memory-card--match" : ""}`}
                  >
                    <span
                      className="memory-card__inner relative block h-full w-full"
                      data-face-visible={faceIsVisible ? "true" : "false"}
                    >
                      <span className="memory-card__face memory-card__back absolute inset-0">
                        <img
                          src={getClubAssetUrl(card.backImage)}
                          alt=""
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span className="memory-card__face memory-card__front absolute inset-0">
                        <img
                          src={faceUrl || getClubAssetUrl(card.backImage)}
                          alt=""
                          loading="eager"
                          decoding="async"
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {session.status === "won" && !reward && (
              <div className="memory-reward-entrance mt-6 text-center">
                <Gift className="mx-auto h-8 w-8 text-[#c2185b]" />
                <button
                  disabled={busy}
                  onClick={claim}
                  className="mt-3 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-8 py-3 text-xs font-black text-white"
                >
                  Resgatar figurinha
                </button>
              </div>
            )}
            {session.status === "won" && reward && (
              <p className="mt-4 text-center text-xs font-bold text-emerald-700">
                Partida concluída! A recompensa diária já havia sido resgatada.
              </p>
            )}
          </>
        )}
        <p
          aria-live="polite"
          className="mt-4 min-h-5 text-center text-xs font-semibold text-[#a52b59] dark:text-[#f7a8cb]"
        >
          {message}
        </p>
      </section>
    </main>
  );
}
