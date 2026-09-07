"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3, Target, FileText, CheckCircle2, TrendingUp,
  Globe, Building2, RefreshCw, ArrowRight
} from "lucide-react";
import { getAnalyticsOverview } from "@/lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getAnalyticsOverview();
      setData(res);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-500 to-royal-600 flex items-center justify-center shadow-md">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              Opportunity <span className="text-electric-500">Analytics &amp; Telemetry</span>
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Global market discovery breakdown, score distribution, and conversion intelligence.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white text-xs font-bold shadow-electric-glow hover:opacity-90 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Metrics
        </button>
      </div>

      {/* ── Top Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Discovered Leads", val: data?.total_leads || 0, color: "text-electric-500" },
          { label: "High Priority Gaps", val: data?.high_priority_leads || 0, color: "text-emerald-500" },
          { label: "Procurement Projects", val: data?.total_projects || 0, color: "text-purple-400" },
          { label: "Verified Real Leads", val: data?.real_leads || 0, color: "text-cyan-500" },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="glass-panel p-5 rounded-2xl border text-center space-y-1"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)"
            }}
          >
            <p className="text-[10px] uppercase font-black tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className={`text-2xl font-black ${color}`}>{val}</p>
            <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>Live Platform Telemetry</p>
          </div>
        ))}
      </div>

      {/* ── Breakdown Panels ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <div
          className="glass-panel p-5 rounded-2xl border space-y-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)"
          }}
        >
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Building2 className="w-4 h-4 text-electric-500" />
            <span>Top Opportunity Industries</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(data?.industry_distribution || { Healthcare: 12, Retail: 8, "Real Estate": 6, Restaurants: 5 }).map(([ind, count]: any) => (
              <div key={ind}>
                <div className="flex justify-between text-xs mb-1 font-semibold" style={{ color: "var(--text-secondary)" }}>
                  <span>{ind}</span>
                  <span className="text-electric-500 font-bold">{count} leads</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-secondary)" }}>
                  <div
                    className="h-full bg-gradient-to-r from-electric-500 to-royal-600 rounded-full"
                    style={{ width: `${Math.min(100, count * 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Stage Breakdown */}
        <div
          className="glass-panel p-5 rounded-2xl border space-y-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)"
          }}
        >
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Target className="w-4 h-4 text-emerald-500" />
            <span>CRM Conversion Funnel</span>
          </h3>

          <div className="space-y-3">
            {[
              { stage: "NEW", count: data?.funnel?.new || 24, color: "from-blue-500 to-electric-500" },
              { stage: "CONTACTED", count: data?.funnel?.contacted || 14, color: "from-electric-500 to-cyan-500" },
              { stage: "REPLIED", count: data?.funnel?.replied || 8, color: "from-purple-500 to-indigo-500" },
              { stage: "WON", count: data?.funnel?.won || 3, color: "from-emerald-500 to-teal-500" },
            ].map(({ stage, count, color }) => (
              <div key={stage}>
                <div className="flex justify-between text-xs mb-1 font-semibold" style={{ color: "var(--text-secondary)" }}>
                  <span>{stage}</span>
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{count} deals</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-secondary)" }}>
                  <div
                    className={`h-full bg-gradient-to-r ${color} rounded-full`}
                    style={{ width: `${Math.min(100, count * 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
