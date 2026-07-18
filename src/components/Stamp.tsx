"use client";

import React from "react";
import { SEED_STICKERS } from "../lib/seeds";

interface StampProps {
  number: number;
  owned?: boolean;
  auto?: boolean;
  cover?: string | null;
}

function getScallopedPath(W: number, H: number, R: number, d: number, cornerR: number) {
  const stepX = W / 9;
  const stepY = H / 13;
  const dx = Math.sqrt(R * R + 2 * R * d);
  const dy = Math.sqrt(R * R + 2 * R * d);
  const Rp = R + d;

  let path = `M ${d} ${cornerR} A ${cornerR - d} ${cornerR - d} 0 0 1 ${cornerR} ${d}`;

  // Top Edge
  for (let i = 0; i < 8; i++) {
    const x = stepX * (i + 1);
    path += ` L ${x - dx} ${d} A ${Rp} ${Rp} 0 0 0 ${x + dx} ${d}`;
  }
  path += ` L ${W - cornerR} ${d} A ${cornerR - d} ${cornerR - d} 0 0 1 ${W - d} ${cornerR}`;

  // Right Edge
  for (let j = 0; j < 12; j++) {
    const y = stepY * (j + 1);
    path += ` L ${W - d} ${y - dy} A ${Rp} ${Rp} 0 0 0 ${W - d} ${y + dy}`;
  }
  path += ` L ${W - d} ${H - cornerR} A ${cornerR - d} ${cornerR - d} 0 0 1 ${W - cornerR} ${H - d}`;

  // Bottom Edge
  for (let i = 7; i >= 0; i--) {
    const x = stepX * (i + 1);
    path += ` L ${x + dx} ${H - d} A ${Rp} ${Rp} 0 0 0 ${x - dx} ${H - d}`;
  }
  path += ` L ${cornerR} ${H - d} A ${cornerR - d} ${cornerR - d} 0 0 1 ${d} ${H - cornerR}`;

  // Left Edge
  for (let j = 11; j >= 0; j--) {
    const y = stepY * (j + 1);
    path += ` L ${d} ${y + dy} A ${Rp} ${Rp} 0 0 0 ${d} ${y - dy}`;
  }
  path += ` Z`;

  return path;
}

function getCoverFilename(number: number): string | null {
  const sticker = SEED_STICKERS.find((s) => s.number === number);
  return sticker ? sticker.cover_url : null;
}


export default function Stamp({ number, owned = false, auto = false, cover = null }: StampProps) {
  const pal = auto
    ? { edge: "#ffffff", panel: "#fff7e6", line: "#dcae4e", num: "#cf9a1e", txt: "#cf9a1e" }
    : owned
      ? { edge: "#ffffff", panel: "#fde3ef", line: "#e98bb4", num: "#c2185b", txt: "#d81b7a" }
      : { edge: "#ffffff", panel: "#fff1f4", line: "#fbc6d3", num: "#e887a0", txt: "#e887a0" };

  const formatNum = String(number).padStart(3, "0");
  const id = `sm-${number}-${owned ? "o" : "l"}-${auto ? "r" : "n"}`;

  const coverFilename = getCoverFilename(number);
  const hasCover = !!coverFilename && owned;

  const sparkPath = (cx: number, cy: number, s: number) => {
    return `M${cx} ${cy - s} L${cx + s * 0.22} ${cy - s * 0.22} L${cx + s} ${cy} L${cx + s * 0.22} ${cy + s * 0.22} L${cx} ${cy + s} L${cx - s * 0.22} ${cy + s * 0.22} L${cx - s} ${cy} L${cx - s * 0.22} ${cy - s * 0.22} Z`;
  };

  return (
    <svg
      viewBox="0 0 200 280"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={`c-${id}`}>
          <rect x="8" y="8" width="184" height="264" rx="12" />
        </clipPath>
        <clipPath id={`c-img-${id}`}>
          <rect x="14" y="14" width="172" height="252" rx="6" />
        </clipPath>
        {auto && (
          <linearGradient id={`goldBorderGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="50%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#F57F17" />
          </linearGradient>
        )}
        {auto && (
          <linearGradient id={`goldSheen-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
            <stop offset="35%" stopColor="#FFF59D" stopOpacity={0.2} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity={0.6} />
            <stop offset="65%" stopColor="#FBC02D" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.3} />
          </linearGradient>
        )}
      </defs>

      {/* Frame Background & Panel */}
      <path d={getScallopedPath(200, 280, 7.5, 0, 10)} fill={auto ? "#FFFDF0" : pal.edge} />
      <rect
        x="13"
        y="13"
        width="174"
        height="254"
        rx="6"
        fill={pal.panel}
        stroke={auto ? `url(#goldBorderGrad-${id})` : "none"}
        strokeWidth={auto ? 2.5 : 0}
      />

      {hasCover ? (
        <>
          <rect
            x="11"
            y="11"
            width="178"
            height="258"
            rx="8"
            fill="white"
            className="stamp-pic-border"
          />
          {/* Cover image embedded */}
          <image
            href={`/covers/${coverFilename}`}
            x="14"
            y="14"
            width="172"
            height="252"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#c-img-${id})`}
          />
          {auto && (
            <rect
              x="8"
              y="8"
              width="184"
              height="264"
              rx="12"
              fill={`url(#goldSheen-${id})`}
              clipPath={`url(#c-${id})`}
              style={{ mixBlendMode: "color-dodge", pointerEvents: "none" }}
            />
          )}

          <rect
            x="8"
            y="8"
            width="184"
            height="264"
            rx="12"
            fill="none"
            stroke={auto ? `url(#goldBorderGrad-${id})` : "none"}
            strokeWidth={auto ? "4" : "0"}
          />
          <g>
            <rect
              className="stamp-number-badge"
              x="4"
              y="4"
              width="40"
              height="22"
              rx="9"
              fill={auto ? `url(#goldBorderGrad-${id})` : pal.num}
            />
            <text
              x="24"
              y="20"
              textAnchor="middle"
              fontFamily="'Baloo 2', sans-serif"
              fontWeight="800"
              fontSize="15"
              fill="white"
            >
              {formatNum}
            </text>
          </g>
        </>
      ) : (
        <>
          {/* Default Seal Design */}
          {/* Scalloped edge contour line */}
          <path
            d={getScallopedPath(200, 280, 7.5, 3.5, 10)}
            fill="none"
            stroke={pal.line}
            strokeWidth="1.2"
          />

          {/* Double inner border */}
          <rect
            x="18"
            y="18"
            width="164"
            height="244"
            rx="5"
            fill="none"
            stroke={pal.line}
            strokeWidth="1.2"
          />
          <rect
            x="22"
            y="22"
            width="156"
            height="236"
            rx="4"
            fill="none"
            stroke={pal.line}
            strokeWidth="0.6"
            opacity="0.65"
          />

          {/* Corners Sparkles & Dots */}
          <g fill={pal.line}>
            {/* Top Left */}
            <path d={sparkPath(36, 36, 5)} />
            <circle cx="36" cy="46" r="1" />

            {/* Top Right */}
            <path d={sparkPath(164, 36, 5)} />
            <circle cx="164" cy="46" r="1" />

            {/* Bottom Left */}
            <path d={sparkPath(36, 244, 5)} />
            <circle cx="36" cy="234" r="1" />

            {/* Bottom Right */}
            <path d={sparkPath(164, 244, 5)} />
            <circle cx="164" cy="234" r="1" />
          </g>

          {/* Center Circle Section (w/ Solid + Dashed borders) */}
          <circle cx="100" cy="125" r="46" fill="none" stroke={pal.line} strokeWidth="1.2" />
          <circle
            cx="100"
            cy="125"
            r="42"
            fill="none"
            stroke={pal.line}
            strokeWidth="1.2"
            strokeDasharray="2.5 5"
          />

          <g fill={pal.line}>
            {/* Top/Bottom sparkles on outer circle */}
            <path d={sparkPath(100, 79, 5)} />
            <path d={sparkPath(100, 171, 5)} />

            {/* Decorative dots around the circle */}
            <circle cx="74" cy="99" r="1.2" />
            <circle cx="126" cy="99" r="1.2" />
            <circle cx="74" cy="151" r="1.2" />
            <circle cx="126" cy="151" r="1.2" />
            <circle cx="54" cy="125" r="1.2" />
            <circle cx="146" cy="125" r="1.2" />
            <circle cx="100" cy="71" r="1.2" />
            <circle cx="100" cy="179" r="1.2" />
          </g>

          {/* Number text centered */}
          <text
            x="100"
            y="141"
            textAnchor="middle"
            fontFamily="'Baloo 2', sans-serif"
            fontWeight="800"
            fontSize="48"
            fill={pal.num}
          >
            {formatNum}
          </text>

          {/* Bottom Branding (Lendo Sáficos) */}
          <text
            x="100"
            y="212"
            textAnchor="middle"
            fontFamily="'Fredoka', sans-serif"
            fontWeight="500"
            fontSize="19"
            fill={pal.txt}
            letterSpacing="1.2"
          >
            Lendo
          </text>
          <text
            x="100"
            y="244"
            textAnchor="middle"
            fontFamily="var(--font-dancing), cursive"
            fontWeight="700"
            fontSize="29"
            fill={pal.txt}
          >
            Sáficos
          </text>

          {/* Swash & Heart Decoration under Sáficos */}
          <path
            d="M 64 252 C 78 255 90 252 92 252"
            fill="none"
            stroke={pal.line}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M 108 252 C 110 252 122 255 136 252"
            fill="none"
            stroke={pal.line}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M 100 249.5 C 99 248.5 97.5 248.5 97.5 250 C 97.5 251.5 100 253.5 100 253.5 C 100 253.5 102.5 251.5 102.5 250 C 102.5 248.5 101 248.5 100 249.5 Z"
            fill={pal.line}
          />
        </>
      )}
    </svg>
  );
}
