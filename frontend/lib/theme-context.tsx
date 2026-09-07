"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("opparch_theme") as ThemeMode | null;
    const pref = stored || "dark";
    setTheme(pref);
    applyTheme(pref);
  }, []);

  function applyTheme(t: ThemeMode) {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("opparch_theme", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
