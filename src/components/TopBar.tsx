import React, { useState, useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Bell, Crown, LogOut, Settings, X } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { useUI } from "@/components/UIProvider";

interface TopBarProps {
  ownedCount: number;
  pct: number;
  statusText: string;
}

export default function TopBar({ ownedCount, pct, statusText }: TopBarProps) {
  const ui = useUI();
  const router = useRouter();
  const [hasUnseenNotifs, setHasUnseenNotifs] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkNotifs = () => {
      const stored = localStorage.getItem("trade_notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        setHasUnseenNotifs(parsed.some((n: any) => !n.seen));
      } else {
        setHasUnseenNotifs(false);
      }
    };
    checkNotifs();
    window.addEventListener("trade_notifications_change", checkNotifs);
    window.addEventListener("storage", checkNotifs);
    return () => {
      window.removeEventListener("trade_notifications_change", checkNotifs);
      window.removeEventListener("storage", checkNotifs);
    };
  }, []);

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.success) {
      localStorage.removeItem("recent_stickers");
      window.location.href = "/clubedascolecionadoras/login";
    } else {
      ui.toast("Erro ao sair da conta.");
    }
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem("trade_notifications");
    const notifications = stored ? JSON.parse(stored) : [];
    const updated = notifications.filter((n: any) => n.id !== id);
    localStorage.setItem("trade_notifications", JSON.stringify(updated));
    setHasUnseenNotifs(updated.some((n: any) => !n.seen));
    window.dispatchEvent(new Event("trade_notifications_change"));
    ui.closeModal();
  };

  const handleNotifications = () => {
    const stored = localStorage.getItem("trade_notifications");
    const notifications = stored ? JSON.parse(stored) : [];

    // Mark all as seen
    const updated = notifications.map((n: any) => ({ ...n, seen: true }));
    localStorage.setItem("trade_notifications", JSON.stringify(updated));
    setHasUnseenNotifs(false);
    window.dispatchEvent(new Event("trade_notifications_change"));

    ui.openModal(
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <h2
          style={{
            marginBottom: "16px",
            color: "var(--wine)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "17px",
            fontWeight: "800",
          }}
        >
          <Bell className="w-5 h-5 text-[#C2185B]" /> Notificações
        </h2>
        {notifications.length === 0 ? (
          <p style={{ fontSize: "13px", opacity: 0.7, padding: "20px 0" }}>
            Nenhuma notificação no momento.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "280px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {notifications.map((n: any) => {
              const isClickable =
                n.type === "trade_claim" ||
                n.type === "collection_completed" ||
                n.type === "welcome_username";
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (isClickable) {
                      ui.closeModal();
                      if (n.type === "welcome_username") {
                        router.navigate({ to: "/clubedascolecionadoras/config" });
                      } else if (n.type === "collection_completed") {
                        router.navigate({
                          to: "/clubedascolecionadoras/album",
                          search: { tab: "colecoes" },
                        });
                      } else {
                        router.navigate({
                          to: "/clubedascolecionadoras/trocas",
                          search: { tab: "history" },
                        });
                      }
                    }
                  }}
                  style={{
                    position: "relative",
                    border: "1px solid rgba(194, 24, 91, 0.12)",
                    background: isClickable ? "#fff0f7" : "#fafafa",
                    borderRadius: "12px",
                    padding: "10px 32px 10px 12px",
                    textAlign: "left",
                    cursor: isClickable ? "pointer" : "default",
                    transition: "transform 0.1s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => removeNotification(n.id, e)}
                    title="Excluir notificação"
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "transparent",
                      border: "none",
                      color: "#999",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                    }}
                  >
                    <X size={14} />
                  </button>

                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      margin: 0,
                      color: isClickable ? "#9e1b4a" : "#444",
                      lineHeight: "1.4",
                    }}
                  >
                    {n.message}
                  </p>
                  <div style={{ fontSize: "9px", opacity: 0.5, marginTop: "4px" }}>
                    {new Date(n.date).toLocaleString("pt-BR")}
                  </div>
                  {isClickable && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#C2185B",
                        fontWeight: "bold",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      {n.type === "welcome_username"
                        ? "Ir para Configurações ➔"
                        : n.type === "collection_completed"
                          ? "Clique para ver ➔"
                          : "Clique para resgatar ➔"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <button
          className="btn soft"
          style={{ marginTop: "20px", width: "100%" }}
          onClick={() => ui.closeModal()}
        >
          Fechar
        </button>
      </div>,
    );
  };

  return (
    <div className="topbar flex justify-between items-center px-4 py-3 bg-white border-b border-pink-100 shadow-[0_2px_12px_rgba(158,27,74,0.03)]">
      <Link to="/clubedascolecionadoras" className="topbar-brand-link flex items-center">
        <img src="/logo_text.png" alt="Clube das Colecionadoras" className="h-6 object-contain" />
      </Link>

      <div className="topbar-status" aria-hidden="true">
        <b>{ownedCount}</b>
        <span>{pct}%</span>
        <small>{statusText}</small>
      </div>

      <div className="topbar-actions flex items-center gap-2">
        <button
          type="button"
          onClick={handleNotifications}
          className="topbar-icon-btn relative"
          aria-label="Notificações"
        >
          <Bell size={18} strokeWidth={2.5} />
          {hasUnseenNotifs && (
            <span
              className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"
              style={{ boxShadow: "0 0 6px #ef4444" }}
            />
          )}
        </button>
        <Link to="/clubedascolecionadoras/mural" className="topbar-icon-btn" aria-label="Mural">
          <Crown size={18} strokeWidth={2.5} />
        </Link>
        <Link
          to="/clubedascolecionadoras/config"
          className="topbar-icon-btn"
          aria-label="Configurações"
        >
          <Settings size={18} strokeWidth={2.5} />
        </Link>
        <button type="button" onClick={handleLogout} className="topbar-icon-btn" aria-label="Sair">
          <LogOut size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
