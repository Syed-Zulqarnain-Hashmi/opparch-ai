"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, CheckCircle2, ArrowRight, ShieldAlert, Target } from 'lucide-react';
import { getEmergingOpportunities } from '@/lib/api';

export default function EmergingOpportunitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getEmergingOpportunities()
      .then(data => setItems(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-electric-500/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-400 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>EMERGING OPPORTUNITY DETECTION ENGINE</span>
          </div>
          <h1 className="text-2xl font-black text-white">Public Sector & Market Trend Signals</h1>
          <p className="text-xs text-slate-300">Identifies sector-wide digital transformation waves and rising market demand signals.</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
            <Sparkles className="w-6 h-6 text-electric-400 animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold">Detecting Emerging Market Transformation Signals...</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-6 rounded-2xl border border-electric-500/20 glass-panel-hover space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-navy-950 text-electric-400 border border-electric-500/30">
                      📍 {item.country} • {item.industry}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      ⚡ {item.growth_signal} GROWTH SIGNAL
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{item.opportunity_name}</h2>
                </div>

                <div className="bg-navy-950 px-4 py-2 rounded-xl border border-electric-500/30 text-right shrink-0">
                  <span className="text-xs text-slate-400 block">Est. Businesses Impacted:</span>
                  <span className="text-lg font-black text-white">{item.estimated_potential_businesses}+ Businesses</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-navy-950/60 p-3.5 rounded-xl border border-electric-500/10">
                {item.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Public Evidence Signals:</h4>
                  {item.evidence_signals.map((sig: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-royal-500/10 p-3.5 rounded-xl border border-electric-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-electric-400 uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" /> Recommended Solution:
                  </span>
                  <p className="text-xs font-bold text-white">{item.recommended_devarcher_solution}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
