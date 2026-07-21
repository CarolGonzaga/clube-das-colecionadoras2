"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@tanstack/react-router";
import { RevealItem } from "@/lib/types";
import PackOpener from "./PackOpener";
import { SEED_STICKERS } from "@/lib/seeds";
import { dbService } from "@/lib/db";
import { normalizeRevealItems } from "@/lib/reveals";

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
  const router = useRouter();
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
  const activePackItemsRef = useRef<RevealItem[]>([]);
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
  const queueRef = useRef(queue);

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
        if (profile.pending_pack && !isPackActiveRef.current) {
          localStorage.setItem("pending_pack", JSON.stringify(profile.pending_pack));
          const pendingReveals = normalizeRevealItems(profile.pending_pack.reveals);
          if (pendingReveals.length === 0) {
            localStorage.removeItem("pending_pack");
            dbService.syncPendingPack(null).catch(() => undefined);
          } else if (pendingReveals.length !== profile.pending_pack.reveals?.length) {
            const normalizedPendingPack = { ...profile.pending_pack, reveals: pendingReveals };
            localStorage.setItem("pending_pack", JSON.stringify(normalizedPendingPack));
            dbService.syncPendingPack(normalizedPendingPack).catch(() => undefined);
          }
          activePackItemsRef.current = pendingReveals;
          setReveals(pendingReveals);
          if (profile.pending_pack.title) setRevealsTitle(profile.pending_pack.title);
          isPackActiveRef.current = pendingReveals.length > 0;
        } else if (!isPackActiveRef.current) {
          // The database is the source of truth. Never restore a package left
          // in this browser by a different account.
          localStorage.removeItem("pending_pack");
          activePackItemsRef.current = [];
          isPackActiveRef.current = false;
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
    const validItems = normalizeRevealItems(pack.items);
    if (validItems.length === 0) {
      isPackActiveRef.current = false;
      activePackItemsRef.current = [];
      return;
    }

    // Persist before mounting PackOpener. This makes code redemptions follow
    // the same durable flow as purchased/mission packs and prevents a route
    // remount or a late profile hydration from losing the animation.
    const pendingPack = {
      reveals: validItems,
      title: pack.title,
      flippedCards: [],
      isOpened: false,
      rewardTag: pack.rewardTag,
      rewardMsg: pack.rewardMsg,
    };
    localStorage.setItem("pending_pack", JSON.stringify(pendingPack));
    dbService.syncPendingPack(pendingPack).catch((error) => {
      console.warn("Could not persist package reveal", error);
    });
    window.dispatchEvent(new Event("pending_pack_change"));

    isPackActiveRef.current = true;
    activePackItemsRef.current = validItems;
    setReveals(validItems);
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

    try {
      const stored = localStorage.getItem("trade_notifications");
      const notifications = stored ? JSON.parse(stored) : [];
      const notifId = `completed-tag-${tagName}`;
      if (!notifications.some((n: any) => n.id === notifId)) {
        const newNotif = {
          id: notifId,
          type: "collection_completed",
          message: `Parabéns! Você completou a ${tagName}! Você possui prêmios a serem resgatados.`,
          seen: false,
          date: new Date().toISOString(),
        };
        localStorage.setItem("trade_notifications", JSON.stringify([newNotif, ...notifications]));
        window.dispatchEvent(new Event("trade_notifications_change"));
      }
    } catch (e) {
      console.warn("Failed to save completed tag notification:", e);
    }

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
            router.navigate({
              to: "/clubedascolecionadoras/album",
              search: { tab: "colecoes" }
            });
          }}
        >
          Ir para Coleções
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
    isPackActiveRef.current = true;
    if (pack.rewardMsg) {
      showFamilyCompletionModal(pack);
      return;
    }
    startPackAnimation(pack);
  };

  const showReveals = (items: RevealItem[], title?: string) => {
    const safeItems = normalizeRevealItems(items);
    if (safeItems.length === 0) {
      toast("O resgate foi concluído, mas o pacote retornou sem figurinhas válidas.");
      return;
    }

    // A stale pending-pack lock must never hide a newly redeemed package. It
    // can happen after navigation or an interrupted close animation: the
    // inventory succeeds, but the package used to remain queued invisibly.
    if (isPackActiveRef.current && activePackItemsRef.current.length === 0) {
      isPackActiveRef.current = false;
    }

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
      const newStickers = safeItems.map((item) => item.number);
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

    const normalizedItems = safeItems.map((item) => {
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

    const newQueue = [...queueRef.current, ...incomingPacks];

    // Starting a pack is a UI side effect, so it must not happen inside a
    // React state-updater callback. React may replay those callbacks.
    if (!isPackActiveRef.current) {
      const nextPack = newQueue[0];
      const restQueue = newQueue.slice(1);
      queueRef.current = restQueue;
      setQueue(restQueue);
      presentQueuedPack(nextPack);
      return;
    }

    queueRef.current = newQueue;
    setQueue(newQueue);
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

  const handleCloseReveals = (completed = false) => {
    const packCompleted = completed || (reveals.length > 0 && openedPacks.length >= reveals.length);
    if (packCompleted) {
      localStorage.removeItem("pending_pack");
      dbService.syncPendingPack(null).catch(() => undefined);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pending_pack_change"));
      }
    }
    activePackItemsRef.current = [];
    setReveals([]);
    if (queueRef.current.length > 0) {
      const [nextPack, ...restQueue] = queueRef.current;
      queueRef.current = restQueue;
      setQueue(restQueue);
      presentQueuedPack(nextPack);
    } else {
      isPackActiveRef.current = false;
      // Refresh only after the final package stage has been dismissed. In the
      // V2 dashboard an eager invalidation can race the modal state update and
      // make a successful redemption look as if it went straight to the album.
      router.invalidate().catch((error) => {
        console.warn("Could not refresh dashboard after package reveal", error);
      });
    }
  };

  // Save reveals_queue to localStorage and DB whenever it changes
  useEffect(() => {
    queueRef.current = queue;
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
          activePackItemsRef.current = parsed.reveals;
          setReveals(parsed.reveals);
          if (parsed.title) setRevealsTitle(parsed.title);
          return;
        }
      } catch (e) {
        console.error("Error triggerPendingPack saved restoration:", e);
      }
    }

    // Try fallback to queue
    if (queueRef.current.length > 0) {
      const [nextPack, ...restQueue] = queueRef.current;
      queueRef.current = restQueue;
      setQueue(restQueue);
      presentQueuedPack(nextPack);
      return;
    }
    isPackActiveRef.current = false;
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

      {/* PackOpener already owns a fullscreen fixed overlay. Portal it to the
          body so dashboard transforms/overflow can never clip the animation. */}
      {reveals.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <PackOpener
            key={`${revealsTitle}-${reveals[0]?.slug || "empty"}-${reveals.length}`}
            reveals={reveals}
            onClose={handleCloseReveals}
            title={revealsTitle}
          />,
          document.body,
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
