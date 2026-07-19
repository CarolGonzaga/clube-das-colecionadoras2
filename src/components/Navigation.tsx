import React from "react";
import { Link, useLocation } from "@tanstack/react-router";

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "/icons/home.png", label: "home", path: "/clubedascolecionadoras" },
  { icon: "/icons/album.png", label: "album", path: "/clubedascolecionadoras/album" },
  { icon: "/icons/quiz.png", label: "quiz", path: "/clubedascolecionadoras/quiz" },
  { icon: "/icons/registro.png", label: "pedidos", path: "/clubedascolecionadoras/registros" },
  { icon: "/icons/repetidas.png", label: "trocas", path: "/clubedascolecionadoras/trocas" },
  { icon: "/icons/loja.png", label: "loja", path: "/clubedascolecionadoras/loja" },
];

export default function Navigation({ pendingTradesCount = 0 }: { pendingTradesCount?: number }) {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (item: NavItem) => {
    if (item.path === "/clubedascolecionadoras") {
      return pathname === "/clubedascolecionadoras" || pathname === "/clubedascolecionadoras/";
    }
    return pathname.startsWith(item.path);
  };

  return (
    <nav className="club-navigation fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] bg-white border-t border-pink-100 shadow-[0_-4px_20px_rgba(158,27,74,0.06)] z-50">
      <div className="club-navigation-brand" aria-hidden="true">
        <img src="/logo_text.png" alt="" />
        <span>seu clube de historias e colecoes</span>
      </div>

      <div className="club-navigation-inner max-w-lg mx-auto flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`club-navigation-item flex flex-col items-center gap-0.5 min-w-[44px] cursor-pointer ${active ? "club-navigation-item-active" : ""}`}
            >
              <div className="club-navigation-icon w-7 h-7 flex items-center justify-center transition-transform relative">
                <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
                {item.path === "/clubedascolecionadoras/trocas" && pendingTradesCount > 0 && (
                  <span className="nav-trade-badge">
                    {pendingTradesCount > 9 ? "9+" : pendingTradesCount}
                  </span>
                )}
              </div>
              <span
                className={`nav-label text-[9px] ${active ? "nav-label-active text-[#9e1b4a] font-extrabold" : "text-[#bf2a5e]/70 font-semibold"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="club-navigation-footer" aria-hidden="true">
        <span>*</span>
        <p>Lendo Saficos</p>
      </div>
    </nav>
  );
}
