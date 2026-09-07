"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Globe, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { getAnalyticsOverview } from '@/lib/api';

export default function GlobalMapPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getAnalyticsOverview().then(data => setStats(data)).catch(console.error);
  }, []);

  const countryData = [
    { country: "Pakistan", flag: "🇵🇰", count: stats?.opportunities_by_country?.Pakistan || 142, highlight: "Healthcare & Restaurants Digital Gap" },
    { country: "USA", flag: "🇺🇸", count: stats?.opportunities_by_country?.USA || 381, highlight: "Real Estate & Logistics Web Redesign" },
    { country: "UAE", flag: "🇦🇪", count: stats?.opportunities_by_country?.UAE || 117, highlight: "Direct E-Commerce & Hospitality Portals" },
    { country: "UK", flag: "🇬🇧", count: stats?.opportunities_by_country?.UK || 209, highlight: "Construction & B2B Web Applications" },
    { country: "Australia", flag: "🇦🇺", count: stats?.opportunities_by_country?.Australia || 94, highlight: "Services & Medical Web Performance" },
    { country: "Saudi Arabia", flag: "🇸🇦", count: stats?.opportunities_by_country?.["Saudi Arabia"] || 76, highlight: "Public Sector & Professional Services" }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-electric-500/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-400 text-xs font-semibold mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL COUNTRY INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl font-black text-white">Worldwide Opportunity Density</h1>
          <p className="text-xs text-slate-300">Filter platform intelligence by country, region, and market opportunity density.</p>
        </div>
      </div>

      {/* Global Visual Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-electric-500/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-white">Target Any Country. Discover Local Digital Gaps.</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              OPPARCH AI's discovery engine operates globally without geographic limitations. Click any target market to instantly trigger filtered opportunity discovery.
            </p>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-electric-500/30">
              <Image
                src="/images/banner.png"
                alt="Global Opportunity Visual"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Country Opportunity Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {countryData.map((item, idx) => (
          <div
            key={idx}
            className="glass-panel p-6 rounded-2xl border border-electric-500/20 glass-panel-hover space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.flag}</span>
                <h3 className="text-lg font-bold text-white">{item.country}</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-royal-500/20 text-electric-400 border border-electric-500/40">
                {item.count} Leads
              </span>
            </div>

            <p className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">Top Opportunity Sector:</strong>
              {item.highlight}
            </p>

            <Link
              href={`/opportunity-hunter?c=${encodeURIComponent(item.country)}`}
              className="w-full py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-electric-400 text-xs font-bold border border-electric-500/30 transition flex items-center justify-center gap-1.5"
            >
              Filter {item.country} Opportunities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
