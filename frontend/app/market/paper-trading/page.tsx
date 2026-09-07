"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity, ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign,
  CheckCircle2, Clock, Trash2, RefreshCw, AlertCircle, X, Loader2
} from "lucide-react";
import { getPaperTrades, createPaperTrade, getMarketTickers } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "DOGE/USDT", "AVAX/USDT"];

export default function PaperTradingPage() {
  const { isLoggedIn } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [tickers, setTickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New trade modal state
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [direction, setDirection] = useState("LONG");
  const [size, setSize] = useState(1000);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, tick] = await Promise.all([
        getPaperTrades().catch(() => []),
        getMarketTickers().catch(() => []),
      ]);
      setTrades(tList || []);
      setTickers(tick || []);
      
      const currentPrice = tick.find((t: any) => t.symbol === symbol)?.price || 75000;
      setStopLoss(direction === "LONG" ? Number((currentPrice * 0.98).toFixed(2)) : Number((currentPrice * 1.02).toFixed(2)));
      setTakeProfit(direction === "LONG" ? Number((currentPrice * 1.04).toFixed(2)) : Number((currentPrice * 0.96).toFixed(2)));
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (newSym: string) => {
    setSymbol(newSym);
    const curr = tickers.find((t: any) => t.symbol === newSym)?.price || 100;
    setStopLoss(direction === "LONG" ? Number((curr * 0.98).toFixed(2)) : Number((curr * 1.02).toFixed(2)));
    setTakeProfit(direction === "LONG" ? Number((curr * 1.04).toFixed(2)) : Number((curr * 0.96).toFixed(2)));
  };

  const handleOpenTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in to open and track virtual paper trades.");
      return;
    }
    setSubmitting(true);
    try {
      const curr = tickers.find((t: any) => t.symbol === symbol)?.price || 100;
      await createPaperTrade({
        symbol,
        direction,
        entry_price: curr,
        stop_loss: Number(stopLoss),
        take_profit: Number(takeProfit),
        position_size: Number(size),
      });
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to execute paper trade");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPnL = trades.reduce((acc, t) => acc + (t.realized_pnl || 0), 0);

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              Virtual Paper <span className="text-cyan-500">Trading Portfolio</span>
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Execute forward simulated positions using real live market price feeds with zero financial capital risk.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-md hover:from-cyan-600 hover:to-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Open Position
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border hover:bg-slate-700/20 transition"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Portfolio Performance Strip ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Active Positions</p>
          <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
            {trades.filter((t) => t.status === "OPEN").length}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Total Executed Trades</p>
          <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{trades.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Realized P&amp;L</p>
          <p className={`text-2xl font-black ${totalPnL >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Paper Account Balance</p>
          <p className="text-2xl font-black text-cyan-500">$10,000.00</p>
        </div>
      </div>

      {/* ── Trades Table ─────────────────────────────────────── */}
      <div
        className="glass-panel p-5 rounded-2xl border space-y-4"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
          Trading Book ({trades.length})
        </h3>

        {trades.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No open paper positions. Click &quot;Open Position&quot; to test strategies.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <th className="pb-3 font-bold uppercase text-[10px]">Symbol</th>
                  <th className="pb-3 font-bold uppercase text-[10px]">Side</th>
                  <th className="pb-3 font-bold uppercase text-[10px]">Entry Price</th>
                  <th className="pb-3 font-bold uppercase text-[10px]">Stop Loss</th>
                  <th className="pb-3 font-bold uppercase text-[10px]">Take Profit</th>
                  <th className="pb-3 font-bold uppercase text-[10px]">Status</th>
                  <th className="pb-3 font-bold uppercase text-[10px]">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-700/10 transition">
                    <td className="py-3 font-bold" style={{ color: "var(--text-primary)" }}>{t.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${t.direction === "LONG" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-3 font-mono" style={{ color: "var(--text-secondary)" }}>${t.entry_price?.toFixed(4)}</td>
                    <td className="py-3 font-mono text-red-500">${t.stop_loss?.toFixed(4)}</td>
                    <td className="py-3 font-mono text-emerald-500">${t.take_profit?.toFixed(4)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3" style={{ color: "var(--text-muted)" }}>{new Date(t.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Open Trade Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-6 space-y-4 border shadow-2xl relative"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)"
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-700/20"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Open Simulated Trade</h3>

            <form onSubmit={handleOpenTrade} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Asset</label>
                <select
                  value={symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border focus:outline-none"
                  style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                >
                  {SYMBOLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("LONG")}
                  className={`py-2 rounded-xl font-bold ${direction === "LONG" ? "bg-emerald-600 text-white" : "border"}`}
                  style={direction !== "LONG" ? { borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("SHORT")}
                  className={`py-2 rounded-xl font-bold ${direction === "SHORT" ? "bg-red-600 text-white" : "border"}`}
                  style={direction !== "SHORT" ? { borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
                >
                  SELL / SHORT
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Size ($ USD)</label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                  style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Stop Loss ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Take Profit ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold transition shadow-md disabled:opacity-50 mt-2"
              >
                {submitting ? "Opening Position…" : "Confirm Simulated Trade"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
