"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Target, Search, Briefcase, KanbanSquare, History, Download, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, User, Zap 
} from 'lucide-react';
import { getSearchHistory, getLeads, getCrmPipeline, getCSVExportHistory, checkOllamaStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function UserDashboardPage() {
  const { user, isLoggedIn } = useAuth();
  const [searches, setSearches] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [crmDeals, setCrmDeals] = useState<number>(0);
  const [exports, setExports] = useState<any[]>([]);
  const [ollamaInfo, setOllamaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sHist, lList, cPipeline, eHist, oStat] = await Promise.all([
          getSearchHistory(),
          getLeads(),
          getCrmPipeline(),
          getCSVExportHistory(),
          checkOllamaStatus()
        ]);
        setSearches(sHist || []);
        setLeads(lList || []);
        
        let crmCount = 0;
        if (cPipeline) {
          Object.values(cPipeline).forEach((arr: any) => { crmCount += arr.length; });
        }
        setCrmDeals(crmCount);
        setExports(eHist || []);
        setOllamaInfo(oStat);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl"
        style={{ border: "1px solid var(--border)" }}
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>MY OPPARCH AI DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
            Welcome Back, {user?.full_name || 'Guest User'}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Personalized opportunity telemetry, search history, and service alignment.
          </p>
        </div>

        <Link
          href="/opportunity-hunter"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 hover:to-royal-700 text-white text-xs font-bold transition shadow-electric-glow flex items-center gap-2 self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Launch Opportunity Hunter</span>
        </Link>
      </div>

      {/* KPI STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="glass-panel p-5 rounded-2xl space-y-2"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
            <span className="text-xs font-semibold">My Searches</span>
            <History className="w-4 h-4 text-electric-500" />
          </div>
          <p className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            {searches.length}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Search Executions</p>
        </div>

        <div
          className="glass-panel p-5 rounded-2xl space-y-2"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
            <span className="text-xs font-semibold">Saved Opportunities</span>
            <Search className="w-4 h-4 text-electric-500" />
          </div>
          <p className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            {leads.length}
          </p>
          <p className="text-[10px] text-emerald-500 font-semibold">Target Leads</p>
        </div>

        <div
          className="glass-panel p-5 rounded-2xl space-y-2"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
            <span className="text-xs font-semibold">CRM Deals</span>
            <KanbanSquare className="w-4 h-4 text-electric-500" />
          </div>
          <p className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            {crmDeals}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>In Active Pipeline</p>
        </div>

        <div
          className="glass-panel p-5 rounded-2xl space-y-2"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
            <span className="text-xs font-semibold">CSV Exports</span>
            <Download className="w-4 h-4 text-electric-500" />
          </div>
          <p className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            {exports.length}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Generated CSV Files</p>
        </div>
      </div>

      {/* AI ENGINE TELEMETRY BAR */}
      <div
        className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          backgroundColor: ollamaInfo?.online ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
          border: `1px solid ${ollamaInfo?.online ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"}`
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-ping"
            style={{ backgroundColor: ollamaInfo?.online ? "#10B981" : "#F59E0B" }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                {ollamaInfo?.online ? "LOCAL AI ENGINE: ONLINE (FREE MODE)" : "LOCAL AI ENGINE: OFFLINE"}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-electric-500/15 text-electric-500">
                {ollamaInfo?.active_model || 'qwen3:4b'}
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {ollamaInfo?.message || 'Ollama is running at http://127.0.0.1:11434 with zero API costs.'}
            </p>
          </div>
        </div>

        <Link
          href="/settings"
          className="text-xs font-bold text-electric-500 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Configure AI Settings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* RECENT SEARCHES & TOP LEADS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Searches */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <History className="w-4 h-4 text-electric-500" />
              Recent Search Queries
            </h2>
            <Link href="/history" className="text-xs text-electric-500 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {searches.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-3"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold line-clamp-1" style={{ color: "var(--text-primary)" }}>
                    {s.query}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    📍 {s.country} {s.city ? `• ${s.city}` : ''} | 🏢 {s.industry || 'All Industries'}
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: "var(--badge-bg)",
                    color: "var(--badge-text)"
                  }}
                >
                  {s.results_count} found
                </span>
              </div>
            ))}

            {searches.length === 0 && (
              <div
                className="p-8 text-center text-xs border border-dashed rounded-xl"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                No search history yet. Try searching in Opportunity Hunter!
              </div>
            )}
          </div>
        </div>

        {/* Right: Saved Opportunities */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Target className="w-4 h-4 text-electric-500" />
              Top Discovered Opportunities
            </h2>
            <Link href="/leads" className="text-xs text-electric-500 hover:underline">
              View Repository
            </Link>
          </div>

          <div className="space-y-3">
            {leads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-3"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>
                    {lead.name}
                  </h3>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    📍 {lead.country} • {lead.industry}
                  </p>
                  <p className="text-[10px] text-electric-500 font-semibold">
                    Service: {lead.services?.[0]?.service_name || 'Website Development'}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className="inline-block px-2 py-1 rounded text-xs font-black"
                    style={{
                      backgroundColor: (lead.score?.opportunity_score ?? 85) >= 80 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: (lead.score?.opportunity_score ?? 85) >= 80 ? "#10B981" : "#F59E0B"
                    }}
                  >
                    {lead.score?.opportunity_score ?? 85} / 100
                  </span>
                  <div className="mt-1">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-[10px] font-bold text-electric-500 hover:underline"
                    >
                      Audit Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <div
                className="p-8 text-center text-xs border border-dashed rounded-xl"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                No saved opportunities found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
