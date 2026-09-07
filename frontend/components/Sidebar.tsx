"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Target, BarChart3, History, Download, Settings,
  Shield, FileText, Kanban, LineChart, Zap, Activity,
  Bell, FlaskConical, BookOpen, LayoutDashboard, Globe, Info, Mail, Laptop
} from "lucide-react";
import { useModule } from "@/lib/module-context";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const CLIENT_HUNTING_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Core Platform",
    items: [
      { href: "/", label: "Command Center", icon: <Home className="w-4 h-4" /> },
      { href: "/dashboard", label: "My Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: "/opportunity-hunter", label: "Opportunity Hunter", icon: <Search className="w-4 h-4" />, badge: "AI" },
    ],
  },
  {
    section: "Intelligence & Data",
    items: [
      { href: "/leads", label: "Leads Repository", icon: <Target className="w-4 h-4" />, badge: "REAL" },
      { href: "/crm", label: "CRM Pipeline", icon: <Kanban className="w-4 h-4" /> },
      { href: "/projects", label: "Project Hunter & RFPs", icon: <FileText className="w-4 h-4" />, badge: "AI" },
      { href: "/analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { href: "/history", label: "Search History", icon: <History className="w-4 h-4" /> },
      { href: "/exports", label: "CSV Export", icon: <Download className="w-4 h-4" /> },
    ],
  },
  {
    section: "Tools & Information",
    items: [
      { href: "/website-auditor", label: "Website Auditor", icon: <Laptop className="w-4 h-4" />, badge: "Tool" },
      { href: "/about", label: "About OPPARCH AI", icon: <Info className="w-4 h-4" /> },
      { href: "/contact", label: "Contact Us", icon: <Mail className="w-4 h-4" /> },
    ],
  },
];

const MARKET_INTELLIGENCE_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Market Terminal",
    items: [
      { href: "/market", label: "Market Terminal", icon: <LineChart className="w-4 h-4" />, badge: "LIVE" },
      { href: "/market/psx", label: "Pakistan Stock Market", icon: <Globe className="w-4 h-4" />, badge: "PSX" },
      { href: "/market/analysis", label: "AI Signal Scanner", icon: <Zap className="w-4 h-4" />, badge: "AI" },
      { href: "/market/alerts", label: "Alert Center", icon: <Bell className="w-4 h-4" /> },
    ],
  },
  {
    section: "Research & Tools",
    items: [
      { href: "/market/backtest", label: "Backtesting Engine", icon: <FlaskConical className="w-4 h-4" /> },
      { href: "/market/paper-trading", label: "Paper Trading", icon: <Activity className="w-4 h-4" /> },
      { href: "/market/news", label: "News & Sentiment", icon: <BookOpen className="w-4 h-4" /> },
      { href: "/market/accuracy", label: "Accuracy Tracker", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    section: "Tools & Information",
    items: [
      { href: "/about", label: "About OPPARCH AI", icon: <Info className="w-4 h-4" /> },
      { href: "/contact", label: "Contact Us", icon: <Mail className="w-4 h-4" /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeModule } = useModule();
  const { user } = useAuth();

  const navGroups = CLIENT_HUNTING_NAV;
  const moduleColor = "from-electric-500 to-royal-600";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r overflow-y-auto transition-colors duration-200"
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderColor: "var(--border)",
      }}
    >
      {/* Module Indicator Strip */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${moduleColor}`} />

      {/* Logo area in sidebar */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="relative w-7 h-7 flex-shrink-0">
          <Image
            src="/images/logo-icon.png"
            alt="OPPARCH AI"
            width={28}
            height={28}
            className="object-contain w-full h-full"
          />
        </div>
        <span className="text-xs font-black tracking-tight" style={{ color: "var(--sidebar-text)" }}>
          OPPARCH <span className="text-electric-400">AI</span>
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-5 pt-4">
        {navGroups.map((group) => (
          <div key={group.section}>
            <p
              className="text-[9px] font-black tracking-widest uppercase mb-2 px-2"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      active
                        ? `bg-gradient-to-r ${moduleColor} text-white shadow-sm font-bold`
                        : ""
                    }`}
                    style={
                      !active
                        ? {
                            color: "var(--sidebar-text)",
                            opacity: 0.75,
                          }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sidebar-hover)";
                        (e.currentTarget as HTMLElement).style.opacity = "1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLElement).style.opacity = "0.75";
                      }
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                          active
                            ? "bg-white/20 text-white"
                            : item.badge === "LIVE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : item.badge === "PSX"
                            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                            : item.badge === "Tool"
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "bg-electric-500/20 text-electric-400 border border-electric-500/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings & Admin */}
      <div
        className="p-3 border-t space-y-0.5"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
            isActive("/settings")
              ? `bg-gradient-to-r ${moduleColor} text-white font-bold`
              : ""
          }`}
          style={
            !isActive("/settings")
              ? { color: "var(--sidebar-text)", opacity: 0.75 }
              : {}
          }
        >
          <Settings className="w-4 h-4" /> AI &amp; Settings
        </Link>
        {user?.role === "ADMIN" && (
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
              isActive("/admin")
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                : "text-amber-400 hover:bg-amber-500/10"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Panel</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
