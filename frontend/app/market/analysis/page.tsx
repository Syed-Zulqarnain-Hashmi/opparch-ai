"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertTriangle, ShieldCheck, Clock, Sparkles
} from "lucide-react";
import { getMarketAnalysis, getMarketTickers } from "@/lib/api";

const SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "DOGE/USDT", "AVAX/USDT"];
const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

export default function MarketAnalysisScannerPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const [selectedTf, setSelectedTf] = useState("1h");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanAllResults, setScanAllResults] = useState<any[]>([]);
  const [scanningAll, setScanningAll] = useState(false);

  useEffect(() => {
    runSingleAnalysis(selectedSymbol, selectedTf);
  }, [selectedSymbol, selectedTf]);

  const runSingleAnalysis = async (sym: string, tf: string) => {
    setLoading(true);
    try {
      const res = await getMarketAnalysis(sym, tf);
      setAnalysis(res);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanAllCoins = async () => {
    setScanningAll(true);
    try {
      const promises = SYMBOLS.map((s) => getMarketAnalysis(s, selectedTf).catch(() => null));
      const results = await Promise.all(promises);
      setScanAllResults(results.filter(Boolean));
    } finally {
      setScanningAll(false);
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 text-xs text-electric-500 hover:underline mb-2 transition font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Market Terminal
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              AI Multi-Factor <span className="text-emerald-500">Signal Scanner</span>
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Automated multi-factor market opportunity discovery powered by technical indicators, order book volume, sentiment, and local Ollama reasoning.
          </p>
        </div>

        <button
          onClick={handleScanAllCoins}
          disabled={scanningAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold shadow-md hover:from-emerald-600 hover:to-cyan-600 transition disabled:opacity-50 self-start sm:self-auto"
        >
          {scanningAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {scanningAll ? "Scanning Market Pairs…" : "Batch Scan All Pairs"}
        </button>
      </div>

      {/* ── Symbol & Timeframe Selection Bar ─────────────────── */}
      <div
        className="glass-panel p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-black tracking-wider mr-1" style={{ color: "var(--text-muted)" }}>Pair:</span>
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSymbol(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedSymbol === s
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-sm"
                  : "border"
              }`}
              style={selectedSymbol !== s ? { backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
            >
              {s.split("/")[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-black tracking-wider mr-1" style={{ color: "var(--text-muted)" }}>TF:</span>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTf(tf)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                selectedTf === tf
                  ? "bg-emerald-600 text-white"
                  : "border"
              }`}
              style={selectedTf !== tf ? { backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Single Coin Result ───────────────────────────────── */}
      {analysis && (
        <div
          className="glass-panel p-6 rounded-2xl border space-y-5"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)"
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{analysis.symbol}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                  {analysis.time_horizon}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Multi-factor conviction score computed across 5 analytical dimensions</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl text-sm font-black tracking-wider uppercase border ${analysis.direction === "LONG" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : analysis.direction === "SHORT" ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"}`}>
                {analysis.direction}
              </span>
              <div className="text-right">
                <span className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{analysis.opportunity_score}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: "var(--text-muted)" }}>Entry Price</span>
              <span className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>${analysis.entry_price?.toFixed(4)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-red-400 block">Invalidation (Stop)</span>
              <span className="text-xs font-mono font-bold text-red-500">${analysis.invalidation_price?.toFixed(4)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Primary Target</span>
              <span className="text-xs font-mono font-bold text-emerald-500">${analysis.target_prices?.[0]?.toFixed(4)}</span>
            </div>
          </div>

          {/* Ollama Reasoning */}
          {analysis.ollama_explanation && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                <Zap className="w-4 h-4" />
                <span>Ollama AI Natural Language Synthesis</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {analysis.ollama_explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Batch Scan Results ───────────────────────────────── */}
      {scanAllResults.length > 0 && (
        <div
          className="glass-panel p-5 rounded-2xl border space-y-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)"
          }}
        >
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Batch Scan Matrix ({scanAllResults.length} Assets)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {scanAllResults.map((r: any) => (
              <div
                key={r.symbol}
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border)"
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>{r.symbol}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${r.direction === "LONG" ? "bg-emerald-500/10 text-emerald-500" : r.direction === "SHORT" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                    {r.direction}
                  </span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>Score: <strong style={{ color: "var(--text-primary)" }}>{r.opportunity_score}</strong></span>
                  <span>Prob: <strong className="text-cyan-500">{Math.round(r.model_probability * 100)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
