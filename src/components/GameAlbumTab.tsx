"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { GameAlbumSticker } from "@/lib/gameAlbum";
import { getBundledMemoryCoverUrl } from "@/lib/memoryCoverAssets";

export default function GameAlbumTab({ stickers }: { stickers: GameAlbumSticker[] }) {
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GameAlbumSticker | null>(null);
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
          <option value="all">Todas as capas</option>
          <option value="owned">Coladas</option>
          <option value="missing">Faltam</option>
        </select>
        <span className="album-count-badge">
          {ownedCount}/{stickers.length} capas
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">Nenhuma capa encontrada.</div>
      ) : (
        <div className="album" id="game-album-grid">
          {filtered.map((item) => {
            const imageUrl = getBundledMemoryCoverUrl(item.frontImagePath) || item.frontImagePath;
            return (
              <button
                type="button"
                key={item.id}
                className={`cell game-album-cell ${item.owned ? "" : "locked"}`}
                onClick={() => item.owned && setSelected(item)}
                aria-label={
                  item.owned
                    ? `${item.title}, capa colada`
                    : `Capa ${item.id}, ainda não conquistada`
                }
              >
                <span className="game-album-number">{item.id}</span>
                {item.owned ? (
                  <img src={imageUrl} alt={item.altText} loading="lazy" decoding="async" />
                ) : (
                  <img src="/verso-card.webp" alt="Capa ainda não conquistada" loading="lazy" />
                )}
                <span className="game-album-label">{item.owned ? item.title : "?"}</span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="modal-overlay active"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <div className="modal-card game-album-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Fechar">
              <X />
            </button>
            <img
              src={getBundledMemoryCoverUrl(selected.frontImagePath) || selected.frontImagePath}
              alt={selected.altText}
            />
            <strong>
              #{selected.id} · {selected.title}
            </strong>
            <span>{selected.author}</span>
          </div>
        </div>
      )}
    </div>
  );
}
