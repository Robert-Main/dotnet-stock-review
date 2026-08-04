import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockReview — Track, Review & Discuss Stocks",
  description:
    "Browse stocks, manage your portfolio, and leave reviews — powered by the StockReview API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-100">
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_55%)]" />
            <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
              {children}
            </main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
