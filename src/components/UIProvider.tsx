"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { RevealItem } from "@/lib/types";
import PackOpener from "./PackOpener";
import { SEED_STICKERS } from "@/lib/seeds";
import { dbService } from "@/lib/db";

interface UIContextType {
  toast: (msg: string) => void;
  openModal: (content: React.ReactNode, options?: { fullScreen?: boolean }) => void;
  closeModal: () => void;
  showReveals: (items: RevealItem[], title?: string) => void;
  triggerPendingPack: () => void;
  triggerHearts: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [modalOptions, setModalOptions] = useState<{ fullScreen?: boolean }>({});
  const [reveals, setReveals] = useState<RevealItem[]>([]);
  const [revealsTitle, setRevealsTitle] = useState<string>("Você ganhou!");
  const [openedPacks, setOpenedPacks] = useState<string[]>([]);
  const [revealedLabels, setRevealedLabels] = useState<string[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  // State updates are asynchronous. This ref is a synchronous lock that stops
  // two rapid rewards from both starting their pack animations at once.
  const isPackActiveRef = useRef(false);
  const [queue, setQueue] = useState<
    { items: RevealItem[]; title: string; rewardMsg?: string; rewardTag?: string }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("reveals_queue");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading initial queue in UIProvider:", e);
    }
    return [];
  });

  // Toast auto-hide
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Load and sync pending states from Database to LocalStorage on load/reload
  useEffect(() => {
    const syncDbToLocalStorage = async () => {
      try {
        const user = await dbService.getCurrentUser();
        if (!user) return;
        setActiveUserId(user.id);
        const profile = await dbService.getProfile(user.id);
        if (!profile) return;

        // Restore pending_pack if present in DB
        if (profile.pending_pack) {
          localStorage.setItem("pending_pack", JSON.stringify(profile.pending_pack));
          setReveals(profile.pending_pack.reveals);
          if (profile.pending_pack.title) setRevealsTitle(profile.pending_pack.title);
          isPackActiveRef.current = true;
        } else {
          // The database is the source of truth. Never restore a package left
          // in this browser by a different account.
          localStorage.removeItem("pending_pack");
          setReveals([]);
        }

        // Restore reveals_queue if present in DB
        if (Array.isArray(profile.reveals_queue) && profile.reveals_queue.length > 0) {
          localStorage.setItem("reveals_queue", JSON.stringify(profile.reveals_queue));
          setQueue(profile.reveals_queue);
        }

        // Restore recent_stickers if present in DB
        if (Array.isArray(profile.recent_stickers) && profile.recent_stickers.length > 0) {
          localStorage.setItem(`recent_stickers:${user.id}`, JSON.stringify(profile.recent_stickers));
        } else {
          localStorage.setItem(`recent_stickers:${user.id}`, JSON.stringify([]));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("pending_pack_change"));
        }
      } catch (e) {
        console.error("Error syncing db to local storage in UIProvider:", e);
      }
    };
    syncDbToLocalStorage();
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
  };

  const openModal = (content: React.ReactNode, options: { fullScreen?: boolean } = {}) => {
    setModalContent(content);
    setModalOptions(options);
  };

  const closeModal = () => {
    setModalContent(null);
    setModalOptions({});
  };

  const startPackAnimation = (pack: {
    items: RevealItem[];
    title: string;
    rewardMsg?: string;
    rewardTag?: string;
  }) => {
    setReveals(pack.items);
    setRevealsTitle(pack.title);
    setOpenedPacks([]);
    setRevealedLabels([]);
  };

  // Family rewards stay in the queue as a separate five-sticker pack. The
  // completion modal is deliberately shown only after the prior pack closes;
  // its button is the sole action that starts the extra-pack animation.
  const showFamilyCompletionModal = (pack: {
    items: RevealItem[];
    title: string;
    rewardMsg?: string;
    rewardTag?: string;
  }) => {
    triggerHearts();
    const tagName = pack.rewardTag || "Saga";
    const families = [
      { tag: "Baldaverso", stickers: [1, 53, 54] },
      { tag: "Frutaverso", stickers: [5, 59, 60] },
      { tag: "Bright Falls", stickers: [22, 51, 52] },
      { tag: "HQ", stickers: [84, 85, 87] },
      { tag: "Opostos Co.", stickers: [19, 73, 74] },
    ];
    const family = families.find((item) => item.tag === tagName);

    openModal(
      <div className="family-reward-modal" style={{ textAlign: "center", padding: "10px" }}>
        <h2 style={{ color: "var(--magenta)", marginBottom: "10px", fontSize: "22px" }}>
          {tagName === "Baldaverso" ? "Kit Baldaverso Completo!" : `Saga ${tagName} Completa!`}
        </h2>
        <p style={{ fontSize: "14px", marginBottom: "16px", fontWeight: 600, color: "#444" }}>
          {pack.rewardMsg}
        </p>

        {family && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
            {family.stickers.map((number) => {
              const sticker = SEED_STICKERS.find((item) => item.number === number);
              if (!sticker) return null;
              return (
                <div key={number} style={{ width: "70px", height: "100px" }}>
                  <img
                    src={sticker.cover_url ? `/covers/${sticker.cover_url}` : undefined}
                    alt={sticker.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "2px solid var(--gold)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        <button
          className="btn w-full"
          style={{ padding: "14px", background: "var(--gradient-berry)" }}
          onClick={() => {
            closeModal();
            startPackAnimation(pack);
          }}
        >
          Abrir pacote extra (5 figurinhas) ✦
        </button>
      </div>,
    );
  };

  const presentQueuedPack = (pack: {
    items: RevealItem[];
    title: string;
    rewardMsg?: string;
    rewardTag?: string;
  }) => {
    if (pack.rewardMsg) {
      showFamilyCompletionModal(pack);
      return;
    }
    startPackAnimation(pack);
  };

  const showReveals = (items: RevealItem[], title?: string) => {
    if (!items || items.length === 0) return;

    // Save to recent stickers list
    try {
      const recentKey = activeUserId ? `recent_stickers:${activeUserId}` : "recent_stickers";
      const existingStr = localStorage.getItem(recentKey);
      let existing: number[] = [];
      if (existingStr) {
        existing = JSON.parse(existingStr);
      }
      if (!Array.isArray(existing)) {
        existing = [];
      }
      const newStickers = items.map((item) => item.number);
      // Prepend, deduplicate, and limit to 10
      const updated = Array.from(new Set([...newStickers, ...existing])).slice(0, 10);
      localStorage.setItem(recentKey, JSON.stringify(updated));
      dbService.syncRecentStickers(updated);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pending_pack_change"));
      }
    } catch (e) {
      console.error("Error saving recent stickers:", e);
    }

    const incomingPacks: {
      items: RevealItem[];
      title: string;
      rewardMsg?: string;
      rewardTag?: string;
    }[] = [];
    let currentPackItems: RevealItem[] = [];

    const normalizedItems = items.map((item) => {
      const sticker = SEED_STICKERS.find((seed) => seed.number === item.number);
      return sticker ? { ...item, slug: sticker.slug } : item;
    });

    normalizedItems.forEach((item) => {
      if (item.reward && (item.reward.startsWith("tag_") || item.reward === "poster")) {
        if (currentPackItems.length > 0) {
          // The five family-reward stickers share one tag. Keep this run as
          // one package instead of splitting it into five single reveals.
          if (currentPackItems[0]?.reward === item.reward) {
            currentPackItems.push(item);
            return;
          }
          incomingPacks.push({ items: currentPackItems, title: title || "Você ganhou!" });
          currentPackItems = [];
        }
        currentPackItems.push(item);
      } else {
        currentPackItems.push(item);
      }
    });

    if (currentPackItems.length > 0) {
      const firstItem = currentPackItems[0];
      if (
        firstItem.reward &&
        (firstItem.reward.startsWith("tag_") || firstItem.reward === "poster")
      ) {
        const rewardTag = firstItem.reward.startsWith("tag_")
          ? firstItem.reward.replace("tag_", "")
          : undefined;
        incomingPacks.push({
          items: currentPackItems,
          title: "Pacote Extra!",
          rewardTag,
          rewardMsg:
            firstItem.rewardMessage ||
            (firstItem.reward === "poster"
              ? "Parabéns! Você completou o álbum!"
              : rewardTag
                ? rewardTag === "Baldaverso"
                  ? `Parabéns! Você completou o kit Baldaverso e ganhou um pacote extra!`
                  : `Parabéns! Você completou a saga ${rewardTag} e ganhou um pacote extra!`
                : undefined),
        });
      } else {
        incomingPacks.push({ items: currentPackItems, title: title || "Você ganhou!" });
      }
    }

    setQueue((prev) => {
      const newQueue = [...prev, ...incomingPacks];

      // Start only one pack at a time. The synchronous lock avoids stale React
      // state when the user completes two missions almost simultaneously.
      if (!isPackActiveRef.current) {
        isPackActiveRef.current = true;
        const nextPack = newQueue[0];
        const restQueue = newQueue.slice(1);

        if (nextPack.rewardMsg) {
          presentQueuedPack(nextPack);
          return restQueue;
          triggerHearts();
          const tagName = nextPack.rewardTag || "Saga";
          const families = [
            { tag: "Baldaverso", stickers: [1, 53, 54] },
            { tag: "Frutaverso", stickers: [5, 59, 60] },
            { tag: "Bright Falls", stickers: [22, 51, 52] },
            { tag: "HQ", stickers: [84, 85, 87] },
            { tag: "Opostos Co.", stickers: [19, 73, 74] },
          ];
          const fam = families.find((f) => f.tag === tagName);

          openModal(
            <div style={{ textAlign: "center", padding: "10px" }}>
              <h2 style={{ color: "var(--magenta)", marginBottom: "10px", fontSize: "22px" }}>
                {tagName === "Baldaverso"
                  ? "Kit Baldaverso Completo!"
                  : `Saga ${tagName} Completa!`}
              </h2>
              <p style={{ fontSize: "14px", marginBottom: "16px", fontWeight: 600, color: "#444" }}>
                {nextPack.rewardMsg}
              </p>

              {fam && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {fam.stickers.map((num) => {
                    const s = SEED_STICKERS.find((st) => st.number === num);
                    if (!s) return null;
                    return (
                      <div key={num} style={{ width: "70px", height: "100px" }}>
                        <img
                          src={s.cover_url ? `/covers/${s.cover_url}` : undefined}
                          alt={s.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "2px solid var(--gold)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="btn w-full"
                style={{ padding: "14px", background: "var(--gradient-berry)" }}
                onClick={() => {
                  closeModal();
                  setReveals(nextPack.items);
                  setRevealsTitle(nextPack.title);
                  setOpenedPacks([]);
                  setRevealedLabels([]);
                }}
              >
                Abrir Pacote Extra ✦
              </button>
            </div>,
          );
        } else {
          setReveals(nextPack.items);
          setRevealsTitle(nextPack.title);
          setOpenedPacks([]);
          setRevealedLabels([]);
        }

        return restQueue;
      }

      return newQueue;
    });
  };

  const triggerHearts = () => {
    const emojis = ["💗", "💖", "✦", "✧", "💕", "⭐"];
    for (let i = 0; i < 28; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.textContent = emojis[i % emojis.length];
      c.style.left = Math.random() * 100 + "vw";
      c.style.fontSize = 14 + Math.random() * 16 + "px";
      c.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
      c.style.animationDelay = Math.random() * 0.5 + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4600);
    }
  };

  const handleOpenPack = (slug: string, idx: number) => {
    if (openedPacks.includes(slug)) return;
    setOpenedPacks((prev) => [...prev, slug]);

    // Trigger spark explosion animations locally
    setTimeout(() => {
      setRevealedLabels((prev) => [...prev, slug]);
    }, 380);
  };

  const handleOpenAll = () => {
    reveals.forEach((r, i) => {
      setTimeout(() => {
        handleOpenPack(r.slug, i);
      }, i * 180);
    });
  };

  const handleCloseReveals = () => {
    setReveals([]);
    setQueue((currentQueue) => {
      if (currentQueue.length > 0) {
        const nextPack = currentQueue[0];
        const restQueue = currentQueue.slice(1);

        if (nextPack.rewardMsg) {
          presentQueuedPack(nextPack);
          return restQueue;
          triggerHearts();
          const tagName = nextPack.rewardTag || "Saga";
          const families = [
            { tag: "Baldaverso", stickers: [1, 53, 54] },
            { tag: "Frutaverso", stickers: [5, 59, 60] },
            { tag: "Bright Falls", stickers: [22, 51, 52] },
            { tag: "HQ", stickers: [84, 85, 87] },
            { tag: "Opostos Co.", stickers: [19, 73, 74] },
          ];
          const fam = families.find((f) => f.tag === tagName);

          openModal(
            <div style={{ textAlign: "center", padding: "10px" }}>
              <h2 style={{ color: "var(--magenta)", marginBottom: "10px", fontSize: "22px" }}>
                {tagName === "Baldaverso"
                  ? "Kit Baldaverso Completo!"
                  : `Saga ${tagName} Completa!`}
              </h2>
              <p style={{ fontSize: "14px", marginBottom: "16px", fontWeight: 600, color: "#444" }}>
                {nextPack.rewardMsg}
              </p>

              {fam && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {fam.stickers.map((num) => {
                    const s = SEED_STICKERS.find((st) => st.number === num);
                    if (!s) return null;
                    return (
                      <div key={num} style={{ width: "70px", height: "100px" }}>
                        <img
                          src={s.cover_url ? `/covers/${s.cover_url}` : undefined}
                          alt={s.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "2px solid var(--gold)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="btn w-full"
                style={{ padding: "14px", background: "var(--gradient-berry)" }}
                onClick={() => {
                  closeModal();
                  setReveals(nextPack.items);
                  setRevealsTitle(nextPack.title);
                  setOpenedPacks([]);
                  setRevealedLabels([]);
                }}
              >
                Abrir Pacote Extra ✦
              </button>
            </div>,
          );
        } else {
          setReveals(nextPack.items);
          setRevealsTitle(nextPack.title);
          setOpenedPacks([]);
          setRevealedLabels([]);
        }

        return restQueue;
      }
      isPackActiveRef.current = false;
      return currentQueue;
    });
  };

  // Save reveals_queue to localStorage and DB whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem("reveals_queue", JSON.stringify(queue));
      dbService.syncRevealsQueue(queue);
    } else {
      localStorage.removeItem("reveals_queue");
      dbService.syncRevealsQueue([]);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pending_pack_change"));
    }
  }, [queue]);

  const triggerPendingPack = () => {
    if (isPackActiveRef.current) return;
    const saved = localStorage.getItem("pending_pack");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.reveals && parsed.reveals.length > 0) {
          isPackActiveRef.current = true;
          setReveals(parsed.reveals);
          if (parsed.title) setRevealsTitle(parsed.title);
          return;
        }
      } catch (e) {
        console.error("Error triggerPendingPack saved restoration:", e);
      }
    }

    // Try fallback to queue
    setQueue((currentQueue) => {
      if (currentQueue.length > 0) {
        isPackActiveRef.current = true;
        const nextPack = currentQueue[0];
        const restQueue = currentQueue.slice(1);

        if (nextPack.rewardMsg) {
          presentQueuedPack(nextPack);
          return restQueue;
          triggerHearts();
          const tagName = nextPack.rewardTag || "Saga";
          const families = [
            { tag: "Baldaverso", stickers: [1, 53, 54] },
            { tag: "Frutaverso", stickers: [5, 59, 60] },
            { tag: "Bright Falls", stickers: [22, 51, 52] },
            { tag: "HQ", stickers: [84, 85, 87] },
            { tag: "Opostos Co.", stickers: [19, 73, 74] },
          ];
          const fam = families.find((f) => f.tag === tagName);

          openModal(
            <div style={{ textAlign: "center", padding: "10px" }}>
              <h2
                style={{
                  color: "var(--wine)",
                  marginBottom: "10px",
                  fontSize: "22px",
                  fontFamily: "Baloo 2",
                }}
              >
                {tagName === "Baldaverso"
                  ? "Kit Baldaverso Completo!"
                  : `Saga ${tagName} Completa!`}
              </h2>
              <p style={{ fontSize: "14px", marginBottom: "16px", fontWeight: 600, color: "#444" }}>
                {nextPack.rewardMsg}
              </p>

              {fam && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {fam.stickers.map((num) => {
                    const s = SEED_STICKERS.find((st) => st.number === num);
                    if (!s) return null;
                    return (
                      <div key={num} style={{ width: "70px", height: "100px" }}>
                        <img
                          src={s.cover_url ? `/covers/${s.cover_url}` : undefined}
                          alt={s.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "2px solid var(--gold)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="btn w-full"
                style={{ padding: "14px", background: "var(--gradient-berry)" }}
                onClick={() => {
                  closeModal();
                  setReveals(nextPack.items);
                  setRevealsTitle(nextPack.title);
                  setOpenedPacks([]);
                  setRevealedLabels([]);
                }}
              >
                Abrir Pacote Extra ✦
              </button>
            </div>,
          );
        } else {
          setReveals(nextPack.items);
          setRevealsTitle(nextPack.title);
          setOpenedPacks([]);
          setRevealedLabels([]);
        }

        return restQueue;
      }
      isPackActiveRef.current = false;
      return currentQueue;
    });
  };

  return (
    <UIContext.Provider
      value={{ toast, openModal, closeModal, showReveals, triggerPendingPack, triggerHearts }}
    >
      {children}

      {/* Global Toast Alert */}
      <div id="toast" className={toastMsg ? "show" : ""}>
        {toastMsg}
      </div>

      {/* Custom Global Details Modal */}
      {modalContent && (
        <div
          className={`modal-bg ${modalOptions.fullScreen ? "full-screen" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className={`modal ${modalOptions.fullScreen ? "full-screen" : ""}`}>
            <div className="grab" onClick={closeModal}></div>
            {modalContent}
          </div>
        </div>
      )}

      {/* Interactive Reveals Stage Modal */}
      {reveals.length > 0 && (
        <div
          className="modal-bg"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseReveals();
          }}
        >
          <div
            className="modal"
            style={{
              maxHeight: "95vh",
              padding: "16px 12px 12px",
              width: "92%",
              maxWidth: "440px",
            }}
          >
            <div className="grab" onClick={handleCloseReveals}></div>
            <PackOpener
              key={`${revealsTitle}-${reveals[0]?.slug || "empty"}-${reveals.length}`}
              reveals={reveals}
              onClose={handleCloseReveals}
              title={revealsTitle}
            />
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
