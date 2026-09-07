"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Laptop, Search, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  Globe, Zap, ArrowRight, Loader2, Target, Smartphone, Lock, Eye, ShoppingCart,
  Activity, Clock, HardDrive, ExternalLink, ShieldAlert, Sparkles, Building2
} from 'lucide-react';
import { auditWebsite } from '@/lib/api';

export default function WebsiteAuditorPage() {
  const [url, setUrl] = useState('');
  const [industry, setIndustry] = useState('General Business');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    setLoading(true);
    setAuditResult(null);
    setErrorMsg('');

    try {
      const res = await auditWebsite(targetUrl, industry !== 'General Business' ? industry : undefined);
      setAuditResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete website audit. Please verify the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen space-y-8" style={{ backgroundColor: "var(--background)" }}>
      {/* Header Banner */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-bold uppercase tracking-wider">
          <Laptop className="w-3.5 h-3.5" />
          <span>TOOL — EVIDENCE-BASED WEBSITE DIGITAL AUDITOR</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          Non-Intrusive Public Website Audit Engine
        </h1>
        <p className="text-xs sm:text-sm max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Audit any business website in real time. Inspect actual HTTP telemetry, SSL security, mobile readiness, SEO metadata, OpenGraph tags, and compute an explainable evidence-based opportunity score.
        </p>

        {/* Search Audit Box */}
        <form onSubmit={handleAudit} className="pt-2 max-w-3xl space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <Globe className="absolute left-4 w-5 h-5 text-electric-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. youtube.com, alirestaurant.pk, or https://example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition shadow-sm"
                style={{
                  backgroundColor: "var(--input-bg)",
                  color: "var(--input-text)",
                  borderColor: "var(--input-border)"
                }}
              />
            </div>

            <div className="sm:w-56">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full py-3.5 px-3 rounded-xl text-xs font-bold border focus:outline-none"
                style={{
                  backgroundColor: "var(--input-bg)",
                  color: "var(--input-text)",
                  borderColor: "var(--input-border)"
                }}
              >
                <option value="General Business">🏢 General Business</option>
                <option value="Restaurant & Dining">🍽️ Restaurant & Dining</option>
                <option value="Medical & Healthcare">🏥 Medical & Healthcare</option>
                <option value="E-Commerce & Retail">🛍️ E-Commerce & Retail</option>
                <option value="Service & Agency">💼 Service & Agency</option>
                <option value="Tech Platform">💻 Tech / Media Platform</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 hover:to-royal-700 text-white text-xs font-bold transition shadow-electric-glow flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing Live...</span>
                </>
              ) : (
                <>
                  <span>Audit Website</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* AUDIT RESULTS */}
      {auditResult && (
        <div className="space-y-6">
          {/* Top Score & Metrics Banner */}
          <div
            className="glass-panel p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Globe className="w-4 h-4 text-electric-500" />
                <span className="text-base font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                  {auditResult.metrics?.final_url || url}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  auditResult.website_status === "MODERN" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                  auditResult.website_status === "OUTDATED" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                  "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}>
                  STATUS: {auditResult.website_status}
                </span>
                {auditResult.metrics?.is_enterprise_platform && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    ENTERPRISE MATURE PLATFORM
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Audited via real HTTP telemetry, TLS verification &amp; DOM inspection
              </p>

              {/* Quick Telemetry Chips */}
              {auditResult.metrics && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <div className="px-2.5 py-1 rounded-lg bg-navy-950/80 border border-electric-500/20 flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <Activity className="w-3 h-3 text-electric-400" />
                    <span>HTTP {auditResult.metrics.http_status || 200}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-navy-950/80 border border-electric-500/20 flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{auditResult.metrics.response_time_ms}ms response</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-navy-950/80 border border-electric-500/20 flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <HardDrive className="w-3 h-3 text-purple-400" />
                    <span>{auditResult.metrics.page_size_kb} KB</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-navy-950/80 border border-electric-500/20 flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <Lock className={`w-3 h-3 ${auditResult.ssl_active ? "text-emerald-400" : "text-rose-400"}`} />
                    <span>{auditResult.ssl_active ? "HTTPS TLS Active" : "Insecure HTTP"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Score Display */}
            <div className="flex items-center gap-4 bg-navy-950/70 p-4 rounded-2xl border border-electric-500/20 shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Opportunity / Gap Score
                </span>
                <span className={`text-3xl font-black ${
                  auditResult.opportunity_score >= 70 ? "text-amber-400" :
                  auditResult.opportunity_score >= 40 ? "text-blue-400" :
                  "text-emerald-400"
                }`}>
                  {auditResult.opportunity_score} <span className="text-sm font-normal text-slate-500">/ 100</span>
                </span>
              </div>
              <div className="border-l pl-3" style={{ borderColor: "var(--border)" }}>
                <span className="text-[9px] font-black uppercase block text-slate-400">PRIORITY</span>
                <span className="text-xs font-black uppercase text-amber-400">
                  {auditResult.priority_level || "MEDIUM"}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detected Gaps & Evidence */}
            <div
              className="glass-panel p-6 rounded-2xl space-y-4"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Digital Weaknesses &amp; Gaps ({(auditResult.weaknesses || []).length})
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Technical Evidence</span>
              </div>

              {(auditResult.weaknesses || []).length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed text-center space-y-1" style={{ borderColor: "var(--border)" }}>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-emerald-300">No Critical Digital Weaknesses Detected</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    This website demonstrates strong technical compliance, metadata configuration, and performance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(auditResult.weaknesses || []).map((w: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl space-y-1.5 text-xs"
                      style={{
                        backgroundColor: "rgba(245, 158, 11, 0.06)",
                        border: "1px solid rgba(245, 158, 11, 0.25)"
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          {w.title}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                          w.severity === "HIGH" ? "bg-red-500/20 text-red-400" :
                          w.severity === "MEDIUM" ? "bg-amber-500/20 text-amber-300" :
                          "bg-blue-500/20 text-blue-300"
                        }`}>
                          {w.severity}
                        </span>
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {w.explanation}
                      </p>
                      <div className="pt-1 font-mono text-[10px] text-slate-400 bg-black/20 p-2 rounded-lg border border-white/5">
                        <strong className="text-slate-300">Evidence: </strong>{w.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Technical Strengths */}
            <div
              className="glass-panel p-6 rounded-2xl space-y-4"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Verified Active Elements ({(auditResult.verified_elements || []).length})
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">VERIFIED</span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {(auditResult.verified_elements || []).map((el: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.06)",
                      border: "1px solid rgba(16, 185, 129, 0.25)"
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-300">{el.element}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{el.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Solutions */}
          <div
            className="glass-panel p-6 rounded-2xl space-y-3"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Zap className="w-4 h-4 text-electric-500" />
                Recommended DevArcher Service Transformation Package
              </h3>
              <span className="text-[10px] font-black uppercase text-electric-400 bg-electric-500/10 px-2 py-0.5 rounded border border-electric-500/20">
                TAILORED SOLUTIONS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {(auditResult.recommended_services || []).map((srv: string, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl text-xs font-bold flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--badge-bg)",
                    color: "var(--badge-text)",
                    border: "1px solid var(--badge-border)"
                  }}
                >
                  <Target className="w-4 h-4 text-electric-400 shrink-0" />
                  <span>{srv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

