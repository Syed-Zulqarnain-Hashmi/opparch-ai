"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { loginUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("123@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(identifier, password);
      if (res.user) {
        // Re-fetch profile from token to confirm role
        await refreshUser();
        if (res.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          setError("Access Denied: Your account does not have Administrator privileges.");
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate administrator.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto">
            <Image
              src="/images/logo-icon.png"
              alt="OPPARCH AI"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ADMIN SECURITY GATEWAY</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
            Admin Command Center
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Authenticate with verified administrative credentials to manage users, data pipelines, and telemetry.
          </p>
        </div>

        {/* Login Box */}
        <div
          className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5"
          style={{ border: "1px solid var(--border)" }}
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Admin Username or Email
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-amber-500" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin or admin@opparch.ai"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition shadow-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--input-text)",
                    borderColor: "var(--input-border)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Admin Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-amber-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition shadow-sm"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--input-text)",
                    borderColor: "var(--input-border)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                <>
                  <span>Enter Admin Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              Standard User Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
