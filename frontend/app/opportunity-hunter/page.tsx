"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Globe, Building2, Target, Sparkles, ArrowRight,
  Filter, CheckCircle2, Loader2, ExternalLink, ShieldAlert,
  AlertCircle, Zap, Info, MapPin, ChevronDown, ListFilter,
  PenLine, Server, BrainCircuit, BadgeCheck, WifiOff
} from 'lucide-react';
import { executeSearch, updateLeadCrmStage } from '@/lib/api';

const COUNTRIES = [
  "Worldwide", "USA", "Pakistan", "UAE", "UK", "Canada", "Australia",
  "Saudi Arabia", "Germany", "France", "Italy", "Spain", "India", "Turkey", "Singapore"
];

const INDUSTRIES = [
  "All Industries", "Restaurants", "Medical Stores", "Clinics", "Hospitals", "Dentists",
  "Salons", "Barbers", "Gyms", "Real Estate", "Hotels", "Clothing Brands", "Fashion", "Law Firms",
  "Construction", "Architecture", "Automotive", "Travel", "Logistics", "E-commerce", "SaaS", "Software Companies", "Startups"
];

const SERVICES = [
  "All Services", "The Archer", "Web Development", "Web Design",
  "Mobile App Development", "SEO & Performance Optimization",
  "Branding & Logo Design", "Web Copywriting", "Custom Software & Mobile Solutions"
];

const SEARCH_SUGGESTIONS = [
  "Find real businesses without a website",
  "Restaurants in New York needing modern UX",
  "Medical stores with missing websites",
  "Real estate agencies needing SEO & traffic",
  "Law firms with weak digital presence",
  "Salons needing online booking systems",
  "Freelance web development projects",
];

function OpportunityHunterContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialC = searchParams.get('c') || 'Worldwide';

  const [query, setQuery] = useState(initialQ || "");
  const [country, setCountry] = useState(initialC);
  const [industry, setIndustry] = useState('All Industries');
  const [serviceTarget, setServiceTarget] = useState('All Services');
  const [searchMode, setSearchMode] = useState<'DEMO' | 'REAL_FREE'>('REAL_FREE');

  const [isSearching, setIsSearching] = useState(false);
  const [searchProgressStep, setSearchProgressStep] = useState(0);
  const [activeQuery, setActiveQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [parsedCriteria, setParsedCriteria] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [leadStages, setLeadStages] = useState<Record<string, string>>({});
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);

  const handleSetStage = async (leadId: string, stage: string) => {
    setUpdatingStageId(leadId);
    try {
      await updateLeadCrmStage(leadId, stage);
      setLeadStages((prev) => ({ ...prev, [leadId]: stage }));
      alert(`✅ Lead successfully moved to CRM Pipeline under '${stage === "RESEARCHING" ? "RESEARCH" : stage}'!`);
    } catch (err: any) {
      alert(err.message || "Failed to update lead stage.");
    } finally {
      setUpdatingStageId(null);
    }
  };

  const progressSteps = [
    { icon: Server, label: "Discovering real businesses..." },
    { icon: Globe, label: "Checking websites..." },
    { icon: Search, label: "Finding public contact information..." },
    { icon: BadgeCheck, label: "Scoring opportunities..." },
    { icon: CheckCircle2, label: "Leads ready" },
  ];


  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSearchResults(null);
    setParsedCriteria(null);

    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    
    // Auto-derive effective search prompt if user left query blank
    const effectivePrompt = q || (
      industry !== "All Industries"
        ? `${industry} in ${country !== "Worldwide" ? country : "target markets"}`
        : (country !== "Worldwide" ? `Businesses in ${country}` : "Find real business opportunities")
    );

    const prompt = q
      ? (q + (country !== "Worldwide" && !q.toLowerCase().includes(country.toLowerCase()) ? ` in ${country}` : ""))
      : effectivePrompt;

    setActiveQuery(q || `${industry !== "All Industries" ? industry : "Businesses"} in ${country}`);
    setIsSearching(true);
    setSearchProgressStep(0);

    const interval = setInterval(() => {
      setSearchProgressStep((prev) => (prev < progressSteps.length - 1 ? prev + 1 : prev));
    }, 500);

    try {
      const res = await executeSearch({
        query: prompt,
        country: country !== "Worldwide" ? country : undefined,
        industry: industry !== "All Industries" ? industry : undefined,
        service_target: serviceTarget !== "All Services" ? serviceTarget : undefined,
        mode: searchMode,
        limit: 20
      });

      setSearchResults(res);
      setParsedCriteria(res.parsed_criteria);
    } catch (err: any) {
      console.error("Search Error:", err);
      setErrorMsg(err.message || "Search failed. Please check that the backend server is running.");
    } finally {
      clearInterval(interval);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQ) {
      setQuery(initialQ);
      handleSearch(undefined, initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diagStatus = searchResults?.status;

  return (
    <div className="space-y-8" style={{ backgroundColor: "var(--background)" }}>
      {/* HEADER BANNER */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl border space-y-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-bold uppercase tracking-wider mb-2">
              <Target className="w-3.5 h-3.5" />
              <span>GLOBAL OPPORTUNITY HUNTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              Discover Real Client Opportunities
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
              Natural language prompt parsing, real OpenStreetMap business discovery, non-intrusive digital audits, and service matching.
            </p>
          </div>

          {/* MODE TOGGLE */}
          <div
            className="flex items-center gap-1.5 p-1.5 rounded-2xl border self-start sm:self-auto shrink-0"
            style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setSearchMode('REAL_FREE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'REAL_FREE'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={searchMode !== 'REAL_FREE' ? { color: "var(--text-secondary)" } : {}}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>REAL FREE MODE</span>
            </button>
            <button
              onClick={() => setSearchMode('DEMO')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'DEMO'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={searchMode !== 'DEMO' ? { color: "var(--text-secondary)" } : {}}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>DEMO MODE</span>
            </button>
          </div>
        </div>

        {/* Mode Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
          searchMode === 'REAL_FREE'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {searchMode === 'REAL_FREE'
              ? 'REAL FREE MODE: Discovers real businesses from permitted public/open data sources (OpenStreetMap / Overpass API). Zero synthetic records substituted.'
              : 'DEMO MODE: Uses preloaded realistic business dataset clearly labeled DEMO DATA — FOR DEMONSTRATION ONLY.'}
          </span>
        </div>
      </div>

      {/* SEARCH PANEL */}
      <div
        className="glass-panel p-6 rounded-2xl border space-y-5"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Custom Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-electric-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Optional: Type custom keywords (e.g. Italian, downtown) or simply select dropdowns below..."
              className="w-full text-xs sm:text-sm pl-12 pr-4 py-3.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition shadow-inner"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--input-text)"
              }}
            />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[11px]" style={{ color: "var(--text-muted)" }}>Quick Searches:</span>
            {SEARCH_SUGGESTIONS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                  handleSearch(undefined, prompt);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] border transition hover:border-electric-500/40 hover:text-electric-500"
                style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-none font-medium"
                style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--input-text)" }}
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-none font-medium"
                style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--input-text)" }}
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Target Service</label>
              <select
                value={serviceTarget}
                onChange={(e) => setServiceTarget(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-none font-medium"
                style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--input-text)" }}
              >
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Dropdown helper badge */}
          <div className="flex items-center gap-2 text-[11px] text-electric-500 font-medium px-3 py-1.5 rounded-xl bg-electric-500/10 border border-electric-500/20">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Direct Dropdown Discovery: Select Country & Industry and click Hunt — no text prompt required.</span>
          </div>

          {/* Hunt Button */}
          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 hover:to-royal-700 text-white text-sm font-bold transition shadow-electric-glow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Hunting Opportunities...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>HUNT OPPORTUNITIES</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* ACTIVE QUERY BANNER */}
      {activeQuery && !isSearching && (
        <div
          className="px-5 py-3 rounded-2xl border flex items-center gap-3 text-xs"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Search className="w-4 h-4 text-electric-500 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>
              Search Executed:
            </span>
            <p className="font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
              &ldquo;{activeQuery}&rdquo;
              {country !== "Worldwide" && <span className="text-electric-500 ml-1">in {country}</span>}
            </p>
          </div>
        </div>
      )}

      {/* PROGRESS PANEL */}
      {isSearching && (
        <div
          className="glass-panel p-8 rounded-2xl border space-y-6"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 text-electric-500 animate-spin mx-auto" />
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              OPPARCH AI Engine is Hunting Opportunities...
            </h3>
            {activeQuery && (
              <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                &ldquo;{activeQuery}&rdquo;
              </p>
            )}
          </div>
          <div className="space-y-2">
            {progressSteps.map((step, idx) => {
              const Icon = step.icon;
              const done = idx < searchProgressStep;
              const active = idx === searchProgressStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs transition-all ${
                    active
                      ? "bg-electric-500/10 border-electric-500/30 text-electric-500 font-bold"
                      : done ? "opacity-60" : "opacity-30"
                  }`}
                  style={!active ? { borderColor: "var(--border)", color: "var(--text-secondary)" } : {}}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : active ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ERROR NOTICE */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Search Error</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* PARSED CRITERIA */}
      {parsedCriteria && (
        <div
          className="glass-panel p-4 rounded-2xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Parsed Natural Language Intent:
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
            <span><strong>Target:</strong> {parsedCriteria.city ? `${parsedCriteria.city}, ${parsedCriteria.country}` : parsedCriteria.country}</span>
            <span>• <strong>Industry:</strong> {parsedCriteria.industry}</span>
            <span>• <strong>Digital Gap:</strong> {parsedCriteria.digital_gap}</span>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC ALERTS */}
      {searchResults && diagStatus === "zero_results" && (
        <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-700 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">No Verified Real Opportunities Found</p>
            <p>{searchResults.message || "No real businesses matched your criteria in public data sources."}</p>
            <p style={{ color: "var(--text-muted)" }}>Try broadening your country or industry filter, or add a more specific location in your query.</p>
          </div>
        </div>
      )}
      {searchResults && diagStatus === "provider_unavailable" && (
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-500">
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Real Data Provider Unavailable</p>
            <p>{searchResults.message || "The Overpass API (OpenStreetMap) could not be reached. Check your internet connection."}</p>
          </div>
        </div>
      )}
      {searchResults && diagStatus === "ollama_unavailable" && (
        <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3 text-xs text-orange-500">
          <BrainCircuit className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">AI Model Unavailable</p>
            <p>{searchResults.message || "Ollama / qwen3:4b is offline. Business discovery ran with deterministic scoring."}</p>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {searchResults && (searchResults.leads?.length > 0 || searchResults.projects?.length > 0) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span>Discovered Opportunities ({searchResults.total_found})</span>
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                • Mode: <strong className={searchResults.mode === 'REAL_FREE' ? 'text-emerald-500' : 'text-amber-500'}>{searchResults.mode}</strong>
              </span>
            </h2>
          </div>

          {/* Projects */}
          {searchResults.projects?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-electric-500">
                Client Projects / Freelance ({searchResults.projects.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {searchResults.projects.map((proj: any) => (
                  <div
                    key={proj.id}
                    className="glass-panel p-5 rounded-2xl border space-y-3 hover:border-electric-500/40 transition"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{proj.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                        proj.fit_level === "PERFECT" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" :
                        proj.fit_level === "STRONG" ? "bg-electric-500/10 text-electric-500 border border-electric-500/30" :
                        "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                      }`}>{proj.fit_level} FIT</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{proj.organization} • {proj.country}</p>
                    {proj.ai_summary && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{proj.ai_summary}</p>}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-500">{proj.devarcher_fit_score}/100 Match Score</span>
                      {proj.deadline && <span style={{ color: "var(--text-muted)" }}>Deadline: {proj.deadline}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Leads */}
          {searchResults.leads?.length > 0 && (
            <div className="space-y-4">
              {searchResults.projects?.length > 0 && (
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">
                  Real Business Leads ({searchResults.leads.length})
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchResults.leads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="glass-panel p-6 rounded-2xl border space-y-4 flex flex-col justify-between hover:border-electric-500/40 transition"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{lead.name}</h3>
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <MapPin className="w-3 h-3 text-electric-500" />
                            <span>{lead.country}{lead.city ? ` • ${lead.city}` : ''}</span>
                            <span>•</span>
                            <span className="text-electric-500 font-semibold">{lead.industry}</span>
                          </p>
                        </div>
                        {lead.data_mode === "REAL_FREE" || !lead.is_demo_data ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shrink-0">REAL BUSINESS</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 shrink-0">DEMO DATA</span>
                        )}
                      </div>

                      <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border space-y-1 sm:space-y-0"
                        style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                      >
                        {/* Website Footprint */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>Website Status:</span>
                          {lead.website_url ? (
                            <div className="space-y-0.5">
                              <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-electric-500 font-bold hover:underline inline-flex items-center gap-1 truncate max-w-full">
                                {lead.website_url.replace("http://", "").replace("https://", "").replace("www.", "")} <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {lead.audit?.website_status || "website_found"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              website_not_found
                            </span>
                          )}
                        </div>

                        {/* Public Email Enrichment */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>Public Contact Email:</span>
                          {lead.email ? (
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-400 font-mono text-[11px] block truncate">{lead.email}</span>
                              <div className="flex flex-wrap items-center gap-1 text-[9px]">
                                <span className="px-1.5 py-0.5 rounded font-black uppercase bg-emerald-500/20 text-emerald-300">
                                  {lead.email_confidence || "HIGH"} CONFIDENCE
                                </span>
                                {lead.email_source && (
                                  <span className="px-1.5 py-0.5 rounded font-semibold bg-purple-500/20 text-purple-300">
                                    {lead.email_source === "official_website" ? "Website" : lead.email_source === "contact_page" ? "Contact Page" : "OSM Registry"}
                                  </span>
                                )}
                                {lead.email_source_url && (
                                  <a href={lead.email_source_url} target="_blank" rel="noreferrer" className="text-electric-400 hover:underline flex items-center gap-0.5">
                                    Source <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                Public business email not found
                              </span>
                              <p className="text-[10px] italic" style={{ color: "var(--text-muted)" }}>No email listed in public sources. Never guessed.</p>
                            </div>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="sm:col-span-2 pt-1 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border)" }}>
                          <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Phone:</span>
                          <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>{lead.phone || "Not listed in public records"}</span>
                        </div>
                      </div>

                      {/* Main Weakness / Pain Point */}
                      {lead.audit?.weaknesses && lead.audit.weaknesses.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Primary Digital Gap:</span>
                          <p className="text-xs font-bold text-amber-200">{lead.audit.weaknesses[0].title}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{lead.audit.weaknesses[0].explanation}</p>
                        </div>
                      )}

                      {/* Opportunity Score */}
                      <div
                        className="flex items-center justify-between p-3 rounded-xl border"
                        style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}
                      >
                        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Opportunity Score:</span>
                        <span className="text-lg font-black text-amber-500">{lead.score?.opportunity_score || 85} / 100</span>
                      </div>

                      {/* Recommended Service */}
                      {lead.services && lead.services.length > 0 && (
                        <div className="p-3 rounded-xl bg-electric-500/10 border border-electric-500/20 space-y-1">
                          <span className="text-[10px] font-bold text-electric-500 uppercase tracking-wider block">Recommended Service:</span>
                          <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{lead.services[0].service_name}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{lead.services[0].match_reason}</p>
                        </div>
                      )}

                      {/* Source & Link */}
                      <div className="flex items-center justify-between text-[10px] pt-1" style={{ color: "var(--text-muted)" }}>
                        <span>Discovery Source: <strong>{lead.discovery_source}</strong></span>
                        {lead.source_url && (
                          <a href={lead.source_url} target="_blank" rel="noreferrer" className="text-electric-500 hover:underline flex items-center gap-0.5 font-bold">
                            View Provider Source <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                    </div>

                    <div className="pt-4 border-t flex flex-col sm:flex-row items-center gap-2" style={{ borderColor: "var(--border)" }}>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="flex-1 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 hover:bg-electric-500/10 text-electric-500 w-full"
                        style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}
                      >
                        <span>VIEW FULL AUDIT &amp; OUTREACH</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleSetStage(lead.id, "RESEARCHING")}
                        disabled={updatingStageId === lead.id}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                          (leadStages[lead.id] || lead.pipeline_stage) === "RESEARCHING"
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                            : "hover:bg-amber-500/10 text-amber-500 border-amber-500/30"
                        }`}
                        style={{ backgroundColor: "var(--surface-secondary)" }}
                        title="Move lead to CRM Pipeline under Research stage"
                      >
                        {updatingStageId === lead.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>
                          {(leadStages[lead.id] || lead.pipeline_stage) === "RESEARCHING"
                            ? "✓ In Research"
                            : "Move to Research"}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpportunityHunterPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Loading Opportunity Hunter...</div>}>
      <OpportunityHunterContent />
    </Suspense>
  );
}


