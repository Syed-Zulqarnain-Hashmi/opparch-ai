"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Target, Search, Filter, Globe, Building2, Phone, Mail,
  ExternalLink, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, 
  ShieldCheck, Download, Zap, Play, Square, Send, X, Loader2, Briefcase, Bookmark, Award
} from "lucide-react";
import { 
  getLeads, getLeadStats, refreshLeads, downloadLeadsCSVBlob,
  generateOutreachEmail, sendOutreachEmail, getProcurementProjects,
  updateLeadCrmStage
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const REPO_TABS = [
  { id: "all", label: "All Leads" },
  { id: "real", label: "Real Leads" },
  { id: "projects", label: "Project Leads" },
  { id: "business", label: "Business Leads" },
  { id: "saved", label: "Saved Leads" },
  { id: "researching", label: "Researching" },
  { id: "ready_for_outreach", label: "Ready for Outreach" },
  { id: "contacted", label: "Contacted" },
  { id: "replied", label: "Replied" },
  { id: "interested", label: "Interested" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export default function LeadsRepositoryPage() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedTab, setSelectedTab] = useState("all");
  const [lastUpdatedText, setLastUpdatedText] = useState("Just now");
  const [newCount, setNewCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  
  // Live discovery cycle state
  const [isLiveDiscovery, setIsLiveDiscovery] = useState(false);
  const discoveryIntervalRef = useRef<any>(null);

  // Outreach Modal state
  const [activeOutreachLead, setActiveOutreachLead] = useState<any>(null);
  const [outreachSubject, setOutreachSubject] = useState("");
  const [outreachBody, setOutreachBody] = useState("");
  const [outreachRecipient, setOutreachRecipient] = useState("");
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [outreachSuccessMsg, setOutreachSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      const [leadsData, statsData, projectsData] = await Promise.all([
        getLeads(),
        getLeadStats().catch(() => null),
        getProcurementProjects().catch(() => [])
      ]);
      setLeads(leadsData || []);
      setStats(statsData);
      setProjects(projectsData || []);
      setLastUpdatedText(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error loading leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live Discovery Toggle
  const toggleLiveDiscovery = () => {
    if (isLiveDiscovery) {
      clearInterval(discoveryIntervalRef.current);
      setIsLiveDiscovery(false);
    } else {
      setIsLiveDiscovery(true);
      handleRefreshRealData();
      discoveryIntervalRef.current = setInterval(() => {
        handleRefreshRealData();
      }, 30000);
    }
  };

  const handleRefreshRealData = async () => {
    setRefreshing(true);
    try {
      const res = await refreshLeads("Pakistan", "Islamabad", "Medical Stores");
      setNewCount(res?.new_leads || 0);
      setUpdatedCount(res?.updated_leads || 0);
      await loadData();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadCsv = async () => {
    setExporting(true);
    try {
      const blob = await downloadLeadsCSVBlob(isAdmin);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opparch_leads_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download CSV.");
    } finally {
      setExporting(false);
    }
  };

  const handleOpenOutreach = async (lead: any) => {
    setActiveOutreachLead(lead);
    setOutreachRecipient(lead.email || "client@business.com");
    setGeneratingOutreach(true);
    setOutreachSuccessMsg("");

    try {
      const draft = await generateOutreachEmail(lead.id);
      setOutreachSubject(draft.subject);
      setOutreachBody(draft.body);
      if (draft.has_recipient_email) {
        setOutreachRecipient(draft.recipient_email);
      }
    } catch (err) {
      console.error("Failed to generate outreach email:", err);
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const handleSendOutreach = async () => {
    if (!activeOutreachLead || !outreachRecipient.trim()) return;
    setSendingOutreach(true);

    try {
      const res = await sendOutreachEmail({
        lead_id: activeOutreachLead.id,
        recipient_email: outreachRecipient.trim(),
        subject: outreachSubject,
        body: outreachBody,
        mode: "MANUAL"
      });
      setOutreachSuccessMsg(res.message || "Email successfully dispatched!");
      setTimeout(() => {
        setActiveOutreachLead(null);
        loadData();
      }, 1800);
    } catch (err: any) {
      alert(err.message || "Failed to send outreach email.");
    } finally {
      setSendingOutreach(false);
    }
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      await updateLeadCrmStage(leadId, newStage);
      await loadData();
    } catch (err: any) {
      console.error("Stage update error:", err);
      alert(err.message || "Failed to update lead stage.");
    }
  };

  const countries = ["All", ...Array.from(new Set(leads.map((l) => l.country).filter(Boolean)))];

  // Filtering based on tab, country, search
  const filtered = leads.filter((l) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      l.name?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q);
    const matchesCountry = selectedCountry === "All" || l.country === selectedCountry;

    let matchesTab = true;
    if (selectedTab === "real") {
      matchesTab = !l.is_demo_data;
    } else if (selectedTab === "business") {
      matchesTab = true;
    } else if (selectedTab === "saved") {
      matchesTab = l.is_saved || l.pipeline_stage !== "NEW";
    } else if (["researching", "ready_for_outreach", "contacted", "replied", "interested", "won", "lost"].includes(selectedTab)) {
      matchesTab = (l.pipeline_stage || "").toLowerCase() === selectedTab;
    }

    return matchesSearch && matchesCountry && matchesTab;
  });

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Top Header & Actions ─────────────────────────────── */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-semibold">
            <Target className="w-3.5 h-3.5" />
            <span>CENTRALIZED LEADS REPOSITORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Leads Repository
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Complete audit trail of verified business opportunities, project procurement leads, and AI deal conversion telemetry.
          </p>
          <div className="flex items-center gap-3 text-[11px] font-semibold pt-1">
            <span className="text-emerald-500">✓ Last updated: {lastUpdatedText}</span>
            {newCount > 0 && <span className="text-electric-500">+{newCount} new</span>}
            {updatedCount > 0 && <span style={{ color: "var(--text-muted)" }}>{updatedCount} verified</span>}
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>EXPORT ALL LEADS CSV</span>
          </button>

          <button
            onClick={handleRefreshRealData}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:opacity-95 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>REFRESH REAL DATA</span>
          </button>

          <button
            onClick={toggleLiveDiscovery}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isLiveDiscovery
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500"
                : "border"
            }`}
            style={!isLiveDiscovery ? { borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface-secondary)" } : {}}
          >
            {isLiveDiscovery ? (
              <>
                <Square className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                <span>Auto-Refresh: ON</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-electric-500" />
                <span>Auto-Refresh: OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Repository Navigation Tabs ────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 border-b pb-3" style={{ borderColor: "var(--border)" }}>
        {REPO_TABS.map((tab) => {
          const isActive = selectedTab === tab.id;
          let badgeCount = null;
          if (tab.id === "all") badgeCount = leads.length;
          else if (tab.id === "real") badgeCount = leads.filter((l) => !l.is_demo_data).length;
          else if (tab.id === "projects") badgeCount = projects.length;
          else if (tab.id === "business") badgeCount = leads.length;
          else if (["researching", "ready_for_outreach", "contacted", "replied", "interested", "won", "lost"].includes(tab.id)) {
            badgeCount = leads.filter((l) => (l.pipeline_stage || "").toLowerCase() === tab.id).length;
          }

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isActive
                  ? "bg-gradient-to-r from-electric-500 to-royal-600 text-white shadow-md"
                  : "border hover:bg-slate-700/10"
              }`}
              style={!isActive ? { backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
            >
              <span>{tab.label}</span>
              {badgeCount !== null && badgeCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : "bg-electric-500/10 text-electric-500"
                }`}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────── */}
      <div
        className="glass-panel p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search business name, city, industry…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border)",
              color: "var(--input-text)"
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Country:</span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border focus:outline-none"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border)",
              color: "var(--input-text)"
            }}
          >
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── PROJECT LEADS TAB VIEW ────────────────────────────── */}
      {selectedTab === "projects" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              Project &amp; Freelance Opportunities ({projects.length})
            </h3>
            <Link href="/projects" className="text-xs text-electric-500 hover:underline font-bold flex items-center gap-1">
              <span>View Full Project Hunter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="glass-panel p-5 rounded-2xl border space-y-3"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {p.source_name || "Project Board"}
                    </span>
                    <h4 className="text-sm font-black mt-1" style={{ color: "var(--text-primary)" }}>{p.title}</h4>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>📍 {p.country} {p.city ? `• ${p.city}` : ""}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-500 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {p.devarcher_fit_score}% Fit
                  </span>
                </div>
                {p.estimated_budget && (
                  <p className="text-xs font-mono font-bold text-amber-500">Budget: {p.estimated_budget}</p>
                )}
                {p.ai_summary && (
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>{p.ai_summary}</p>
                )}
                {p.source_url && (
                  <a
                    href={p.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-electric-500 hover:underline font-bold"
                  >
                    <span>View Project Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── BUSINESS LEADS GRID VIEW ────────────────────────── */
        <div>
          {loading ? (
            <div className="py-20 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-electric-500" />
              Loading verified leads…
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="glass-panel p-12 rounded-2xl border text-center space-y-3"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <Target className="w-8 h-8 mx-auto" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>No verified real data available in this view.</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click "REFRESH REAL DATA" or execute a search in Opportunity Hunter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((lead) => {
                const score = lead.score?.opportunity_score ?? 80;
                const topService = lead.services?.[0]?.service_name || "Full-Stack Web Development";

                return (
                  <div
                    key={lead.id}
                    className="glass-panel p-5 rounded-2xl border flex flex-col justify-between gap-4 hover:border-electric-500/40 transition"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded border bg-electric-500/10 text-electric-500 border-electric-500/20">
                              {lead.industry || "Business"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              REAL DATA
                            </span>
                            <select
                              value={lead.pipeline_stage || "NEW"}
                              onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded border focus:outline-none cursor-pointer"
                              style={{
                                backgroundColor: "var(--surface-secondary)",
                                borderColor: "var(--border)",
                                color: lead.pipeline_stage === "RESEARCHING" ? "#f59e0b" : "var(--text-primary)"
                              }}
                              title="Change CRM Pipeline Stage"
                            >
                              {["NEW", "RESEARCHING", "READY_FOR_OUTREACH", "CONTACTED", "REPLIED", "INTERESTED", "MEETING", "PROPOSAL", "WON", "LOST"].map((s) => (
                                <option key={s} value={s}>
                                  {s === "RESEARCHING" ? "Stage: RESEARCH" : `Stage: ${s}`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <h3 className="text-base font-black pt-1" style={{ color: "var(--text-primary)" }}>
                            {lead.name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-electric-500">{score}</span>
                          <span className="text-[10px] block" style={{ color: "var(--text-muted)" }}>Score</span>
                        </div>
                      </div>

                      {/* Contact & Location Info */}
                      <div className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <p className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-electric-500 flex-shrink-0" />
                          <span>{lead.country} {lead.city ? `• ${lead.city}` : ""}</span>
                        </p>
                        {lead.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="font-mono text-[11px]">{lead.phone}</span>
                          </p>
                        )}
                        {lead.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span className="font-mono text-[11px]">{lead.email}</span>
                          </p>
                        )}
                      </div>

                      {/* Recommended Service */}
                      <div className="p-2.5 rounded-xl border text-xs" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] uppercase font-black block" style={{ color: "var(--text-muted)" }}>Matched Solution</span>
                        <span className="font-bold text-electric-500">{topService}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="flex-1 py-2 rounded-xl border text-center text-xs font-bold hover:bg-slate-700/10 transition"
                        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                      >
                        Audit Details
                      </Link>
                      <button
                        onClick={() => handleOpenOutreach(lead)}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>Outreach</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Outreach Modal ───────────────────────────────────── */}
      {activeOutreachLead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-3xl p-6 space-y-4 border shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setActiveOutreachLead(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-700/20"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-electric-500 uppercase">Consultative AI Outreach</span>
              <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                Email Outreach for {activeOutreachLead.name}
              </h3>
            </div>

            {generatingOutreach ? (
              <div className="py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-electric-500" />
                Synthesizing personalized consultative pitch…
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Recipient Email</label>
                  <input
                    value={outreachRecipient}
                    onChange={(e) => setOutreachRecipient(e.target.value)}
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Subject Line</label>
                  <input
                    value={outreachSubject}
                    onChange={(e) => setOutreachSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Email Body</label>
                  <textarea
                    rows={8}
                    value={outreachBody}
                    onChange={(e) => setOutreachBody(e.target.value)}
                    className="w-full p-2.5 rounded-xl border focus:outline-none leading-relaxed"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>

                {outreachSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                    {outreachSuccessMsg}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSendOutreach}
                    disabled={sendingOutreach}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendingOutreach ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{sendingOutreach ? "Sending…" : "Send Email via SMTP"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOutreachLead(null)}
                    className="px-4 py-3 rounded-xl border font-bold"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
