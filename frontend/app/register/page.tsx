"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { registerUser } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerUser(email, password, fullName);
      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo + Brand */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              <Image
                src="/images/logo-icon.png"
                alt="OPPARCH AI"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              OPPARCH <span className="text-electric-500">AI</span>
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-400 text-xs font-semibold mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            First registered account automatically receives ADMIN privileges.
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {error && (
            <div
              className="p-3.5 rounded-xl flex items-center gap-2.5 text-xs"
              style={{
                backgroundColor: 'var(--error-bg)',
                color: 'var(--error-text)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <User className="w-3.5 h-3.5 text-electric-400" /> Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Syed Zulqarnain"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5 flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Mail className="w-3.5 h-3.5 text-electric-400" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5 flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Lock className="w-3.5 h-3.5 text-electric-400" /> Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>REGISTER</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div
            className="pt-4 border-t text-xs flex items-center justify-between"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <span>Already have an account?</span>
            <Link href="/login" className="font-bold text-electric-400 hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
