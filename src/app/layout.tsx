import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "./SidebarWrapper";
import Toaster from "../components/Toaster";
import KeyInjector from "../components/KeyInjector";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display font for H1/hero — editorial contrast against the UI font.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
  variable: "--font-display",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AI-PATH — Your Personal AI Tutor",
  description: "Personalized learning paths, interactive quizzes, progress tracking and AI guidance.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F6FB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* Dark by default; an explicit stored "light" choice is respected (no flash). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('ai-path-theme')!=='light')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        <SidebarWrapper>{children}</SidebarWrapper>
        <Toaster />
        <KeyInjector />
      </body>
    </html>
  );
}
