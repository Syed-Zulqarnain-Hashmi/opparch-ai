"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Sparkles, TrendingUp, Briefcase, Building2,
  ShieldAlert, ArrowRight, Globe, CheckCircle2, Award, Zap, Target,
  RefreshCw
} from "lucide-react";
import { getAnalyticsOverview, getLeads, executeSearch } from "@/lib/api";

const GENERIC_SERVICES = [
  { name: "Full-Stack Web Development", tag: "Fast Engineering" },
  { name: "UI/UX & Mobile Apps", tag: "iOS / Android" },
  { name: "Custom Software & SaaS", tag: "Cloud Architecture" },
  { name: "AI / ML & Automation", tag: "LLM & Workflows" },
  { name: "SEO & Web Optimization", tag: "Organic Traffic" },
  { name: "E-commerce Solutions", tag: "Direct Sales" },
  { name: "Brand & Visual Identity", tag: "Design System" },
  { name: "Ongoing Support & Maintenance", tag: "24/7 Operations" }
];

export default function CommandDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [searchPrompt, setSearchPrompt] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Worldwide");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    getAnalyticsOverview().then((data) => setStats(data)).catch(console.error);
    getLeads().then((leads) => setRecentLeads(leads.slice(0, 5))).catch(console.error);
  }, []);

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPrompt.trim()) return;
    setIsSearching(true);
    try {
      await executeSearch({
        query: searchPrompt,
        country: selectedCountry,
        limit: 15,
      });
      window.location.href = `/opportunity-hunter?q=${encodeURIComponent(searchPrompt)}&c=${encodeURIComponent(selectedCountry)}`;
    } catch (err) {
      console.error(err);
      window.location.href = `/opportunity-hunter?q=${encodeURIComponent(searchPrompt)}&c=${encodeURIComponent(selectedCountry)}`;
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8" style={{ backgroundColor: "var(--background)" }}>
      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Opportunity Intelligence Command Center</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
                DISCOVER. ANALYZE. <span className="text-electric-500">GROW.</span>
              </h1>
              <p className="text-sm lg:text-base leading-relaxed max-w-xl font-medium" style={{ color: "var(--text-secondary)" }}>
                FIND THE OPPORTUNITIES BEHIND THE DATA. Unified AI intelligence platform to uncover high-potential business opportunities, digital gaps, and real-time market trends.
              </p>
            </div>

            {/* Central Search Box */}
            <form onSubmit={handleQuickSearch} className="space-y-3">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-electric-500" />
                <input
                  type="text"
                  value={searchPrompt}
                  onChange={(e) => setSearchPrompt(e.target.value)}
                  placeholder="e.g. Find restaurants in Dubai that don't have a professional website…"
                  className="w-full pl-12 pr-32 py-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition shadow-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--border)",
                    color: "var(--input-text)"
                  }}
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 px-4 py-2 rounded-lg bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 hover:to-royal-700 text-white text-xs font-bold transition shadow-electric-glow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSearching ? "Searching…" : "Discover"} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>Suggestions:</span>
                {[
                  "Restaurants in Dubai needing websites",
                  "Pharmacies in Islamabad with digital gap",
                  "Real estate in USA needing modern UX",
                  "Public IT Tenders in Pakistan",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSearchPrompt(chip)}
                    className="px-2.5 py-1 rounded-md border transition text-[11px] font-medium hover:text-electric-500 hover:border-electric-500/40"
                    style={{
                      backgroundColor: "var(--surface-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Hero Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border shadow-md"
              style={{ borderColor: "var(--border)" }}
            >
              <Image
                src="/images/hero-visual.png"
                alt="OPPARCH AI Opportunity Intelligence"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div
                className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl backdrop-blur-md border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)"
                }}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-electric-500" />
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>Multi-Source Discovery</span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>OpenStreetMap + PSX Feeds</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK KPI METRICS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Opportunities",
            value: stats?.total_leads || 523,
            change: "+14% vs last week",
            icon: Sparkles,
            color: "text-electric-500",
            bg: "bg-electric-500/10 border-electric-500/20",
          },
          {
            title: "High Priority Gaps",
            value: stats?.high_priority_leads || 142,
            change: "Score ≥ 80/100",
            icon: ShieldAlert,
            color: "text-amber-500",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            title: "Procurement Projects",
            value: stats?.total_projects || 48,
            change: "Public RFPs & Tenders",
            icon: Briefcase,
            color: "text-purple-500",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
          {
            title: "Market Telemetry",
            value: "Live Feeds",
            change: "PSX / Crypto Streams",
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border space-y-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)"
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{kpi.title}</span>
                <div className={`p-2 rounded-lg border ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{kpi.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{kpi.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MAIN DASHBOARD CONTENT GRID ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent High-Score Opportunities (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Target className="w-5 h-5 text-electric-500" />
                Recent High-Score Opportunities
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Top prioritized business leads with verified digital gaps</p>
            </div>
            <Link
              href="/leads"
              className="text-xs font-semibold text-electric-500 hover:underline flex items-center gap-1"
            >
              View Repository <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentLeads.map((lead) => {
              const score = lead.score?.opportunity_score ?? 85;
              return (
                <div
                  key={lead.id}
                  className="glass-panel p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-electric-500/40 transition"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)"
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{lead.name}</h3>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                        style={{
                          backgroundColor: "var(--surface-secondary)",
                          borderColor: "var(--border)",
                          color: "var(--text-secondary)"
                        }}
                      >
                        {lead.country} {lead.city ? `• ${lead.city}` : ""}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-electric-500/10 text-electric-500 border border-electric-500/20">
                        {lead.industry}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-1 font-medium" style={{ color: "var(--text-secondary)" }}>
                      {lead.score?.reasoning_summary || "Digital presence gap qualified for transformation."}
                    </p>
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span>Service Fit: <strong style={{ color: "var(--text-primary)" }}>{lead.services?.[0]?.service_name || "Website Development"}</strong></span>
                      <span>• {lead.has_website ? "Website Exists" : "No Website Found"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                        score >= 85 ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      }`}>
                        {score} / 100
                      </span>
                    </div>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="px-3 py-1.5 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 text-electric-500 text-xs font-bold border border-electric-500/30 transition flex items-center gap-1"
                    >
                      Audit <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Service Alignment Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className="glass-panel p-5 rounded-2xl border space-y-3"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)"
            }}
          >
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <Zap className="w-4 h-4 text-electric-500" />
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Service Solutions Catalog</h3>
            </div>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
              OPPARCH AI automatically maps detected business digital gaps to high-converting service solutions:
            </p>
            <div className="space-y-2">
              {GENERIC_SERVICES.map((srv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl border"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border)"
                  }}
                >
                  <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{srv.name}</span>
                  <span className="text-[10px] text-electric-500 font-mono font-bold bg-electric-500/10 px-1.5 py-0.5 rounded">{srv.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
