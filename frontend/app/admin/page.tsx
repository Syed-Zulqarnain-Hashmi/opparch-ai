"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, Users, Search, Database, Cpu, Activity, Download, CheckCircle2, 
  XCircle, RefreshCw, Loader2, Mail, MessageSquare, Send, Inbox, ShieldCheck, Lock, Eye, AlertTriangle
} from 'lucide-react';
import { 
  getAdminDashboard, getAdminUsers, toggleUserStatus, updateUserRole, 
  getAdminLogs, getAdminOutreachLogs, getContactMessages, markContactMessageAsRead, getUserFullDetails,
  getAdminEmailSettings, updateAdminEmailSettings, devResetDatabase, testAdminSmtpConnection
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [outreachData, setOutreachData] = useState<any>({ outreaches: [], replies: [] });
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kpis' | 'users' | 'outreach' | 'messages' | 'activity' | 'email_settings' | 'dev_reset'>('kpis');
  const [emailSettings, setEmailSettings] = useState<any>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [resettingDb, setResettingDb] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [emailForm, setEmailForm] = useState({
    smtp_host: "mail.zoho.com",
    smtp_port: 587,
    smtp_username: "contact@devarcher.com",
    smtp_password: "",
    from_email: "contact@devarcher.com",
    imap_host: "imap.zoho.com",
    imap_port: 993
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, users, logs, outreach, msgs, emailCfg] = await Promise.all([
        getAdminDashboard().catch(() => null),
        getAdminUsers().catch(() => []),
        getAdminLogs().catch(() => []),
        getAdminOutreachLogs().catch(() => ({ outreaches: [], replies: [] })),
        getContactMessages().catch(() => []),
        getAdminEmailSettings().catch(() => null)
      ]);
      setData(dash);
      setUsersList(users || []);
      setActivityLogs(logs || []);
      setOutreachData(outreach || { outreaches: [], replies: [] });
      setContactMessages(msgs || []);
      if (emailCfg) {
        setEmailSettings(emailCfg);
        setEmailForm((prev) => ({
          ...prev,
          smtp_host: emailCfg.smtp_host || prev.smtp_host,
          smtp_port: emailCfg.smtp_port || prev.smtp_port,
          smtp_username: emailCfg.smtp_username || prev.smtp_username,
          from_email: emailCfg.from_email || prev.from_email,
          imap_host: emailCfg.imap_host || prev.imap_host,
          imap_port: emailCfg.imap_port || prev.imap_port,
        }));
      }
    } catch (err: any) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmail(true);
    try {
      const res = await updateAdminEmailSettings(emailForm);
      setEmailSettings(res.config);
      alert("✅ Zoho SMTP configuration saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to update email configuration.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await testAdminSmtpConnection(testEmailRecipient || undefined);
      setSmtpTestResult(res);
    } catch (err: any) {
      setSmtpTestResult({ status: "error", message: err.message || "SMTP test failed." });
    } finally {
      setTestingSmtp(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      // Do not silently redirect — allow rendering 403 Forbidden screen
      setLoading(false);
      return;
    }
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, authLoading]);

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await toggleUserStatus(userId, !currentActive);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update user status.");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update user role.");
    }
  };

  const handleInspectUser = async (userId: string) => {
    try {
      const details = await getUserFullDetails(userId);
      setSelectedUserDetail(details);
    } catch (err: any) {
      alert(err.message || "Failed to load user details.");
    }
  };

  const handleMarkMessageRead = async (messageId: string) => {
    try {
      await markContactMessageAsRead(messageId);
      await loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (authLoading || (isAdmin && loading)) {
    return (
      <div
        className="glass-panel p-12 text-center rounded-2xl"
        style={{ border: "1px solid var(--border)" }}
      >
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          Authenticating &amp; Loading Admin Command Center...
        </p>
      </div>
    );
  }

  // 403 Forbidden state for unauthenticated or non-admin users
  if (!isAdmin) {
    return (
      <div
        className="glass-panel p-12 text-center rounded-3xl space-y-5 max-w-md mx-auto my-12"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
            403 Forbidden
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Admin credentials required to access this command dashboard.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/admin/login"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg"
          >
            Admin Login
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border text-xs font-bold"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Command Center
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u: any) => {
    if (!searchUserQuery.trim()) return true;
    const q = searchUserQuery.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8" style={{ backgroundColor: "var(--background)" }}>
      {/* Header Banner */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>OPPARCH AI — ROOT ADMINISTRATOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Admin Command Center
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Role-based user management, live data provider telemetry, email outreach logs, and platform security auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text-primary)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
        {[
          { id: 'kpis', label: 'Platform KPIs & Providers', icon: <Cpu className="w-4 h-4" /> },
          { id: 'users', label: `User Directory (${usersList.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'outreach', label: `Email Outreach & Replies (${outreachData.outreaches.length})`, icon: <Send className="w-4 h-4" /> },
          { id: 'email_settings', label: 'Email Configuration', icon: <Mail className="w-4 h-4" /> },
          { id: 'messages', label: `Contact Inquiries (${contactMessages.length})`, icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'activity', label: 'Security & Audit Logs', icon: <Activity className="w-4 h-4" /> },
          { id: 'dev_reset', label: '⚠ Dev DB Reset', icon: <AlertTriangle className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === tab.id
                ? tab.id === 'dev_reset' ? 'bg-red-600 text-white shadow-md' : 'bg-amber-500 text-white shadow-md'
                : tab.id === 'dev_reset' ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-amber-500/10'
            }`}
            style={{
              color: activeTab === tab.id ? '#FFFFFF' : tab.id === 'dev_reset' ? '#f87171' : 'var(--text-secondary)',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: KPIS & PROVIDERS */}
      {activeTab === 'kpis' && data && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl space-y-1" style={{ border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Total Users</span>
              <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{data.kpis.total_users}</p>
              <span className="text-[10px] text-emerald-500 font-bold">{data.kpis.active_users} Active</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl space-y-1" style={{ border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Total Leads</span>
              <p className="text-2xl font-black text-electric-500">{data.kpis.total_leads}</p>
              <span className="text-[10px] text-emerald-500 font-bold">{data.kpis.real_leads} Real Leads</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl space-y-1" style={{ border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Email Outreaches</span>
              <p className="text-2xl font-black text-amber-500">{data.kpis.total_outreaches || 0}</p>
              <span className="text-[10px] text-purple-400 font-bold">{data.kpis.total_replies || 0} Replies</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl space-y-1" style={{ border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Active Projects</span>
              <p className="text-2xl font-black text-cyan-500">{data.kpis.total_projects}</p>
              <span className="text-[10px] text-cyan-400 font-bold">Client &amp; RFPs</span>
            </div>
          </div>

          {/* Provider Health Matrix */}
          <div className="glass-panel p-6 rounded-2xl space-y-4" style={{ border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Cpu className="w-4 h-4 text-amber-500" />
              <span>Data Provider &amp; AI Engine Status</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Local Ollama AI</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400">
                    {data.providers.ollama_local_ai?.status || "ONLINE"}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Model: {data.providers.ollama_local_ai?.active_model || data.providers.ollama_local_ai?.configured_model || "qwen3:4b"} (http://127.0.0.1:11434)
                </p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>OpenStreetMap Overpass</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400">ONLINE</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>REAL_FREE Global Business Discovery</p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>SMTP Outreach</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400">CONFIGURED</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Sender: syedzulqarnain164@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 w-4 h-4 text-amber-500" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                style={{
                  backgroundColor: "var(--input-bg)",
                  color: "var(--input-text)",
                  borderColor: "var(--input-border)",
                }}
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-secondary)" }}>
                    <th className="p-3.5 font-bold" style={{ color: "var(--text-muted)" }}>USER</th>
                    <th className="p-3.5 font-bold" style={{ color: "var(--text-muted)" }}>EMAIL</th>
                    <th className="p-3.5 font-bold" style={{ color: "var(--text-muted)" }}>ROLE</th>
                    <th className="p-3.5 font-bold" style={{ color: "var(--text-muted)" }}>STATUS</th>
                    <th className="p-3.5 font-bold" style={{ color: "var(--text-muted)" }}>REGISTERED</th>
                    <th className="p-3.5 font-bold text-right" style={{ color: "var(--text-muted)" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-amber-500/5 transition">
                      <td className="p-3.5 font-bold" style={{ color: "var(--text-primary)" }}>
                        {u.full_name || "N/A"}
                      </td>
                      <td className="p-3.5 font-mono" style={{ color: "var(--text-secondary)" }}>
                        {u.email}
                      </td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 rounded text-xs border font-bold"
                          style={{
                            backgroundColor: "var(--input-bg)",
                            color: "var(--input-text)",
                            borderColor: "var(--border)",
                          }}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        {u.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black">
                            DEACTIVATED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5" style={{ color: "var(--text-muted)" }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleInspectUser(u.id)}
                          className="px-2.5 py-1 rounded bg-electric-500/20 text-electric-400 hover:bg-electric-500/30 text-[11px] font-bold transition"
                        >
                          Deep Inspect
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                            u.is_active
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep User Detail Modal */}
          {selectedUserDetail && (
            <div
              className="glass-panel p-6 rounded-2xl space-y-4"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                  User Intelligence Profile: {selectedUserDetail.user.email}
                </h3>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="text-xs px-2 py-1 rounded border"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border text-center" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Searches</span>
                  <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{selectedUserDetail.total_searches}</p>
                </div>
                <div className="p-3 rounded-xl border text-center" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Leads Saved</span>
                  <p className="text-lg font-black text-electric-500">{selectedUserDetail.total_leads}</p>
                </div>
                <div className="p-3 rounded-xl border text-center" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>CSV Exports</span>
                  <p className="text-lg font-black text-amber-500">{selectedUserDetail.total_exports}</p>
                </div>
                <div className="p-3 rounded-xl border text-center" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Emails Sent</span>
                  <p className="text-lg font-black text-purple-400">{selectedUserDetail.total_outreaches}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EMAIL OUTREACH & REPLIES */}
      {activeTab === 'outreach' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sent Emails */}
            <div className="glass-panel p-6 rounded-2xl space-y-4" style={{ border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Send className="w-4 h-4 text-amber-500" />
                <span>Outreach Emails Dispatched ({outreachData.outreaches.length})</span>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {outreachData.outreaches.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>No emails dispatched yet.</p>
                ) : (
                  outreachData.outreaches.map((o: any) => (
                    <div key={o.id} className="p-3 rounded-xl border space-y-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-secondary)" }}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{o.recipient_email}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400">{o.status}</span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{o.subject}</p>
                      <span className="text-[10px] block" style={{ color: "var(--text-muted)" }}>{new Date(o.sent_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Replies Received */}
            <div className="glass-panel p-6 rounded-2xl space-y-4" style={{ border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Inbox className="w-4 h-4 text-purple-400" />
                <span>Client Replies &amp; Inbound Interest ({outreachData.replies.length})</span>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {outreachData.replies.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>No client replies received yet.</p>
                ) : (
                  outreachData.replies.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-xl border space-y-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-secondary)" }}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{r.sender_email}</span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{new Date(r.received_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.subject}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{r.summary || "Inbound response registered."}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4" style={{ border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Mail className="w-4 h-4 text-amber-500" />
            <span>Public Contact Inquiries ({contactMessages.length})</span>
          </h3>

          <div className="space-y-3">
            {contactMessages.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No contact inquiries submitted yet.</p>
            ) : (
              contactMessages.map((msg: any) => (
                <div key={msg.id} className="p-4 rounded-xl border space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-secondary)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{msg.name}</span>
                      <span className="text-xs font-mono ml-2" style={{ color: "var(--text-muted)" }}>&lt;{msg.email}&gt;</span>
                    </div>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Subject: {msg.subject}</p>
                  <p className="text-xs p-3 rounded-lg border leading-relaxed" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'activity' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4" style={{ border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Activity className="w-4 h-4 text-amber-500" />
            <span>System Activity &amp; Audit Trail</span>
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {activityLogs.map((log: any) => (
              <div key={log.id} className="p-3 rounded-xl border flex items-center justify-between text-xs" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-secondary)" }}>
                <div>
                  <span className="font-bold text-amber-500">{log.action}</span>
                  <span className="text-[11px] ml-2 font-mono" style={{ color: "var(--text-muted)" }}>
                    {JSON.stringify(log.details)}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: EMAIL OUTREACH SETTINGS */}
      {activeTab === 'email_settings' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="glass-panel p-6 rounded-2xl border" style={{ borderColor: "var(--border)" }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Zoho Mail • SMTP:587 STARTTLS • IMAP:993 SSL</span>
                </div>
                <h3 className="text-base font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <span>Outreach SMTP &amp; IMAP Infrastructure</span>
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Configure authenticated Zoho Mail delivery for <strong>contact@devarcher.com</strong> — DevArcher outreach mailbox. Never hard-code passwords; use environment variables.
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border self-start shrink-0 ${
                emailSettings?.smtp_password_set
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/30"
              }`}>
                {emailSettings?.smtp_password_set ? "🟢 Zoho SMTP Configured" : "⚠️ Password Not Set"}
              </span>
            </div>

            {/* Config Form */}
            <form onSubmit={handleSaveEmailSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                    SMTP Host
                  </label>
                  <input
                    value={emailForm.smtp_host}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                    placeholder="mail.zoho.com"
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                    SMTP Port (STARTTLS)
                  </label>
                  <input
                    type="number"
                    value={emailForm.smtp_port}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_port: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                    SMTP Username / From Address
                  </label>
                  <input
                    value={emailForm.smtp_username}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_username: e.target.value })}
                    placeholder="contact@devarcher.com"
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                    SMTP App Password {emailSettings?.smtp_password_set && <span className="text-emerald-400">(Configured)</span>}
                  </label>
                  <input
                    type="password"
                    value={emailForm.smtp_password}
                    placeholder={emailSettings?.smtp_password_set ? "•••••••••••••••• (Leave blank to keep existing)" : "Enter Zoho App Password (Security → App Passwords)"}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>From Email Address</label>
                  <input
                    value={emailForm.from_email}
                    onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                    placeholder="contact@devarcher.com"
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>IMAP Host (Reply Sync)</label>
                  <input
                    value={emailForm.imap_host}
                    onChange={(e) => setEmailForm({ ...emailForm, imap_host: e.target.value })}
                    placeholder="imap.zoho.com"
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>IMAP Port (SSL)</label>
                  <input
                    type="number"
                    value={emailForm.imap_port}
                    onChange={(e) => setEmailForm({ ...emailForm, imap_port: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border focus:outline-none font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingEmail}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold transition shadow-md disabled:opacity-50 text-xs"
                >
                  {savingEmail ? "Saving…" : "💾 Save Configuration"}
                </button>
              </div>
            </form>
          </div>

          {/* Test SMTP Connection Panel */}
          <div className="glass-panel p-6 rounded-2xl border space-y-4" style={{ borderColor: "var(--border)" }}>
            <h4 className="text-sm font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Test SMTP Connection &amp; Send Verification Email</span>
            </h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Verifies STARTTLS handshake, authentication with Zoho, and optionally dispatches a real test email to the address below.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Optional: send test email to this address (e.g. you@gmail.com)"
                className="flex-1 p-2.5 rounded-xl border focus:outline-none font-mono text-xs"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
              />
              <button
                onClick={handleTestSmtp}
                disabled={testingSmtp}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {testingSmtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing Zoho SMTP…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{testEmailRecipient ? "Test Connection + Send Email" : "Test SMTP Connection"}</span>
                  </>
                )}
              </button>
            </div>

            {/* SMTP Test Result */}
            {smtpTestResult && (
              <div
                className="p-4 rounded-xl border text-xs space-y-2"
                style={{
                  backgroundColor: smtpTestResult.status === "success" || smtpTestResult.status === "SENT" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  borderColor: smtpTestResult.status === "success" || smtpTestResult.status === "SENT" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"
                }}
              >
                <div className="flex items-center gap-2">
                  {(smtpTestResult.status === "success" || smtpTestResult.status === "SENT") ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                    {smtpTestResult.message || smtpTestResult.status}
                  </span>
                </div>
                {smtpTestResult.details && (
                  <p className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {smtpTestResult.details}
                  </p>
                )}
                {smtpTestResult.host && (
                  <p style={{ color: "var(--text-muted)" }}>
                    Connected: <strong>{smtpTestResult.host}:{smtpTestResult.port}</strong> using STARTTLS as <strong>{smtpTestResult.username}</strong>
                  </p>
                )}
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-[11px] space-y-1" style={{ color: "var(--text-muted)" }}>
              <p className="font-bold text-blue-400">⚙️ Zoho Setup Notes:</p>
              <p>• If 2FA is enabled on your Zoho account, generate an <strong>App Password</strong> from Zoho Account → Security → App Passwords.</p>
              <p>• The password is stored only in the <code className="font-mono bg-slate-800 px-1 rounded">backend/.env</code> file and never exposed through the API.</p>
              <p>• SMTP: <code className="font-mono bg-slate-800 px-1 rounded">mail.zoho.com:587</code> (STARTTLS) &nbsp;|&nbsp; IMAP: <code className="font-mono bg-slate-800 px-1 rounded">imap.zoho.com:993</code> (SSL)</p>
            </div>
          </div>
        </div>
      )}



      {/* TAB: DEV RESET */}
      {activeTab === 'dev_reset' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-5" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Development Database Reset</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  DEVELOPMENT USE ONLY — Permanently deletes all leads, search history, CRM activity, and market data.
                </p>
              </div>
            </div>

            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 space-y-2">
              <p className="text-sm font-semibold text-red-400">⚠️ What will be deleted:</p>
              <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
                <li>• All BusinessLeads, LeadScores, LeadAudits, LeadServiceMatches</li>
                <li>• All ProcurementProjects (RFPs & project opportunities)</li>
                <li>• All SearchHistory records</li>
                <li>• All MarketPredictions, PaperTrades, MarketAlerts</li>
                <li>• All ActivityLogs and CSVExports</li>
              </ul>
              <p className="text-xs text-green-400 font-semibold mt-2">✅ What is preserved: Admin user account, other users, system configuration.</p>
            </div>

            <div className="rounded-xl p-4 bg-blue-500/5 border border-blue-500/20">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                <strong className="text-blue-400">Bootstrap Rule:</strong> After reset, the next user to register on an
                empty database will automatically become <strong>ADMIN</strong>. All subsequent registrations will be
                normal <strong>USER</strong>. Dev admin <code className="bg-gray-800 px-1 rounded">admin / 123@123</code> is auto-seeded on first login attempt.
              </p>
            </div>

            {resetResult && (
              <div className={`p-4 rounded-xl border text-sm ${
                resetResult.status === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                <p className="font-semibold">{resetResult.message}</p>
                {resetResult.deleted_counts && (
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs opacity-80">
                    {Object.entries(resetResult.deleted_counts).map(([k, v]) => (
                      <span key={k}>{k}: {String(v)}</span>
                    ))}
                  </div>
                )}
                {resetResult.note && <p className="text-xs mt-2 opacity-70">{resetResult.note}</p>}
              </div>
            )}

            <button
              onClick={async () => {
                if (!confirm("⚠️ This will permanently delete all leads, searches, and market data. Are you absolutely sure?")) return;
                setResettingDb(true);
                setResetResult(null);
                try {
                  const res = await devResetDatabase();
                  setResetResult(res);
                  await loadData();
                } catch (err: any) {
                  setResetResult({ status: 'error', message: err.message || 'Reset failed.' });
                } finally {
                  setResettingDb(false);
                }
              }}
              disabled={resettingDb}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md disabled:opacity-50"
            >
              {resettingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              {resettingDb ? "Resetting Database…" : "Reset Development Database"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
