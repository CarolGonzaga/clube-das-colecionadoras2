import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useUI } from "@/components/UIProvider";
import { normalizePath } from "@/lib/urls";
import {
  generateGridPieceDefinitions,
  PUZZLE_GRID_CONFIG,
  type PuzzleDifficulty,
  type PuzzlePieceDefinition,
} from "@/lib/puzzleGenerator";
import {
  abandonPuzzleGame,
  claimPuzzleGameReward,
  getPuzzleGameState,
  savePuzzleProgress,
  startPuzzleGame,
} from "@/lib/games";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  Puzzle,
} from "lucide-react";

interface PieceState extends PuzzlePieceDefinition {
  isPlaced: boolean;
  currentX: number; // Position in board/container relative to top-left of board
  currentY: number;
  isDragging: boolean;
}

export default function PuzzleGameClient() {
  const ui = useUI();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PuzzleDifficulty>("easy");
  const [starting, setStarting] = useState(false);

  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [showGhost, setShowGhost] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [reward, setReward] = useState<any>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const activeDragId = useRef<number | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Board dimensions
  const BOARD_WIDTH = 320;
  const BOARD_HEIGHT = 480;

  const session = gameState?.session;
  const gridConfig = session ? PUZZLE_GRID_CONFIG[session.difficulty as PuzzleDifficulty] : null;

  const pieceWidth = gridConfig ? BOARD_WIDTH / gridConfig.cols : 0;
  const pieceHeight = gridConfig ? BOARD_HEIGHT / gridConfig.rows : 0;

  // Load game state on mount
  const loadState = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getPuzzleGameState();
      setGameState(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Não foi possível carregar o Quebra-Cabeça.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Initialize or restore puzzle pieces when session changes
  useEffect(() => {
    if (!session || !gridConfig) {
      setPieces([]);
      return;
    }

    const baseDefs = generateGridPieceDefinitions(
      gridConfig.rows,
      gridConfig.cols,
      pieceWidth,
      pieceHeight,
      // Use session ID char codes as random seed
      session.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0),
    );

    const savedBoardState: { id: number; isPlaced: boolean; x?: number; y?: number }[] =
      session.boardState || [];

    const restored: PieceState[] = baseDefs.map((def) => {
      const saved = savedBoardState.find((s) => s.id === def.id);
      const correctX = def.col * pieceWidth;
      const correctY = def.row * pieceHeight;

      if (saved?.isPlaced) {
        return {
          ...def,
          isPlaced: true,
          currentX: correctX,
          currentY: correctY,
          isDragging: false,
        };
      }

      // Initial random position in tray if not placed
      const randomX = Math.floor(Math.random() * (BOARD_WIDTH - pieceWidth));
      const randomY = Math.floor(Math.random() * 120);

      return {
        ...def,
        isPlaced: false,
        currentX: saved?.x ?? randomX,
        currentY: saved?.y ?? randomY,
        isDragging: false,
      };
    });

    setPieces(restored);
  }, [session?.id]);

  // Start new game
  const handleStart = async (difficulty: PuzzleDifficulty) => {
    try {
      setStarting(true);
      setErrorMsg(null);
      await startPuzzleGame({ data: { difficulty } });
      await loadState();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao iniciar partida.");
    } finally {
      setStarting(false);
    }
  };

  // Abandon game
  const handleAbandon = async () => {
    if (!session) return;
    try {
      setLoading(true);
      await abandonPuzzleGame({ data: { sessionId: session.id } });
      await loadState();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao reiniciar.");
    } finally {
      setLoading(false);
    }
  };

  // Dragging logic (Pointer events)
  const handlePointerDown = (pieceId: number, e: React.PointerEvent) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece || piece.isPlaced || session?.status === "won" || session?.status === "claimed")
      return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activeDragId.current = pieceId;

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    dragOffset.current = {
      x: e.clientX - boardRect.left - piece.currentX,
      y: e.clientY - boardRect.top - piece.currentY,
    };

    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, isDragging: true } : p)),
    );
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeDragId.current === null || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const rawX = e.clientX - boardRect.left - dragOffset.current.x;
    const rawY = e.clientY - boardRect.top - dragOffset.current.y;

    setPieces((prev) =>
      prev.map((p) => (p.id === activeDragId.current ? { ...p, currentX: rawX, currentY: rawY } : p)),
    );
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (activeDragId.current === null) return;
    const pieceId = activeDragId.current;
    activeDragId.current = null;

    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece || !gridConfig) return;

    const correctX = piece.col * pieceWidth;
    const correctY = piece.row * pieceHeight;

    // Check snap distance threshold (32px)
    const distance = Math.hypot(piece.currentX - correctX, piece.currentY - correctY);
    const isSnapped = distance <= 32;

    const updatedPieces = pieces.map((p) => {
      if (p.id === pieceId) {
        return {
          ...p,
          isDragging: false,
          isPlaced: isSnapped,
          currentX: isSnapped ? correctX : p.currentX,
          currentY: isSnapped ? correctY : p.currentY,
        };
      }
      return p;
    });

    setPieces(updatedPieces);

    const newPlacedCount = updatedPieces.filter((p) => p.isPlaced).length;

    // Save progress to server
    if (session) {
      try {
        const boardStateSave = updatedPieces.map((p) => ({
          id: p.id,
          isPlaced: p.isPlaced,
          x: p.currentX,
          y: p.currentY,
        }));
        const res = await savePuzzleProgress({
          data: {
            sessionId: session.id,
            placedPieces: newPlacedCount,
            boardState: boardStateSave,
          },
        });
        if (res.won) {
          ui.triggerHearts();
          loadState();
        }
      } catch (err) {
        console.error("Erro ao salvar progresso:", err);
      }
    }
  };

  // Claim reward
  const handleClaimReward = async () => {
    if (!session) return;
    try {
      setClaiming(true);
      const res = await claimPuzzleGameReward({ data: { sessionId: session.id } });
      setReward(res);
      ui.triggerHearts();
      await loadState();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao resgatar recompensa.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-[#9e1b4a]">
        <Puzzle className="h-10 w-10 animate-bounce text-[#c2185b]" />
        <p className="mt-3 text-sm font-bold">Carregando Quebra-Cabeça...</p>
      </div>
    );
  }

  const coverUrl = session ? normalizePath(session.frontImagePath) : "";
  const placedCount = pieces.filter((p) => p.isPlaced).length;
  const isWon = session?.status === "won" || (gridConfig && placedCount === gridConfig.totalPieces);
  const isClaimed = session?.status === "claimed" || gameState?.reward;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/clubedascolecionadoras"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#9e1b4a] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Link>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-[11px] font-black uppercase text-[#9e1b4a] dark:bg-[#381028] dark:text-[#f7a8cb]">
          Missão Diária
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-3xl border border-pink-100 bg-white p-6 shadow-sm dark:border-pink-900/30 dark:bg-[#1b0818] sm:flex-row">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
            <Puzzle className="h-7 w-7 text-[#c2185b]" /> Quebra-Cabeça Sáfico
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#8c3558] dark:text-[#f7a8cb]">
            Encaixe todas as peças para liberar a recompensa.
          </p>
        </div>

        {session && !isClaimed && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGhost(!showGhost)}
              className="flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3.5 py-1.5 text-xs font-bold text-[#9e1b4a] hover:bg-pink-100 dark:border-pink-900 dark:bg-[#2c0d22] dark:text-[#f7a8cb]"
            >
              {showGhost ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showGhost ? "Ocultar Guia" : "Mostrar Guia"}
            </button>
            <button
              type="button"
              onClick={handleAbandon}
              className="flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-pink-900 dark:bg-[#260c20] dark:text-gray-300"
            >
              <RotateCcw className="h-4 w-4" /> Reiniciar
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Select Difficulty Screen if no active session */}
      {!session && !isClaimed && (
        <div className="mt-8 rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm dark:border-pink-900/30 dark:bg-[#1b0818]">
          <h2 className="text-lg font-black text-[#6e1638] dark:text-[#ffd1e5]">
            Escolha o nível de dificuldade
          </h2>
          <p className="mt-1 text-xs text-[#a52b59] dark:text-[#f7a8cb]">
            1 recompensa por dia. Conclua os 3 níveis para liberar a rotação novamente.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["easy", "medium", "hard"] as PuzzleDifficulty[]).map((diff) => {
              const cfg = PUZZLE_GRID_CONFIG[diff];
              const isAvailable = gameState?.availableDifficulties?.includes(diff);
              return (
                <button
                  key={diff}
                  type="button"
                  disabled={!isAvailable || starting}
                  onClick={() => handleStart(diff)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-5 transition-all ${
                    isAvailable
                      ? "border-pink-200 bg-gradient-to-b from-pink-50/50 to-white hover:border-[#c2185b] hover:shadow-md dark:border-pink-900 dark:from-[#260c20] dark:to-[#1c0819]"
                      : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900"
                  }`}
                >
                  <span className="text-sm font-black text-[#6e1638] dark:text-[#ffd1e5]">
                    {cfg.label}
                  </span>
                  <span className="mt-1 text-xs font-bold text-[#c2185b]">
                    {cfg.rows} x {cfg.cols} ({cfg.totalPieces} peças)
                  </span>
                  {!isAvailable && (
                    <span className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500">
                      <Lock className="h-3 w-3" /> Bloqueado hoje
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Claimed / Already rewarded view */}
      {isClaimed && (
        <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-sm dark:border-emerald-900/40 dark:bg-[#0c2419]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-black text-emerald-900 dark:text-emerald-100">
            Missão concluída hoje!
          </h2>
          <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Você já resgatou sua recompensa de hoje. Volte amanhã para jogar a próxima partida!
          </p>

          {gameState?.reward && (
            <div className="mt-6 inline-flex flex-col items-center rounded-2xl border border-emerald-200 bg-white p-4 shadow-md dark:bg-[#183427]">
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-300">
                Figurinha #{gameState.reward.sticker_number}
              </span>
              {gameState.reward.is_rare && (
                <span className="mt-1 flex items-center gap-1 text-[10px] font-black text-amber-500">
                  <Sparkles className="h-3 w-3" /> RARA!
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Puzzle Board Area */}
      {session && !isClaimed && gridConfig && (
        <div className="mt-6 flex flex-col items-center">
          {/* Progress Indicator */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-black text-[#6e1638] dark:text-[#ffd1e5]">
              Progresso: {placedCount} de {gridConfig.totalPieces} peças encaixadas
            </span>
            <div className="h-2 w-36 overflow-hidden rounded-full bg-pink-100 dark:bg-[#381028]">
              <div
                className="h-full bg-gradient-to-r from-[#c2185b] to-[#df347c] transition-all duration-300"
                style={{ width: `${(placedCount / gridConfig.totalPieces) * 100}%` }}
              />
            </div>
          </div>

          {/* SVG Clip Definitions */}
          <svg className="absolute h-0 w-0 pointer-events-none" aria-hidden="true">
            <defs>
              {pieces.map((p) => (
                <clipPath id={`puzzle-clip-${p.id}`} clipPathUnits="userSpaceOnUse" key={p.id}>
                  <path d={p.svgPath} />
                </clipPath>
              ))}
            </defs>
          </svg>

          {/* Jigsaw Board */}
          <div
            ref={boardRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative select-none rounded-2xl border-4 border-[#9e1b4a]/20 bg-[#3f0b27]/90 shadow-2xl touch-none"
            style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
          >
            {/* Ghost background image */}
            {showGhost && (
              <img
                src={coverUrl}
                alt="Guia"
                className="absolute inset-0 h-full w-full object-fill opacity-25 pointer-events-none"
              />
            )}

            {/* Grid overlay lines */}
            <div className="absolute inset-0 grid h-full w-full pointer-events-none"
                 style={{
                   gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
                   gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`
                 }}>
              {Array.from({ length: gridConfig.totalPieces }).map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>

            {/* Render Pieces */}
            {pieces.map((p) => {
              const correctX = p.col * pieceWidth;
              const correctY = p.row * pieceHeight;

              return (
                <div
                  key={p.id}
                  onPointerDown={(e) => handlePointerDown(p.id, e)}
                  className={`absolute transition-shadow ${
                    p.isPlaced
                      ? "z-10 cursor-default"
                      : p.isDragging
                        ? "z-50 cursor-grabbing scale-105 shadow-2xl"
                        : "z-30 cursor-grab hover:scale-102"
                  }`}
                  style={{
                    left: `${p.currentX}px`,
                    top: `${p.currentY}px`,
                    width: `${pieceWidth}px`,
                    height: `${pieceHeight}px`,
                    clipPath: `url(#puzzle-clip-${p.id})`,
                  }}
                >
                  <img
                    src={coverUrl}
                    alt={`Peça ${p.id}`}
                    draggable={false}
                    className="absolute h-full w-full max-w-none object-fill select-none pointer-events-none"
                    style={{
                      width: `${BOARD_WIDTH}px`,
                      height: `${BOARD_HEIGHT}px`,
                      left: `-${correctX}px`,
                      top: `-${correctY}px`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Victory & Claim Modal Button */}
          {isWon && (
            <div className="mt-6 flex flex-col items-center rounded-3xl border border-pink-200 bg-white p-6 shadow-xl dark:border-pink-900 dark:bg-[#1b0818]">
              <Trophy className="h-10 w-10 animate-bounce text-amber-500" />
              <h3 className="mt-2 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
                Quebra-Cabeça Completo!
              </h3>
              <p className="mt-1 text-xs text-[#a52b59] dark:text-[#f7a8cb]">
                Você encaixou todas as peças perfeitamente. Clique abaixo para resgatar sua figurinha diária!
              </p>
              <button
                type="button"
                disabled={claiming}
                onClick={handleClaimReward}
                className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-8 py-3 text-xs font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {claiming ? "Resgatando..." : "Resgatar Recompensa"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reward Popup Modal */}
      {reward && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#3f0b27]/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-2xl dark:bg-[#1c0819]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg">
              <Trophy className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
              Parabéns! Recompensa Resgatada!
            </h3>

            <div className="mt-4 flex flex-col items-center rounded-2xl border border-pink-100 bg-pink-50/50 p-4 dark:border-pink-900/40 dark:bg-[#2b0c21]">
              <span className="text-2xl font-black text-[#c2185b]">
                Figurinha #{reward.number}
              </span>
              <span className="mt-1 text-xs font-bold text-[#8c3558] dark:text-[#f7a8cb]">
                {reward.wasNew ? "✨ Figurinha Inédita!" : "🔄 Repetida (Adicionada ao estoque)"}
              </span>
              {reward.isRare && (
                <span className="mt-2 flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" /> RECOMPENSA RARA!
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setReward(null);
                loadState();
              }}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] py-3 text-xs font-black text-white shadow-md hover:scale-102"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
