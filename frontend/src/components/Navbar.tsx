"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navLinkClass = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-emerald-500/10 text-emerald-400"
      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-105">
              <TrendingUp size={20} strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight text-zinc-50">
              Stock<span className="text-emerald-400">Review</span>
            </span>
          </Link>

          {isAuthenticated && (
            <div className="hidden items-center gap-1 md:flex">
              <Link href="/" className={navLinkClass(pathname === "/")}>
                <LayoutDashboard size={16} />
                Markets
              </Link>
              <Link
                href="/portfolio"
                className={navLinkClass(pathname === "/portfolio")}
              >
                <BarChart3 size={16} />
                Portfolio
              </Link>
              <Link
                href="/stocks/new"
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <PlusCircle size={16} />
                Add stock
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-zinc-100">
                  {user.userName}
                </p>
                <p className="text-xs leading-tight text-zinc-500">
                  {user.email}
                </p>
              </div>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-sm font-bold text-zinc-100 ring-1 ring-zinc-700 sm:flex">
                {user.userName?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => setMobileOpen((o) => !o)}
                  title="Menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition-colors hover:border-zinc-700 md:hidden"
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && isAuthenticated && (
        <div className="border-t border-zinc-800/70 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass(pathname === "/")}
            >
              <LayoutDashboard size={16} />
              Markets
            </Link>
            <Link
              href="/portfolio"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass(pathname === "/portfolio")}
            >
              <BarChart3 size={16} />
              Portfolio
            </Link>
            <Link
              href="/stocks/new"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
            >
              <PlusCircle size={16} />
              Add stock
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
