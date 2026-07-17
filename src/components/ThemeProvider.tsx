"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import GlitterBackground from "./GlitterBackground";

interface ThemeContextType {
  enabledStyles: string[];
  setEnabledStyles: (styles: string[]) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialStyles,
}: {
  children: React.ReactNode;
  initialStyles: string[];
}) {
  const [enabledStyles, setEnabledStylesState] = useState<string[]>(initialStyles);

  const setEnabledStyles = (styles: string[]) => {
    setEnabledStylesState(styles);
  };

  useEffect(() => {
    setEnabledStylesState(initialStyles);
  }, [initialStyles]);

  useEffect(() => {
    const root = document.documentElement;
    const isLilac = enabledStyles.includes("lilac");
    const isAvatarNeon = enabledStyles.includes("avatar-neon-frame");
    const isDark = enabledStyles.includes("theme-dark");
    const isGoldFrame = enabledStyles.includes("goldframe");

    root.classList.toggle("theme-lilac", isLilac);
    root.classList.toggle("dark", isDark);
    root.classList.toggle("goldframe-enabled", isGoldFrame);
    document.body.classList.toggle("avatar-neon-frame-enabled", isAvatarNeon);
  }, [enabledStyles]);

  return (
    <ThemeContext.Provider value={{ enabledStyles, setEnabledStyles }}>
      {enabledStyles.includes("glitter") && <GlitterBackground />}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
