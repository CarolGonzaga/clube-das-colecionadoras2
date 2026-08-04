"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useUI } from "@/components/UIProvider";
import { getBundledMemoryCoverUrl } from "@/lib/memoryCoverAssets";
import { getMemoryCoverPath } from "@/lib/memoryImagePath";
import {
  claimCoverGuesserReward,
  getCoverGuesserState,
  startCoverGuesser,
  submitCoverGuess,
  useHint as requestHint,
} from "@/lib/coverGuesser";
import {
  ArrowLeft,
  Eye,
  Gift,
  HelpCircle,
  Lock,
  Search,
  Sparkles,
  Trophy,
  BookOpen,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const BLUR_BY_DIFFICULTY: Record<string, string> = {
  easy: "blur(14px)",
  medium: "blur(24px)",
  hard: "blur(36px)",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const HINTS_LABEL: Record<string, string> = {
  easy: "2 dicas",
  medium: "1 dica",
  hard: "Sem dicas",
};

function playWinTones() {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.35);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  } catch {}
}

// ─── main component ──────────────────────────────────────────────────────────

export default function CoverGuesserClient() {
  const ui = useUI();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [starting, setStarting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [guessInput, setGuessInput] = useState("");
  const [guessError, setGuessError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usingHint, setUsingHint] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const session = gameState?.session;
  const reward = gameState?.reward;
  const availableDifficulties: string[] = gameState?.availableDifficulties || [
    "easy",
    "medium",
    "hard",
  ];
  const usedDifficulties: string[] = gameState?.usedDifficulties || [];
  const canPlay = gameState?.canPlay;
  const blockedByGame = gameState?.blockedByGame;

  const coverPath = session?.stickerId ? getMemoryCoverPath(session.stickerId) : null;
  const coverUrl = coverPath ? getBundledMemoryCoverUrl(coverPath) || coverPath : null;

  // ── load state ──────────────────────────────────────────────────────────
  const loadState = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const state = await getCoverGuesserState();
      setGameState(state);
    } catch (e: any) {
      setErrorMsg(e?.message || "Não foi possível carregar o jogo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // ── start game ──────────────────────────────────────────────────────────
  const handleStart = useCallback(async (diff: "easy" | "medium" | "hard") => {
    setStarting(true);
    setErrorMsg(null);
    try {
      const sess = await startCoverGuesser({ data: { difficulty: diff } });
      setGameState((prev: any) => ({ ...prev, session: sess, canPlay: false }));
      setGuessInput("");
      setGuessError(null);
      setShowReveal(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e: any) {
      setErrorMsg(e?.message || "Não foi possível iniciar o jogo.");
    } finally {
      setStarting(false);
    }
  }, []);

  // ── use hint ────────────────────────────────────────────────────────────
  const handleHint = useCallback(async () => {
    if (!session) return;
    setUsingHint(true);
    try {
      const result = await requestHint({ data: { sessionId: session.id } });
      setGameState((prev: any) => ({
        ...prev,
        session: {
          ...prev.session,
          hintsUsed: result.hintsUsed,
          revealedPositions: result.revealedPositions,
          wordMasks: result.wordMasks,
        },
      }));
    } catch (e: any) {
      ui.toast(e?.message || "Não foi possível usar a dica.");
    } finally {
      setUsingHint(false);
    }
  }, [session, ui]);

  // ── submit guess ────────────────────────────────────────────────────────
  const handleGuess = useCallback(async () => {
    if (!session || !guessInput.trim()) return;
    setSubmitting(true);
    setGuessError(null);
    try {
      const result = await submitCoverGuess({ data: { sessionId: session.id, guess: guessInput } });
      if (result.correct) {
        playWinTones();
        setGameState((prev: any) => ({
          ...prev,
          session: { ...prev.session, status: "won" },
        }));
        setShowReveal(true);
      } else {
        setGuessError("Resposta incorreta. Tente novamente!");
        inputRef.current?.focus();
      }
    } catch (e: any) {
      setGuessError(e?.message || "Não foi possível verificar a resposta.");
    } finally {
      setSubmitting(false);
    }
  }, [session, guessInput]);

  // ── claim reward ────────────────────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    if (!session) return;
    setClaiming(true);
    try {
      const result = await claimCoverGuesserReward({ data: { sessionId: session.id } });
      setClaimResult(result);
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
      await loadState();
    } catch (e: any) {
      setErrorMsg(e?.message || "Não foi possível resgatar a figurinha.");
    } finally {
      setClaiming(false);
    }
  }, [session, loadState, ui]);

  // ── abandon ─────────────────────────────────────────────────────────────
  // ── keyboard enter ───────────────────────────────────────────────────────
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleGuess();
    },
    [handleGuess],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="cover-guesser-loading">
        <div className="cover-guesser-spinner" />
        <p>Carregando…</p>
      </div>
    );
  }

  if (!gameState?.available) {
    return (
      <div className="cover-guesser-unavailable">
        <BookOpen size={48} style={{ opacity: 0.4 }} />
        <h2>Adivinhe a Capa</h2>
        <p>Este jogo ainda não está disponível para sua conta.</p>
        <button
          className="cover-guesser-back-btn"
          onClick={() => router.navigate({ to: "/clubedascolecionadoras/jogos" as any })}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  // ── Already completed today ─────────────────────────────────────────────
  if (reward || session?.status === "claimed") {
    return (
      <div className="cover-guesser-wrap">
        <header className="cover-guesser-header">
          <button
            className="cover-guesser-back-btn"
            onClick={() => router.navigate({ to: "/clubedascolecionadoras" as any })}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1>Adivinhe a Capa</h1>
        </header>
        <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm dark:border-emerald-900/50 dark:bg-[#0c2419]">
          <Trophy className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          <h2 className="mt-3 text-lg font-black text-emerald-800 dark:text-emerald-200">
            🏆 Missão concluída hoje!
          </h2>
          <p className="mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Volte amanhã para jogar novamente!
          </p>
        </div>
      </div>
    );
  }

  // ── Difficulty selection ────────────────────────────────────────────────
  if (!session || session.status === "abandoned") {
    const blocked = !canPlay && !blockedByGame;
    return (
      <div className="cover-guesser-wrap">
        <header className="cover-guesser-header">
          <button
            className="cover-guesser-back-btn"
            onClick={() => router.navigate({ to: "/clubedascolecionadoras" as any })}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1>Adivinhe a Capa</h1>
          <span className="cover-guesser-badge">Missão diária</span>
        </header>

        {errorMsg && <div className="cover-guesser-error">{errorMsg}</div>}

        {blockedByGame && (
          <div className="cover-guesser-blocked">
            Você tem uma partida em andamento em outro jogo. Conclua-a primeiro.
          </div>
        )}

        <div className="mx-auto mt-4 w-full max-w-sm px-5">
          <details className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-left text-xs text-[#7f3152] dark:bg-[#260c20] dark:text-[#f7a8cb]">
            <summary className="cursor-pointer font-black">Como jogar</summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                Escolha o nível de dificuldade: <strong>Fácil</strong> (2 dicas, blur leve),{" "}
                <strong>Médio</strong> (1 dica, blur médio) ou <strong>Difícil</strong> (sem dicas,
                blur intenso).
              </li>
              <li>
                Veja a imagem da capa do livro borrada com os traços indicando a quantidade de
                letras de cada palavra.
              </li>
              <li>Use o botão "Dica" para revelar letras se precisar de ajuda.</li>
              <li>
                Digite o nome do livro no campo de texto e clique em <strong>Confirmar</strong> para
                acertar.
              </li>
              <li>
                <strong>Ciclo de Partidas:</strong> Cada nível jogado fica marcado como{" "}
                <em>"já usado"</em>. Para escolher o nível Fácil novamente, você precisará jogar
                também o Médio e o Difícil. Após concluir uma partida em cada um dos 3 níveis, todos
                os níveis voltam a ficar disponíveis!
              </li>
              <li>Cada jogo permite 1 resgate de recompensa por dia.</li>
              <li>
                Depois de iniciar, esta partida fica reservada até você vencer. Se não concluir até
                a virada do dia, ela expira e você poderá começar uma nova partida do zero.
              </li>
            </ul>
          </details>
        </div>

        <div className="cover-guesser-diff-grid">
          {(["easy", "medium", "hard"] as const).map((diff) => {
            const isUsed = usedDifficulties.includes(diff);
            const isAvail = availableDifficulties.includes(diff);
            const isDisabled = isUsed || !isAvail || !canPlay || starting;
            return (
              <button
                key={diff}
                id={`cover-guesser-diff-${diff}`}
                className={`cover-guesser-diff-btn${isUsed ? " used" : ""}${!isAvail && !isUsed ? " locked" : ""}`}
                disabled={isDisabled}
                onClick={() => {
                  setDifficulty(diff);
                  handleStart(diff);
                }}
              >
                {isUsed ? (
                  <>
                    <Trophy size={22} />
                    <span className="diff-name">{DIFFICULTY_LABELS[diff]}</span>
                    <span className="diff-sub">Concluído ✓</span>
                  </>
                ) : !isAvail ? (
                  <>
                    <Lock size={22} />
                    <span className="diff-name">{DIFFICULTY_LABELS[diff]}</span>
                    <span className="diff-sub">Complete os outros níveis</span>
                  </>
                ) : (
                  <>
                    <Search size={22} />
                    <span className="diff-name">{DIFFICULTY_LABELS[diff]}</span>
                    <span className="diff-sub">{HINTS_LABEL[diff]}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {starting && <div className="cover-guesser-loading-inline">Preparando a capa…</div>}
      </div>
    );
  }

  // ── Active game ─────────────────────────────────────────────────────────
  const wordMasks = session.wordMasks || [];
  const hintsLeft = session.hintsAllowed - session.hintsUsed;
  const hasHints = hintsLeft > 0;
  const blurStyle = BLUR_BY_DIFFICULTY[session.difficulty] || "blur(24px)";
  const isWon = session.status === "won";

  return (
    <div className="cover-guesser-wrap">
      <header className="cover-guesser-header">
        <button
          className="cover-guesser-back-btn"
          onClick={() => router.navigate({ to: "/clubedascolecionadoras" as any })}
        >
          <ArrowLeft size={16} /> Sair
        </button>
        <h1>Adivinhe a Capa</h1>
        <span className={`cover-guesser-diff-tag diff-${session.difficulty}`}>
          {DIFFICULTY_LABELS[session.difficulty]}
        </span>
      </header>

      {errorMsg && <div className="cover-guesser-error">{errorMsg}</div>}

      <div className="cover-guesser-game-area">
        {/* Cover image */}
        <div className="cover-guesser-img-wrap">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Capa do livro borrada"
              className="cover-guesser-img"
              style={{ filter: isWon ? "none" : blurStyle, transition: "filter 1.2s ease" }}
              draggable={false}
            />
          ) : (
            <div className="cover-guesser-img cover-guesser-img-placeholder">
              <BookOpen size={64} style={{ opacity: 0.3 }} />
            </div>
          )}
          {isWon && (
            <div className="cover-guesser-img-won-badge">
              <Trophy size={16} /> Acertou!
            </div>
          )}
        </div>

        {/* Word masks (hangman-style) */}
        <div className="cover-guesser-masks">
          {wordMasks.map((word: any[], wi: number) => (
            <span key={wi} className="cover-guesser-word">
              {word.map((cell: any, ci: number) => {
                if (!cell.isLetter) {
                  // Non-letter chars like – always visible
                  return (
                    <span key={ci} className="cover-guesser-nonletter">
                      {cell.char}
                    </span>
                  );
                }
                return (
                  <span
                    key={ci}
                    className={`cover-guesser-cell${cell.revealed ? " revealed" : ""}`}
                  >
                    {cell.revealed ? cell.char : <span className="cover-guesser-dash">_</span>}
                  </span>
                );
              })}
            </span>
          ))}
        </div>

        {/* Hint section */}
        {!isWon && (
          <div className="cover-guesser-hints-row">
            {hasHints ? (
              <button
                id="cover-guesser-hint-btn"
                className="cover-guesser-hint-btn"
                disabled={usingHint}
                onClick={handleHint}
              >
                <HelpCircle size={16} />
                {usingHint
                  ? "Revelando…"
                  : `Dica (${hintsLeft} restante${hintsLeft > 1 ? "s" : ""})`}
              </button>
            ) : session.hintsAllowed > 0 ? (
              <span className="cover-guesser-no-hints">Nenhuma dica restante</span>
            ) : (
              <span className="cover-guesser-no-hints">Sem dicas neste nível</span>
            )}
          </div>
        )}

        {/* Input area */}
        {!isWon && (
          <div className="cover-guesser-input-area">
            <input
              ref={inputRef}
              id="cover-guesser-input"
              type="text"
              className="cover-guesser-input"
              placeholder="Digite o nome do livro…"
              value={guessInput}
              onChange={(e) => {
                setGuessInput(e.target.value);
                setGuessError(null);
              }}
              onKeyDown={onKeyDown}
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              id="cover-guesser-submit-btn"
              className="cover-guesser-submit-btn"
              disabled={submitting || !guessInput.trim()}
              onClick={handleGuess}
            >
              {submitting ? "Verificando…" : "Confirmar"}
            </button>
          </div>
        )}

        {guessError && <div className="cover-guesser-guess-error">{guessError}</div>}

        {/* Win state */}
        {isWon && !claimResult && (
          <div className="cover-guesser-win-panel">
            <div className="cover-guesser-win-confetti">🎉</div>
            <h2>Você acertou!</h2>
            <p className="cover-guesser-win-subtitle">Resgate sua figurinha como recompensa!</p>
            <button
              id="cover-guesser-claim-btn"
              className="cover-guesser-claim-btn"
              disabled={claiming}
              onClick={handleClaim}
            >
              {claiming ? (
                <>
                  <div className="cover-guesser-spinner-sm" /> Resgatando…
                </>
              ) : (
                <>
                  <Gift size={18} /> Resgatar figurinha
                </>
              )}
            </button>
          </div>
        )}

        {/* After claim */}
        {claimResult && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900/50 dark:bg-[#0c2419]">
            <Trophy className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <h2 className="mt-2 text-base font-black text-emerald-800 dark:text-emerald-200">
              🏆 Missão concluída hoje!
            </h2>
            <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Volte amanhã para jogar novamente!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
