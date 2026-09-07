"use client";

import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile({
        full_name: fullName,
        password: password.length >= 6 ? password : undefined,
      });
      await refreshUser();
      setMsg("Profile updated successfully!");
      setPassword('');
    } catch (err: any) {
      setMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-4">
      <div className="glass-panel p-6 rounded-2xl border border-electric-500/30 text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-royal-500/20 border-2 border-electric-500/40 flex items-center justify-center mx-auto text-electric-400 font-black text-xl">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <h1 className="text-2xl font-black text-white">{user?.full_name}</h1>
        <p className="text-xs text-slate-400">{user?.email} • Role: <strong className="text-electric-400">{user?.role}</strong></p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-electric-500/30 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-electric-400" /> Account & Password Settings
        </h3>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-navy-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-electric-500/30 focus:outline-none focus:border-electric-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password (optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full bg-navy-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-electric-500/30 focus:outline-none focus:border-electric-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-royal-500 to-royal-600 hover:from-royal-600 text-white text-xs font-bold transition shadow-electric-glow flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
}
