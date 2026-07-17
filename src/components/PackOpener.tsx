"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PackageOpen, ArrowRight, Check, Sparkles } from "lucide-react";
import { RevealItem } from "@/lib/types";
import Stamp from "./Stamp";
import { dbService } from "@/lib/db";

interface PackOpenerProps {
  reveals: RevealItem[];
  onClose: (completed?: boolean) => void;
  title?: string;
}

type AnimationState = "idle" | "opening" | "cards-emerging" | "cards-ready" | "card-flip";

// Web Audio API Sound Synthesizer for premium retro/arcade sound effects
class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    try {
      if (!this.ctx && typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch((err) => console.warn("AudioContext resume failed:", err));
      }
    } catch (e) {
      console.warn("AudioContext initialization failed:", e);
      this.ctx = null;
    }
  }

  playTear() {
    try {
      this.init();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 6;
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      console.warn("Audio playTear error", e);
    }
  }

  playSparkle() {
    try {
      this.init();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const notes = [987.77, 1174.66, 1318.51, 1567.98, 1975.53, 2349.32];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + idx * 0.04 + 0.2);
      });
    } catch (e) {
      console.warn("Audio playSparkle error", e);
    }
  }

  playFlash() {
    try {
      this.init();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio playFlash error", e);
    }
  }

  playFlip() {
    try {
      this.init();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn("Audio playFlip error", e);
    }
  }
}

const sfx = new SoundEffects();

interface FxParticle {
  id: number;
  type: "sparkle" | "star" | "confetti";
  tx: string;
  ty: string;
  rot?: string;
  color?: string;
  size?: string;
  width?: string;
  height?: string;
  radius?: string;
  char?: string;
}

const TOTAL_FRAMES = 9;
const FRAME_DURATION_MS = 60; // 60ms per frame

export default function PackOpener({ reveals, onClose, title = "Você ganhou!" }: PackOpenerProps) {
  const [animState, setAnimState] = useState<AnimationState>("idle");
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [isCardZoomed, setIsCardZoomed] = useState(false);
  const [fxParticles, setFxParticles] = useState<FxParticle[]>([]);
  const [showFlash, setShowFlash] = useState(false);

  const fxParticleIdRef = useRef(0);
  const timersRef = useRef<any[]>([]);
  const intervalRef = useRef<any>(null);

  const addTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  };

  const notifyPendingPackChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pending_pack_change"));
    }
  };

  // Preload frames and dispatch unmount notification
  useEffect(() => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/${i}.webp`;
    }
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      if (intervalRef.current) clearInterval(intervalRef.current);
      notifyPendingPackChange();
    };
  }, []);

  // Recovery of pending pack on mount
  useEffect(() => {
    const saved = localStorage.getItem("pending_pack");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isSame =
          parsed.reveals &&
          parsed.reveals.length === reveals.length &&
          parsed.reveals[0]?.slug === reveals[0]?.slug;
        if (isSame) {
          setFlippedCards([]);
          setActiveCardIndex(0);
          setAnimState("idle");
          setCurrentFrame(1);
        }
      } catch (e) {
        console.error("Error recovering pending pack:", e);
      }
    }
  }, [reveals]);

  // Immediately initialize pack as pending in localStorage when it mounts
  useEffect(() => {
    if (reveals.length > 0) {
      const saved = localStorage.getItem("pending_pack");
      let shouldSave = true;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed.reveals &&
            parsed.reveals.length === reveals.length &&
            parsed.reveals[0]?.slug === reveals[0]?.slug
          ) {
            shouldSave = false;
          }
        } catch (e) {
          // Ignore parsing error, defaults to saving
        }
      }
      if (shouldSave) {
        const rewardItem = reveals.find((r) => r.reward && r.reward.startsWith("tag_"));
        const rewardTag =
          rewardItem && rewardItem.reward ? rewardItem.reward.replace("tag_", "") : undefined;
        const rewardMsg = rewardItem
          ? rewardItem.rewardMessage ||
            (rewardTag === "Baldaverso"
              ? `Parabéns! Você completou o kit Baldaverso e ganhou um pacote extra!`
              : `Parabéns! Você completou a saga ${rewardTag} e ganhou um pacote extra!`)
          : undefined;

        const pendingObj = {
          reveals,
          title,
          flippedCards: [],
          isOpened: false,
          rewardTag,
          rewardMsg,
        };

        localStorage.setItem("pending_pack", JSON.stringify(pendingObj));
        dbService.syncPendingPack(pendingObj);
        notifyPendingPackChange();
      }
    }
  }, [reveals, title]);

  // Clean up localStorage immediately when all cards are flipped
  useEffect(() => {
    if (reveals.length > 0 && flippedCards.length === reveals.length) {
      localStorage.removeItem("pending_pack");
      dbService.syncPendingPack(null);
      notifyPendingPackChange();
    }
  }, [flippedCards, reveals]);

  useEffect(() => {
    if (animState !== "cards-emerging") return;
    const fallback = setTimeout(() => {
      setAnimState((current) => (current === "cards-emerging" ? "cards-ready" : current));
      setFxParticles([]);
    }, 1800);
    return () => clearTimeout(fallback);
  }, [animState]);

  const triggerFxBurst = (isRareOnly = false) => {
    const newParticles: FxParticle[] = [];
    const colors = isRareOnly
      ? ["#FFD700", "#FFA500", "#FFF8DC", "#FFDF00"]
      : ["#ff85c8", "#c850c0", "#a855f7", "#ffd700", "#fff"];

    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 120;
      const tx = `${Math.cos(angle) * distance}px`;
      const ty = `${Math.sin(angle) * distance - 20}px`;
      newParticles.push({
        id: fxParticleIdRef.current++,
        type: "sparkle",
        tx,
        ty,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: `${4 + Math.random() * 6}px`,
      });
    }

    const starChars = isRareOnly ? ["✨", "⭐", "🏵️", "✦", "✧"] : ["✦", "★", "✨", "⭐"];
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 140;
      const tx = `${Math.cos(angle) * distance}px`;
      const ty = `${Math.sin(angle) * distance - 30}px`;
      newParticles.push({
        id: fxParticleIdRef.current++,
        type: "star",
        tx,
        ty,
        rot: `${180 + Math.random() * 360}deg`,
        char: starChars[Math.floor(Math.random() * starChars.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: `${12 + Math.random() * 10}px`,
      });
    }

    for (let i = 0; i < 25; i++) {
      const tx = `${-150 + Math.random() * 300}px`;
      const rot = `${360 + Math.random() * 720}deg`;
      newParticles.push({
        id: fxParticleIdRef.current++,
        type: "confetti",
        tx,
        ty: "180px",
        rot,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: `${6 + Math.random() * 8}px`,
        height: `${4 + Math.random() * 6}px`,
        radius: Math.random() > 0.5 ? "2px" : "0px",
      });
    }
    setFxParticles(newParticles);
  };

  const handleOpenPack = () => {
    if (animState !== "idle") return;

    localStorage.setItem(
      "pending_pack",
      JSON.stringify({ reveals, title, flippedCards: [], isOpened: true }),
    );
    notifyPendingPackChange();

    setAnimState("opening");
    sfx.playFlash();

    // Aguarda o shake inicial (450ms) antes de rodar os frames
    addTimeout(() => {
      let frame = 1;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        frame++;
        setCurrentFrame(frame);

        if (frame === 2) {
          sfx.playTear();
          try {
            if (
              typeof window !== "undefined" &&
              window.navigator &&
              typeof window.navigator.vibrate === "function"
            ) {
              window.navigator.vibrate([80, 40, 80]);
            }
          } catch (e) {
            console.warn("Vibration failed:", e);
          }
        }

        if (frame >= TOTAL_FRAMES) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setAnimState("cards-emerging");
          triggerFxBurst();
          sfx.playSparkle();
          sfx.playFlash();
          setShowFlash(true);
          try {
            if (
              typeof window !== "undefined" &&
              window.navigator &&
              typeof window.navigator.vibrate === "function"
            ) {
              window.navigator.vibrate(180);
            }
          } catch (e) {
            console.warn("Vibration failed:", e);
          }
          addTimeout(() => setShowFlash(false), 250);

          addTimeout(() => {
            setAnimState("cards-ready");
            setFxParticles([]);
          }, 1200);
        }
      }, FRAME_DURATION_MS);
    }, 450);
  };

  const handleCardClick = (idx: number, isRare: boolean) => {
    if (animState !== "cards-ready") return;

    setAnimState("card-flip");
    setIsCardZoomed(true);

    const nextFlipped = [...flippedCards, idx];
    setFlippedCards(nextFlipped);

    localStorage.setItem(
      "pending_pack",
      JSON.stringify({ reveals, title, flippedCards: nextFlipped, isOpened: true }),
    );
    notifyPendingPackChange();

    sfx.playFlip();

    if (isRare) {
      addTimeout(() => {
        sfx.playSparkle();
        triggerFxBurst(true);
      }, 200);
    }
  };

  const handleNextCard = () => {
    setIsCardZoomed(false);

    if (activeCardIndex < reveals.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
      setAnimState("cards-emerging");
      addTimeout(() => {
        setAnimState("cards-ready");
      }, 850);
    } else {
      onClose(true);
    }
  };

  const currentReveal = reveals[activeCardIndex];
  const isActiveFlipped = flippedCards.includes(activeCardIndex);

  const particlesRenderer = () => (
    <>
      {fxParticles.map((p) => {
        if (p.type === "sparkle") {
          return (
            <span
              key={p.id}
              className="sparkle-fx"
              style={{ "--tx": p.tx, "--ty": p.ty, "--color": p.color, "--size": p.size } as any}
            />
          );
        } else if (p.type === "star") {
          return (
            <span
              key={p.id}
              className="star-fx"
              style={
                {
                  "--tx": p.tx,
                  "--ty": p.ty,
                  "--rot": p.rot,
                  "--size": p.size,
                  color: p.color,
                } as any
              }
            >
              {p.char}
            </span>
          );
        } else {
          return (
            <span
              key={p.id}
              className="confetti-fx"
              style={
                {
                  "--tx": p.tx,
                  "--rot": p.rot,
                  "--color": p.color,
                  "--width": p.width,
                  "--height": p.height,
                  "--radius": p.radius,
                } as any
              }
            />
          );
        }
      })}
    </>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center overflow-hidden backdrop-blur-md">
      {/* Flash effect overlay */}
      {showFlash && (
        <div className="absolute inset-0 z-[120] bg-white opacity-80 pointer-events-none animate-fade-out" />
      )}

      {/* Main UI Container */}
      <div
        className={`relative w-full max-w-lg min-h-[580px] flex flex-col items-center justify-between py-6 transition-opacity duration-500 ${isCardZoomed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {/* Title */}
        <div className="text-center px-4 z-10">
          <h2 className="text-[#f7a8cb] font-baloo text-3xl font-extrabold mb-1 drop-shadow-lg">
            {title}
          </h2>
          {animState === "cards-ready" && !isActiveFlipped && (
            <p className="text-white text-sm font-bold tracking-wide animate-pulse drop-shadow-md mt-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> toque na figurinha para revelar{" "}
              <Sparkles className="w-4 h-4" />
            </p>
          )}
        </div>

        {/* Animation Stage */}
        <div className="relative w-full h-[400px] flex items-center justify-center mt-2">
          {/* Background Glow */}
          {["cards-emerging", "cards-ready", "card-flip"].includes(animState) && (
            <div
              className="absolute inset-0 pointer-events-none animate-pulse opacity-50"
              style={{
                background: currentReveal?.isRare
                  ? "radial-gradient(circle, rgba(231, 181, 59, 0.5) 0%, transparent 60%)"
                  : "radial-gradient(circle, rgba(194, 24, 91, 0.4) 0%, transparent 60%)",
              }}
            />
          )}

          <div className="fx-layer absolute inset-0 z-0">{particlesRenderer()}</div>

          <div className="relative flex items-center justify-center w-[260px] h-[360px] z-10">
            {animState === "idle" || animState === "opening" ? (
              <img
                src={`/frames/${currentFrame}.webp`}
                alt="Pacote"
                className={`w-full h-full object-contain drop-shadow-2xl ${animState === "idle" ? "cursor-pointer pack-float-idle hover:scale-105 transition-transform" : "pack-shake"}`}
                onClick={handleOpenPack}
              />
            ) : (
              <img
                src="/frames/9.webp"
                alt="Pacote Aberto"
                className="w-full h-full object-contain opacity-50 blur-sm"
              />
            )}

            {/* Emerging Card (Back face only before reveal) */}
            {["cards-emerging", "cards-ready"].includes(animState) && currentReveal && (
              <motion.div
                key={`back-${activeCardIndex}`}
                initial={{ x: 0, y: 120, scale: 0.5, rotate: 0, opacity: 0 }}
                animate={
                  animState === "cards-emerging"
                    ? { x: 0, y: -20, scale: 1, rotate: 0, opacity: 1 }
                    : { x: 0, y: [-15, -25, -15], scale: 1.05, rotate: 0, opacity: 1 }
                }
                transition={
                  animState === "cards-emerging"
                    ? { duration: 0.85, ease: "easeOut" }
                    : { y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
                }
                className="absolute z-30 cursor-pointer drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                onClick={() => handleCardClick(activeCardIndex, currentReveal.isRare)}
              >
                <img
                  src="/verso-card.webp"
                  alt="Verso da figurinha"
                  className="w-[140px] h-[190px] object-cover rounded-md"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Revealed Cards Shelf */}
        {reveals.length > 1 && (
          <div className="z-10 px-4 mt-2 mb-4 w-full flex flex-col items-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#f7a8cb] mb-2 font-sans opacity-80">
              Sequência do Pacote ({flippedCards.length}/{reveals.length})
            </p>
            <div className="flex justify-center gap-2 flex-wrap max-w-md">
              {reveals.map((r, i) => {
                const isRevealed = flippedCards.includes(i);
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={isRevealed ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.3 }}
                    className="w-[56px] h-[78px] rounded-lg shadow-sm border border-pink-200/20 overflow-hidden relative bg-white/10"
                    transition={{ duration: 0.3 }}
                  >
                    {isRevealed ? (
                      <Stamp number={r.number} owned={true} auto={r.isRare} cover={r.slug} />
                    ) : (
                      <img
                        src="/verso-card.webp"
                        alt="Verso"
                        className="w-full h-full object-cover opacity-60"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Button Action Bar */}
        <div className="w-full px-5 mt-4 z-10 flex flex-col gap-2 h-16 items-center justify-center">
          {animState === "idle" && (
            <button
              onClick={handleOpenPack}
              className="btn font-bold py-3 px-8 text-sm flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform animate-bounce text-white rounded-full border-2 border-white/20"
              style={{ background: "var(--gradient-berry)" }}
            >
              <PackageOpen className="w-5 h-5" /> Abrir Pacote
            </button>
          )}
          {animState === "cards-ready" && currentReveal && (
            <button
              onClick={() => handleCardClick(activeCardIndex, currentReveal.isRare)}
              className="btn font-bold py-3 px-8 text-sm text-white rounded-full border-2 border-white/20"
              style={{ background: "var(--gradient-berry)" }}
            >
              Revelar figurinha
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Blur Zoom Reveal UI */}
      <AnimatePresence>
        {isCardZoomed && currentReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] backdrop-blur-2xl bg-black/60 flex flex-col items-center justify-center p-6"
          >
            {/* Overlay Particles */}
            <div className="fx-layer absolute inset-0 z-0 pointer-events-none">
              {particlesRenderer()}
            </div>

            <motion.div
              initial={{ scale: 0.5, rotateY: 180, y: 100 }}
              animate={{ scale: 1.4, rotateY: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, duration: 0.8 }}
              className="relative z-10 card-3d-container flipped mb-12 drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              style={{ width: "160px", height: "220px" }}
            >
              <div className="card-3d-inner">
                <div className="card-3d-back rounded-lg overflow-hidden border border-white/10">
                  <img src="/verso-card.webp" alt="Verso" className="w-full h-full object-cover" />
                </div>
                <div className="card-3d-front rounded-lg overflow-hidden border-2 border-white/20">
                  {currentReveal.isRare && <div className="card-rare-holo" />}
                  <Stamp
                    number={currentReveal.number}
                    owned={true}
                    auto={currentReveal.isRare}
                    cover={currentReveal.slug}
                  />
                  {currentReveal.isRare && <div className="card-rare-glow animate-pulse" />}
                </div>
              </div>
            </motion.div>

            {currentReveal.wasNew && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1.2, opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="z-20 mb-10"
              >
                <img
                  src="/icons/nova.png"
                  alt="Nova Figurinha"
                  className="h-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-16 z-20 w-full px-6 flex justify-center"
            >
              <button
                onClick={handleNextCard}
                className="w-full max-w-xs py-4 px-8 text-lg font-extrabold flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform text-white rounded-full border border-white/20 hover:brightness-110"
                style={{
                  background: "var(--gradient-berry)",
                }}
              >
                {activeCardIndex < reveals.length - 1 ? (
                  <span className="flex items-center gap-2">
                    Revelar Próxima <ArrowRight className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-white">
                    Fechar <Check className="w-5 h-5 text-white" />
                  </span>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
