"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useUI } from "@/components/UIProvider";
import { normalizePath } from "@/lib/urls";
import { getBundledMemoryCoverUrl } from "@/lib/memoryCoverAssets";
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
  Gift,
} from "lucide-react";

interface PieceState extends PuzzlePieceDefinition {
  placed: boolean;
  x: number; // Current X in container
  y: number; // Current Y in container
  correctX: number; // Target X in container
  correctY: number; // Target Y in container
  z: number;
}

// Web Audio API helper for sound effects
function playTone(freq: number, delay: number, duration: number, ctx: AudioContext) {
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + delay + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime + delay);
    o.stop(ctx.currentTime + delay + duration + 0.02);
  } catch (e) {}
}

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (!ctxRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        ctxRef.current = new AudioCtx();
      } catch (e) {
        return null;
      }
    }
    return ctxRef.current;
  };
  const snap = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(680, 0, 0.16, ctx);
  }, []);
  const win = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    [523, 659, 784, 1046].forEach((f, i) => playTone(f, i * 0.11, 0.3, ctx));
  }, []);
  return { snap, win };
}

// Scatter algorithm to place unplaced pieces around the board frame
function generateScatter(
  count: number,
  containerW: number,
  containerH: number,
  boardLeft: number,
  boardTop: number,
  boardW: number,
  boardH: number,
  pieceW: number,
  pieceH: number,
) {
  const pad = 10;
  const bands = [
    { xMin: pad, xMax: containerW - pieceW - pad, yMin: pad, yMax: Math.max(pad, boardTop - pieceH - pad) },
    {
      xMin: pad,
      xMax: containerW - pieceW - pad,
      yMin: Math.min(containerH - pieceH - pad, boardTop + boardH + pad),
      yMax: containerH - pieceH - pad,
    },
    { xMin: pad, xMax: Math.max(pad, boardLeft - pieceW - pad), yMin: pad, yMax: containerH - pieceH - pad },
    {
      xMin: Math.min(containerW - pieceW - pad, boardLeft + boardW + pad),
      xMax: containerW - pieceW - pad,
      yMin: pad,
      yMax: containerH - pieceH - pad,
    },
  ].filter((b) => b.xMax > b.xMin && b.yMax > b.yMin);

  const placed: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let best = { x: pad, y: pad };
    if (bands.length > 0) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const band = bands[Math.floor(Math.random() * bands.length)];
        const x = band.xMin + Math.random() * (band.xMax - band.xMin);
        const y = band.yMin + Math.random() * (band.yMax - band.yMin);
        const overlaps = placed.some(
          (r) => Math.abs(r.x - x) < pieceW * 0.78 && Math.abs(r.y - y) < pieceH * 0.78,
        );
        best = { x, y };
        if (!overlaps) break;
      }
    } else {
      best = { x: Math.random() * (containerW - pieceW), y: Math.random() * (containerH - pieceH) };
    }
    placed.push(best);
  }
  return placed;
}

export default function PuzzleGameClient() {
  const ui = useUI();
  const router = useRouter();
  const audio = useAudio();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("easy");
  const [starting, setStarting] = useState(false);

  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [reward, setReward] = useState<any>(null);

  const dragRef = useRef<{
    id: number;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const zCounter = useRef(1);

  // Responsive scale factor
  const [viewportW, setViewportW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [viewportH, setViewportH] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

  const session = gameState?.session;
  const availableDifficulties: PuzzleDifficulty[] =
    gameState?.availableDifficulties || ["easy", "medium", "hard"];
  const usedDifficulties: PuzzleDifficulty[] = gameState?.usedDifficulties || [];

  const currentDiff = (session?.difficulty || difficulty) as PuzzleDifficulty;
  const gridConfig = PUZZLE_GRID_CONFIG[currentDiff] || PUZZLE_GRID_CONFIG.easy;

  // Board size (standard 2:3 book ratio)
  const boardW = 320;
  const boardH = 480;
  const scatterMarginX = 140;
  const scatterMarginY = 120;

  const containerW = boardW + scatterMarginX * 2;
  const containerH = boardH + scatterMarginY * 2;

  const boardLeft = scatterMarginX;
  const boardTop = scatterMarginY;

  const pieceW = boardW / gridConfig.cols;
  const pieceH = boardH / gridConfig.rows;

  const snapThreshold = Math.min(pieceW, pieceH) * 0.45;

  // Responsive fit scale
  useEffect(() => {
    const onResize = () => {
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fitScale = useMemo(() => {
    const availW = Math.min(viewportW - 32, 1000);
    const availH = viewportH - 220;
    const s = Math.min(1, availW / containerW, availH / containerH);
    return Math.max(0.38, Math.min(1, s));
  }, [viewportW, viewportH, containerW, containerH]);

  // Cover image URL
  const coverUrl = useMemo(() => {
    if (!session?.frontImagePath) return "";
    return getBundledMemoryCoverUrl(session.frontImagePath) || normalizePath(session.frontImagePath);
  }, [session?.frontImagePath]);

  // Load server state
  const loadState = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getPuzzleGameState();
      setGameState(res);
      if (res?.session?.difficulty) {
        setDifficulty(res.session.difficulty);
      } else if (res?.availableDifficulties?.length) {
        setDifficulty(res.availableDifficulties[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Não foi possível carregar o Quebra-Cabeça.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Force guide off for Medium and Hard
  useEffect(() => {
    if (session?.difficulty && session.difficulty !== "easy") {
      setShowGuide(false);
    } else if (session?.difficulty === "easy") {
      setShowGuide(true);
    }
  }, [session?.difficulty]);

  // Build / restore pieces
  useEffect(() => {
    if (!session || !coverUrl) {
      setPieces([]);
      return;
    }

    const seed = session.id
      .split("")
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

    const baseDefs = generateGridPieceDefinitions(
      gridConfig.rows,
      gridConfig.cols,
      pieceW,
      pieceH,
      seed,
    );

    const scatter = generateScatter(
      baseDefs.length,
      containerW,
      containerH,
      boardLeft,
      boardTop,
      boardW,
      boardH,
      pieceW,
      pieceH,
    );

    const savedBoardState: { id: number; isPlaced: boolean; x?: number; y?: number }[] =
      session.boardState || [];

    const restored: PieceState[] = baseDefs.map((def, idx) => {
      const saved = savedBoardState.find((s) => s.id === def.id);
      const correctX = boardLeft + def.col * pieceW;
      const correctY = boardTop + def.row * pieceH;
      const isPlaced = Boolean(saved?.isPlaced);

      return {
        ...def,
        placed: isPlaced,
        correctX,
        correctY,
        x: isPlaced ? correctX : saved?.x ?? scatter[idx].x,
        y: isPlaced ? correctY : saved?.y ?? scatter[idx].y,
        z: isPlaced ? 1 : idx + 2,
      };
    });

    zCounter.current = restored.length + 5;
    setPieces(restored);
  }, [session?.id, coverUrl]);

  // Check victory condition
  useEffect(() => {
    if (pieces.length > 0 && pieces.every((p) => p.placed) && session?.status === "in_progress") {
      audio.win();
      ui.triggerHearts();
    }
  }, [pieces, session?.status]);

  // Start match
  const handleStart = async () => {
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

  // Abandon match
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

  // Pointer drag logic
  const handlePointerDown = (e: React.PointerEvent, pieceId: number) => {
    const p = pieces.find((pp) => pp.id === pieceId);
    if (!p || p.placed || session?.status !== "in_progress") return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      id: pieceId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: p.x,
      origY: p.y,
      moved: false,
    };

    zCounter.current += 1;
    const z = zCounter.current;
    setPieces((prev) => prev.map((pp) => (pp.id === pieceId ? { ...pp, z } : pp)));
    setDraggingId(pieceId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    const dx = (e.clientX - d.startClientX) / fitScale;
    const dy = (e.clientY - d.startClientY) / fitScale;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;

    const nx = Math.min(containerW - pieceW, Math.max(0, d.origX + dx));
    const ny = Math.min(containerH - pieceH, Math.max(0, d.origY + dy));

    setPieces((prev) => prev.map((pp) => (pp.id === d.id ? { ...pp, x: nx, y: ny } : pp)));
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDraggingId(null);

    const p = pieces.find((pp) => pp.id === d.id);
    if (!p || !session) return;

    const dist = Math.hypot(p.x - p.correctX, p.y - p.correctY);
    const isSnapped = dist <= snapThreshold;

    const updatedPieces = pieces.map((pp) => {
      if (pp.id !== d.id) return pp;
      if (isSnapped) {
        audio.snap();
        return { ...pp, x: pp.correctX, y: pp.correctY, placed: true };
      }
      return pp;
    });

    setPieces(updatedPieces);

    // Save progress to server
    const newPlacedCount = updatedPieces.filter((pp) => pp.placed).length;
    try {
      const boardStateSave = updatedPieces.map((pp) => ({
        id: pp.id,
        isPlaced: pp.placed,
        x: pp.x,
        y: pp.y,
      }));

      const res = await savePuzzleProgress({
        data: {
          sessionId: session.id,
          placedPieces: newPlacedCount,
          boardState: boardStateSave,
        },
      });

      if (res.won) {
        audio.win();
        ui.triggerHearts();
        loadState();
      }
    } catch (err) {
      console.error("Erro ao salvar progresso:", err);
    }
  };

  // Claim reward with packet opening animation
  const handleClaimReward = async () => {
    if (!session) return;
    try {
      setClaiming(true);
      const res = await claimPuzzleGameReward({ data: { sessionId: session.id } });
      setReward(res);
      ui.triggerHearts();

      // Trigger standard sticker pack opening modal
      ui.showReveals(
        [
          {
            slug: `sticker-${res.number}`,
            number: res.number,
            wasNew: res.wasNew,
            isRare: res.isRare,
            repeat: !res.wasNew,
            reward: null,
          },
        ],
        res.isRare ? "Figurinha Rara Desbloqueada! ✦" : "Figurinha Desbloqueada!",
      );

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

  const placedCount = pieces.filter((p) => p.placed).length;
  const isWon = session?.status === "won" || (gridConfig && placedCount === gridConfig.totalPieces);
  const isClaimed = session?.status === "claimed" || gameState?.reward;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-3 pb-24 pt-5 sm:px-6">
      <button
        type="button"
        className="mb-4 flex items-center gap-1 text-xs font-bold text-[#9e1b4a] hover:underline"
        onClick={() => router.navigate({ to: "/clubedascolecionadoras" })}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <section className="rounded-3xl border border-pink-200/70 bg-white p-4 shadow-sm sm:p-6 dark:border-pink-900/30 dark:bg-[#1b0818]">
        {/* Main Title Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fce4ec] px-3 py-1 text-[10px] font-bold uppercase text-[#9e1b4a] dark:bg-[#381028] dark:text-[#f7a8cb]">
            <Sparkles className="h-3 w-3" /> Missão diária
          </span>
          <h1 className="mt-2 text-2xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
            Quebra-Cabeça Sáfico
          </h1>
          <p className="mt-1 text-xs text-[#a52b59] dark:text-[#f7a8cb]">
            Encaixe todas as peças para liberar a recompensa.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Claimed View */}
        {isClaimed && !session && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900/50 dark:bg-[#0c2419]">
            <Trophy className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <h2 className="mt-2 text-base font-black text-emerald-800 dark:text-emerald-200">
              Missão concluída hoje!
            </h2>
            <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Sua recompensa de hoje já foi resgatada. Volte amanhã para jogar novamente!
            </p>
          </div>
        )}

        {/* Cannot Play Notice */}
        {!session && !isClaimed && gameState?.canPlay === false && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-pink-200 bg-pink-50 p-5 text-center text-xs font-semibold text-[#8e1745] dark:border-pink-900/40 dark:bg-[#260c20] dark:text-[#f7a8cb]">
            Você já tem uma partida em andamento em outro jogo. Conclua a partida atual antes de iniciar.
          </div>
        )}

        {/* Difficulty Selection Screen */}
        {!session && !isClaimed && gameState?.canPlay !== false && (
          <div className="mx-auto mt-6 max-w-sm">
            {/* Rules Details Box */}
            <details className="mb-5 rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-left text-xs text-[#7f3152] dark:border-pink-900/40 dark:bg-[#260c20] dark:text-[#f7a8cb]">
              <summary className="cursor-pointer font-black">Como jogar</summary>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                <li>Antes de começar, escolha um nível: Fácil, Médio ou Difícil.</li>
                <li>
                  Para encontrar e encaixar as peças, arraste cada uma para sua posição correta no
                  tabuleiro de montagem.
                </li>
                <li>
                  Ao concluir a montagem de todas as peças da partida, você libera a recompensa diária.
                </li>
                <li>
                  Não conseguiu terminar no mesmo dia? Sem problema! Seu progresso fica salvo e você pode
                  continuar depois, exatamente de onde parou.
                </li>
                <li>Você só pode receber 1 recompensa por dia.</li>
                <li>
                  Depois de concluir um nível de dificuldade (Fácil, Médio ou Difícil), ele ficará
                  bloqueado até que você finalize os outros dois níveis. Quando completar os três níveis
                  de dificuldade, todos serão liberados novamente para jogar.
                </li>
              </ul>
            </details>

            {/* Difficulty Cards */}
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-[#6e1638] dark:text-[#ffd1e5]">
                Escolha a dificuldade
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map((level) => {
                  const cfg = PUZZLE_GRID_CONFIG[level];
                  const isAvailable = availableDifficulties.includes(level);
                  const isUsed = usedDifficulties.includes(level);
                  const isSelected = difficulty === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setDifficulty(level)}
                      className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:border-gray-800 dark:disabled:bg-gray-900 ${
                        isSelected
                          ? "border-[#9e1b4a] bg-[#fce4ec] text-[#6e1638] dark:border-pink-500 dark:bg-[#381028] dark:text-[#ffd1e5]"
                          : "border-pink-100 text-[#a52b59] hover:bg-pink-50 dark:border-pink-900/40 dark:text-[#f7a8cb]"
                      }`}
                    >
                      <span>{cfg.label}</span>
                      <small className="mt-1 block text-[9px] font-semibold opacity-80">
                        {cfg.rows}×{cfg.cols} ({cfg.totalPieces}p)
                      </small>
                      {isUsed && (
                        <span className="mt-1 block text-[7px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                          já usado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="button"
              disabled={starting || !availableDifficulties.includes(difficulty)}
              onClick={handleStart}
              className="mt-5 w-full rounded-full bg-[#9e1b4a] py-3 text-sm font-black text-white shadow-md transition-transform hover:scale-102 disabled:opacity-50"
            >
              {starting ? "Iniciando..." : "Começar partida"}
            </button>
          </div>
        )}

        {/* Active Game View */}
        {session && !isClaimed && (
          <div className="mt-6 flex flex-col items-center">
            {/* Top Toolbar */}
            <div className="mb-4 flex w-full max-w-xl items-center justify-between gap-3 border-b border-pink-100 pb-3 dark:border-pink-900/40">
              <div>
                <span className="text-xs font-black text-[#6e1638] dark:text-[#ffd1e5]">
                  Nível {gridConfig.label} · {placedCount} de {gridConfig.totalPieces} peças
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Guide image toggle ONLY on Easy level */}
                {session.difficulty === "easy" && (
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-[#9e1b4a] hover:bg-pink-100 dark:border-pink-900 dark:bg-[#2c0d22] dark:text-[#f7a8cb]"
                  >
                    {showGuide ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showGuide ? "Ocultar Guia" : "Mostrar Guia"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAbandon}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-pink-900 dark:bg-[#260c20] dark:text-gray-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
                </button>
              </div>
            </div>

            {/* SVG ClipPaths definitions for male/female jigsaw pieces */}
            <svg className="absolute h-0 w-0 pointer-events-none" aria-hidden="true">
              <defs>
                {pieces.map((p) => (
                  <clipPath id={`puzzle-clip-${p.id}`} clipPathUnits="userSpaceOnUse" key={p.id}>
                    <path d={p.svgPath} />
                  </clipPath>
                ))}
              </defs>
            </svg>

            {/* Workbench Container */}
            <div
              style={{
                width: containerW * fitScale,
                height: containerH * fitScale,
              }}
              className="relative overflow-hidden rounded-3xl border border-pink-200/80 bg-gradient-to-br from-[#2b1022] via-[#240b1e] to-[#1c0717] shadow-xl touch-none"
            >
              <div
                style={{
                  width: containerW,
                  height: containerH,
                  transform: `scale(${fitScale})`,
                  transformOrigin: "0 0",
                }}
                className="relative select-none"
              >
                {/* Board Frame */}
                <div
                  style={{
                    left: boardLeft - 12,
                    top: boardTop - 12,
                    width: boardW + 24,
                    height: boardH + 24,
                  }}
                  className="absolute z-0 rounded-2xl border-2 border-[#c2185b]/40 bg-[#190615] shadow-inner"
                />

                {/* Ghost Background Image (ONLY if Easy level & showGuide === true) */}
                {showGuide && session.difficulty === "easy" && coverUrl && (
                  <div
                    style={{
                      left: boardLeft,
                      top: boardTop,
                      width: boardW,
                      height: boardH,
                      backgroundImage: `url(${coverUrl})`,
                      backgroundSize: "cover",
                    }}
                    className="absolute z-0 rounded-lg opacity-25 pointer-events-none"
                  />
                )}

                {/* Dashed Grid Slots (No cell highlight hints!) */}
                {Array.from({ length: gridConfig.totalPieces }).map((_, idx) => {
                  const r = Math.floor(idx / gridConfig.cols);
                  const c = idx % gridConfig.cols;
                  return (
                    <div
                      key={idx}
                      style={{
                        left: boardLeft + c * pieceW,
                        top: boardTop + r * pieceH,
                        width: pieceW,
                        height: pieceH,
                      }}
                      className="absolute z-0 border border-white/10 rounded-sm pointer-events-none"
                    />
                  );
                })}

                {/* Pieces */}
                {pieces.map((p) => {
                  const shiftX = p.x - p.correctX;
                  const shiftY = p.y - p.correctY;

                  return (
                    <div
                      key={p.id}
                      onPointerDown={(e) => handlePointerDown(e, p.id)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      style={{
                        left: p.correctX,
                        top: p.correctY,
                        width: boardW,
                        height: boardH,
                        transform: `translate(${shiftX}px, ${shiftY}px)`,
                        clipPath: `url(#puzzle-clip-${p.id})`,
                        zIndex: p.placed ? 1 : p.z,
                        cursor: p.placed ? "default" : draggingId === p.id ? "grabbing" : "grab",
                      }}
                      className={`absolute touch-none select-none transition-shadow ${
                        p.placed
                          ? "drop-shadow-sm"
                          : draggingId === p.id
                            ? "drop-shadow-2xl scale-102"
                            : "drop-shadow-md hover:brightness-105"
                      }`}
                    >
                      <img
                        src={coverUrl}
                        alt={`Peça ${p.id}`}
                        draggable={false}
                        className="h-full w-full object-fill select-none pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Victory / Claim Reward Card */}
            {isWon && (
              <div className="mt-6 flex flex-col items-center rounded-3xl border border-pink-200 bg-white p-6 text-center shadow-xl dark:border-pink-900 dark:bg-[#1b0818]">
                <Trophy className="h-10 w-10 animate-bounce text-amber-500" />
                <h3 className="mt-2 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
                  Montagem Completa!
                </h3>
                <p className="mt-1 text-xs text-[#a52b59] dark:text-[#f7a8cb]">
                  Você encaixou todas as {gridConfig.totalPieces} peças perfeitamente. Clique abaixo para
                  resgatar sua figurinha diária!
                </p>
                <button
                  type="button"
                  disabled={claiming}
                  onClick={handleClaimReward}
                  className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-8 py-3 text-xs font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Gift className="h-4 w-4" />
                  {claiming ? "Resgatando..." : "Resgatar figurinha"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
