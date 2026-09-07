"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase, Globe, ExternalLink, Calendar, Award, CheckCircle2,
  Filter, Sparkles, Building2, FileText, RefreshCw, Search, Loader2,
  ArrowRight, Zap, Tag, Wifi, WifiOff, Download, LayoutGrid, Cpu
} from "lucide-react";
import {
  getProcurementProjects, refreshProjectsFromProviders,
  getFreelancePlatformStatuses, matchProjectWithAI, downloadProjectsCSVBlob
} from "@/lib/api";

const CATEGORY_TABS = ["All", "FREELANCE", "CLIENT_PROJECT_REQUEST", "PROCUREMENT", "RFP", "TENDER"];
const PLATFORM_LABELS: Record<string, { color: string; icon: string }> = {
  Upwork: { color: "text-green-500", icon: "🟢" },
  Freelancer: { color: "text-blue-500", icon: "🔵" },
  Guru: { color: "text-amber-500", icon: "🟡" },
  PeoplePerHour: { color: "text-purple-400", icon: "🟣" },
  Contra: { color: "text-cyan-500", icon: "🔵" },
  Workana: { color: "text-emerald-500", icon: "🟢" },
};

export default function ProjectsHunterPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [platformStatuses, setPlatformStatuses] = useState<any[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<Record<string, any>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [showPlatforms, setShowPlatforms] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchPlatformStatuses();
  }, [selectedCategory]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getProcurementProjects({
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setProjects(data || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlatformStatuses = async () => {
    try {
      const res = await getFreelancePlatformStatuses();
      setPlatformStatuses(res?.platform_statuses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await refreshProjectsFromProviders();
      await fetchProjects();
      await fetchPlatformStatuses();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAIMatch = async (p: any) => {
    const projId = String(p.id);
    setAnalyzingId(projId);
    setExpandedProject(projId);
    try {
      const res = await matchProjectWithAI({
        title: p.title,
        description: p.ai_summary || p.title,
        budget: p.estimated_budget || "",
      });
      setAiResult((prev) => ({ ...prev, [projId]: res }));
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const blob = await downloadProjectsCSVBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opparch_projects_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const filtered = projects;

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Header Banner ─────────────────────────────────────── */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl border"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>ENGINE B — REAL CLIENT PROJECT HUNTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              Client Project Requests &amp; Public RFPs
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
              Discovers real client project requests from Upwork, Freelancer, and public procurement boards. AI evaluates each project against DevArcher capabilities.
            </p>
            {lastRefreshed && (
              <p className="text-[11px] text-emerald-500 font-semibold">✓ Last refreshed: {lastRefreshed}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Fetching Real Projects…" : "Refresh Real Data"}
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={downloadingCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition disabled:opacity-50"
              style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingCsv ? "Downloading…" : "Export CSV"}
            </button>

            <button
              onClick={() => setShowPlatforms(!showPlatforms)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold"
              style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Providers
            </button>
          </div>
        </div>
      </div>

      {/* ── Provider Status Panel ─────────────────────────────── */}
      {showPlatforms && (
        <div
          className="glass-panel p-5 rounded-2xl border space-y-3"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Wifi className="w-4 h-4 text-electric-500" />
            Freelance Platform Connection Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(platformStatuses.length > 0 ? platformStatuses : [
              { platform: "Upwork", status: "ONLINE", count: 0 },
              { platform: "Freelancer", status: "ONLINE", count: 0 },
              { platform: "Guru", status: "API/public access required", count: 0 },
              { platform: "PeoplePerHour", status: "API/public access required", count: 0 },
              { platform: "Contra", status: "API/public access required", count: 0 },
              { platform: "Workana", status: "API/public access required", count: 0 },
            ]).map((ps) => {
              const isOnline = ps.status === "ONLINE";
              return (
                <div
                  key={ps.platform}
                  className="p-3 rounded-xl border text-center space-y-1"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: isOnline ? "rgba(34,197,94,0.4)" : "var(--border)"
                  }}
                >
                  <div className="flex items-center justify-center gap-1 text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    <span>{PLATFORM_LABELS[ps.platform]?.icon || "🔲"}</span>
                    <span>{ps.platform}</span>
                  </div>
                  <span className={`text-[10px] font-black ${isOnline ? "text-emerald-500" : "text-amber-500"}`}>
                    {isOnline ? `✓ Live (${ps.count})` : "API Key Required"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Guru, PeoplePerHour, Contra, and Workana require API credentials. Configure in Admin → Provider Settings. Upwork and Freelancer use public authorized feeds.
          </p>
        </div>
      )}

      {/* ── Search & Filter Bar ───────────────────────────────── */}
      <div
        className="glass-panel p-4 rounded-2xl border flex flex-wrap items-center gap-3"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-48 flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project title, client, skill…"
            className="flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border)",
              color: "var(--input-text)"
            }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                  : "border"
              }`}
              style={selectedCategory !== cat ? { backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
            >
              {cat === "All" ? "All Types" : cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Projects Feed ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading real client project requests…
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-panel p-12 rounded-2xl border text-center space-y-3"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Briefcase className="w-8 h-8 mx-auto" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>No verified real data available from the configured provider.</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click "Refresh Real Data" to discover live client projects from authorized feeds.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const projId = String(p.id);
            const isExpanded = expandedProject === projId;
            const aiRes = aiResult[projId];
            const isAnalyzing = analyzingId === projId;

            return (
              <div
                key={projId}
                className="glass-panel rounded-2xl border overflow-hidden"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                {/* Project Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {p.source_name || "Project Board"}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          p.devarcher_fit_score >= 90 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                          p.devarcher_fit_score >= 75 ? "bg-electric-500/10 text-electric-500 border-electric-500/30" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/30"
                        }`}>
                          {p.devarcher_fit_score}% Fit Score
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                          {p.project_type?.replace(/_/g, " ") || "PROJECT REQUEST"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          REAL DATA
                        </span>
                      </div>
                      <h3 className="text-sm font-black leading-snug" style={{ color: "var(--text-primary)" }}>{p.title}</h3>
                      <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        <span>🏢 {p.organization || "Client"}</span>
                        <span>📍 {p.country} {p.city ? `• ${p.city}` : ""}</span>
                        {p.estimated_budget && <span>💰 {p.estimated_budget}</span>}
                        {p.deadline && <span>📅 {p.deadline}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      {p.source_url && (
                        <a
                          href={p.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl border text-electric-500 hover:bg-electric-500/10 transition"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleAIMatch(p)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold disabled:opacity-50 transition"
                      >
                        {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                        <span>{isAnalyzing ? "Analyzing…" : "AI Match"}</span>
                      </button>
                    </div>
                  </div>

                  {p.ai_summary && (
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {p.ai_summary.slice(0, 250)}{p.ai_summary.length > 250 ? "…" : ""}
                    </p>
                  )}

                  {p.requirements?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.requirements.slice(0, 6).map((r: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded border font-semibold"
                          style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Match Result Drawer */}
                {isExpanded && aiRes && (
                  <div
                    className="border-t p-5 space-y-4"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-secondary)" }}
                  >
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>DevArcher AI Opportunity Analysis</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                        {aiRes.ai_powered_by || "Ollama / Rule Engine"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl border space-y-1 text-center" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] block uppercase font-bold" style={{ color: "var(--text-muted)" }}>Fit Score</span>
                        <span className="text-xl font-black text-emerald-500">{aiRes.fit_score || aiRes.opportunity_score}%</span>
                      </div>
                      <div className="p-3 rounded-xl border space-y-1 text-center" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] block uppercase font-bold" style={{ color: "var(--text-muted)" }}>Est. Value</span>
                        <span className="text-xs font-black" style={{ color: "var(--text-primary)" }}>{aiRes.estimated_project_value}</span>
                      </div>
                      <div className="p-3 rounded-xl border space-y-1 text-center" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] block uppercase font-bold" style={{ color: "var(--text-muted)" }}>Urgency</span>
                        <span className="text-xs font-black text-amber-500">{aiRes.urgency}</span>
                      </div>
                      <div className="p-3 rounded-xl border space-y-1 text-center" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] block uppercase font-bold" style={{ color: "var(--text-muted)" }}>Complexity</span>
                        <span className="text-xs font-black text-electric-500">{aiRes.complexity}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase mb-1" style={{ color: "var(--text-muted)" }}>Recommended DevArcher Service</p>
                      <p className="text-sm font-bold text-purple-400">{aiRes.recommended_service}</p>
                    </div>

                    {aiRes.discovery_questions?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase mb-2" style={{ color: "var(--text-muted)" }}>Client Discovery Questions</p>
                        <ol className="space-y-1 list-decimal list-inside text-xs" style={{ color: "var(--text-secondary)" }}>
                          {aiRes.discovery_questions.map((q: string, i: number) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {aiRes.proposal_draft && (
                      <div>
                        <p className="text-[10px] font-black uppercase mb-2" style={{ color: "var(--text-muted)" }}>Generated Proposal Draft</p>
                        <pre className="text-xs whitespace-pre-wrap leading-relaxed p-3 rounded-xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)", fontFamily: "inherit" }}>
                          {aiRes.proposal_draft}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Summary Footer ─────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div
          className="glass-panel p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <span>
            Showing <strong style={{ color: "var(--text-primary)" }}>{filtered.length}</strong> verified opportunities
          </span>
          <span className="px-2 py-1 rounded border text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-bold">
            ✓ REAL DATA — Sources shown per card
          </span>
        </div>
      )}
    </div>
  );
}
