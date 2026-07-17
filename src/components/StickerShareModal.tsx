"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Sticker } from "@/lib/types";
import { getClubAssetUrl } from "@/lib/urls";

interface StickerShareModalProps {
  sticker: Sticker;
  isRare?: boolean;
  onClose: () => void;
  onMessage?: (message: string) => void;
}

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

function loadCanvasImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceRatio = image.width / image.height;
  const destinationRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (sourceRatio > destinationRatio) {
    sourceWidth = image.height * destinationRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / destinationRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawCenteredWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  const visibleLines = lines.slice(0, 3);
  visibleLines.forEach((line, index) => {
    ctx.fillText(line, centerX, startY + index * lineHeight);
  });

  return visibleLines.length;
}

export default function StickerShareModal({
  sticker,
  isRare = false,
  onClose,
  onMessage,
}: StickerShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shareFileRef = useRef<File | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let active = true;
    shareFileRef.current = null;
    setIsReady(false);

    const coverUrl = sticker.cover_url ? getClubAssetUrl(`/covers/${sticker.cover_url}`) : null;

    Promise.all([
      loadCanvasImage(getClubAssetUrl("/card story/fundo_ls.jpeg")),
      loadCanvasImage(getClubAssetUrl("/card story/logo2.png")),
      coverUrl ? loadCanvasImage(coverUrl) : Promise.resolve(null),
    ]).then(([background, clubLogo, cover]) => {
      if (!active) return;
      ctx.clearRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

      if (background) {
        drawImageCover(ctx, background, 0, 0, STORY_WIDTH, STORY_HEIGHT);
      } else {
        const fallback = ctx.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT);
        fallback.addColorStop(0, "#f7b8ce");
        fallback.addColorStop(1, "#d48dba");
        ctx.fillStyle = fallback;
        ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
      }

      if (clubLogo) {
        let logoWidth = 820;
        let logoHeight = Math.round(logoWidth * (clubLogo.height / clubLogo.width));
        if (logoHeight > 235) {
          logoHeight = 235;
          logoWidth = Math.round(logoHeight * (clubLogo.width / clubLogo.height));
        }
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(clubLogo, (STORY_WIDTH - logoWidth) / 2, 42, logoWidth, logoHeight);
        ctx.restore();
      }

      const cardWidth = 650;
      const cardHeight = 910;
      const cardX = (STORY_WIDTH - cardWidth) / 2;
      const cardY = 325;
      const frameRadius = 34;

      ctx.save();
      ctx.shadowColor = isRare ? "rgba(180, 122, 13, 0.55)" : "rgba(91, 25, 58, 0.32)";
      ctx.shadowBlur = isRare ? 42 : 30;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = isRare ? "#D6A62E" : "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(cardX - 18, cardY - 18, cardWidth + 36, cardHeight + 36, frameRadius + 10);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, frameRadius);
      ctx.clip();
      if (cover) {
        drawImageCover(ctx, cover, cardX, cardY, cardWidth, cardHeight);
      } else {
        ctx.fillStyle = "#FDE3EF";
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
      }

      if (isRare) {
        const sheen = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
        sheen.addColorStop(0, "rgba(255,255,255,0.05)");
        sheen.addColorStop(0.48, "rgba(255,241,158,0.26)");
        sheen.addColorStop(0.58, "rgba(255,255,255,0.08)");
        ctx.fillStyle = sheen;
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
      }
      ctx.restore();

      const badgeX = cardX - 4;
      const badgeY = cardY - 4;
      const badgeWidth = 150;
      const badgeHeight = 72;
      const badgeGradient = ctx.createLinearGradient(
        badgeX,
        badgeY,
        badgeX + badgeWidth,
        badgeY + badgeHeight,
      );
      badgeGradient.addColorStop(0, isRare ? "#FFE37A" : "#EF4A82");
      badgeGradient.addColorStop(1, isRare ? "#C68C16" : "#B91754");
      ctx.fillStyle = badgeGradient;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 28);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = "800 42px 'Baloo 2', 'Quicksand', sans-serif";
      ctx.fillText(String(sticker.number).padStart(3, "0"), badgeX + badgeWidth / 2, badgeY + 50);

      ctx.fillStyle = "#7A123D";
      ctx.textAlign = "center";
      ctx.font = "800 52px 'Baloo 2', 'Quicksand', sans-serif";
      const titleLineCount = drawCenteredWrappedText(
        ctx,
        `#${String(sticker.number).padStart(3, "0")} · ${sticker.name}`,
        STORY_WIDTH / 2,
        1355,
        900,
        60,
      );

      if (sticker.author) {
        ctx.fillStyle = "#C2185B";
        ctx.font = "700 38px 'Quicksand', 'Nunito', sans-serif";
        ctx.fillText(sticker.author, STORY_WIDTH / 2, 1355 + titleLineCount * 60 + 45);
      }

      canvas.toBlob((blob) => {
        if (!active) return;
        if (blob) {
          shareFileRef.current = new File(
            [blob],
            `figurinha-${String(sticker.number).padStart(3, "0")}.png`,
            { type: "image/png" },
          );
        }
        setIsReady(true);
      }, "image/png");
    });

    return () => {
      active = false;
    };
  }, [isRare, sticker]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `figurinha-${String(sticker.number).padStart(3, "0")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const shareImage = async () => {
    const file = shareFileRef.current;
    if (!isReady || !file) {
      onMessage?.("Aguarde a imagem terminar de carregar.");
      return;
    }

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({
          files: [file],
          title: `#${String(sticker.number).padStart(3, "0")} · ${sticker.name}`,
          text: "Minha figurinha do Clube das Colecionadoras!",
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    downloadImage();
    onMessage?.("Imagem baixada para compartilhar.");
  };

  return (
    <div className="sticker-share-modal" style={{ width: "100%", textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginBottom: "8px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "20px" }}>Compartilhar figurinha</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          title="Fechar"
          style={{
            width: "40px",
            height: "40px",
            display: "grid",
            placeItems: "center",
            border: 0,
            borderRadius: "50%",
            background: "var(--pink-soft)",
            color: "var(--magenta)",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div className="poster-wrap flex justify-center my-4">
        <canvas
          ref={canvasRef}
          width={STORY_WIDTH}
          height={STORY_HEIGHT}
          aria-label={`Card compartilhável da figurinha ${sticker.number}`}
          style={{
            width: "216px",
            height: "384px",
            display: "block",
            margin: "0 auto",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        />
      </div>

      <button
        type="button"
        className="btn"
        onClick={shareImage}
        disabled={!isReady}
        style={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px" }}
      >
        <Share2 size={17} /> {isReady ? "Compartilhar imagem" : "Preparando imagem..."}
      </button>
      <button
        type="button"
        className="btn soft"
        onClick={downloadImage}
        disabled={!isReady}
        style={{
          width: "100%",
          marginTop: "8px",
          display: "flex",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <Download size={17} /> Baixar imagem
      </button>
      <p className="note">1080x1920 · formato Story</p>
    </div>
  );
}
