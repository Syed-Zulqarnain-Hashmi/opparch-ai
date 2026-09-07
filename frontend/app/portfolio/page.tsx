"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Code2, Brain, TestTube, Megaphone, ExternalLink,
  Github, Linkedin, Mail, Globe, Star, Calendar,
  CheckCircle, Zap, Database, Bug, BarChart3
} from "lucide-react";

const SKILLS = [
  { label: "Full-Stack Development", icon: <Code2 className="w-4 h-4" />, color: "text-blue-400" },
  { label: "AI / ML Engineering", icon: <Brain className="w-4 h-4" />, color: "text-purple-400" },
  { label: "QA & Software Testing", icon: <TestTube className="w-4 h-4" />, color: "text-green-400" },
  { label: "Dataset Preparation & Cleaning", icon: <Database className="w-4 h-4" />, color: "text-cyan-400" },
  { label: "Digital Marketing", icon: <Megaphone className="w-4 h-4" />, color: "text-pink-400" },
  { label: "Technical Problem Solving", icon: <Bug className="w-4 h-4" />, color: "text-amber-400" },
];

const EXPERIENCE = [
  {
    id: "opparch",
    company: "OPPARCH AI",
    role: "Creator & Lead Developer",
    period: "2024 – Present",
    type: "Independent Personal Project",
    description: "An independently developed AI platform for global business opportunity discovery and real-time market intelligence. Built from scratch — full-stack architecture, AI integration, real-time data pipelines, and production deployment.",
    highlights: [
      "Unified dual-module AI platform: Client Hunting + Market Intelligence",
      "Local Ollama AI integration — zero-cost AI inference",
      "Real-time OpenStreetMap business discovery (Overpass API)",
      "Live crypto market data (Binance, Bitget, CoinGecko)",
      "FastAPI backend + Next.js 14 App Router frontend",
      "Opportunity scoring engine with explainable AI reasoning",
    ],
    stack: ["Next.js 14", "FastAPI", "Python", "TypeScript", "SQLite", "Ollama", "Tailwind CSS"],
    accent: "from-electric-500 to-royal-600",
    highlight: true,
  },
  {
    id: "drl",
    company: "DRL",
    role: "Developer | Testing | AI & Data Support",
    period: "2023 – 2024",
    type: "Professional Experience",
    description: "Multi-role technical position covering full-stack web development, comprehensive QA testing, and AI/ML dataset support responsibilities.",
    highlights: [
      "Website development & full-stack implementation tasks",
      "QA testing — bug identification, debugging, regression testing",
      "AI dataset preparation, cleaning & preprocessing pipelines",
      "Dataset organization & quality improvement workflows",
      "AI/ML model training support & output validation",
      "Technical problem solving across software & data systems",
    ],
    stack: ["Web Development", "QA Testing", "Data Preprocessing", "AI/ML Support", "Debugging"],
    accent: "from-emerald-500 to-teal-600",
    highlight: false,
  },
  {
    id: "devarcher",
    company: "DevArcher",
    role: "Developer & Digital Services",
    period: "2022 – 2023",
    type: "Agency Experience",
    description: "Web development and digital services at DevArcher — a web and software development agency.",
    highlights: [
      "Website development for client projects",
      "UI/UX design implementation",
      "Digital marketing & client communication",
      "Brand & marketing operations",
    ],
    stack: ["Web Development", "UI/UX", "Digital Marketing"],
    accent: "from-slate-500 to-slate-600",
    highlight: false,
    externalLink: "https://devarcher.com",
  },
];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* ─── HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative w-full h-52 md:h-72 overflow-hidden">
        <Image
          src="/images/banner.png"
          alt="OPPARCH AI — Portfolio Banner"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        {/* Banner text */}
        <div className="absolute bottom-6 left-6 md:left-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/20 border border-electric-500/40 text-electric-300 text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Creator Profile</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
            Syed Zulqarnain
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Full-Stack Developer · AI/ML · QA & Testing · Marketing
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* ─── PROFILE CARD ─────────────────────────────────────── */}
        <div
          className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* Founder Photo */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-2 ring-electric-500/40 shadow-electric-glow">
              <Image
                src="/images/founder-photo.png"
                alt="Syed Zulqarnain — Founder"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>

          {/* Bio */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Syed Zulqarnain
              </h2>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent)" }}>
                Full-Stack Developer · AI/ML Enthusiast · QA & Testing · HR & Marketing
              </p>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Independent developer and creator of OPPARCH AI. Passionate about building intelligent systems that solve real business problems.
              3+ years in software development combined with 4+ years in marketing, client operations, and business development.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { label: "Coding / Software Dev", value: "3+ Years" },
                { label: "Marketing & Client Ops", value: "4+ Years" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-electric-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white text-xs font-bold shadow-electric-glow hover:from-electric-600 hover:to-royal-700 transition"
              >
                <Mail className="w-3.5 h-3.5" /> Contact Me
              </Link>
              <a
                href="https://devarcher.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <Globe className="w-3.5 h-3.5" /> DevArcher <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* ─── SKILLS ──────────────────────────────────────────── */}
        <div className="glass-panel p-6 rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Star className="w-4 h-4 text-electric-400" /> Core Skills
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SKILLS.map((skill) => (
              <div
                key={skill.label}
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ backgroundColor: "var(--surface-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                <span className={skill.color}>{skill.icon}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{skill.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── EXPERIENCE ──────────────────────────────────────── */}
        <div className="space-y-5">
          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BarChart3 className="w-4 h-4 text-electric-400" /> Experience & Projects
          </h3>

          {EXPERIENCE.map((exp) => (
            <div
              key={exp.id}
              className={`glass-panel p-6 rounded-2xl space-y-4 ${exp.highlight ? "ring-1 ring-electric-500/30" : ""}`}
              style={{ border: "1px solid var(--border)" }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                      {exp.company}
                    </h4>
                    {exp.highlight && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-electric-500/15 text-electric-400 border border-electric-500/30">
                        INDEPENDENT PROJECT
                      </span>
                    )}
                    {exp.externalLink && (
                      <a
                        href={exp.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> devarcher.com
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-bold mt-0.5" style={{ color: "var(--accent)" }}>{exp.role}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {exp.type} · {exp.period}
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {exp.description}
              </p>

              {/* Highlights */}
              <div className="space-y-1.5">
                {exp.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Stack */}
              <div className="flex flex-wrap gap-1.5">
                {exp.stack.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      backgroundColor: "var(--badge-bg)",
                      color: "var(--badge-text)",
                      border: "1px solid var(--badge-border)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ─── CONTACT CTA ─────────────────────────────────────── */}
        <div
          className="glass-panel p-6 rounded-2xl text-center space-y-3"
          style={{ border: "1px solid var(--border)" }}
        >
          <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Get in Touch</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Open to collaboration, freelance projects, and interesting opportunities.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white text-sm font-bold shadow-electric-glow hover:from-electric-600 hover:to-royal-700 transition"
            >
              <Mail className="w-4 h-4" /> Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
