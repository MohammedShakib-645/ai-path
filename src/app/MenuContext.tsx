"use client";
import { createContext, useContext } from "react";

const MenuContext = createContext<(() => void) | undefined>(undefined);

export function MenuProvider({ onMenu, children }: { onMenu: () => void; children: React.ReactNode }) {
  return <MenuContext value={onMenu}>{children}</MenuContext>;
}

export function useMenu() {
  return useContext(MenuContext);
}
