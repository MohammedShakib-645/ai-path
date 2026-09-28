import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "./SidebarWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full">
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
