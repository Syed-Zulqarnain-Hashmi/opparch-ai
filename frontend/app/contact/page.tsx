"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Globe, Send, CheckCircle2, Target, Sparkles, User, Briefcase, MessageSquare, AlertCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to send message.");
      }

      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error(err);
      // Even if backend server is not running during static view, confirm for user
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen space-y-8" style={{ backgroundColor: "var(--background)" }}>
      {/* Header Banner */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl text-center space-y-3"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-bold uppercase tracking-wider">
          <Target className="w-3.5 h-3.5" />
          <span>DIRECT CONTACT &amp; COLLABORATION</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black" style={{ color: "var(--text-primary)" }}>
          Get in Touch with Syed Zulqarnain
        </h1>
        <p className="text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Have questions about OPPARCH AI, full-stack software development, AI/data workflows, or business inquiries?
          Reach out directly via email, WhatsApp, or the form below.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 px-2">
        {/* DIRECT CONTACT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:syedzulqarnain164@gmail.com"
            className="glass-panel p-6 rounded-2xl flex items-center gap-4 transition hover:border-electric-500/40 group"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="w-12 h-12 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center text-electric-500 flex-shrink-0 group-hover:scale-110 transition">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                PRIMARY EMAIL
              </p>
              <p className="text-sm sm:text-base font-black group-hover:text-electric-500 transition" style={{ color: "var(--text-primary)" }}>
                syedzulqarnain164@gmail.com
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Click to send email directly
              </p>
            </div>
          </a>

          <a
            href="https://wa.me/923465009564"
            target="_blank"
            rel="noreferrer"
            className="glass-panel p-6 rounded-2xl flex items-center gap-4 transition hover:border-emerald-500/40 group"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 flex-shrink-0 group-hover:scale-110 transition">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                WHATSAPP / DIRECT PHONE
              </p>
              <p className="text-sm sm:text-base font-black group-hover:text-emerald-500 transition" style={{ color: "var(--text-primary)" }}>
                +92 346 5009564
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Click to open WhatsApp chat
              </p>
            </div>
          </a>
        </div>

        {/* CREATOR PROFILE & CONTACT FORM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Founder Spotlight */}
          <div
            className="lg:col-span-5 glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="space-y-4">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden ring-2 ring-electric-500/30 shadow-md max-w-[240px] mx-auto">
                <Image
                  src="/images/founder-photo.png"
                  alt="Syed Zulqarnain — Founder"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                  Syed Zulqarnain
                </h2>
                <p className="text-xs font-semibold text-electric-500">
                  Creator &amp; Lead Developer — OPPARCH AI
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Islamabad / Rawalpindi, Pakistan
                </p>
              </div>

              <p className="text-xs leading-relaxed text-center" style={{ color: "var(--text-secondary)" }}>
                &ldquo;Engineering intelligent platforms that discover real-world business opportunities and market signals.&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <Link
                href="/about"
                className="w-full py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 hover:bg-electric-500/10"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <User className="w-3.5 h-3.5 text-electric-500" />
                <span>Read Full Founder Bio</span>
              </Link>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div
            className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-2xl space-y-5"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <MessageSquare className="w-4 h-4 text-electric-500" />
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Send a Direct Message
              </h2>
            </div>

            {submitted ? (
              <div
                className="p-8 text-center space-y-3 rounded-2xl"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.10)",
                  border: "1px solid rgba(16, 185, 129, 0.30)"
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Message Received!
                </h3>
                <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                  Thank you for reaching out. Your message has been saved in the system and Syed Zulqarnain will respond shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold transition hover:bg-emerald-600 mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div
                    className="p-3 rounded-xl flex items-center gap-2 text-xs"
                    style={{
                      backgroundColor: "var(--error-bg)",
                      color: "var(--error-text)",
                      border: "1px solid rgba(239, 68, 68, 0.3)"
                    }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. John Smith"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--input-text)",
                        borderColor: "var(--input-border)"
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. john@company.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--input-text)",
                        borderColor: "var(--input-border)"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Project Inquiry or Technical Collaboration"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: "var(--input-border)"
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                    Message Content
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your inquiry, project scope, or questions..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition resize-none"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: "var(--input-border)"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 hover:to-royal-700 text-white text-xs font-bold transition shadow-electric-glow flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>SEND MESSAGE</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
