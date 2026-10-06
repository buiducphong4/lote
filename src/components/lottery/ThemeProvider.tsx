"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SKIN,
  MODE_STORAGE_KEY,
  SKIN_STORAGE_KEY,
  isSkinId,
  type SkinId
} from "@/lib/theme";

type ThemeValue = {
  skin: SkinId;
  setSkin: (next: SkinId) => void;
  dark: boolean;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkinState] = useState<SkinId>(DEFAULT_SKIN);
  const [dark, setDark] = useState(false);

  // The bootstrap script already wrote both onto <html> before paint, so read
  // back from the DOM rather than re-deriving and risking a mismatch.
  useEffect(() => {
    const root = document.documentElement;
    const current = root.getAttribute("data-skin");
    setSkinState(isSkinId(current) ? current : DEFAULT_SKIN);
    setDark(root.classList.contains("dark"));
  }, []);

  const setSkin = useCallback((next: SkinId) => {
    setSkinState(next);
    document.documentElement.setAttribute("data-skin", next);
    writeStorage(SKIN_STORAGE_KEY, next);
  }, []);

  const toggleDark = useCallback(() => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      writeStorage(MODE_STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  const value = useMemo<ThemeValue>(() => ({ skin, setSkin, dark, toggleDark }), [skin, setSkin, dark, toggleDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside a ThemeProvider.");
  }
  return value;
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Blocked storage: the choice still applies for this session.
  }
}
