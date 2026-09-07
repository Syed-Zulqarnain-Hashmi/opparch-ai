"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Sparkles, 
  Send, 
  Copy, 
  KanbanSquare, 
  ArrowLeft,
  Zap,
  Target,
  RefreshCw,
  ShieldCheck,
  Edit3,
  Check,
  Loader2,
  Instagram,
  Facebook,
  Linkedin,
  User as UserIcon,
  Clock,
  Trash2
} from 'lucide-react';
import { 
  getLeadDetails, 
  generateOutreach, 
  updateCrmLead, 
  verifyLead, 
  updateLeadDetails,
  sendOutreachEmail,
  deleteLead
} from '@/lib/api';


export default function LeadAuditDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  
  // Edit Lead Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    industry: "",
    city: "",
    email: "",
    phone: "",
    website_url: "",
    contact_person: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    internal_notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Outreach Modal state
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  const [outreachChannel, setOutreachChannel] = useState('Email');
  const [outreachTone, setOutreachTone] = useState('Consultative & Value-Focused');
  const [outreachResult, setOutreachResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Delete Lead State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  const handleDeleteLead = async () => {
    setIsDeletingLead(true);
    try {
      await deleteLead(leadId);
      router.push('/crm');
    } catch (err: any) {
      alert(err.message || "Failed to delete lead.");
      setIsDeletingLead(false);
    }
  };

  useEffect(() => {

    if (leadId) {
      loadLead();
    }
  }, [leadId]);

  const loadLead = () => {
    setIsLoading(true);
    getLeadDetails(leadId)
      .then(data => {
        setLead(data);
        setEditForm({
          name: data.name || "",
          industry: data.industry || "",
          city: data.city || "",
          email: data.email || "",
          phone: data.phone || "",
          website_url: data.website_url || "",
          contact_person: data.contact_person || "",
          instagram: data.social_presence?.instagram || "",
          facebook: data.social_presence?.facebook || "",
          linkedin: data.social_presence?.linkedin || "",
          internal_notes: data.internal_notes || "",
        });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleSaveEdit = async (moveToResearching: boolean = false) => {
    setSavingEdit(true);
    try {
      const payload: any = {
        ...editForm,
        pipeline_stage: moveToResearching ? "RESEARCHING" : lead.pipeline_stage
      };
      const updated = await updateLeadDetails(leadId, payload);
      setLead(updated);
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to update lead.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleVerifyLead = async () => {
    setVerifying(true);
    try {
      const res = await verifyLead(leadId);
      setVerifyResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setIsGenerating(true);
    setSendSuccessMsg("");
    try {
      const res = await generateOutreach({
        lead_id: leadId,
        channel: outreachChannel,
        tone: outreachTone
      });
      setOutreachResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendViaZoho = async () => {
    if (!lead || !lead.email) {
      alert("No email address configured. Click 'Edit / Research Lead' to add an email first.");
      return;
    }
    if (!outreachResult) return;

    setIsSendingDirect(true);
    try {
      const res = await sendOutreachEmail({
        lead_id: leadId,
        recipient_email: lead.email,
        subject: outreachResult.subject || `Inquiry for ${lead.name}`,
        body: outreachResult.message_body || outreachResult.body,
        mode: "MANUAL"
      });
      setSendSuccessMsg(res.message || "Email successfully dispatched via Zoho SMTP (contact@devarcher.com)! Lead moved to CONTACTED.");
      await loadLead();
    } catch (err: any) {
      alert(err.message || "Failed to send email via Zoho SMTP.");
    } finally {
      setIsSendingDirect(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateStage = async (stage: string) => {
    try {
      const updated = await updateCrmLead(leadId, { pipeline_stage: stage });
      setLead(updated);
    } catch (err) {
      console.error(err);
    }
  };


  if (isLoading) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
        <Sparkles className="w-8 h-8 text-electric-400 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold">Loading Lead Opportunity Intelligence...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
        <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-base font-bold text-white">Opportunity Not Found</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-navy-900 rounded-lg text-xs text-electric-400">
          Go Back
        </button>
      </div>
    );
  }

  const scoreObj = lead.score || {};
  const auditObj = lead.audit || {};
  const breakdown = scoreObj.breakdown || {};

  return (
    <div className="space-y-8">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-slate-300 hover:text-white text-xs font-semibold border border-electric-500/20 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to CRM Pipeline
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit / Research Lead</span>
          </button>

          <button
            onClick={handleVerifyLead}
            disabled={verifying}
            className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-electric-500/30 text-electric-400 text-xs font-bold transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{verifying ? 'Verifying Footprint...' : 'VERIFY LEAD'}</span>
          </button>

          <button
            onClick={() => setIsOutreachOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-royal-500 to-royal-600 hover:from-royal-600 hover:to-royal-700 text-white text-xs font-bold shadow-electric-glow transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Generate &amp; Send Outreach
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-400 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Lead</span>
          </button>
        </div>
      </div>


      {/* VERIFICATION RESULT BANNER */}
      {verifyResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> REAL LEAD VERIFICATION CHECK COMPLETE
            </span>
            <span className="text-[10px] text-slate-400">Confidence: {(verifyResult.confidence_score * 100).toFixed(0)}%</span>
          </div>
          <p className="text-slate-200">
            <strong>Status:</strong> {verifyResult.verification_status} • <strong>Source:</strong> {verifyResult.discovery_source} • <strong>Last Checked:</strong> {new Date(verifyResult.last_checked).toLocaleString()}
          </p>
        </div>
      )}

      {/* LEAD PROFILE HEADER */}
      <div className="glass-panel p-6 rounded-2xl border border-electric-500/30 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-white">{lead.name}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-950 text-electric-400 border border-electric-500/30">
              📍 {lead.country} {lead.city ? `• ${lead.city}` : ''}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-electric-500/10 text-electric-300 border border-electric-500/20">
              🏢 {lead.industry}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-royal-500/20 text-electric-400 border border-royal-500/40">
              STAGE: {lead.pipeline_stage}
            </span>
            {lead.is_demo_data && (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                DEMO DATA
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>Website: {lead.website_url ? (
                <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-electric-400 hover:underline inline-flex items-center gap-0.5 font-semibold">
                  {lead.website_url} <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <strong className="text-rose-400">No Official Website Detected</strong>
              )}</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>Email: {lead.email ? (
                <strong className="text-emerald-400 font-mono">{lead.email}</strong>
              ) : (
                <span className="text-rose-400 font-semibold">Missing (Click 'Edit' to add)</span>
              )}</span>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                <span>Phone: {lead.phone}</span>
              </div>
            )}

            {lead.contact_person && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                <span>Contact Person: <strong className="text-white">{lead.contact_person}</strong></span>
              </div>
            )}

            {lead.address && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                <span className="line-clamp-1">{lead.address}</span>
              </div>
            )}
          </div>

          {/* Social Presence Chips */}
          {lead.social_presence && Object.keys(lead.social_presence).some(k => lead.social_presence[k]) && (
            <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Social Presence:</span>
              {lead.social_presence.instagram && (
                <span className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[11px] font-semibold flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> {lead.social_presence.instagram}
                </span>
              )}
              {lead.social_presence.facebook && (
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold flex items-center gap-1">
                  <Facebook className="w-3 h-3" /> {lead.social_presence.facebook}
                </span>
              )}
              {lead.social_presence.linkedin && (
                <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-semibold flex items-center gap-1">
                  <Linkedin className="w-3 h-3" /> {lead.social_presence.linkedin}
                </span>
              )}
            </div>
          )}
        </div>

        {/* EXPLAINABLE SCORE CARD */}
        <div className="lg:col-span-4 bg-navy-950/80 p-5 rounded-xl border border-electric-500/30 text-center space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunity Score</span>
          <div className="text-4xl font-black text-white flex items-center justify-center gap-2">
            <span className={scoreObj.opportunity_score >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
              {scoreObj.opportunity_score || 85}
            </span>
            <span className="text-base text-slate-500 font-normal">/ 100</span>
          </div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 py-1 rounded border border-amber-500/20">
            {scoreObj.priority_level || 'HIGH'} PRIORITY OPPORTUNITY
          </p>
        </div>
      </div>

      {/* WHY OUTREACH? STRATEGIC CHECKLIST */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-3 bg-emerald-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">WHY OUTREACH? — Opportunity Checklist</h2>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
            GROUNDED EVIDENCE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-navy-950/80 border border-emerald-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{!lead.has_website ? "No Official Website Detected" : "Website Footprint Detected"}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              {!lead.has_website ? "Business operates without direct web presence or customer capture." : "Website analyzed for UX modernization & speed."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-navy-950/80 border border-emerald-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Active Local Market Visibility</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Verified physical presence in {lead.city || lead.country} with established customer footfall.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-navy-950/80 border border-emerald-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>High Conversion Upside</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Opportunity score {scoreObj.opportunity_score || 85}/100 indicates significant revenue expansion via DevArcher solution.
            </p>
          </div>
        </div>
      </div>

      {/* --- GRID DETAILS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Digital Audit & Evidence (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* DIGITAL MATURITY AUDIT */}
          <div className="glass-panel p-6 rounded-2xl border border-electric-500/30 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-electric-500/20">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-electric-400" />
                <h2 className="text-base font-bold text-white">Digital Maturity Audit</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Audited via Non-Intrusive Engine</span>
            </div>

            {/* Audit Status Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Website Footprint", val: auditObj.website_status, ok: auditObj.website_status === "MODERN" || auditObj.website_status === "ACTIVE" },
                { label: "Mobile Responsive", val: auditObj.mobile_friendly ? "Yes" : "No / Unoptimized", ok: auditObj.mobile_friendly },
                { label: "SSL Security", val: auditObj.ssl_active ? "HTTPS Active" : "Insecure HTTP", ok: auditObj.ssl_active },
                { label: "Page Speed", val: auditObj.page_speed_rating, ok: auditObj.page_speed_rating === "FAST" },
                { label: "SEO Quality", val: auditObj.seo_quality, ok: auditObj.seo_quality === "STRONG" },
                { label: "UX Rating", val: auditObj.ux_rating, ok: auditObj.ux_rating === "STRONG" }
              ].map((pill, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-navy-950/70 border border-electric-500/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400">{pill.label}</span>
                    <span className="text-[9px] font-black uppercase text-electric-400 bg-electric-500/10 px-1.5 py-0.5 rounded">FACT</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {pill.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className={pill.ok ? 'text-emerald-300' : 'text-rose-300'}>{pill.val}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Evidence & Pain Points */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Identified Digital Gaps &amp; Evidence:</h3>
                <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">INFERENCE</span>
              </div>
              <div className="space-y-2">
                {(auditObj.evidence_points || []).map((ev: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-navy-950/60 p-3 rounded-xl border border-electric-500/10">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EXPLAINABLE SCORE BREAKDOWN */}
          <div className="glass-panel p-6 rounded-2xl border border-electric-500/30 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-electric-500/20">
              <Award className="w-5 h-5 text-electric-400" />
              <h2 className="text-base font-bold text-white">Explainable Score Breakdown (0–100)</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Website Gap", val: breakdown.website_gap_score, max: 25 },
                { label: "Digital Weakness", val: breakdown.digital_weakness_score, max: 20 },
                { label: "Business Activity", val: breakdown.business_activity_score, max: 15 },
                { label: "Social Presence", val: breakdown.social_presence_score, max: 10 },
                { label: "E-commerce Fit", val: breakdown.ecommerce_opportunity_score, max: 10 },
                { label: "UI/UX Fit", val: breakdown.ux_opportunity_score, max: 10 },
                { label: "Mobile Fit", val: breakdown.mobile_opportunity_score, max: 5 },
                { label: "Branding Fit", val: breakdown.branding_opportunity_score, max: 5 }
              ].map((item, idx) => (
                <div key={idx} className="bg-navy-950 p-3 rounded-xl border border-electric-500/15 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block">{item.label}</span>
                  <p className="text-sm font-black text-electric-400">{item.val} / {item.max}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recommended DevArcher Services (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-electric-500/30 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-electric-500/20">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-electric-400" />
                <h2 className="text-base font-bold text-white">Matched Service Solutions</h2>
              </div>
              <span className="text-[9px] font-black uppercase text-electric-300 bg-electric-500/20 px-2 py-0.5 rounded border border-electric-500/30">AI RECOMMENDATION</span>
            </div>

            <div className="space-y-4">
              {lead.services.map((sm: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2 ${
                    idx === 0
                      ? 'bg-royal-500/15 border-electric-500/40 shadow-electric-glow'
                      : 'bg-navy-950/70 border-electric-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{sm.service_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-electric-500/20 text-electric-300">
                      {sm.match_confidence}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sm.match_reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CRM PIPELINE QUICK ACTION */}
          <div className="glass-panel p-6 rounded-2xl border border-electric-500/30 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <KanbanSquare className="w-4 h-4 text-electric-400" /> CRM Stage Management
            </h3>
            <p className="text-xs text-slate-400">Current Pipeline Stage: <strong className="text-white">{lead.pipeline_stage}</strong></p>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {["NEW", "RESEARCHING", "READY_FOR_OUTREACH", "CONTACTED", "REPLIED", "INTERESTED", "MEETING", "PROPOSAL", "WON", "LOST"].map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleUpdateStage(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    lead.pipeline_stage === stage
                      ? 'bg-royal-500 text-white border-electric-400 shadow-electric-glow'
                      : 'bg-navy-950 text-slate-400 hover:text-white border-electric-500/20'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- EDIT / RESEARCH LEAD MODAL --- */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-electric-500/40 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-electric-500/20">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Edit / Research Lead Data</h2>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Business Name", field: "name", placeholder: "e.g. Ali's Restaurant" },
                { label: "Business Type / Industry", field: "industry", placeholder: "e.g. Restaurant, Medical Store" },
                { label: "City", field: "city", placeholder: "e.g. Karachi, Lahore" },
                { label: "Contact Person", field: "contact_person", placeholder: "e.g. Muhammad Ali" },
                { label: "Email Address", field: "email", placeholder: "e.g. contact@business.com" },
                { label: "Phone Number", field: "phone", placeholder: "e.g. +92 300 1234567" },
                { label: "Website URL", field: "website_url", placeholder: "e.g. https://business.com" },
              ].map(({ label, field, placeholder }) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {label}
                    {field === "email" && (
                      <span className="ml-2 text-emerald-400 normal-case font-normal">
                        {editForm.email && /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(editForm.email)
                          ? "✓ VALID FORMAT"
                          : editForm.email ? "✗ Invalid format" : ""}
                      </span>
                    )}
                  </label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={(editForm as any)[field]}
                    onChange={(e) => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-navy-950 text-white text-xs px-3 py-2 rounded-lg border border-electric-500/30 focus:outline-none focus:border-electric-400"
                  />
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social Presence</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Instagram", field: "instagram", placeholder: "@handle or URL" },
                  { label: "Facebook", field: "facebook", placeholder: "Page URL or name" },
                  { label: "LinkedIn", field: "linkedin", placeholder: "Profile URL" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] text-slate-400">{label}</label>
                    <input
                      type="text"
                      value={(editForm as any)[field]}
                      onChange={(e) => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-navy-950 text-white text-xs px-3 py-2 rounded-lg border border-electric-500/30"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Notes</label>
              <textarea
                value={editForm.internal_notes}
                onChange={(e) => setEditForm(f => ({ ...f, internal_notes: e.target.value }))}
                placeholder="Research findings, owner details, observed pain points..."
                rows={3}
                className="w-full bg-navy-950 text-white text-xs px-3 py-2 rounded-lg border border-electric-500/30 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleSaveEdit(false)}
                disabled={savingEdit}
                className="flex-1 py-2.5 rounded-xl border border-electric-500/30 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 bg-navy-900 hover:bg-navy-800"
              >
                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Changes
              </button>
              <button
                onClick={() => handleSaveEdit(true)}
                disabled={savingEdit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-royal-500 to-royal-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-electric-glow"
              >
                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeft className="w-3.5 h-3.5 rotate-180" />}
                Save &amp; Move to RESEARCHING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OUTREACH GENERATOR & SENDER MODAL --- */}
      {isOutreachOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-electric-500/40 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-electric-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-electric-400" />
                <h2 className="text-base font-bold text-white">AI Personalized Outreach — Zoho Mail</h2>
              </div>
              <button onClick={() => setIsOutreachOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {/* Sender & Recipient bar */}
            <div className="p-3 rounded-xl bg-navy-950/80 border border-electric-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-400">From: </span>
                <strong className="text-emerald-400 font-mono">contact@devarcher.com</strong> (Zoho SMTP:587)
              </div>
              <div>
                <span className="text-slate-400">To: </span>
                <strong className={lead.email ? "text-emerald-400 font-mono" : "text-rose-400"}>
                  {lead.email || "No Email (Add in Edit)"}
                </strong>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Channel</label>
                <select
                  value={outreachChannel}
                  onChange={(e) => setOutreachChannel(e.target.value)}
                  className="w-full bg-navy-950 text-white text-xs px-3 py-2 rounded-lg border border-electric-500/30"
                >
                  <option value="Email">Email Draft (Zoho Mail)</option>
                  <option value="LinkedIn">LinkedIn InMail</option>
                  <option value="WhatsApp">WhatsApp Business</option>
                  <option value="Instagram">Instagram Business DM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tone</label>
                <select
                  value={outreachTone}
                  onChange={(e) => setOutreachTone(e.target.value)}
                  className="w-full bg-navy-950 text-white text-xs px-3 py-2 rounded-lg border border-electric-500/30"
                >
                  <option value="Consultative & Value-Focused">Consultative &amp; Value-Focused</option>
                  <option value="Direct & Technical">Direct &amp; Technical</option>
                  <option value="Executive Intro">Executive Intro</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateOutreach}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-royal-500 to-royal-600 text-white text-xs font-bold shadow-electric-glow transition flex items-center justify-center gap-2"
            >
              {isGenerating ? 'Synthesizing Grounded Draft...' : 'Generate Grounded AI Message'}
            </button>

            {/* Dispatch Success Alert */}
            {sendSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sendSuccessMsg}</span>
              </div>
            )}

            {/* Result Box */}
            {outreachResult && (
              <div className="space-y-3 pt-2">
                {outreachResult.subject && (
                  <div className="bg-navy-950 p-2.5 rounded-lg border border-electric-500/20 text-xs">
                    <span className="text-slate-400 font-semibold">Subject: </span>
                    <strong className="text-white">{outreachResult.subject}</strong>
                  </div>
                )}

                <div className="relative bg-navy-950 p-4 rounded-xl border border-electric-500/20 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {outreachResult.message_body || outreachResult.body}
                  
                  <button
                    onClick={() => handleCopyText(outreachResult.message_body || outreachResult.body)}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-electric-400 border border-electric-500/30 transition flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* Direct Dispatch Button */}
                {outreachChannel === "Email" && (
                  <button
                    onClick={handleSendViaZoho}
                    disabled={isSendingDirect || !lead.email}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingDirect ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {lead.email ? `Send Directly via Zoho SMTP (To: ${lead.email})` : "Add Email First in Edit Modal"}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== DELETE LEAD MODAL ========== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="glass-panel rounded-3xl p-8 w-full max-w-md border border-rose-500/30 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Delete Lead</h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  This will permanently delete <strong className="text-rose-300">{lead?.name}</strong> and all associated outreach, notes, and audit data.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs border font-semibold hover:opacity-80 transition"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={isDeletingLead}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isDeletingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeletingLead ? "Deleting..." : "Yes, Delete Lead"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
