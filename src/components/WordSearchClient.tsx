"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, Gift, Sparkles, Trophy, X } from "lucide-react";
import { useUI } from "@/components/UIProvider";
import { claimDailyGameReward, startWordSearch, submitWordPath } from "@/lib/games";
import type { CellCoordinate, WordSearchDifficulty } from "@/lib/wordSearchGenerator";

type Session = {
  id: string;
  difficulty: WordSearchDifficulty;
  board: string[][];
  status: "in_progress" | "won" | "claimed";
  totalWords: number;
  foundWords: number;
  words: { id: string; displayWord: string; category: string; found: boolean }[];
  foundPaths: CellCoordinate[][];
};

type Reward = {
  sticker_number: number;
  result_type: string;
  is_rare: boolean;
};

type InitialGameState = {
  available: boolean;
  session?: Session | null;
  reward?: Reward | null;
  availableDifficulties?: WordSearchDifficulty[];
  usedDifficulties?: WordSearchDifficulty[];
};

const HIGHLIGHT_COLORS = ["#fde047", "#86efac", "#7dd3fc", "#f9a8d4", "#c4b5fd", "#fdba74"];

export default function WordSearchClient({ initialState }: { initialState: InitialGameState }) {
  const router = useRouter();
  const ui = useUI();
  const [session, setSession] = useState<Session | null>(initialState?.session || null);
  const availableDifficulties = initialState.availableDifficulties || ["easy", "medium", "hard"];
  const [difficulty, setDifficulty] = useState<WordSearchDifficulty>(
    session?.difficulty ||
      (availableDifficulties.includes("easy") ? "easy" : availableDifficulties[0] || "easy"),
  );
  const [selection, setSelection] = useState<CellCoordinate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reward, setReward] = useState<Reward | null>(initialState?.reward || null);

  const selectedKeys = useMemo(
    () => new Set(selection.map((cell) => `${cell.row}:${cell.col}`)),
    [selection],
  );
  const foundCellColors = useMemo(() => {
    const colors = new Map<string, string[]>();
    (session?.foundPaths || []).forEach((path, pathIndex) => {
      const color = HIGHLIGHT_COLORS[pathIndex % HIGHLIGHT_COLORS.length];
      path.forEach((cell) => {
        const key = `${cell.row}:${cell.col}`;
        colors.set(key, [...(colors.get(key) || []), color]);
      });
    });
    return colors;
  }, [session]);

  if (!initialState?.available) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-5 text-center">
        <div className="rounded-3xl border border-pink-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-black text-[#6e1638]">Recurso indisponível</h1>
          <p className="mt-2 text-sm text-[#9e1b4a]">
            Este recurso não está disponível para sua conta no momento.
          </p>
          <button
            className="mt-5 rounded-full bg-[#9e1b4a] px-5 py-2 text-sm font-bold text-white"
            onClick={() => router.navigate({ to: "/clubedascolecionadoras" })}
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  const start = async () => {
    setLoading(true);
    setMessage("");
    try {
      const next = await startWordSearch({ data: { difficulty } });
      setSession(next as Session);
      setSelection([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar.");
    } finally {
      setLoading(false);
    }
  };

  const chooseCell = async (row: number, col: number) => {
    if (!session || loading || session.status !== "in_progress") return;
    const key = `${row}:${col}`;
    if (selectedKeys.has(key)) {
      setMessage("Essa célula já está na seleção.");
      return;
    }
    const next = [...selection, { row, col }];
    if (next.length >= 2) {
      const dr = next[1].row - next[0].row;
      const dc = next[1].col - next[0].col;
      const expected = {
        row: next[0].row + dr * (next.length - 1),
        col: next[0].col + dc * (next.length - 1),
      };
      if (
        Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ||
        expected.row !== row ||
        expected.col !== col
      ) {
        setMessage("Escolha letras vizinhas e continue na mesma direção.");
        return;
      }
      const isEasyDirection =
        (dr === 0 && dc === 1) || (dr === 1 && dc === 0) || (dr === 1 && dc === 1);
      if (session.difficulty === "easy" && !isEasyDirection) {
        setMessage(
          "No nível fácil, selecione da esquerda para a direita, de cima para baixo ou na diagonal.",
        );
        return;
      }
    }
    setSelection(next);
    setMessage("");
  };

  const submit = async () => {
    if (!session || selection.length < 4) return;
    setLoading(true);
    try {
      const result = await submitWordPath({ data: { sessionId: session.id, path: selection } });
      setSession(result.session as Session);
      setMessage(
        result.matched
          ? `Você encontrou “${result.foundWord}”!`
          : "Essa sequência não está na lista. Tente outra.",
      );
      setSelection([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível validar a palavra.");
    } finally {
      setLoading(false);
    }
  };

  const claim = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await claimDailyGameReward({ data: { sessionId: session.id } });
      setReward({
        sticker_number: result.number,
        result_type: result.resultType,
        is_rare: result.isRare,
      });
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
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-3 pb-24 pt-5 sm:px-6">
      <button
        className="mb-4 flex items-center gap-1 text-xs font-bold text-[#9e1b4a]"
        onClick={() => router.navigate({ to: "/clubedascolecionadoras" })}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <section className="rounded-3xl border border-pink-200/70 bg-white p-4 shadow-sm sm:p-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fce4ec] px-3 py-1 text-[10px] font-bold uppercase text-[#9e1b4a]">
            <Sparkles className="h-3 w-3" /> Missão diária
          </span>
          <h1 className="mt-2 text-2xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
            Caça-Palavras Sáfico
          </h1>
          <p className="mt-1 text-xs text-[#a52b59] dark:text-[#f7a8cb]">
            Encontre todas as palavras e ganhe uma figurinha entre 21 e 193.
          </p>
        </div>

        {!session && reward ? (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <Trophy className="mx-auto h-8 w-8 text-emerald-600" />
            <h2 className="mt-2 text-base font-black text-emerald-800">Missão concluída hoje!</h2>
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Sua figurinha já foi resgatada. Volte amanhã para jogar novamente.
            </p>
          </div>
        ) : !session ? (
          <div className="mx-auto mt-6 max-w-sm">
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-[#6e1638]">
                Escolha a dificuldade
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <button
                    key={level}
                    disabled={!availableDifficulties.includes(level)}
                    onClick={() => setDifficulty(level)}
                    className={`rounded-xl border px-2 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 ${difficulty === level ? "border-[#9e1b4a] bg-[#fce4ec] text-[#6e1638]" : "border-pink-100 text-[#a52b59]"}`}
                  >
                    {level === "easy" ? "Fácil" : level === "medium" ? "Médio" : "Difícil"}
                    {!availableDifficulties.includes(level) && (
                      <span className="mt-1 block text-[8px] font-semibold uppercase">
                        concluído neste ciclo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              disabled={loading}
              onClick={start}
              className="mt-5 w-full rounded-full bg-[#9e1b4a] py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? "Preparando..." : "Começar partida"}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-center rounded-2xl bg-[#fff4f8] px-4 py-3">
              <span className="text-xs font-bold text-[#6e1638]">
                {session.foundWords} de {session.totalWords} palavras
              </span>
            </div>
            {session.difficulty !== "hard" ? (
              <ul className="mt-3 flex flex-wrap justify-center gap-2">
                {session.words.map((word) => {
                  const foundIndex = session.words
                    .filter((candidate) => candidate.found)
                    .findIndex((candidate) => candidate.id === word.id);
                  return (
                    <li
                      key={word.id}
                      style={
                        word.found
                          ? {
                              backgroundColor:
                                HIGHLIGHT_COLORS[foundIndex % HIGHLIGHT_COLORS.length],
                            }
                          : undefined
                      }
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${word.found ? "border-black/15 text-[#3f1830] line-through" : "border-pink-200 text-[#9e1b4a]"}`}
                    >
                      {word.found && <Check className="mr-1 inline h-3 w-3" />}
                      {word.displayWord}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-center text-xs font-bold text-[#9e1b4a]">
                {session.foundWords} de 5 palavras encontradas
              </p>
            )}

            <div
              className="word-search-board mx-auto mt-5 grid aspect-square w-full max-w-[520px] gap-0.5 p-2"
              style={{ gridTemplateColumns: `repeat(${session.board.length}, minmax(0, 1fr))` }}
            >
              {session.board.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const key = `${rowIndex}:${colIndex}`;
                  const selected = selectedKeys.has(key);
                  const colors = foundCellColors.get(key) || [];
                  const found = colors.length > 0;
                  const highlightBackground =
                    colors.length === 1
                      ? colors[0]
                      : `linear-gradient(135deg, ${colors
                          .map(
                            (color, index) =>
                              `${color} ${(index / colors.length) * 100}%, ${color} ${((index + 1) / colors.length) * 100}%`,
                          )
                          .join(", ")})`;
                  return (
                    <button
                      key={key}
                      aria-label={`Linha ${rowIndex + 1}, coluna ${colIndex + 1}, letra ${letter}${selected ? ", selecionada" : found ? ", encontrada" : ""}`}
                      onClick={() => chooseCell(rowIndex, colIndex)}
                      style={found && !selected ? { background: highlightBackground } : undefined}
                      className={`aspect-square min-w-0 rounded-[4px] border text-[clamp(8px,2.6vw,16px)] font-black leading-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6e1638] ${selected ? "border-[#6e1638] bg-[#f5a9cb] text-[#4d0d26] ring-1 ring-[#6e1638]" : found ? "border-black/15 text-[#301224]" : "word-search-cell border-white/70 bg-white text-[#6e1638]"}`}
                    >
                      {found && <span className="sr-only">Encontrada: </span>}
                      {letter}
                    </button>
                  );
                }),
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                disabled={!selection.length || loading}
                onClick={() => setSelection([])}
                className="flex items-center justify-center gap-1 rounded-full border border-[#9e1b4a] py-2.5 text-xs font-bold text-[#9e1b4a] disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" /> Limpar seleção
              </button>
              <button
                disabled={selection.length < 4 || loading}
                onClick={submit}
                className="rounded-full bg-[#9e1b4a] py-2.5 text-xs font-bold text-white disabled:opacity-40"
              >
                Confirmar palavra
              </button>
            </div>
            {session.status === "won" && !reward && (
              <button
                disabled={loading}
                onClick={claim}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#9e1b4a] to-[#d63384] py-3 text-sm font-black text-white"
              >
                <Gift className="h-4 w-4" /> Resgatar figurinha
              </button>
            )}
          </>
        )}
        {message && (
          <p
            role="status"
            className="mt-4 rounded-xl bg-[#fff4f8] p-3 text-center text-xs font-semibold text-[#9e1b4a]"
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
