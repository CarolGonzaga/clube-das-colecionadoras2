"use client";

import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Gamepad2, Gift, Trophy } from "lucide-react";
import { useUI } from "@/components/UIProvider";
import {
  claimMemoryGameReward,
  compareMemoryCards,
  getMemoryGameState,
  revealMemoryCard,
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
  session?: Session | null;
  reward?: { sticker_number: number } | null;
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar.");
    } finally {
      setBusy(false);
    }
  };
  const flip = async (card: Card) => {
    if (!session || busy || card.matched || selected.includes(card.id) || selected.length >= 2)
      return;
    setBusy(true);
    try {
      const reveal = await revealMemoryCard({ data: { sessionId: session.id, cardId: card.id } });
      const next = [...selected, card.id];
      setOpen((old) => ({ ...old, [card.id]: reveal.frontImage }));
      setSelected(next);
      if (next.length === 2) {
        const result = await compareMemoryCards({
          data: { sessionId: session.id, firstCardId: next[0], secondCardId: next[1] },
        });
        if (!result.matched) {
          setMessage("Ainda não! Tente outro par.");
          await new Promise((resolve) => window.setTimeout(resolve, 900));
          setOpen((old) => {
            const copy = { ...old };
            delete copy[next[0]];
            delete copy[next[1]];
            return copy;
          });
        } else {
          setMessage(result.won ? "Você encontrou todos os pares!" : "Par encontrado!");
          setSession(result.session as Session);
        }
        setSelected([]);
      }
    } catch (error) {
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
        {!session && !reward && (
          <div className="mt-6">
            <details className="mb-5 rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-left text-xs text-[#7f3152] dark:bg-[#260c20] dark:text-[#f7a8cb]">
              <summary className="cursor-pointer font-black">Como jogar</summary>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                <li>Escolha Fácil (6 pares), Médio (8 pares) ou Difícil (12 pares).</li>
                <li>Vire duas cartas por vez. Se forem iguais, elas permanecem abertas.</li>
                <li>Encontre todos os pares para liberar a recompensa diária.</li>
                <li>Ao iniciar, o nível escolhido fica bloqueado até o fim da partida.</li>
                <li>Você pode iniciar somente uma partida por dia.</li>
                <li>
                  Se sair antes de terminar, a partida continuará salva, inclusive depois da virada
                  do dia.
                </li>
                <li>Há apenas uma recompensa por dia, compartilhada entre todos os jogos.</li>
              </ul>
            </details>
            <h2 className="text-center text-sm font-bold text-[#6e1638] dark:text-[#ffd1e5]">
              Escolha a dificuldade
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setDifficulty(level.id)}
                  className={`rounded-2xl border p-3 text-xs font-bold ${difficulty === level.id ? "border-pink-500 bg-pink-100 text-[#8e1745]" : "border-pink-200 text-[#a52b59] dark:bg-[#260c20]"}`}
                >
                  {level.label}
                  <span className="mt-1 block text-[9px] font-medium">{level.pairs} pares</span>
                </button>
              ))}
            </div>
            <button
              disabled={busy}
              onClick={() => start()}
              className="mx-auto mt-5 block rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-8 py-3 text-xs font-black text-white disabled:opacity-60"
            >
              Iniciar partida
            </button>
          </div>
        )}
        {reward && (
          <div className="mx-auto mt-3 max-w-sm rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-700">
            <Trophy className="mr-1 inline h-4 w-4" /> Recompensa diária já resgatada.
            {session
              ? " Você pode concluir a partida pendente, mas não receberá outro resgate hoje."
              : " Uma nova partida estará disponível no próximo dia."}
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
                const face = card.matched ? card.frontImage : open[card.id];
                const faceUrl = getBundledMemoryCoverUrl(face);
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
                    className="group aspect-[2/3] w-full min-w-0 focus:outline-none focus:ring-4 focus:ring-pink-300 disabled:opacity-90"
                  >
                    <span
                      className={`relative block h-full w-full transition-transform duration-300 [transform-style:preserve-3d] motion-reduce:transition-none ${faceUrl ? "[transform:rotateY(180deg)]" : ""}`}
                    >
                      <img
                        src={getClubAssetUrl(card.backImage)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover [backface-visibility:hidden]"
                      />
                      <img
                        src={faceUrl || getClubAssetUrl(card.backImage)}
                        alt=""
                        className="absolute inset-0 h-full w-full border border-pink-300 object-cover [backface-visibility:hidden] [transform:rotateY(180deg)]"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
            {session.status === "won" && !reward && (
              <div className="mt-6 text-center">
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
