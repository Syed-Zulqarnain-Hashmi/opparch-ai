"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ModuleType = "CLIENT_HUNTING" | "MARKET_INTELLIGENCE";

interface ModuleContextValue {
  activeModule: ModuleType;
  setModule: (m: ModuleType) => void;
}

const ModuleContext = createContext<ModuleContextValue>({
  activeModule: "CLIENT_HUNTING",
  setModule: () => {},
});

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<ModuleType>("CLIENT_HUNTING");

  // Persist module selection in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("opparch_active_module") as ModuleType | null;
    if (stored === "CLIENT_HUNTING" || stored === "MARKET_INTELLIGENCE") {
      setActiveModule(stored);
    }
  }, []);

  const setModule = (m: ModuleType) => {
    setActiveModule(m);
    localStorage.setItem("opparch_active_module", m);
  };

  return (
    <ModuleContext.Provider value={{ activeModule, setModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  return useContext(ModuleContext);
}
