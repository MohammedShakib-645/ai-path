"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { MenuProvider } from "./MenuContext";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={open} onClose={() => setOpen(false)} />
      <main className="flex-1 min-w-0 px-4 md:px-8 py-5 max-w-[1400px] mx-auto w-full">
        <MenuProvider onMenu={() => setOpen(true)}>{children}</MenuProvider>
      </main>
    </div>
  );
}
