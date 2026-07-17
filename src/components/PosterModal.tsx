"use client";

import React, { useEffect, useRef } from "react";
import { Sticker, UserStyle } from "@/lib/types";
import { getClubAssetUrl } from "@/lib/urls";

interface PosterModalProps {
  mode: "final" | "progress";
  nick: string;
  stickers: Sticker[];
  ownedSlugs: string[];
  autoSlugs: string[];
  statusPhrase: string;
  userStyles?: UserStyle[];
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  rareCount?: number;
  premiumLayout?: boolean;
  onClose: () => void;
}

export default function PosterModal({
  mode,
  nick,
  stickers,
  ownedSlugs,
  autoSlugs,
  statusPhrase,
  userStyles,
  avatarUrl,
  avatarEmoji,
  rareCount = 0,
  premiumLayout = false,
  onClose,
}: PosterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ownedCount = ownedSlugs.length;
  const pct = Math.round((ownedCount / 100) * 100);
  const commonCount = Math.max(0, ownedCount - rareCount);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1920;

    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed: ${src}`));
      });

    const loadBg = loadImage(getClubAssetUrl("/card story/fundo_ls.jpeg")).catch(() => null);
    const loadLogo = loadImage(getClubAssetUrl("/card story/logo2.png")).catch(() => null);
    const loadFooter = loadImage(getClubAssetUrl("/logo-ls.png")).catch(() => null);
    const loadStamp = loadImage(getClubAssetUrl("/card story/ficha-usuario-vazio.png")).catch(() => null);
    const loadRibbon = loadImage(getClubAssetUrl("/card story/faixa-sem-texto.png")).catch(() => null);
    const finalAvatarUrl =
      avatarUrl || (avatarEmoji && avatarEmoji.startsWith("/avatar/") ? avatarEmoji : null);
    const resolvedAvatarUrl = finalAvatarUrl?.startsWith("/")
      ? getClubAssetUrl(finalAvatarUrl)
      : finalAvatarUrl;
    const loadAvatar = resolvedAvatarUrl
      ? loadImage(resolvedAvatarUrl).catch(() => null)
      : Promise.resolve(null);

    Promise.all([loadBg, loadLogo, loadFooter, loadStamp, loadRibbon, loadAvatar]).then(
      ([bgImg, logoImg, footerImg, stampImg, ribbonImg, avatarImg]) => {
        ctx.clearRect(0, 0, W, H);

        // 1. BACKGROUND
        if (bgImg) {
          const bAr = bgImg.width / bgImg.height;
          const cAr = W / H;
          let sx = 0,
            sy = 0,
            sw = bgImg.width,
            sh = bgImg.height;
          if (bAr > cAr) {
            sw = sh * cAr;
            sx = (bgImg.width - sw) / 2;
          } else {
            sh = sw / cAr;
            sy = (bgImg.height - sh) / 2;
          }
          ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, W, H);
        } else {
          const g = ctx.createLinearGradient(0, 0, W, H);
          g.addColorStop(0, "#f7b8ce");
          g.addColorStop(1, "#d48dba");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }

        // 2. LOGO HEAD (clube das colecionadoras)
        if (logoImg) {
          let lw = 820;
          let lh = Math.round(lw * (logoImg.height / logoImg.width));
          if (lh > 240) {
            lh = 240;
            lw = Math.round(lh * (logoImg.width / logoImg.height));
          }
          const lx = (W - lw) / 2;
          const ly = (288 - lh) / 2;
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          ctx.drawImage(logoImg, lx, ly, lw, lh);
          ctx.restore();
        }

        // 3. STAMP (TICKET)
        const stampW = 860;
        const stampH = 1344;
        const stampX = (W - stampW) / 2;
        const stampY = 288;

        if (stampImg) {
          const sW = stampImg.width;
          const sH = stampImg.height;
          const sliceTop = 250;
          const sliceBottom = 250;
          const destSliceTop = Math.round(sliceTop * (stampW / sW));
          const destSliceBottom = Math.round(sliceBottom * (stampW / sW));

          // Compose the stretched ticket offscreen so premium coloring and
          // shadows follow its transparent, scalloped silhouette.
          const stampCanvas = document.createElement("canvas");
          stampCanvas.width = stampW;
          stampCanvas.height = stampH;
          const stampCtx = stampCanvas.getContext("2d");

          if (!stampCtx) return;

          stampCtx.drawImage(stampImg, 0, 0, sW, sliceTop, 0, 0, stampW, destSliceTop);
          stampCtx.drawImage(
            stampImg,
            0,
            sliceTop,
            sW,
            sH - sliceTop - sliceBottom,
            0,
            destSliceTop,
            stampW,
            stampH - destSliceTop - destSliceBottom,
          );
          stampCtx.drawImage(
            stampImg,
            0,
            sH - sliceBottom,
            sW,
            sliceBottom,
            0,
            stampH - destSliceBottom,
            stampW,
            destSliceBottom,
          );

          if (premiumLayout) {
            // Warm the paper without painting the transparent corners.
            const paperGold = stampCtx.createLinearGradient(0, 0, stampW, stampH);
            paperGold.addColorStop(0, "rgba(255, 239, 184, 0.20)");
            paperGold.addColorStop(0.5, "rgba(224, 176, 67, 0.13)");
            paperGold.addColorStop(1, "rgba(255, 228, 145, 0.22)");
            stampCtx.save();
            stampCtx.globalCompositeOperation = "source-atop";
            stampCtx.fillStyle = paperGold;
            stampCtx.fillRect(0, 0, stampW, stampH);
            stampCtx.restore();

            // Build a gold silhouette and place it a few pixels around the
            // ticket. The visible rim follows every perforation instead of
            // creating a rectangular yellow block behind the asset.
            const goldCanvas = document.createElement("canvas");
            goldCanvas.width = stampW;
            goldCanvas.height = stampH;
            const goldCtx = goldCanvas.getContext("2d");
            if (!goldCtx) return;
            goldCtx.drawImage(stampCanvas, 0, 0);
            goldCtx.globalCompositeOperation = "source-in";
            const edgeGold = goldCtx.createLinearGradient(0, 0, stampW, stampH);
            edgeGold.addColorStop(0, "#FFE58A");
            edgeGold.addColorStop(0.45, "#D5A72F");
            edgeGold.addColorStop(1, "#A97916");
            goldCtx.fillStyle = edgeGold;
            goldCtx.fillRect(0, 0, stampW, stampH);

            ctx.save();
            ctx.shadowColor = "rgba(174, 119, 19, 0.42)";
            ctx.shadowBlur = 24;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
              ctx.drawImage(
                goldCanvas,
                stampX + Math.cos(angle) * 7,
                stampY + Math.sin(angle) * 7,
              );
            }
            ctx.restore();

            ctx.drawImage(stampCanvas, stampX, stampY);

            // Sparkles
            ctx.save();
            ctx.fillStyle = "#F6C153";
            ctx.font = "40px sans-serif";
            ctx.fillText("✨", stampX + 70, stampY + 90);
            ctx.fillText("✨", stampX + stampW - 90, stampY + stampH - 180);
            ctx.fillText("✨", stampX + 110, stampY + stampH - 130);
            ctx.fillText("✨", stampX + stampW - 70, stampY + 110);
            ctx.restore();
          } else {
            ctx.drawImage(stampCanvas, stampX, stampY);
          }
        } else {
          ctx.fillStyle = "#FFF0F2";
          ctx.beginPath();
          ctx.roundRect(stampX, stampY, stampW, stampH, 40);
          ctx.fill();
        }

        // 4. CONTENT INNER
        const cx = W / 2;

        let statusText = "Coleção Começando";
        if (pct >= 100) statusText = "Coleção Purpurina";
        else if (pct >= 66) statusText = "Coleção Ouro";
        else if (pct >= 41) statusText = "Coleção Prata";
        else if (pct >= 16) statusText = "Coleção Bronze";

        ctx.save();
        ctx.fillStyle = "#E8C1CD";
        ctx.textAlign = "center";
        ctx.font = "bold 36px 'Quicksand', 'Nunito', sans-serif";
        ctx.fillText(statusText, cx, stampY + 175);
        ctx.restore();

        const avCY = stampY + 410;
        const avR = 150;

        ctx.save();
        ctx.strokeStyle = premiumLayout ? "#F6C153" : "#EDCDD4";
        ctx.lineWidth = 18;
        if (premiumLayout) {
          ctx.shadowColor = "rgba(246, 193, 83, 0.6)";
          ctx.shadowBlur = 25;
        }
        ctx.beginPath();
        ctx.arc(cx, avCY, avR + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (avatarImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, avCY, avR, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, cx - avR, avCY - avR, avR * 2, avR * 2);
          ctx.restore();
        } else {
          const grad = ctx.createRadialGradient(cx, avCY - 20, 0, cx, avCY, avR);
          grad.addColorStop(0, "#F9BC66");
          grad.addColorStop(1, "#F09040");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, avCY, avR, 0, Math.PI * 2);
          ctx.fill();
          const emoji = avatarEmoji && !avatarEmoji.startsWith("/avatar/") ? avatarEmoji : "🔮";
          ctx.font = `${Math.round(avR * 1.1)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText(emoji, cx, avCY + Math.round(avR * 0.36));
        }

        ctx.save();
        ctx.fillStyle = premiumLayout ? "#7A1B41" : "#B07898";
        ctx.textAlign = "center";
        ctx.font = "bold 52px 'Quicksand', 'Nunito', sans-serif";
        ctx.fillText(nick, cx, stampY + 680);

        if (premiumLayout) {
          const tw = ctx.measureText(nick).width;
          const vipX = cx + tw / 2 + 15;
          const vipY = stampY + 636;

          const grad = ctx.createLinearGradient(vipX, vipY, vipX + 86, vipY + 48);
          grad.addColorStop(0, "#FCE881");
          grad.addColorStop(1, "#D4AF37");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(vipX, vipY, 86, 48, 12);
          ctx.fill();

          ctx.fillStyle = "#5c1c3c";
          ctx.font = "900 24px 'Quicksand', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("VIP", vipX + 22, vipY + 34);
        }
        ctx.restore();

        const pillW = 600;
        const barW = pillW - 100;
        const barH = 28;
        const barX = cx - pillW / 2;
        const barY = stampY + 760;

        ctx.fillStyle = "#F5E6EA";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, barH / 2);
        ctx.fill();

        const fillW = Math.max(barH, Math.round((barW * pct) / 100));
        const fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        fillGrad.addColorStop(0, "#C580B0");
        fillGrad.addColorStop(1, "#9E70A0");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, barH / 2);
        ctx.fill();

        ctx.save();
        ctx.fillStyle = "#B07898";
        ctx.textAlign = "right";
        ctx.font = "bold 34px 'Quicksand', 'Nunito', sans-serif";
        ctx.fillText(`${pct}%`, cx + pillW / 2, barY + 24);
        ctx.restore();

        const pillH = 96;
        const pillX = cx - pillW / 2;
        const pill1Y = stampY + 840;
        const pill2Y = stampY + 956;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(pillX, pill1Y, pillW, pillH, pillH / 2);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = "#C5A0B0";
        ctx.textAlign = "center";
        ctx.font = "bold 44px 'Quicksand', 'Nunito', sans-serif";
        ctx.fillText(`${commonCount} Comuns`, cx, pill1Y + 62);
        ctx.restore();

        ctx.fillStyle = "#E4CC44";
        ctx.beginPath();
        ctx.roundRect(pillX, pill2Y, pillW, pillH, pillH / 2);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.font = "bold 44px 'Quicksand', 'Nunito', sans-serif";
        ctx.fillText(`${rareCount} Raras`, cx, pill2Y + 62);
        ctx.restore();

        // 5. RIBBON
        let ribbonBottom = stampY + stampH;
        if (ribbonImg) {
          const rw = 800;
          const rh = Math.round(rw * (ribbonImg.height / ribbonImg.width));
          const rx = (W - rw) / 2 + 50;
          // Subtraindo um valor bem maior (-120) para que o movimento seja perceptível na tela em miniatura (escala 1/5)
          const ry = stampY + stampH - rh / 2 - 80;
          ribbonBottom = ry + rh;

          ctx.drawImage(ribbonImg, rx, ry, rw, rh);

          ctx.save();
          ctx.translate(cx + 50, ry + rh * 0.52);
          // Girando o texto 5 graus a mais para a direita (sentido horário): + 0.087 radianos
          ctx.rotate(-0.22 + 0.087);
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.font = "800 42px 'Fredoka', 'Quicksand', sans-serif";
          ctx.fillText("já criou seu álbum?", 0, 0);
          ctx.restore();
        }
      },
    );
  }, [nick, ownedSlugs, avatarUrl, avatarEmoji, rareCount, pct, commonCount]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "story-clube-das-colecionadoras.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <div
      className="modal-bg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ textAlign: "center" }}>
        <div className="grab" onClick={onClose} />
        <h2>Story de progresso</h2>
        <div className="poster-wrap flex justify-center my-4">
          <canvas
            ref={canvasRef}
            width={1080}
            height={1920}
            style={{
              width: "216px",
              height: "384px",
              display: "block",
              margin: "0 auto",
              borderRadius: "6px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          />
        </div>
        <button className="btn" onClick={handleDownload} style={{ marginTop: "14px" }}>
          Baixar imagem
        </button>
        <button className="btn soft" onClick={onClose} style={{ marginTop: "8px" }}>
          Fechar
        </button>
        <p className="note">1080x1920 - formato Story</p>
      </div>
    </div>
  );
}
