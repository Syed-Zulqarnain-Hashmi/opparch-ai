"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Sun, Moon, LogOut, User,
  TrendingUp, Search, Info, Mail
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useModule, ModuleType } from "@/lib/module-context";
import { useTheme } from "@/lib/theme-context";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const { activeModule, setModule } = useModule();
  const { toggleTheme, isDark } = useTheme();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleModuleSelect = (moduleId: ModuleType) => {
    setModule(moduleId);
    if (moduleId === "MARKET_INTELLIGENCE" && !pathname.startsWith("/market")) {
      router.push("/market");
    } else if (moduleId === "CLIENT_HUNTING" && pathname.startsWith("/market")) {
      router.push("/");
    }
  };

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md shadow-sm transition-colors duration-200"
      style={{
        backgroundColor: "var(--header-bg)",
        borderColor: "var(--header-border)",
      }}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3 px-4 py-2">
        {/* ── Brand Logo ──────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-black text-lg tracking-tight flex-shrink-0 group"
        >
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image
              src="/images/logo-icon.png"
              alt="OPPARCH AI Logo"
              width={36}
              height={36}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <span
            className="hidden sm:block font-black tracking-tight text-base"
            style={{ color: "var(--header-text)" }}
          >
            OPPARCH
            <span className="text-electric-500 ml-0.5">AI</span>
          </span>
        </Link>

        {/* ── Client Hunting Indicator ─────────────────────────── */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-shrink-0 bg-electric-500/10 border-electric-500/30 text-electric-400 text-xs font-bold"
        >
          <Search className="w-3.5 h-3.5 text-electric-500" />
          <span>DevArcher Opportunity Hunter</span>
        </div>

        {/* ── Right Controls ───────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* About Link */}
          <Link
            href="/about"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--border)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <Info className="w-3.5 h-3.5 text-electric-500" />
            <span className="hidden md:inline">About</span>
          </Link>

          {/* Contact Link */}
          <Link
            href="/contact"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--border)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <Mail className="w-3.5 h-3.5 text-electric-500" />
            <span className="hidden lg:inline">Contact</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-8 h-8 rounded-lg border flex items-center justify-center transition"
            style={{
              backgroundColor: "var(--surface-secondary)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {isDark
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            }
          </button>

          {/* Auth Controls */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-electric-500 to-royal-600 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span
                  className="text-xs font-semibold max-w-[100px] truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.full_name}
                </span>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30 transition"
                  >
                    ADMIN
                  </Link>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg border flex items-center justify-center transition hover:text-red-500"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                }}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold transition"
                style={{ color: "var(--text-secondary)" }}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-electric-500 to-royal-600 text-white text-xs font-bold shadow-electric-glow hover:from-electric-600 hover:to-royal-700 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
