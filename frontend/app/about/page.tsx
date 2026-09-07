"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Target, Sparkles, Cpu, Globe, ShieldCheck, User, Zap, Database, Lock, ArrowRight,
  Code2, Brain, TestTube, Megaphone, CheckCircle, Calendar, Mail, ExternalLink, Star, Briefcase, Linkedin

} from "lucide-react";

const PILLARS = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-electric-400",
    bg: "bg-electric-500/10 border-electric-500/30",
    title: "Evidence-Based Discovery",
    desc: "Instead of stale bought lists or blind cold outreach, OPPARCH AI identifies real digital maturity gaps — missing websites, mobile weaknesses, or unserved local markets — backed by open-source public telemetry.",
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    title: "Zero-Cost Local AI",
    desc: "Built with a privacy-first local architecture using Ollama (qwen3:4b) and public data APIs (Binance, Bitget, and OpenStreetMap). Zero mandatory paid subscription keys.",
  },
  {
    icon: <Target className="w-5 h-5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    title: "Unified Intelligence",
    desc: "Both Module A (Client Hunting) and Module B (Market Intelligence) exist within the same application, sharing one authentication system, one database, and one seamless UI experience.",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    title: "Non-Intrusive Public Auditing",
    desc: "OPPARCH AI performs only read-only, publicly available website and presence checks. No unauthorized probing or private data collection.",
  },
  {
    icon: <Database className="w-5 h-5" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    title: "Real-Time Market Intelligence",
    desc: "Live crypto and financial market streams, AI multi-factor signal scanning, alert center, paper trading, strategy backtesting, and sentiment tracking.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    title: "Provenance & Traceability",
    desc: "Every discovered opportunity includes complete data provenance: source entity, source URL, coordinates, and timestamp.",
  },
];

const SKILLS = [
  { label: "Full-Stack Web Development", icon: <Code2 className="w-4 h-4" />, color: "text-blue-400" },
  { label: "AI / ML Engineering & Ollama", icon: <Brain className="w-4 h-4" />, color: "text-purple-400" },
  { label: "QA & Software Testing", icon: <TestTube className="w-4 h-4" />, color: "text-green-400" },
  { label: "Dataset Preparation & Cleaning", icon: <Database className="w-4 h-4" />, color: "text-cyan-400" },
  { label: "Digital Marketing & Client Dealing", icon: <Megaphone className="w-4 h-4" />, color: "text-pink-400" },
  { label: "Technical Problem Solving", icon: <Sparkles className="w-4 h-4" />, color: "text-amber-400" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen space-y-8" style={{ backgroundColor: "var(--background)" }}>
      {/* ─── BANNER HERO ─────────────────────────────────────────── */}
      <div className="relative w-full h-52 md:h-72 overflow-hidden rounded-3xl">
        <Image
          src="/images/banner.png"
          alt="OPPARCH AI — Opportunity Architecture"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 md:left-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/20 border border-electric-500/40 text-electric-300 text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>OPPORTUNITY ARCHITECTURE AI</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-lg">
            FIND THE OPPORTUNITIES BEHIND THE DATA
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            A unified AI Opportunity Intelligence Platform for global business opportunity discovery and real-time market intelligence.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 px-2">
        {/* ─── WHAT PROBLEM OPPARCH AI SOLVES ─────────────────────── */}
        <div
          className="glass-panel p-6 md:p-8 rounded-2xl space-y-4"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-electric-500">
            <Target className="w-4 h-4" /> The Vision &amp; Purpose
          </div>
          <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
            Why OPPARCH AI Was Created
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Agencies, developers, and consultants waste countless hours searching through stale lead databases, purchased contact lists, and manual directories.
            <strong> OPPARCH AI (Opportunity Architecture AI)</strong> transforms public open-source data into qualified, high-converting business opportunities.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            By querying real OpenStreetMap registries, performing automated non-intrusive website audits, and leveraging local Ollama AI reasoning, OPPARCH AI surfaces businesses that actually need digital transformation — with explainable opportunity scores and matched service packages.
          </p>
        </div>

        {/* ─── FOUNDER SECTION ───────────────────────────────────── */}
        <div
          className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* Founder Photo */}
          <div className="flex-shrink-0">
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden ring-2 ring-electric-500/40 shadow-electric-glow">
              <Image
                src="/images/founder-photo.png"
                alt="Syed Zulqarnain — Creator & Founder"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>

          {/* Bio & Details */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black bg-electric-500/15 text-electric-500 border border-electric-500/30 uppercase mb-1">
                CREATOR &amp; LEAD DEVELOPER
              </div>
              <h3 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Syed Zulqarnain
              </h3>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent)" }}>
                Full-Stack Developer · AI/ML Enthusiast · QA &amp; Testing · HR &amp; Marketing
              </p>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Lead developer and architect of OPPARCH AI. Combining 3+ years of hands-on software development with 4+ years of professional marketing, client operations, and business strategy.
            </p>

            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { label: "Coding & Software Engineering", value: "3+ Years" },
                { label: "Marketing & Client Operations", value: "4+ Years" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-electric-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white text-xs font-bold shadow-electric-glow hover:from-electric-600 hover:to-royal-700 transition"
              >
                <Mail className="w-3.5 h-3.5" /> Contact Founder
              </Link>
              <a
                href="https://pk.linkedin.com/in/syed-zulqarnain?utm_source=share&utm_medium=member_mweb&utm_campaign=share_via&utm_content=profile"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition shadow-md"
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
              </a>
            </div>

          </div>
        </div>

        {/* ─── DRL & DEVARCHER EXPERIENCE ENTRIES ────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Briefcase className="w-4 h-4 text-electric-500" /> Technical Background &amp; Experience
          </h3>

          {/* DRL Entry */}
          <div
            className="glass-panel p-6 rounded-2xl space-y-3"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                  DRL
                </h4>
                <p className="text-xs font-bold text-electric-500">Developer | Testing | AI &amp; Data Support</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Professional Experience</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Multi-faceted technical role covering end-to-end web engineering, comprehensive QA testing, and AI/ML data preprocessing workflows.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {[
                "Website development & full-stack implementations",
                "QA testing, bug identification & regression analysis",
                "AI dataset preparation, cleaning & preprocessing",
                "Dataset organization & data quality improvement",
                "AI/ML model training support & output validation",
                "Technical problem solving across complex systems"
              ].map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span style={{ color: "var(--text-secondary)" }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DevArcher Entry */}
          <div
            className="glass-panel p-6 rounded-2xl space-y-3"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                  DevArcher
                </h4>
                <p className="text-xs font-bold text-electric-500">Digital Services &amp; Web Development</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Agency Experience</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Collaborating on full-stack web applications, UI/UX interface implementations, and technical digital services.
            </p>
          </div>
        </div>

        {/* ─── PLATFORM PILLARS ──────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: "var(--text-primary)" }}>
            Platform Architecture &amp; Engineering Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="glass-panel p-5 rounded-2xl space-y-3"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${p.bg} ${p.color}`}>
                  {p.icon}
                </div>
                <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
