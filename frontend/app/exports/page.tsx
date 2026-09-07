"use client";

import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Sparkles, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { generateCSVExport, getCSVExportHistory, downloadExportFileDirect, downloadLeadsCsvDirect } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function CSVExportsPage() {
  const { isAdmin } = useAuth();
  const [exportsList, setExportsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const history = await getCSVExportHistory();
      setExportsList(history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateCSV = async () => {
    setGenerating(true);
    try {
      await generateCSVExport("My Opportunities Export");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to generate CSV export.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadDirect = async (expId: string, filename: string) => {
    setDownloadingId(expId);
    try {
      await downloadExportFileDirect(expId, filename);
    } catch (err: any) {
      alert(err.message || "Failed to download export file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAllLeads = async () => {
    try {
      await downloadLeadsCsvDirect(isAdmin);
    } catch (err: any) {
      alert(err.message || "Failed to download CSV.");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4" style={{ backgroundColor: "var(--background)" }}>
      {/* Header Banner */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV REPORT GENERATOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Exported Opportunity Reports
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Generate and download formatted CSV reports containing business leads, gap scores, and service recommendations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 self-start md:self-auto">
          <button
            onClick={handleDownloadAllLeads}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD ALL LEADS CSV</span>
          </button>

          <button
            onClick={handleGenerateCSV}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 hover:to-royal-700 text-white text-xs font-bold transition shadow-electric-glow flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating CSV...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>EXPORT NEW CSV REPORT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* History List */}
      <div
        className="glass-panel p-6 rounded-2xl space-y-4"
        style={{ border: "1px solid var(--border)" }}
      >
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Download className="w-4 h-4 text-electric-500" />
          <span>Export History</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Loading export records...
          </div>
        ) : (
          <div className="space-y-3">
            {exportsList.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border)"
                }}
              >
                <div className="space-y-1">
                  <h4 className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                    {exp.filename}
                  </h4>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Records: {exp.record_count} leads • Created: {new Date(exp.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => handleDownloadDirect(exp.id, exp.filename)}
                  disabled={downloadingId === exp.id}
                  className="px-4 py-2 rounded-lg bg-electric-500/10 hover:bg-electric-500/20 border border-electric-500/30 text-electric-500 font-bold transition flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
                >
                  {downloadingId === exp.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download File</span>
                </button>
              </div>
            ))}

            {exportsList.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-500" />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No exported CSV reports yet. Click &quot;Export New CSV Report&quot; or &quot;Download All Leads CSV&quot; above.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
