"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FlaskConical, Play, ArrowLeft, TrendingUp, ShieldAlert, BarChart3,
  Percent, CheckCircle2, XCircle, RefreshCw, HelpCircle, Loader2
} from "lucide-react";
import { runBacktest } from "@/lib/api";

const SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "DOGE/USDT", "AVAX/USDT"];
const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [days, setDays] = useState(30);
  const [capital, setCapital] = useState(10000);
  const [risk, setRisk] = useState(2.0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await runBacktest({
        symbol,
        timeframe,
        days_history: Number(days),
        initial_capital: Number(capital),
        risk_per_trade_percent: Number(risk),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute backtest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 text-xs text-electric-500 hover:underline mb-2 transition font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Market Terminal
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              Quantitative Strategy <span className="text-purple-400">Backtesting Engine</span>
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Simulate OPPARCH multi-factor opportunity signals over historical candles with zero lookahead bias.
          </p>
        </div>
      </div>

      {/* ── Configuration Form ──────────────────────────────── */}
      <div
        className="glass-panel p-5 rounded-2xl border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        <form onSubmit={handleRunBacktest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Symbol */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Trading Pair
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--input-text)"
                }}
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Candle Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--input-text)"
                }}
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* Days History */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Historical Span (Days)
              </label>
              <input
                type="number"
                min={7}
                max={180}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--input-text)"
                }}
              />
            </div>

            {/* Capital */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Initial Capital ($)
              </label>
              <input
                type="number"
                min={100}
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--input-text)"
                }}
              />
            </div>

            {/* Run Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{loading ? "Simulating…" : "Run Simulation"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          className="glass-panel p-6 rounded-2xl border space-y-6"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)"
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                Backtest Outcomes for {result.symbol} ({result.timeframe})
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Executed across {result.total_trades} simulated positions over {days} days.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold block" style={{ color: "var(--text-muted)" }}>Net Profit / Loss</span>
              <span className={`text-2xl font-black ${result.total_pnl_percent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {result.total_pnl_percent >= 0 ? `+${result.total_pnl_percent}%` : `${result.total_pnl_percent}%`}
              </span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: "var(--text-muted)" }}>Win Rate</span>
              <span className="text-xl font-black text-emerald-500">{result.win_rate}%</span>
            </div>
            <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: "var(--text-muted)" }}>Profit Factor</span>
              <span className="text-xl font-black text-purple-400">{result.profit_factor}</span>
            </div>
            <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: "var(--text-muted)" }}>Max Drawdown</span>
              <span className="text-xl font-black text-red-500">{result.max_drawdown_percent}%</span>
            </div>
            <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold block" style={{ color: "var(--text-muted)" }}>Final Capital</span>
              <span className="text-xl font-black" style={{ color: "var(--text-primary)" }}>${result.final_capital?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
