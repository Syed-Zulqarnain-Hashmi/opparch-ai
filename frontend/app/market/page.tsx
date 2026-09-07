"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Minus, Zap, Activity, Bell, RefreshCw,
  AlertTriangle, CheckCircle2, BarChart3, Target, BookOpen, Clock,
  ChevronUp, ChevronDown, Wifi, WifiOff, FlaskConical, DollarSign
} from "lucide-react";
import {
  getMarketTickers, getMarketKlines, getMarketAnalysis,
  getNewsSentiment, getMarketAlerts, getPredictionAccuracy
} from "@/lib/api";

const SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "DOGE/USDT", "AVAX/USDT"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

// ── Helper Components ─────────────────────────────────────────────────────────

function PriceChange({ pct }: { pct: number }) {
  const color = pct >= 0 ? "text-emerald-500" : "text-red-500";
  const Icon = pct >= 0 ? ChevronUp : ChevronDown;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold ${color}`}>
      <Icon className="w-3 h-3" /> {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

function DirectionBadge({ dir }: { dir: string }) {
  const map = {
    LONG: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", Icon: TrendingUp },
    SHORT: { color: "bg-red-500/10 text-red-500 border-red-500/30", Icon: TrendingDown },
    WAIT: { color: "bg-amber-500/10 text-amber-500 border-amber-500/30", Icon: Minus },
  } as const;
  const cfg = map[dir as keyof typeof map] || map.WAIT;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-black ${cfg.color}`}>
      <cfg.Icon className="w-3.5 h-3.5" /> {dir}
    </span>
  );
}

// ── Main Market Terminal Page ─────────────────────────────────────────────────

export default function MarketTerminalPage() {
  const [tickers, setTickers] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const [selectedTf, setSelectedTf] = useState("1h");
  const [analysis, setAnalysis] = useState<any>(null);
  const [news, setNews] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [accuracy, setAccuracy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    startWsStream();
    return () => wsRef.current?.close();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [t, a, n, al, acc] = await Promise.all([
        getMarketTickers().catch(() => []),
        getMarketAlerts().catch(() => []),
        getNewsSentiment().catch(() => null),
        getMarketAlerts().catch(() => []),
        getPredictionAccuracy().catch(() => null),
      ]);
      if (t?.length) setTickers(t);
      setAlerts(a || []);
      setNews(n);
      setAccuracy(acc);
    } finally {
      setLoading(false);
    }
  };

  const startWsStream = () => {
    try {
      const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("http", "ws").replace("/api/v1", "") + "/api/v1/ws/market-stream";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "TICKERS_UPDATE" && data.tickers?.length) {
            setTickers(data.tickers);
          }
        } catch {}
      };
    } catch {
      setWsConnected(false);
    }
  };

  const runAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const res = await getMarketAnalysis(selectedSymbol, selectedTf);
      setAnalysis(res);
    } catch (err: any) {
      console.error("Analysis error:", err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedSymbol, selectedTf]);

  const selectedTicker = tickers.find(t => t.symbol === selectedSymbol) || { price: 0, price_change_24h: 0, high_24h: 0, low_24h: 0, volume_24h: 0 };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Activity className="w-10 h-10 text-emerald-500 animate-pulse mx-auto" />
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Connecting to live market telemetry feeds…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              OPPARCH Market <span className="text-emerald-500">Intelligence Terminal</span>
            </h1>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${wsConnected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "border-slate-500/30"}`} style={!wsConnected ? { color: "var(--text-muted)", backgroundColor: "var(--surface-secondary)" } : {}}>
              {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {wsConnected ? "LIVE" : "REST"}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Real-time crypto &amp; PSX market intelligence powered by Binance + Local Ollama AI</p>
        </div>
        <button
          onClick={loadInitialData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md hover:from-emerald-600 hover:to-cyan-600 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* ── Accuracy Stats Row ─────────────────────────────── */}
      {accuracy && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Signals", val: accuracy.total_signals_logged, color: "text-electric-500" },
            { label: "Measured Accuracy", val: `${accuracy.actual_accuracy_percent}%`, color: "text-emerald-500" },
            { label: "LONG Win Rate", val: `${accuracy.long_win_rate_percent}%`, color: "text-cyan-500" },
            { label: "SHORT Win Rate", val: `${accuracy.short_win_rate_percent}%`, color: "text-amber-500" },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              className="glass-panel p-3 rounded-xl border text-center"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)"
              }}
            >
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className={`text-lg font-black ${color}`}>{val}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>Real Outcomes Only</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Live Ticker Grid ───────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>📡 Live Prices</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
          {tickers.map((t) => (
            <button
              key={t.symbol}
              onClick={() => setSelectedSymbol(t.symbol)}
              className={`text-left p-3 rounded-xl border transition-all duration-150 ${
                selectedSymbol === t.symbol
                  ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
                  : "hover:border-emerald-500/40"
              }`}
              style={{
                backgroundColor: selectedSymbol === t.symbol ? "var(--surface-hover)" : "var(--surface)",
                borderColor: selectedSymbol === t.symbol ? undefined : "var(--border)"
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black" style={{ color: "var(--text-primary)" }}>{t.symbol.split("/")[0]}</span>
                <PriceChange pct={t.price_change_24h} />
              </div>
              <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                ${t.price >= 1000 ? t.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : t.price.toFixed(4)}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>Vol: ${(t.volume_24h / 1e9).toFixed(1)}B</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Selected Symbol Detail + AI Analysis ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Price Detail */}
        <div
          className="lg:col-span-2 glass-panel p-5 rounded-2xl border space-y-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)"
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{selectedSymbol.split("/")[0]}</h2>
              <PriceChange pct={selectedTicker.price_change_24h} />
            </div>
            <p className="text-3xl font-black text-emerald-500 mt-1">
              ${selectedTicker.price >= 1000
                ? selectedTicker.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : selectedTicker.price.toFixed(6)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            {[
              { label: "24H High", val: `$${selectedTicker.high_24h?.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, color: "text-emerald-500" },
              { label: "24H Low", val: `$${selectedTicker.low_24h?.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, color: "text-red-500" },
              { label: "24H Volume", val: `$${selectedTicker.volume_24h ? (selectedTicker.volume_24h / 1e9).toFixed(2) + "B" : "N/A"}`, color: "text-cyan-500" },
              { label: "Source", val: "Binance Live", color: "text-purple-400" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="text-[9px] mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className={`text-xs font-bold ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Timeframe Picker */}
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Timeframe</p>
            <div className="flex flex-wrap gap-1">
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

          {/* Symbol Selector */}
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Switch Pair</p>
            <div className="flex flex-wrap gap-1">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSymbol(s)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition border ${
                    selectedSymbol === s
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/40"
                      : "hover:border-emerald-500/40"
                  }`}
                  style={selectedSymbol !== s ? { backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
                >
                  {s.split("/")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Analysis Panel */}
        <div
          className="lg:col-span-3 glass-panel p-5 rounded-2xl border space-y-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              <h3 className="font-black text-sm" style={{ color: "var(--text-primary)" }}>AI Opportunity Analysis</h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">Ollama qwen3:4b</span>
            </div>
            <button
              onClick={runAnalysis}
              disabled={analysisLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold shadow-md hover:from-emerald-600 hover:to-cyan-600 transition disabled:opacity-50"
            >
              {analysisLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {analysisLoading ? "Analyzing…" : "Analyze Now"}
            </button>
          </div>

          {analysis ? (
            <div className="space-y-4">
              {/* Verdict Row */}
              <div
                className="flex flex-wrap items-center gap-3 p-4 rounded-xl border"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border)"
                }}
              >
                <DirectionBadge dir={analysis.direction} />
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Opportunity Score</p>
                  <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{analysis.opportunity_score}<span className="text-sm" style={{ color: "var(--text-muted)" }}>/100</span></p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Model Probability</p>
                  <p className="text-xl font-black text-cyan-500">{Math.round(analysis.model_probability * 100)}%</p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Risk Level</p>
                  <p className={`text-sm font-bold ${analysis.risk_level === "Low" ? "text-emerald-500" : analysis.risk_level === "High" ? "text-red-500" : "text-amber-500"}`}>
                    {analysis.risk_level}
                  </p>
                </div>
              </div>

              {/* Price Levels */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                  <p className="text-[9px] mb-0.5" style={{ color: "var(--text-muted)" }}>Entry</p>
                  <p className="text-xs font-black" style={{ color: "var(--text-primary)" }}>${analysis.entry_price?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                  <p className="text-[9px] text-red-400 mb-0.5">Invalidation</p>
                  <p className="text-xs font-black text-red-500">${analysis.invalidation_price?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <p className="text-[9px] text-emerald-400 mb-0.5">Target 1</p>
                  <p className="text-xs font-black text-emerald-500">${analysis.target_prices?.[0]?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Multi-factor Signal Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Technical", val: analysis.technical_verdict },
                  { label: "News", val: analysis.news_verdict },
                  { label: "Social", val: analysis.social_verdict },
                  { label: "BTC Alignment", val: analysis.btc_alignment },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--surface-secondary)",
                      borderColor: "var(--border)"
                    }}
                  >
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span className={`text-[10px] font-bold ${val === "BULLISH" || val === "POSITIVE" ? "text-emerald-500" : val === "BEARISH" || val === "NEGATIVE" ? "text-red-500" : "text-amber-500"}`}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Explanation */}
              {analysis.ollama_explanation && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Ollama AI Reasoning</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{analysis.ollama_explanation}</p>
                </div>
              )}

              {/* Evidence Reasons */}
              {analysis.reasons?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Evidence Signals</p>
                  {analysis.reasons.slice(0, 5).map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Click <strong>Analyze Now</strong> to run multi-factor AI analysis</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Technical indicators + News sentiment + Order book + BTC alignment + Ollama reasoning</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Links ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/market/psx", label: "Pakistan Stock Market", icon: <DollarSign className="w-4 h-4" />, color: "from-emerald-600 to-teal-700" },
          { href: "/market/paper-trading", label: "Paper Trading", icon: <DollarSign className="w-4 h-4" />, color: "from-cyan-600 to-blue-700" },
          { href: "/market/news", label: "News Intelligence", icon: <BookOpen className="w-4 h-4" />, color: "from-amber-600 to-orange-700" },
          { href: "/market/accuracy", label: "Accuracy Tracker", icon: <BarChart3 className="w-4 h-4" />, color: "from-purple-600 to-indigo-700" },
        ].map(({ href, label, icon, color }) => (
          <a
            key={href}
            href={href}
            className={`flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r ${color} text-white text-xs font-bold shadow-md hover:opacity-90 transition`}
          >
            {icon} {label}
          </a>
        ))}
      </div>
    </div>
  );
}
