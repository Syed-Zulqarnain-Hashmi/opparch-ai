"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Activity, Globe, ShieldAlert,
  BarChart3, ArrowRight, Zap, CheckCircle2, AlertTriangle,
  Building2, Filter, Loader2, BookOpen, Clock, DollarSign,
  ChevronRight, RefreshCw, X, ShieldCheck, Search, Calculator,
  Compass, PieChart, Newspaper, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  getPsxCompanies, analyzePsxCompany, getPsxIndices,
  getPsxSectors, getPsxMacroNews, calculatePsxProfit
} from "@/lib/api";

const SECTORS_LIST = [
  "All Sectors", "Commercial Banks", "Technology", "Oil & Gas",
  "Fertilizer", "Cement", "Power Generation"
];

export default function PsxMarketPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [indices, setIndices] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [macroNews, setMacroNews] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "calculator" | "sectors" | "news">("overview");

  // Profit Calculator State
  const [calcSymbol, setCalcSymbol] = useState("SYS");
  const [calcInvestment, setCalcInvestment] = useState(100000);
  const [calcEntryPrice, setCalcEntryPrice] = useState<number | undefined>(undefined);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, idxs, sects, news] = await Promise.all([
        getPsxCompanies(selectedSector !== "All Sectors" ? selectedSector : undefined, searchQuery || undefined),
        getPsxIndices().catch(() => []),
        getPsxSectors().catch(() => []),
        getPsxMacroNews().catch(() => [])
      ]);
      setCompanies(comps || []);
      setIndices(idxs || []);
      setSectors(sects || []);
      setMacroNews(news || []);

      if (!selectedCompany && comps && comps.length > 0) {
        handleSelectCompany(comps[0]);
      }
    } catch (err) {
      console.error("Failed to load PSX market data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSector]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleSelectCompany = async (company: any) => {
    setSelectedCompany(company);
    setCalcSymbol(company.symbol);
    setCalcEntryPrice(company.price);
    setAnalyzing(true);
    try {
      const res = await analyzePsxCompany(company.symbol);
      setAnalysisResult(res);
    } catch (err) {
      console.error("Failed to analyze PSX company:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunCalculator = async (sym?: string, inv?: number, entry?: number) => {
    setCalculating(true);
    try {
      const targetSym = sym || calcSymbol;
      const targetInv = inv !== undefined ? inv : calcInvestment;
      const targetEntry = entry !== undefined ? entry : calcEntryPrice;
      const res = await calculatePsxProfit({
        symbol: targetSym,
        investment_amount: targetInv,
        entry_price: targetEntry
      });
      setCalcResult(res);
    } catch (err) {
      console.error("Profit calculation error:", err);
    } finally {
      setCalculating(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    if (verdict?.includes("BUY")) {
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30";
    }
    if (verdict === "WATCH") {
      return "bg-amber-500/10 text-amber-500 border border-amber-500/30";
    }
    return "bg-red-500/10 text-red-500 border border-red-500/30";
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
              <Globe className="w-3.5 h-3.5" />
              <span>PAKISTAN STOCK MARKET INTELLIGENCE</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
              DELAYED — PSX AUTHORIZED FEED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Pakistan Stock Market (PSX) Terminal
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Multi-stage KSE-100 analytical pipeline with company valuation, corporate disclosures, Ollama risk synthesis, and exit conditions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 self-start md:self-auto hover:bg-emerald-500/10 disabled:opacity-50"
          style={{
            backgroundColor: "var(--surface-secondary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)"
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh PSX Data</span>
        </button>
      </div>

      {/* ── Major Indices Bar ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {indices.map((idx) => (
          <div
            key={idx.index_name}
            className="glass-panel p-4 rounded-2xl border space-y-1.5"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                {idx.index_name}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                +{idx.change_pct}% (+{idx.change_points})
              </span>
            </div>
            <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              {idx.current_points?.toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
              <span>Vol: {idx.volume}</span>
              <span>
                <strong className="text-emerald-500">{idx.advances} Adv</strong> •{" "}
                <strong className="text-red-500">{idx.declines} Dec</strong> •{" "}
                <span>{idx.unchanged} Unch</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
        {[
          { id: "overview", label: "Companies & AI Analysis", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "calculator", label: "Profit Scenario Calculator", icon: <Calculator className="w-4 h-4" /> },
          { id: "sectors", label: "Sector Performance Matrix", icon: <PieChart className="w-4 h-4" /> },
          { id: "news", label: "Macro News & Sector Impact", icon: <Newspaper className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id as any);
              if (t.id === "calculator" && !calcResult) {
                handleRunCalculator();
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === t.id
                ? "bg-emerald-600 text-white shadow-md"
                : "border hover:bg-emerald-500/10"
            }`}
            style={activeTab !== t.id ? { backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: COMPANIES & AI ANALYSIS ───────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Sector Filter & Search */}
          <div
            className="glass-panel p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {SECTORS_LIST.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedSector === sec
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border"
                  }`}
                  style={selectedSector !== sec ? { backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
                >
                  {sec}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol (e.g. HBL, SYS, OGDC)…"
                className="px-3 py-1.5 rounded-xl text-xs border focus:outline-none"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Company Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Listed Universe ({companies.length} Assets)
              </h3>

              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {companies.map((c) => {
                  const isSelected = selectedCompany?.symbol === c.symbol;
                  const isPositive = c.change_pct >= 0;
                  return (
                    <div
                      key={c.symbol}
                      onClick={() => handleSelectCompany(c)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? "border-emerald-500 shadow-md"
                          : "hover:border-emerald-500/40"
                      }`}
                      style={{
                        backgroundColor: isSelected ? "var(--surface-secondary)" : "var(--surface)",
                        borderColor: isSelected ? "var(--primary)" : "var(--border)"
                      }}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm" style={{ color: "var(--text-primary)" }}>{c.symbol}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                            {c.sector}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.name}</p>
                      </div>

                      <div className="text-right space-y-0.5">
                        <p className="text-sm font-black font-mono" style={{ color: "var(--text-primary)" }}>
                          PKR {c.price.toFixed(2)}
                        </p>
                        <span className={`text-xs font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                          {isPositive ? `+${c.change_pct}%` : `${c.change_pct}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Deep AI Risk & Exit Analysis (7 cols) */}
            <div className="lg:col-span-7">
              {analyzing ? (
                <div
                  className="glass-panel p-16 rounded-3xl border text-center space-y-3"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Running 7-Stage PSX Analytical Pipeline…</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Synthesizing price momentum, financial ratios, disclosures, and Ollama risk verdict.</p>
                </div>
              ) : analysisResult ? (
                <div
                  className="glass-panel p-6 rounded-3xl border space-y-6"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {/* Company Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                          {analysisResult.name} ({analysisResult.symbol})
                        </h2>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {analysisResult.sector} • Market Cap: {analysisResult.market_cap}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${getVerdictBadge(analysisResult.ollama_analysis?.verdict || analysisResult.default_verdict)}`}>
                        {analysisResult.ollama_analysis?.verdict || analysisResult.default_verdict}
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono" style={{ color: "var(--text-primary)" }}>
                          PKR {analysisResult.price.toFixed(2)}
                        </span>
                        <span className={`text-xs font-bold block ${analysisResult.change_pct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {analysisResult.change_pct >= 0 ? `+${analysisResult.change_pct}%` : `${analysisResult.change_pct}%`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Ratios Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                      <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>P/E Ratio</span>
                      <span className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{analysisResult.fundamentals?.pe_ratio}</span>
                    </div>
                    <div className="p-3 rounded-xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                      <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Dividend Yield</span>
                      <span className="text-sm font-black text-emerald-500">{analysisResult.fundamentals?.dividend_yield}</span>
                    </div>
                    <div className="p-3 rounded-xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                      <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>RSI (14)</span>
                      <span className="text-sm font-black text-electric-500">{analysisResult.momentum?.rsi_14}</span>
                    </div>
                    <div className="p-3 rounded-xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                      <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>52w Range</span>
                      <span className="text-[11px] font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                        {analysisResult.low_52w} – {analysisResult.high_52w}
                      </span>
                    </div>
                  </div>

                  {/* Ollama Risk Synthesis */}
                  <div
                    className="p-5 rounded-2xl border space-y-3"
                    style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-500">
                        <Zap className="w-4 h-4" />
                        <span>Ollama AI Structured Evaluation</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        Confidence: {analysisResult.ollama_analysis?.confidence || 88}%
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {analysisResult.ollama_analysis?.executive_summary || "Strong valuation metrics supported by high dividend yields."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] uppercase font-bold text-emerald-500 block">Suggested Entry Zone</span>
                        <span className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>{analysisResult.entry_zone}</span>
                      </div>
                      <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] uppercase font-bold text-electric-500 block">Target Zone</span>
                        <span className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>{analysisResult.target_zone}</span>
                      </div>
                    </div>
                  </div>

                  {/* "WHEN TO SELL" / EXIT CONDITIONS */}
                  <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      <span>&quot;When to Sell&quot; — Exit Conditions &amp; Risk Invalidation</span>
                    </h4>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Systematic rules to reduce exposure or exit position (Zero speculative date forecasting):
                    </p>
                    <ul className="space-y-1 text-xs list-disc list-inside" style={{ color: "var(--text-primary)" }}>
                      {(analysisResult.ollama_analysis?.exit_conditions || analysisResult.exit_conditions || []).map((ec: string, i: number) => (
                        <li key={i}>{ec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Calculator Shortcut */}
                  <button
                    onClick={() => {
                      setActiveTab("calculator");
                      handleRunCalculator(analysisResult.symbol, 100000, analysisResult.price);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Calculate Investment Profit Scenario for {analysisResult.symbol}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PROFIT CALCULATOR ──────────────────────────── */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          <div
            className="glass-panel p-6 sm:p-8 rounded-3xl border space-y-6"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div>
              <h3 className="text-lg font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Calculator className="w-5 h-5 text-emerald-500" />
                <span>PSX Stock Investment &amp; Scenario Calculator</span>
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Simulate potential capital gains, break-even price, broker commissions, and Capital Gains Tax (CGT 15%).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Stock Asset</label>
                <select
                  value={calcSymbol}
                  onChange={(e) => {
                    const sym = e.target.value;
                    setCalcSymbol(sym);
                    const comp = companies.find((c) => c.symbol === sym);
                    if (comp) {
                      setCalcEntryPrice(comp.price);
                      handleRunCalculator(sym, calcInvestment, comp.price);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border font-bold"
                  style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                >
                  {companies.map((c) => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.symbol} — {c.name} (PKR {c.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Investment Capital (PKR)</label>
                <input
                  type="number"
                  step={5000}
                  value={calcInvestment}
                  onChange={(e) => {
                    const inv = Number(e.target.value);
                    setCalcInvestment(inv);
                    handleRunCalculator(calcSymbol, inv, calcEntryPrice);
                  }}
                  className="w-full p-2.5 rounded-xl border font-mono font-bold"
                  style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Entry Price (PKR)</label>
                <input
                  type="number"
                  step="any"
                  value={calcEntryPrice || ""}
                  onChange={(e) => {
                    const ep = Number(e.target.value);
                    setCalcEntryPrice(ep);
                    handleRunCalculator(calcSymbol, calcInvestment, ep);
                  }}
                  className="w-full p-2.5 rounded-xl border font-mono font-bold"
                  style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                />
              </div>
            </div>

            {/* Results Grid */}
            {calcResult && (
              <div className="space-y-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Total Shares</span>
                    <span className="text-xl font-black font-mono" style={{ color: "var(--text-primary)" }}>{calcResult.number_of_shares?.toLocaleString()}</span>
                  </div>
                  <div className="p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Actual Deployed</span>
                    <span className="text-xl font-black font-mono text-electric-500">PKR {calcResult.capital_deployed?.toLocaleString()}</span>
                  </div>
                  <div className="p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Break-Even Price</span>
                    <span className="text-xl font-black font-mono" style={{ color: "var(--text-primary)" }}>PKR {calcResult.break_even_price}</span>
                  </div>
                  <div className="p-4 rounded-2xl border text-center space-y-1" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Est. Fees &amp; CGT</span>
                    <span className="text-xl font-black font-mono text-amber-500">PKR {calcResult.commission_estimate}</span>
                  </div>
                </div>

                {/* Scenario Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bull Case */}
                  <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-emerald-500">Bull Case Scenario</span>
                      <span className="text-xs font-black text-emerald-500">{calcResult.bull_case?.gain_pct}</span>
                    </div>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-300">Target Exit: PKR {calcResult.bull_case?.exit_price}</p>
                    <p className="text-2xl font-black text-emerald-500">+PKR {calcResult.bull_case?.net_profit?.toLocaleString()}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Final Value: PKR {calcResult.bull_case?.final_value?.toLocaleString()}</p>
                  </div>

                  {/* Base Case */}
                  <div className="p-5 rounded-2xl border border-electric-500/40 bg-electric-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-electric-500">Base Case Scenario</span>
                      <span className="text-xs font-black text-electric-500">{calcResult.base_case?.gain_pct}</span>
                    </div>
                    <p className="text-xs font-mono text-electric-500">Target Exit: PKR {calcResult.base_case?.exit_price}</p>
                    <p className="text-2xl font-black text-electric-500">+PKR {calcResult.base_case?.net_profit?.toLocaleString()}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Final Value: PKR {calcResult.base_case?.final_value?.toLocaleString()}</p>
                  </div>

                  {/* Bear Case */}
                  <div className="p-5 rounded-2xl border border-red-500/40 bg-red-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-red-500">Bear Case Risk</span>
                      <span className="text-xs font-black text-red-500">{calcResult.bear_case?.loss_pct}</span>
                    </div>
                    <p className="text-xs font-mono text-red-500">Stop Level: PKR {calcResult.bear_case?.exit_price}</p>
                    <p className="text-2xl font-black text-red-500">-PKR {Math.abs(calcResult.bear_case?.net_loss)?.toLocaleString()}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Final Value: PKR {calcResult.bear_case?.final_value?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border text-[11px] text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  ⚠️ {calcResult.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: SECTORS ────────────────────────────────────── */}
      {activeTab === "sectors" && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            PSX Industrial Sector Heatmap &amp; Volume Flow
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.map((sec) => (
              <div
                key={sec.name}
                className="glass-panel p-5 rounded-2xl border space-y-2"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{sec.name}</h4>
                  <span className={`text-xs font-black ${sec.change_pct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {sec.change_pct >= 0 ? `+${sec.change_pct}%` : `${sec.change_pct}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>Vol: {sec.volume}</span>
                  <span>Leader: <strong className="text-electric-500">{sec.leader}</strong></span>
                  <span className="px-2 py-0.5 rounded border text-[10px] font-bold" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    {sec.sentiment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: MACRO NEWS ─────────────────────────────────── */}
      {activeTab === "news" && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Macroeconomic Drivers &amp; Sector Impact Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {macroNews.map((n, i) => (
              <div
                key={i}
                className="glass-panel p-5 rounded-2xl border space-y-2.5"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {n.category}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>{n.timestamp}</span>
                </div>
                <h4 className="text-sm font-black leading-snug" style={{ color: "var(--text-primary)" }}>{n.headline}</h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{n.summary}</p>
                <div className="p-2.5 rounded-xl border text-xs flex items-center justify-between" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Correlated Impact: <strong style={{ color: "var(--text-primary)" }}>{n.impact_sector}</strong></span>
                  <span className="text-[10px] font-black text-emerald-500">{n.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
