import React, { useMemo } from "react";

export default function GlitterBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const size = Math.random() * 4 + 2; // 2px to 6px
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = Math.random() * 3 + 2; // 2s to 5s
      const delay = Math.random() * 5;
      const isStar = Math.random() > 0.5;

      return (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size,
            height: size,
            left: `${left}%`,
            top: `${top}%`,
            backgroundColor: isStar ? "#fff" : "rgba(255, 255, 255, 0.5)",
            boxShadow: isStar ? "0 0 6px 1px rgba(255, 255, 255, 0.8)" : "none",
            animation: `sparkle ${duration}s infinite ease-in-out`,
            animationDelay: `${delay}s`,
            zIndex: 0,
          }}
        />
      );
    });
  }, []);

  return <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">{particles}</div>;
}
