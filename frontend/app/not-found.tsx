"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Search, LineChart, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="relative w-20 h-20">
        <Image
          src="/images/logo-icon.png"
          alt="OPPARCH AI"
          fill
          className="object-contain"
          priority
        />
      </div>

      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-bold uppercase">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Page Not Found</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
          404 — Opportunity Not Located
        </h1>
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          The requested page or resource could not be found. Navigate to one of the active intelligence modules below.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 hover:to-royal-700 text-white text-xs font-bold transition shadow-electric-glow flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Command Center</span>
        </Link>
        <Link
          href="/opportunity-hunter"
          className="px-5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 hover:bg-electric-500/10"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <Search className="w-4 h-4 text-electric-500" />
          <span>Opportunity Hunter</span>
        </Link>
        <Link
          href="/market"
          className="px-5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 hover:bg-emerald-500/10"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <LineChart className="w-4 h-4 text-emerald-500" />
          <span>Market Terminal</span>
        </Link>
      </div>
    </div>
  );
}
