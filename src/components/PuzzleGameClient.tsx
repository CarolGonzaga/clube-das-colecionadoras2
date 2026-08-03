"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { useUI } from "@/components/UIProvider";
import { normalizePath } from "@/lib/urls";
import { getBundledMemoryCoverUrl } from "@/lib/memoryCoverAssets";
import {
  generateGridPieceDefinitions,
  PUZZLE_GRID_CONFIG,
  type PuzzleDifficulty,
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
  Lock,
  Puzzle,
  Gift,
  RotateCw,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function playTone(freq: number, delay: number, dur: number, ctx: AudioContext) {
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + delay + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime + delay);
    o.stop(ctx.currentTime + delay + dur + 0.02);
  } catch {}
}

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (!ctxRef.current) {
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        ctxRef.current = new AC();
      } catch { return null; }
    }
    return ctxRef.current;
  };
  const snap = useCallback(() => {
    const ctx = getCtx();
    if (ctx) playTone(680, 0, 0.16, ctx);
  }, []);
  const win = useCallback(() => {
    const ctx = getCtx();
    if (ctx) [523, 659, 784, 1046].forEach((f, i) => playTone(f, i * 0.11, 0.3, ctx));
  }, []);
  return { snap, win };
}

/** Scatter pieces around the board in 4 bands (top, bottom, left, right) */
function generateScatter(
  count: number,
  containerW: number, containerH: number,
  boardLeft: number, boardTop: number,
  boardW: number, boardH: number,
  cellW: number, cellH: number,
) {
  const pad = 8;
  const bands = [
    { xMin: pad, xMax: containerW - cellW - pad, yMin: pad, yMax: Math.max(pad, boardTop - cellH - pad) },
    { xMin: pad, xMax: containerW - cellW - pad, yMin: Math.min(containerH - cellH - pad, boardTop + boardH + pad), yMax: containerH - cellH - pad },
    { xMin: pad, xMax: Math.max(pad, boardLeft - cellW - pad), yMin: pad, yMax: containerH - cellH - pad },
    { xMin: Math.min(containerW - cellW - pad, boardLeft + boardW + pad), xMax: containerW - cellW - pad, yMin: pad, yMax: containerH - cellH - pad },
  ].filter(b => b.xMax > b.xMin && b.yMax > b.yMin);

  const placed: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let best = { x: pad, y: pad };
    for (let attempt = 0; attempt < 60; attempt++) {
      const band = bands.length > 0 ? bands[Math.floor(Math.random() * bands.length)] : { xMin: pad, xMax: containerW - cellW, yMin: pad, yMax: containerH - cellH };
      const x = band.xMin + Math.random() * (band.xMax - band.xMin);
      const y = band.yMin + Math.random() * (band.yMax - band.yMin);
      const overlaps = placed.some(r => Math.abs(r.x - x) < cellW * 0.75 && Math.abs(r.y - y) < cellH * 0.75);
      best = { x, y };
      if (!overlaps) break;
    }
    placed.push(best);
  }
  return placed;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface PieceState {
  id: number;
  row: number;
  col: number;
  svgPath: string;
  x: number;            // current position in container space
  y: number;
  correctX: number;     // snap target (board-relative position in container)
  correctY: number;
  rotation: number;     // 0 | 90 | 180 | 270
  placed: boolean;
  z: number;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function PuzzleGameClient() {
  const ui = useUI();
  const router = useRouter();
  const audio = useAudio();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("easy");
  const [starting, setStarting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // viewport dimensions for responsive scale
  const [viewportW, setViewportW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [viewportH, setViewportH] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

  const dragRef = useRef<{
    id: number; startCX: number; startCY: number; origX: number; origY: number; moved: boolean;
  } | null>(null);
  const scaleRef = useRef(1);
  const zCounter = useRef(1);

  // ── derived from session ────────────────────────────────────────────────
  const session = gameState?.session;
  const availableDifficulties: PuzzleDifficulty[] = gameState?.availableDifficulties || ["easy", "medium", "hard"];
  const usedDifficulties: PuzzleDifficulty[] = gameState?.usedDifficulties || [];

  const currentDiff = (session?.difficulty || difficulty) as PuzzleDifficulty;
  const gridConfig = PUZZLE_GRID_CONFIG[currentDiff];

  // Board dimensions: 3:4 portrait (book cover ratio)
  const BOARD_W = gridConfig.cols * 80;
  const BOARD_H = gridConfig.rows * 80;
  const MARGIN_X = 220;
  const MARGIN_Y = 160;

  const CONTAINER_W = BOARD_W + MARGIN_X * 2;
  const CONTAINER_H = BOARD_H + MARGIN_Y * 2;
  const BOARD_LEFT = MARGIN_X;
  const BOARD_TOP = MARGIN_Y;

  const PIECE_W = BOARD_W / gridConfig.cols;
  const PIECE_H = BOARD_H / gridConfig.rows;
  const SNAP_THRESHOLD = Math.min(PIECE_W, PIECE_H) * 0.40;

  // ── responsive fit scale ────────────────────────────────────────────────
  const fitScale = useMemo(() => {
    const maxW = Math.min(viewportW - 32, 1100);
    const maxH = viewportH - 220;
    return clamp(Math.min(maxW / CONTAINER_W, maxH / CONTAINER_H), 0.30, 1);
  }, [viewportW, viewportH, CONTAINER_W, CONTAINER_H]);

  useEffect(() => {
    const onResize = () => { setViewportW(window.innerWidth); setViewportH(window.innerHeight); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── cover image URL ─────────────────────────────────────────────────────
  const coverUrl = useMemo(() => {
    if (!session?.frontImagePath) return "";
    return getBundledMemoryCoverUrl(session.frontImagePath) || normalizePath(session.frontImagePath);
  }, [session?.frontImagePath]);

  // ── load state ──────────────────────────────────────────────────────────
  const loadState = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getPuzzleGameState();
      setGameState(res);
      if (res?.session?.difficulty) setDifficulty(res.session.difficulty);
      else if (res?.availableDifficulties?.length) setDifficulty(res.availableDifficulties[0] as PuzzleDifficulty);
    } catch (err: any) {
      setErrorMsg(err.message || "Não foi possível carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadState(); }, []);

  // Hide guide on medium/hard
  useEffect(() => {
    if (session?.difficulty && session.difficulty !== "easy") setShowGuide(false);
    else if (session?.difficulty === "easy") setShowGuide(true);
  }, [session?.difficulty]);

  // ── initialise pieces ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !coverUrl) { setPieces([]); return; }

    const seed = session.id.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const defs = generateGridPieceDefinitions(gridConfig.rows, gridConfig.cols, PIECE_W, PIECE_H, seed);
    const scatter = generateScatter(defs.length, CONTAINER_W, CONTAINER_H, BOARD_LEFT, BOARD_TOP, BOARD_W, BOARD_H, PIECE_W, PIECE_H);
    const savedBoard: { id: number; isPlaced: boolean; x?: number; y?: number; rotation?: number }[] = session.boardState || [];

    const ROTATIONS = [0, 90, 180, 270];
    let rngState = seed + 1;
    const rng = () => { rngState = (rngState * 9301 + 49297) % 233280; return rngState / 233280; };

    const ps: PieceState[] = defs.map((def, idx) => {
      const saved = savedBoard.find(s => s.id === def.id);
      const correctX = BOARD_LEFT + def.col * PIECE_W;
      const correctY = BOARD_TOP + def.row * PIECE_H;
      const isPlaced = Boolean(saved?.isPlaced);

      // Assign deterministic random rotation for unplaced pieces
      const rotation = isPlaced ? 0 : saved?.rotation ?? ROTATIONS[Math.floor(rng() * 4)];

      return {
        id: def.id,
        row: def.row,
        col: def.col,
        svgPath: def.svgPath,
        placed: isPlaced,
        correctX,
        correctY,
        x: isPlaced ? correctX : (saved?.x ?? scatter[idx].x),
        y: isPlaced ? correctY : (saved?.y ?? scatter[idx].y),
        rotation,
        z: isPlaced ? 1 : idx + 2,
      };
    });

    zCounter.current = ps.length + 5;
    setPieces(ps);
  }, [session?.id, coverUrl]);

  // ── win check ───────────────────────────────────────────────────────────
  const placedCount = pieces.filter(p => p.placed).length;
  const isWon = session?.status === "won" || (pieces.length > 0 && placedCount === gridConfig.totalPieces);
  const isClaimed = session?.status === "claimed" || Boolean(gameState?.reward);

  useEffect(() => {
    if (pieces.length > 0 && pieces.every(p => p.placed) && session?.status === "in_progress") {
      audio.win();
      ui.triggerHearts();
    }
  }, [pieces]);

  // ── start / abandon ─────────────────────────────────────────────────────
  const handleStart = async () => {
    try {
      setStarting(true);
      setErrorMsg(null);
      await startPuzzleGame({ data: { difficulty } });
      await loadState();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao iniciar.");
    } finally {
      setStarting(false);
    }
  };

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

  // ── save progress ───────────────────────────────────────────────────────
  const saveProgress = useCallback(async (updatedPieces: PieceState[]) => {
    if (!session) return null;
    const newPlaced = updatedPieces.filter(p => p.placed).length;
    try {
      return await savePuzzleProgress({
        data: {
          sessionId: session.id,
          placedPieces: newPlaced,
          boardState: updatedPieces.map(p => ({
            id: p.id, isPlaced: p.placed, x: p.x, y: p.y, rotation: p.rotation,
          })),
        },
      });
    } catch (err) {
      console.error("saveProgress error:", err);
      return null;
    }
  }, [session]);

  // ── pointer drag ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent, id: number) => {
    const p = pieces.find(pp => pp.id === id);
    if (!p || p.placed || session?.status !== "in_progress") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id, startCX: e.clientX, startCY: e.clientY, origX: p.x, origY: p.y, moved: false };
    zCounter.current += 1;
    const z = zCounter.current;
    setPieces(prev => prev.map(pp => pp.id === id ? { ...pp, z } : pp));
    setDraggingId(id);
  }, [pieces, session]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startCX) / scaleRef.current;
    const dy = (e.clientY - d.startCY) / scaleRef.current;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    const nx = clamp(d.origX + dx, -PIECE_W * 0.5, CONTAINER_W - PIECE_W * 0.5);
    const ny = clamp(d.origY + dy, -PIECE_H * 0.5, CONTAINER_H - PIECE_H * 0.5);
    setPieces(prev => prev.map(pp => pp.id === d.id ? { ...pp, x: nx, y: ny } : pp));
  }, [CONTAINER_W, CONTAINER_H, PIECE_W, PIECE_H]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDraggingId(null);

    // Tap without drag = rotate 90°
    if (!d.moved) {
      setPieces(prev => {
        const updated = prev.map(pp =>
          pp.id === d.id ? { ...pp, rotation: (pp.rotation + 90) % 360 } : pp
        );
        saveProgress(updated);
        return updated;
      });
      return;
    }

    // Try to snap to grid
    setPieces(prev => {
      const piece = prev.find(pp => pp.id === d.id);
      if (!piece) return prev;

      const dist = Math.hypot(piece.x - piece.correctX, piece.y - piece.correctY);
      const snapped = dist < SNAP_THRESHOLD && piece.rotation % 360 === 0;

      const updated = prev.map(pp => {
        if (pp.id !== d.id) return pp;
        if (snapped) {
          audio.snap();
          return { ...pp, x: pp.correctX, y: pp.correctY, placed: true };
        }
        return pp;
      });

      // Async save
      saveProgress(updated).then(res => {
        if (res?.won) { audio.win(); ui.triggerHearts(); loadState(); }
      });

      return updated;
    });
  }, [SNAP_THRESHOLD, audio, saveProgress, loadState]);

  // Keep scaleRef in sync
  useEffect(() => { scaleRef.current = fitScale; }, [fitScale]);

  // ── claim reward ────────────────────────────────────────────────────────
  const handleClaimReward = async () => {
    if (!session) return;
    try {
      setClaiming(true);
      const res = await claimPuzzleGameReward({ data: { sessionId: session.id } });
      ui.triggerHearts();
      ui.showReveals(
        [{ slug: `sticker-${res.number}`, number: res.number, wasNew: res.wasNew, isRare: res.isRare, repeat: !res.wasNew, reward: null }],
        res.isRare ? "Figurinha Rara Desbloqueada! ✦" : "Figurinha Desbloqueada!",
      );
      await loadState();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao resgatar.");
    } finally {
      setClaiming(false);
    }
  };

  // ─── render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-[#9e1b4a]">
        <Puzzle className="h-10 w-10 animate-bounce text-[#c2185b]" />
        <p className="mt-3 text-sm font-bold">Carregando...</p>
      </div>
    );
  }

  if (gameState && (!gameState.available || !gameState.authorized)) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-3 pb-24 pt-5 sm:px-6">
        <button type="button" className="mb-4 flex items-center gap-1 text-xs font-bold text-[#9e1b4a] hover:underline"
          onClick={() => router.navigate({ to: "/clubedascolecionadoras" })}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="mx-auto mt-10 max-w-sm rounded-3xl border border-pink-200 bg-white p-8 text-center shadow dark:border-pink-900/40 dark:bg-[#1b0818]">
          <Lock className="mx-auto h-10 w-10 text-[#c2185b]" />
          <h2 className="mt-3 text-lg font-black text-[#6e1638] dark:text-[#ffd1e5]">Conteúdo bloqueado</h2>
          <p className="mt-2 text-xs text-[#a52b59] dark:text-[#f7a8cb]">O Quebra-Cabeça Sáfico ainda não está disponível para sua conta.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-3 pb-24 pt-5 sm:px-6">
      {/* Back button */}
      <button
        type="button"
        className="mb-4 flex items-center gap-1 text-xs font-bold text-[#9e1b4a] hover:underline"
        onClick={() => router.navigate({ to: "/clubedascolecionadoras" })}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <section className="rounded-3xl border border-pink-200/70 bg-white p-4 shadow-sm sm:p-6 dark:border-pink-900/30 dark:bg-[#1b0818]">

        {/* Header */}
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
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Claimed / No session */}
        {isClaimed && !session && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900/50 dark:bg-[#0c2419]">
            <Trophy className="mx-auto h-8 w-8 text-emerald-600" />
            <h2 className="mt-2 text-base font-black text-emerald-800 dark:text-emerald-200">Missão concluída hoje!</h2>
            <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Volte amanhã para jogar novamente!
            </p>
          </div>
        )}

        {!session && !isClaimed && gameState?.canPlay === false && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-pink-200 bg-pink-50 p-5 text-center text-xs font-semibold text-[#8e1745] dark:border-pink-900/40 dark:bg-[#260c20] dark:text-[#f7a8cb]">
            Você já tem uma partida em andamento em outro jogo. Conclua antes de iniciar.
          </div>
        )}

        {/* Difficulty selection */}
        {!session && !isClaimed && gameState?.canPlay !== false && (
          <div className="mx-auto mt-6 max-w-sm">
            <details className="mb-5 rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-left text-xs text-[#7f3152] dark:border-pink-900/40 dark:bg-[#260c20] dark:text-[#f7a8cb]">
              <summary className="cursor-pointer font-black">Como jogar</summary>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                <li>Escolha um nível: Fácil, Médio ou Difícil.</li>
                <li>Arraste cada peça para sua posição correta no tabuleiro. Toque sem arrastar <strong>gira a peça 90°</strong>. Algumas peças precisarão ser giradas para encaixar.</li>
                <li>No nível Fácil, uma imagem guia fica visível para ajudar.</li>
                <li>Ao encaixar todas as peças, você libera a recompensa diária.</li>
                <li>Seu progresso fica salvo para continuar depois.</li>
                <li>Você só pode receber 1 recompensa por dia.</li>
              </ul>
            </details>

            <fieldset>
              <legend className="mb-2 text-xs font-bold text-[#6e1638] dark:text-[#ffd1e5]">Escolha a dificuldade</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as const).map(level => {
                  const cfg = PUZZLE_GRID_CONFIG[level];
                  const isAvailable = availableDifficulties.includes(level);
                  const isUsed = usedDifficulties.includes(level);
                  const isSelected = difficulty === level;
                  return (
                    <button key={level} type="button"
                      disabled={!isAvailable}
                      onClick={() => setDifficulty(level)}
                      className={`flex flex-col items-center rounded-xl border px-2 py-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:border-gray-800 dark:disabled:bg-gray-900 ${isSelected ? "border-[#9e1b4a] bg-[#fce4ec] text-[#6e1638] dark:border-pink-500 dark:bg-[#381028] dark:text-[#ffd1e5]" : "border-pink-100 text-[#a52b59] hover:bg-pink-50 dark:border-pink-900/40 dark:text-[#f7a8cb]"}`}
                    >
                      {/* Mini grid icon */}
                      <div
                        className="mb-1.5"
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`,
                          gap: 2,
                          width: 36,
                          height: 36 * cfg.rows / cfg.cols,
                        }}
                      >
                        {Array.from({ length: cfg.totalPieces }).map((_, i) => (
                          <div key={i} className={`rounded-[2px] ${isSelected ? "bg-[#c2185b]" : "bg-pink-200 dark:bg-pink-900"}`} />
                        ))}
                      </div>
                      <span>{cfg.label}</span>
                      <small className="mt-0.5 block text-[9px] font-semibold opacity-75">
                        {cfg.cols}×{cfg.rows} · {cfg.totalPieces}p
                      </small>
                      {!isAvailable && isUsed && (
                        <span className="mt-1 block text-[7px] font-bold uppercase text-emerald-600 dark:text-emerald-400">já usado</span>
                      )}
                      {!isAvailable && !isUsed && (
                        <span className="mt-1 flex items-center gap-0.5 text-[7px] font-bold uppercase text-gray-500"><Lock className="h-2.5 w-2.5" /> bloqueado</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button type="button"
              disabled={starting || !availableDifficulties.includes(difficulty)}
              onClick={handleStart}
              className="mt-5 w-full rounded-full bg-[#9e1b4a] py-3 text-sm font-black text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {starting ? "Iniciando..." : "Começar partida"}
            </button>
          </div>
        )}

        {/* Active game */}
        {session && !isClaimed && (
          <div className="mt-5">
            {/* Toolbar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-3 dark:border-pink-900/40">
              <span className="text-xs font-black text-[#6e1638] dark:text-[#ffd1e5]">
                {gridConfig.label} · {placedCount}/{gridConfig.totalPieces} peças encaixadas
              </span>
              <div className="flex items-center gap-2">
                {session.difficulty === "easy" && (
                  <button type="button" onClick={() => setShowGuide(v => !v)}
                    className="flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-[#9e1b4a] hover:bg-pink-100 dark:border-pink-900 dark:bg-[#2c0d22] dark:text-[#f7a8cb]">
                    {showGuide ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showGuide ? "Ocultar Guia" : "Mostrar Guia"}
                  </button>
                )}
                <button type="button" onClick={handleAbandon}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-pink-900 dark:bg-[#260c20] dark:text-gray-300">
                  <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
                </button>
              </div>
            </div>

            {/* Hint for mobile */}
            <p className="mb-2 text-center text-[10px] font-semibold text-[#a52b59] dark:text-[#f7a8cb]">
              Arraste as peças para o tabuleiro · <RotateCw className="inline h-3 w-3" /> Toque sem arrastar = girar
            </p>

            {/* Clip path definitions */}
            <svg className="absolute h-0 w-0 pointer-events-none" aria-hidden>
              <defs>
                {pieces.map(p => (
                  <clipPath key={p.id} id={`pc-${p.id}`} clipPathUnits="userSpaceOnUse">
                    <path d={p.svgPath} />
                  </clipPath>
                ))}
              </defs>
            </svg>

            {/* Workbench */}
            <div
              className="mx-auto select-none overflow-hidden rounded-2xl touch-none"
              style={{ width: CONTAINER_W * fitScale, height: CONTAINER_H * fitScale, maxWidth: "100%" }}
            >
              <div
                className="relative"
                style={{
                  width: CONTAINER_W,
                  height: CONTAINER_H,
                  transform: `scale(${fitScale})`,
                  transformOrigin: "0 0",
                  background: "repeating-linear-gradient(115deg, #2a1020 0px, #2a1020 3px, #2e1225 3px, #2e1225 6px)",
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {/* Board frame */}
                <div
                  className="absolute z-0 rounded-2xl border-2 border-[#c2185b]/30 bg-[#190615] shadow-inner"
                  style={{ left: BOARD_LEFT - 14, top: BOARD_TOP - 14, width: BOARD_W + 28, height: BOARD_H + 28 }}
                />

                {/* Ghost guide (Easy only) */}
                {showGuide && session.difficulty === "easy" && coverUrl && (
                  <div
                    className="absolute rounded-lg pointer-events-none"
                    style={{
                      left: BOARD_LEFT, top: BOARD_TOP, width: BOARD_W, height: BOARD_H,
                      backgroundImage: `url(${coverUrl})`,
                      backgroundSize: "100% 100%",
                      opacity: 0.20,
                    }}
                  />
                )}

                {/* Slot grid (subtle dashes, no highlight on click) */}
                {Array.from({ length: gridConfig.totalPieces }).map((_, idx) => {
                  const r = Math.floor(idx / gridConfig.cols);
                  const c = idx % gridConfig.cols;
                  return (
                    <div key={idx} className="absolute border border-dashed border-white/10 pointer-events-none"
                      style={{ left: BOARD_LEFT + c * PIECE_W, top: BOARD_TOP + r * PIECE_H, width: PIECE_W, height: PIECE_H }} />
                  );
                })}

                {/* Pieces */}
                {pieces.map(p => {
                  const isDragging = draggingId === p.id;
                  return (
                    <div
                      key={p.id}
                      onPointerDown={e => handlePointerDown(e, p.id)}
                      className="absolute touch-none"
                      style={{
                        left: p.x,
                        top: p.y,
                        width: PIECE_W,
                        height: PIECE_H,
                        transform: `rotate(${p.rotation}deg)`,
                        transformOrigin: "center center",
                        zIndex: p.placed ? 1 : p.z,
                        cursor: p.placed ? "default" : isDragging ? "grabbing" : "grab",
                        // Snap animation
                        transition: isDragging ? "none" : p.placed ? "left 0.18s ease, top 0.18s ease" : "none",
                        filter: isDragging ? "drop-shadow(0 12px 24px rgba(0,0,0,0.7))" : p.placed ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" : "drop-shadow(0 4px 10px rgba(0,0,0,0.55))",
                      }}
                    >
                      {/* SVG clip container — must be overflow:visible so tabs protrude */}
                      <svg
                        width={PIECE_W}
                        height={PIECE_H}
                        viewBox={`0 0 ${PIECE_W} ${PIECE_H}`}
                        style={{ overflow: "visible", position: "absolute", top: 0, left: 0 }}
                      >
                        <defs>
                          <clipPath id={`cp-${p.id}`}>
                            <path d={p.svgPath} />
                          </clipPath>
                        </defs>
                        <image
                          href={coverUrl}
                          x={-(p.col * PIECE_W)}
                          y={-(p.row * PIECE_H)}
                          width={BOARD_W}
                          height={BOARD_H}
                          clipPath={`url(#cp-${p.id})`}
                          preserveAspectRatio="none"
                        />
                        {/* Piece edge stroke for realism */}
                        <path
                          d={p.svgPath}
                          fill="none"
                          stroke={p.placed ? "rgba(194,24,91,0.6)" : "rgba(0,0,0,0.35)"}
                          strokeWidth={p.placed ? 1.5 : 1}
                          style={{ overflow: "visible" } as React.CSSProperties}
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Victory card */}
            {isWon && (
              <div className="mt-6 flex flex-col items-center rounded-3xl border border-pink-200 bg-white p-6 text-center shadow-xl dark:border-pink-900 dark:bg-[#1b0818]">
                <Trophy className="h-10 w-10 animate-bounce text-amber-500" />
                <h3 className="mt-2 text-xl font-black text-[#6e1638] dark:text-[#ffd1e5]">
                  Montagem Completa!
                </h3>
                <p className="mt-1 text-xs text-[#a52b59] dark:text-[#f7a8cb]">
                  Você encaixou todas as {gridConfig.totalPieces} peças. Resgate sua figurinha!
                </p>
                <button type="button" disabled={claiming} onClick={handleClaimReward}
                  className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c2185b] to-[#df347c] px-8 py-3 text-xs font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
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
