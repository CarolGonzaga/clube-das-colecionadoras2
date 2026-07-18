"use client";

import { useState } from "react";
import { getClubAssetUrl } from "@/lib/urls";

export function getAutographFilename(author: string | null): string | null {
  if (!author) return null;
  const normalized = author
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.includes("baldassari")) return "baldassari";
  if (normalized.includes("kader")) return "yasmim-m-kader";
  if (normalized.includes("giordanno")) return "camilla-giordanno";
  if (normalized.includes("englantine")) return "englantine";
  if (normalized.includes("fernanda-v")) return "fernanda-v";

  return normalized;
}

export function AutographSignature({ filename, large = false }: { filename: string; large?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const width = large ? "95%" : "90%";

  return (
    <div
      style={{
        position: "relative",
        width,
        maxHeight: large ? "75%" : "70%",
        minHeight: large ? "86px" : "42px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!loaded && (
        <span
          aria-label="Carregando assinatura"
          style={{
            position: "absolute",
            color: "#5a2030",
            opacity: 0.48,
            fontFamily: "'Dancing Script', cursive",
            fontSize: large ? "52px" : "30px",
            transform: "rotate(-12deg)",
            animation: "autograph-placeholder-pulse 0.9s ease-in-out infinite alternate",
          }}
        >
          ass.
        </span>
      )}
      <img
        src={getClubAssetUrl(`/autographs/${filename}.png`)}
        alt="Autografo"
        decoding="async"
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          filter: loaded ? "brightness(0)" : "brightness(0) blur(3px)",
          opacity: loaded ? 1 : 0.16,
          transform: `scale(${large ? 1.4 : 1.35})`,
          transition: "opacity 180ms ease, filter 180ms ease",
        }}
      />
    </div>
  );
}

export default function AutographSeal({ author, onZoom }: { author: string | null; onZoom?: () => void }) {
  const filename = getAutographFilename(author);
  if (!filename) return null;

  return (
    <div
      className="autograph-seal-container cursor-pointer transition-transform hover:scale-105 active:scale-95"
      onClick={onZoom}
      style={{ cursor: onZoom ? "zoom-in" : "default" }}
      title={onZoom ? "Clique para ver assinatura ampliada" : undefined}
    >
      <img
        src={getClubAssetUrl("/badge.png")}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "12% 10%",
        }}
      >
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontWeight: 600,
            fontSize: "15px",
            color: "#5a2030",
            lineHeight: 1.0,
            display: "block",
            marginBottom: "1px",
            textAlign: "center",
          }}
        >
          com carinho,
        </span>
        <AutographSignature filename={filename} />
      </div>
    </div>
  );
}
