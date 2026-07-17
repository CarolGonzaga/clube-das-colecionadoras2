import React from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Crown, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { useUI } from "@/components/UIProvider";

interface TopBarProps {
  ownedCount: number;
  pct: number;
  statusText: string;
}

export default function TopBar({ ownedCount, pct, statusText }: TopBarProps) {
  const ui = useUI();

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.success) {
      localStorage.removeItem("recent_stickers");
      window.location.href = "/clubedascolecionadoras/login";
    } else {
      ui.toast("Erro ao sair da conta.");
    }
  };

  const handleNotifications = () => {
    ui.toast("Nenhuma notificacao nova.");
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
          className="topbar-icon-btn"
          aria-label="Notificacoes"
        >
          <Bell size={18} strokeWidth={2.5} />
        </button>
        <Link to="/clubedascolecionadoras/mural" className="topbar-icon-btn" aria-label="Mural">
          <Crown size={18} strokeWidth={2.5} />
        </Link>
        <Link
          to="/clubedascolecionadoras/config"
          className="topbar-icon-btn"
          aria-label="Configuracoes"
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
