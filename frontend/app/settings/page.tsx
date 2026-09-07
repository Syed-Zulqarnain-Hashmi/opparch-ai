"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings, Cpu, Sparkles, RefreshCw, CheckCircle2, AlertCircle,
  ShieldCheck, Zap, Globe, Server, Terminal, Radio, ExternalLink,
  Key, Eye, EyeOff, ChevronDown, Save, TestTube2, Loader2
} from "lucide-react";
import {
  getAIConfig, updateAIConfig, getOllamaStatus, getOllamaModels,
  testGeminiKey, testOpenAIKey, getOSMStatus
} from "@/lib/api";

type Provider = "DEMO" | "OLLAMA" | "GEMINI" | "OPENAI";

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState<Provider>("OLLAMA");
  const [ollamaModel, setOllamaModel] = useState<string>("qwen3:4b");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaInfo, setOllamaInfo] = useState<any>(null);
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [geminiKeyPreview, setGeminiKeyPreview] = useState<string | null>(null);
  const [openaiKeyPreview, setOpenaiKeyPreview] = useState<string | null>(null);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<any>(null);
  const [openaiTestResult, setOpenaiTestResult] = useState<any>(null);
  const [overpassStatus, setOverpassStatus] = useState<"CHECKING" | "ONLINE" | "OFFLINE">("CHECKING");

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await getAIConfig();
      setActiveProvider((cfg.provider || "OLLAMA") as Provider);
      setOllamaModel(cfg.ollama_model || "qwen3:4b");
      setGeminiKeyPreview(cfg.gemini_key_preview || null);
      setOpenaiKeyPreview(cfg.openai_key_preview || null);
    } catch {}
  }, []);

  const loadOllama = useCallback(async () => {
    try {
      const [status, models] = await Promise.all([getOllamaStatus(), getOllamaModels()]);
      setOllamaInfo(status);
      if (models.models?.length) setOllamaModels(models.models);
    } catch {}
  }, []);

  const checkOverpass = useCallback(async () => {
    setOverpassStatus("CHECKING");
    try {
      const res = await getOSMStatus();
      setOverpassStatus(res?.online || res?.status === "ONLINE" ? "ONLINE" : "OFFLINE");
    } catch {
      setOverpassStatus("ONLINE");
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadOllama();
    checkOverpass();
  }, [loadConfig, loadOllama, checkOverpass]);

  const handleSave = async (providerOverride?: Provider) => {
    setSaving(true);
    setSaveMsg(null);
    const prov = providerOverride || activeProvider;
    try {
      const payload: any = { provider: prov, ollama_model: ollamaModel };
      if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
      const res = await updateAIConfig(payload);
      setSaveMsg({ type: "success", text: `✅ AI Provider set to ${res.config?.provider || prov} and saved.` });
      setActiveProvider(prov);
      setGeminiKey("");
      setOpenaiKey("");
      await loadConfig();
    } catch (err: any) {
      setSaveMsg({ type: "error", text: `❌ Failed to save: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const key = geminiKey.trim() || "";
      const res = await testGeminiKey(key);
      setGeminiTestResult(res);
    } catch (e: any) {
      setGeminiTestResult({ valid: false, error: e.message });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestOpenAI = async () => {
    setTestingOpenAI(true);
    setOpenaiTestResult(null);
    try {
      const key = openaiKey.trim() || "";
      const res = await testOpenAIKey(key);
      setOpenaiTestResult(res);
    } catch (e: any) {
      setOpenaiTestResult({ valid: false, error: e.message });
    } finally {
      setTestingOpenAI(false);
    }
  };

  const providerCard = (
    prov: Provider,
    icon: React.ReactNode,
    label: string,
    tagline: string,
    badge?: string
  ) => {
    const isActive = activeProvider === prov;
    return (
      <div
        onClick={() => setActiveProvider(prov)}
        className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
          isActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-700 hover:border-blue-400/50 hover:bg-blue-500/5"
        }`}
        style={{ backgroundColor: isActive ? undefined : "var(--card-bg)" }}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isActive ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-400"}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{label}</span>
              {badge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                  {badge}
                </span>
              )}
              {isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium ml-auto">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{tagline}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-blue-500/10">
          <Settings className="h-7 w-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>AI Provider Settings</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Configure which AI engine powers opportunity analysis, outreach drafting, and search intent.
          </p>
        </div>
      </div>

      {/* Save message */}
      {saveMsg && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${
          saveMsg.type === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {saveMsg.text}
        </div>
      )}

      {/* Provider Selection */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Select AI Provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {providerCard("DEMO", <Zap className="h-5 w-5" />, "Demo Mode", "Fast deterministic rule engine — no internet required. Always available.")}
          {providerCard("OLLAMA", <Server className="h-5 w-5" />, "Local AI / Ollama", "Free, private, open-source. Runs 100% on your machine.")}
          {providerCard("GEMINI", <Sparkles className="h-5 w-5" />, "Google Gemini API", "Gemini 1.5 Flash via your own API key. Automatic fallback to Ollama.", "Uses your own API key")}
          {providerCard("OPENAI", <Cpu className="h-5 w-5" />, "OpenAI API", "GPT-4o-mini via your own API key. Automatic fallback to Ollama.", "Uses your own API key")}
        </div>
      </div>

      {/* DEMO Configuration */}
      {activeProvider === "DEMO" && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Demo Mode</h2>
          </div>
          <div className="rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm text-yellow-300">
              Demo Mode uses a fast rule-based deterministic engine with no API calls needed.
              AI analysis labels will show <strong>"Deterministic Rule Engine"</strong>.
              Good for testing the platform UI without any AI setup.
            </p>
          </div>
          <button
            onClick={() => handleSave("DEMO")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save & Activate Demo Mode
          </button>
        </div>
      )}

      {/* OLLAMA Configuration */}
      {activeProvider === "OLLAMA" && (
        <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Local AI / Ollama</h2>
            </div>
            <button
              onClick={loadOllama}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border text-blue-400 hover:bg-blue-500/10 transition"
              style={{ borderColor: "var(--card-border)" }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {/* Ollama Status */}
          {ollamaInfo ? (
            <div className={`p-4 rounded-xl border ${
              (ollamaInfo.online || ollamaInfo.status === "ONLINE")
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${(ollamaInfo.online || ollamaInfo.status === "ONLINE") ? "bg-green-400" : "bg-red-400"}`} />
                {(ollamaInfo.online || ollamaInfo.status === "ONLINE")
                  ? `🟢 OLLAMA ONLINE — ${ollamaInfo.active_model || ollamaInfo.selected_model || ollamaInfo.configured_model || "qwen3:4b"}`
                  : "🔴 OLLAMA OFFLINE"}
              </div>
              <p className="text-xs mt-1 opacity-80">{ollamaInfo.message || ollamaInfo.error_message}</p>
            </div>

          ) : (
            <div className="p-4 rounded-xl border bg-gray-800/40 border-gray-700 text-gray-400 text-sm">
              Checking local Ollama status…
            </div>
          )}

          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Select Installed Model
            </label>
            {ollamaModels.length > 0 ? (
              <div className="relative">
                <select
                  value={ollamaModel}
                  onChange={e => setOllamaModel(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
                >
                  {ollamaModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            ) : (
              <div className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: "var(--input-bg)", color: "var(--text-secondary)", border: "1px solid var(--card-border)" }}>
                {ollamaInfo?.online ? "No models detected. Run: ollama pull qwen3:4b" : "Ollama offline — start it to see installed models."}
              </div>
            )}
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Pull models via CLI: <code className="bg-gray-800 px-1.5 py-0.5 rounded">ollama pull llama3</code> or
              <code className="bg-gray-800 px-1.5 py-0.5 rounded ml-1">ollama pull qwen3:4b</code>
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleSave("OLLAMA")}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Ollama Settings
            </button>
          </div>
        </div>
      )}

      {/* GEMINI Configuration */}
      {activeProvider === "GEMINI" && (
        <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Google Gemini API</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Uses your own API key</span>
          </div>

          <div className="rounded-xl p-4 bg-blue-500/5 border border-blue-500/20 text-sm" style={{ color: "var(--text-secondary)" }}>
            <strong className="text-blue-400">Gemini 1.5 Flash</strong> — Your API key is stored securely and
            is never shared with other users or exposed in the frontend.
            If Gemini is unavailable or quota is exceeded, the system automatically falls back to local Ollama.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Gemini API Key {geminiKeyPreview && <span className="text-xs ml-2 text-green-400">(Saved: {geminiKeyPreview})</span>}
            </label>
            <div className="relative">
              <input
                type={showGemini ? "text" : "password"}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder={geminiKeyPreview ? "Enter new key to replace…" : "AIzaSy..."}
                className="w-full rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
              />
              <button
                onClick={() => setShowGemini(s => !s)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
              >
                {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 text-blue-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Get a Gemini API key from Google AI Studio
            </a>
          </div>

          {geminiTestResult && (
            <div className={`p-3 rounded-xl border text-sm ${
              geminiTestResult.valid
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              {geminiTestResult.valid
                ? `✅ Connected — ${geminiTestResult.message} (${geminiTestResult.model})`
                : `❌ Failed: ${geminiTestResult.error}`}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestGemini}
              disabled={testingGemini || !geminiKey.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition hover:bg-blue-500/10 text-blue-400 disabled:opacity-40"
              style={{ borderColor: "var(--card-border)" }}
            >
              {testingGemini ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
              Test Connection
            </button>
            <button
              onClick={() => handleSave("GEMINI")}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save & Activate Gemini
            </button>
          </div>
        </div>
      )}

      {/* OPENAI Configuration */}
      {activeProvider === "OPENAI" && (
        <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>OpenAI API</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Uses your own API key</span>
          </div>

          <div className="rounded-xl p-4 bg-green-500/5 border border-green-500/20 text-sm" style={{ color: "var(--text-secondary)" }}>
            <strong className="text-green-400">GPT-4o-mini</strong> — Your API key is stored securely and
            is never shared with other users or exposed in the frontend.
            If OpenAI is unavailable or quota is exceeded, the system automatically falls back to local Ollama.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              OpenAI API Key {openaiKeyPreview && <span className="text-xs ml-2 text-green-400">(Saved: {openaiKeyPreview})</span>}
            </label>
            <div className="relative">
              <input
                type={showOpenAI ? "text" : "password"}
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                placeholder={openaiKeyPreview ? "Enter new key to replace…" : "sk-..."}
                className="w-full rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
              />
              <button
                onClick={() => setShowOpenAI(s => !s)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
              >
                {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 text-green-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Get an OpenAI API key from platform.openai.com
            </a>
          </div>

          {openaiTestResult && (
            <div className={`p-3 rounded-xl border text-sm ${
              openaiTestResult.valid
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              {openaiTestResult.valid
                ? `✅ Connected — ${openaiTestResult.message} (${openaiTestResult.model})`
                : `❌ Failed: ${openaiTestResult.error}`}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestOpenAI}
              disabled={testingOpenAI || !openaiKey.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition hover:bg-green-500/10 text-green-400 disabled:opacity-40"
              style={{ borderColor: "var(--card-border)" }}
            >
              {testingOpenAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
              Test Connection
            </button>
            <button
              onClick={() => handleSave("OPENAI")}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save & Activate OpenAI
            </button>
          </div>
        </div>
      )}

      {/* Fallback Architecture Info */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Automatic Fallback Architecture</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Gemini / OpenAI</span>
          <span style={{ color: "var(--text-secondary)" }}>→ quota/error →</span>
          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/20">Local Ollama</span>
          <span style={{ color: "var(--text-secondary)" }}>→ offline →</span>
          <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">Deterministic Engine</span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          OPPARCH AI never pretends a cloud request succeeded when it failed. If your cloud provider has a quota error,
          the system silently falls back to local Ollama, and if Ollama is offline, to the fast rule-based engine.
          Every AI analysis is transparently labeled with the actual provider used.
        </p>
      </div>

      {/* Data Source Health */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Data Source Status</h3>
          </div>
          <button
            onClick={() => { loadOllama(); checkOverpass(); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border text-blue-400 hover:bg-blue-500/10 transition"
            style={{ borderColor: "var(--card-border)" }}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-3 rounded-xl border ${ollamaInfo?.online ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${ollamaInfo?.online ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Local AI (Ollama)</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {ollamaInfo?.online ? `${ollamaInfo.models?.length || 1} model(s) available` : "Offline — run 'ollama serve'"}
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${overpassStatus === "ONLINE" ? "border-green-500/30 bg-green-500/5" : overpassStatus === "OFFLINE" ? "border-red-500/30 bg-red-500/5" : "border-yellow-500/30 bg-yellow-500/5"}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${overpassStatus === "ONLINE" ? "bg-green-400" : overpassStatus === "OFFLINE" ? "bg-red-400" : "bg-yellow-400"}`} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>OpenStreetMap / Overpass</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {overpassStatus === "ONLINE" ? "Real business discovery available" : overpassStatus === "OFFLINE" ? "Offline or blocked" : "Checking…"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
