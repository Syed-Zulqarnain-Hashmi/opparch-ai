"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell, ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
  Minus, ShieldAlert, CheckCircle2
} from "lucide-react";
import { getMarketAlerts } from "@/lib/api";

export default function MarketAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await getMarketAlerts();
      setAlerts(res || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 text-xs text-electric-500 hover:underline mb-2 transition font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Market Terminal
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-md">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              Real-Time Market <span className="text-amber-500">Alert Center</span>
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Automated alerts dispatched when high-probability opportunities (Score ≥ 75) are detected.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white text-xs font-bold shadow-md hover:from-amber-600 hover:to-red-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Alerts
        </button>
      </div>

      {/* ── Alerts Feed ─────────────────────────────────────── */}
      <div
        className="glass-panel p-5 rounded-2xl border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        {alerts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No active high-risk alerts</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Alerts trigger automatically when opportunity signals exceed score 75.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl border border-amber-500/20 space-y-2 hover:border-amber-500/40 transition"
                style={{
                  backgroundColor: "var(--surface-secondary)"
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black" style={{ color: "var(--text-primary)" }}>{alert.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${alert.direction === "LONG" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : "bg-red-500/10 text-red-500 border border-red-500/30"}`}>
                      {alert.direction}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Score: {alert.opportunity_score}/100</span>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {alert.message}
                </p>

                {alert.reasons?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {alert.reasons.map((r: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text-secondary)"
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
