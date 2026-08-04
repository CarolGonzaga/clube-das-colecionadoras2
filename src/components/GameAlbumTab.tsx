"use client";

import { useMemo, useState } from "react";
import { Lock, Search, ShoppingCart, X } from "lucide-react";
import type { GameAlbumSticker } from "@/lib/gameAlbum";
import { getBundledMemoryCoverUrl } from "@/lib/memoryCoverAssets";
import { useUI } from "@/components/UIProvider";
import Stamp from "./Stamp";

export default function GameAlbumTab({ stickers }: { stickers: GameAlbumSticker[] }) {
  const ui = useUI();
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");
  const [search, setSearch] = useState("");
  const ownedCount = stickers.filter((item) => item.owned).length;
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return stickers.filter((item) => {
      if (filter === "owned" && !item.owned) return false;
      if (filter === "missing" && item.owned) return false;
      return (
        !query ||
        `${item.id} ${item.title} ${item.author}`.toLocaleLowerCase("pt-BR").includes(query)
      );
    });
  }, [filter, search, stickers]);

  const getImageUrl = (item: GameAlbumSticker) =>
    getBundledMemoryCoverUrl(item.frontImagePath) || item.frontImagePath;

  const openSticker = (item: GameAlbumSticker) => {
    const imageUrl = getImageUrl(item);
    const amazonUrl =
      item.amazonUrl ||
      `https://www.amazon.com.br/s?k=${encodeURIComponent(`${item.title} ${item.author}`)}`;

    ui.openModal(
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            maxWidth: "360px",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={ui.closeModal}
            style={{
              background: "none",
              border: "none",
              color: "var(--magenta)",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
              padding: "8px 4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <X size={18} /> Fechar
          </button>
        </div>

        <div
          className="reveal-card"
          style={{
            width: "90%",
            maxWidth: "320px",
            aspectRatio: "200 / 280",
            margin: "10px auto 20px",
            position: "relative",
          }}
        >
          <Stamp
            number={item.id}
            owned={item.owned}
            imageUrlOverride={item.owned ? imageUrl : null}
          />
        </div>

        <h2
          style={{
            textAlign: "center",
            fontFamily: "Baloo 2",
            fontSize: "18px",
            color: "var(--wine)",
            margin: "8px 0 2px",
          }}
        >
          {item.owned
            ? `#${String(item.id).padStart(3, "0")} · ${item.title}`
            : `Figurinha misteriosa #${String(item.id).padStart(3, "0")}`}
        </h2>

        {item.owned ? (
          <>
            <p
              style={{
                textAlign: "center",
                color: "var(--magenta)",
                fontWeight: 800,
                margin: "2px 0 8px",
                fontSize: "12px",
              }}
            >
              {item.author}
            </p>
            <a
              className="btn sm soft"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                width: "100%",
                maxWidth: "200px",
                margin: "8px auto 6px",
              }}
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShoppingCart size={15} /> Ver na Amazon
            </a>
          </>
        ) : (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--magenta)",
              fontWeight: 800,
              margin: "10px 0",
              fontSize: "14px",
            }}
          >
            <Lock size={16} /> Jogue para desbloquear esta figurinha
          </p>
        )}
      </div>,
      { fullScreen: true },
    );
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div
        className="filter-dropdown-container"
        style={{
          margin: "14px 0",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{ position: "relative", display: "flex", alignItems: "center", flex: "1 1 220px" }}
        >
          <Search size={17} style={{ position: "absolute", left: 12, color: "var(--magenta)" }} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por ID, título ou autora"
            aria-label="Buscar capa do álbum de jogos"
            style={{
              width: "100%",
              padding: "9px 12px 9px 38px",
              borderRadius: 12,
              border: "1px solid var(--blush)",
              background: "#fff",
              color: "var(--wine)",
              fontWeight: 700,
            }}
          />
        </label>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
          aria-label="Filtrar capas de jogos"
        >
          <option value="all">Todas as figurinhas</option>
          <option value="owned">Coladas</option>
          <option value="missing">Faltam</option>
        </select>
        <span className="album-count-badge">
          {ownedCount}/{stickers.length} figurinhas
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">Nenhuma figurinha encontrada.</div>
      ) : (
        <div className="album" id="game-album-grid">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`cell ${item.owned ? "" : "locked"}`}
              onClick={() => openSticker(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") openSticker(item);
              }}
              aria-label={
                item.owned
                  ? `${item.title}, figurinha colada`
                  : `Figurinha ${item.id}, ainda não conquistada`
              }
            >
              <Stamp
                number={item.id}
                owned={item.owned}
                imageUrlOverride={item.owned ? getImageUrl(item) : null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
