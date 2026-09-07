"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Search, ArrowRight, Globe, Sparkles } from 'lucide-react';
import { getSearchHistory } from '@/lib/api';

export default function SearchHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getSearchHistory();
        setHistory(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4" style={{ backgroundColor: "var(--background)" }}>
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-semibold">
            <History className="w-3.5 h-3.5" />
            <span>SEARCH TELEMETRY LOG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Opportunity Search History
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Complete chronological audit trail of your natural language and filtered opportunity searches.
          </p>
        </div>
      </div>

      <div
        className="glass-panel p-6 rounded-2xl border space-y-4"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)"
        }}
      >
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <History className="w-4 h-4 text-electric-500" />
          <span>Executed Query History ({history.length})</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>Loading search history...</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border)"
                }}
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>&quot;{item.query}&quot;</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    <span className="px-2 py-0.5 rounded font-semibold text-electric-500 bg-electric-500/10 border border-electric-500/20">
                      📍 {item.country} {item.city ? `• ${item.city}` : ''}
                    </span>
                    {item.industry && (
                      <span className="px-2 py-0.5 rounded border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                        🏢 {item.industry}
                      </span>
                    )}
                    <span>• Results Found: {item.results_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                  <Link
                    href={`/opportunity-hunter?q=${encodeURIComponent(item.query)}&c=${encodeURIComponent(item.country)}`}
                    className="px-3 py-1.5 rounded-lg bg-electric-500/10 hover:bg-electric-500/20 text-electric-500 font-bold border border-electric-500/30 text-xs flex items-center gap-1 transition"
                  >
                    <span>Re-run</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="p-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                No search history recorded yet. Use the Opportunity Hunter to execute searches.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
