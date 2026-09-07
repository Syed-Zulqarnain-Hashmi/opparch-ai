"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, ArrowLeft, RefreshCw, ExternalLink, MessageSquare,
  ThumbsUp, CheckCircle2, AlertTriangle, ShieldCheck
} from "lucide-react";
import { getNewsSentiment } from "@/lib/api";

export default function NewsIntelligencePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await getNewsSentiment();
      setData(res);
    } finally {
      setLoading(false);
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
              News &amp; Social <span className="text-amber-500">Sentiment Intelligence</span>
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Real-time public news aggregation with automated market verification (price &amp; volume confirmation).
          </p>
        </div>

        <button
          onClick={loadNews}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-md hover:from-amber-600 hover:to-orange-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Feeds
        </button>
      </div>

      {/* ── Sentiment Summary Banner ──────────────────────────── */}
      <div
        className="glass-panel p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest" style={{ color: "var(--text-muted)" }}>Overall Sentiment Bias</p>
            <p className="text-sm font-black text-emerald-500">
              {data?.overall_social_sentiment || "POSITIVE"} MOMENTUM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Reddit Posts: </span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{data?.reddit_posts?.length || 0}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>RSS Articles: </span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{data?.news_items?.length || 0}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Verification Engine: </span>
            <span className="font-bold text-emerald-500">Active</span>
          </div>
        </div>
      </div>

      {/* ── Two Columns: Reddit vs RSS News ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reddit Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Reddit Crypto Community Feeds</span>
            </h3>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Public JSON Feed</span>
          </div>

          <div className="space-y-2">
            {(data?.reddit_posts || []).map((post: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border space-y-1.5"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)"
                }}
              >
                <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold text-amber-500">{post.subreddit}</span>
                  <span>{post.score} points • {post.num_comments} comments</span>
                </div>
                <h4 className="text-xs font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {post.title}
                </h4>
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-electric-500 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Read Reddit Thread</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RSS News Articles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <BookOpen className="w-3.5 h-3.5 text-electric-500" />
              <span>Major Publications &amp; Wire Feeds</span>
            </h3>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>RSS Sentiment Parser</span>
          </div>

          <div className="space-y-2">
            {(data?.news_items || []).map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border space-y-1.5"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)"
                }}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-electric-500">{item.source}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${item.sentiment === "POSITIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"}`}>
                    {item.sentiment}
                  </span>
                </div>
                <h4 className="text-xs font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {item.title}
                </h4>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-electric-500 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Full Article</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
