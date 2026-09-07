"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  KanbanSquare, Sparkles, Send, MessageSquare, Plus, RefreshCw, 
  CheckCircle2, AlertCircle, X, Loader2, ArrowRight, User, Globe, Mail, Phone,
  CheckSquare, Square, ListFilter, ShieldCheck, Clock, Settings, AlertTriangle,
  Edit3, FileText, Check, Instagram, Facebook, Linkedin, Zap, Trash2
} from 'lucide-react';
import { 
  getCrmPipeline, updateLeadCrmStage, generateOutreachEmail, 
  sendOutreachEmail, getLeadThread, addLeadNote, simulateClientReply, generateReplyResponse,
  checkOutreachEligibility, getBulkOutreachPreview, sendBulkOutreach, updateLeadDetails, quickAiOutreach,
  deleteBatchLeads, deleteLead
} from '@/lib/api';


const STAGES = [
  "NEW", "RESEARCHING", "READY_FOR_OUTREACH", "CONTACTED", "REPLIED", "INTERESTED", "MEETING", "PROPOSAL", "WON", "LOST"
];

function sanitizeServiceName(name?: string): string {
  if (!name || name === "The Archer") return "Full-Stack Web Development";
  return name.replace(/DevArcher/gi, "DevArcher");
}

export default function CrmPipelinePage() {
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Selection & Bulk Outreach
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Bulk Outreach Preview & Editor Modal
  const [bulkPreviewList, setBulkPreviewList] = useState<any[]>([]);
  const [showBulkPreviewModal, setShowBulkPreviewModal] = useState(false);
  const [loadingBulkPreviews, setLoadingBulkPreviews] = useState(false);
  const [batchDelaySeconds, setBatchDelaySeconds] = useState(3);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkSendResults, setBulkSendResults] = useState<any>(null);

  // Quick One-Click AI Outreach Modal & State
  const [showQuickSendModal, setShowQuickSendModal] = useState(false);
  const [isQuickSending, setIsQuickSending] = useState(false);
  const [quickSendResults, setQuickSendResults] = useState<any>(null);

  // Delete Selected Modal & State
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingLeads, setIsDeletingLeads] = useState(false);

  // Manual Lead Edit / Research Modal
  const [editingLead, setEditingLead] = useState<any>(null);
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


  // Single Outreach Modal
  const [outreachLead, setOutreachLead] = useState<any>(null);
  const [outreachSubject, setOutreachSubject] = useState("");
  const [outreachBody, setOutreachBody] = useState("");
  const [outreachRecipient, setOutreachRecipient] = useState("");
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [outreachSuccess, setOutreachSuccess] = useState("");
  const [senderEmail, setSenderEmail] = useState("contact@devarcher.com");

  // Lead Thread / Conversation Modal
  const [threadLead, setThreadLead] = useState<any>(null);
  const [threadData, setThreadData] = useState<any>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Simulate Reply
  const [simulatingReply, setSimulatingReply] = useState(false);
  const [mockReplyText, setMockReplyText] = useState(
    "Hi DevArcher Team,\n\nYes, we are interested in a modern website for our business. We need online ordering and WhatsApp inquiry integration. Our budget is around PKR 350,000 and we want to launch next month.\n\nPlease share your proposal.\n\nThanks!"
  );

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const data = await getCrmPipeline();
      setPipeline(data);
    } catch (err) {
      console.error("Pipeline fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Lead Edit Handlers
  const handleOpenEditLead = (lead: any) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name || "",
      industry: lead.industry || "",
      city: lead.city || "",
      email: lead.email || "",
      phone: lead.phone || "",
      website_url: lead.website_url || "",
      contact_person: lead.contact_person || "",
      instagram: lead.social_presence?.instagram || "",
      facebook: lead.social_presence?.facebook || "",
      linkedin: lead.social_presence?.linkedin || "",
      internal_notes: lead.internal_notes || "",
    });
  };

  const handleSaveEditLead = async (moveToResearching: boolean = false) => {
    if (!editingLead) return;
    setSavingEdit(true);
    try {
      const payload: any = {
        ...editForm,
        pipeline_stage: moveToResearching ? "RESEARCHING" : editingLead.pipeline_stage
      };
      await updateLeadDetails(editingLead.id, payload);
      await fetchPipeline();
      setEditingLead(null);
    } catch (err: any) {
      alert(err.message || "Failed to update lead.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick One-Click AI Outreach Handler
  const handleQuickAiOutreach = async () => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    setIsQuickSending(true);
    setShowQuickSendModal(true);
    setQuickSendResults(null);
    try {
      const res = await quickAiOutreach(ids, batchDelaySeconds);
      setQuickSendResults(res);
      await fetchPipeline();
    } catch (err: any) {
      alert(err.message || "Quick AI outreach execution failed.");
    } finally {
      setIsQuickSending(false);
    }
  };


  // Selection Handlers
  const toggleSelectLead = (leadId: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(leadId)) {
      next.delete(leadId);
    } else {
      next.add(leadId);
    }
    setSelectedLeadIds(next);
    runEligibilityCheck(Array.from(next));
  };

  const selectAllInStage = (stage: string) => {
    const leads = pipeline[stage] || [];
    const next = new Set(selectedLeadIds);
    leads.forEach(l => next.add(l.id));
    setSelectedLeadIds(next);
    runEligibilityCheck(Array.from(next));
  };

  const clearSelection = () => {
    setSelectedLeadIds(new Set());
    setEligibilityData(null);
  };

  const runEligibilityCheck = async (ids: string[]) => {
    if (ids.length === 0) {
      setEligibilityData(null);
      return;
    }
    setIsCheckingEligibility(true);
    try {
      const res = await checkOutreachEligibility(ids);
      setEligibilityData(res);
    } catch (err) {
      console.error("Eligibility check error:", err);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const getSelectedLeadObjects = () => {
    const leads: any[] = [];
    Object.values(pipeline).forEach((stageLeads) => {
      (stageLeads || []).forEach((l: any) => {
        if (selectedLeadIds.has(l.id)) {
          leads.push(l);
        }
      });
    });
    return leads;
  };

  const handleConfirmDeleteLeads = async () => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    setIsDeletingLeads(true);
    try {
      await deleteBatchLeads(ids);
      clearSelection();
      setShowDeleteConfirmModal(false);
      await fetchPipeline();
    } catch (err: any) {
      alert(err.message || "Failed to delete selected leads.");
    } finally {
      setIsDeletingLeads(false);
    }
  };

  // Open Bulk Preview Modal
  const handleOpenBulkPreview = async () => {

    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;

    setLoadingBulkPreviews(true);
    setShowBulkPreviewModal(true);
    setBulkSendResults(null);

    try {
      const res = await getBulkOutreachPreview(ids);
      setBulkPreviewList(res.previews || []);
      if (res.sender_email) setSenderEmail(res.sender_email);
    } catch (err: any) {
      alert(err.message || "Failed to generate bulk email previews.");
    } finally {
      setLoadingBulkPreviews(false);
    }
  };

  const updatePreviewItem = (index: number, field: string, value: any) => {
    const updated = [...bulkPreviewList];
    updated[index] = { ...updated[index], [field]: value };
    setBulkPreviewList(updated);
  };

  const handleExecuteBulkSend = async () => {
    const approved = bulkPreviewList.filter(p => p.approved && p.recipient_email);
    if (approved.length === 0) {
      alert("No approved leads with valid recipient emails to send.");
      return;
    }

    setIsSendingBulk(true);
    setBulkSendResults(null);

    try {
      const res = await sendBulkOutreach(
        bulkPreviewList.map(p => ({
          lead_id: p.lead_id,
          recipient_email: p.recipient_email,
          subject: p.subject,
          body: p.body,
          approved: Boolean(p.approved)
        })),
        batchDelaySeconds
      );
      setBulkSendResults(res);
      await fetchPipeline();
    } catch (err: any) {
      alert(err.message || "Bulk outreach execution failed.");
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      await updateLeadCrmStage(leadId, newStage);
      await fetchPipeline();
    } catch (err: any) {
      console.error("Stage update error:", err);
      alert(err.message || "Failed to update lead stage.");
    }
  };

  const handleOpenOutreach = async (lead: any) => {
    setOutreachLead(lead);
    setOutreachRecipient(lead.email || "");
    setGeneratingEmail(true);
    setOutreachSuccess("");

    try {
      const draft = await generateOutreachEmail(lead.id);
      setOutreachSubject(draft.subject);
      setOutreachBody(draft.body);
      if (draft.sender_email) setSenderEmail(draft.sender_email);
      if (draft.has_recipient_email) {
        setOutreachRecipient(draft.recipient_email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSendEmail = async () => {
    if (!outreachLead || !outreachRecipient.trim()) return;
    setSendingEmail(true);

    try {
      const res = await sendOutreachEmail({
        lead_id: outreachLead.id,
        recipient_email: outreachRecipient.trim(),
        subject: outreachSubject,
        body: outreachBody,
        mode: "MANUAL"
      });
      setOutreachSuccess(res.message || "Email sent via Zoho SMTP! Lead moved to CONTACTED.");
      setTimeout(() => {
        setOutreachLead(null);
        fetchPipeline();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenThread = async (lead: any) => {
    setThreadLead(lead);
    setLoadingThread(true);
    try {
      const data = await getLeadThread(lead.id);
      setThreadData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadLead || !newNoteText.trim()) return;
    setAddingNote(true);

    try {
      await addLeadNote(threadLead.id, newNoteText.trim());
      setNewNoteText("");
      const updated = await getLeadThread(threadLead.id);
      setThreadData(updated);
    } catch (err: any) {
      alert(err.message || "Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  };

  const handleSimulateReply = async () => {
    if (!threadLead || !mockReplyText.trim()) return;
    setSimulatingReply(true);

    try {
      await simulateClientReply(threadLead.id, mockReplyText.trim());
      const updated = await getLeadThread(threadLead.id);
      setThreadData(updated);
      await fetchPipeline();
    } catch (err: any) {
      alert(err.message || "Failed to simulate reply.");
    } finally {
      setSimulatingReply(false);
    }
  };

  return (
    <div className="space-y-8" style={{ backgroundColor: "var(--background)" }}>
      {/* Header Banner */}
      <div
        className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-semibold mb-2">
            <KanbanSquare className="w-3.5 h-3.5" />
            <span>OPPORTUNITY CRM &amp; OUTREACH ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Deal Pipeline &amp; Zoho Mail Outreach
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Select eligible leads, generate grounded AI personalized emails, preview/edit drafts, and dispatch controlled batches via Zoho SMTP (contact@devarcher.com).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPipeline}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)", backgroundColor: "var(--surface)" }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-electric-500" />
            <span>Refresh Pipeline</span>
          </button>
        </div>
      </div>

      {/* BULK OUTREACH SELECTION CONTROL BAR */}
      {selectedLeadIds.size > 0 && (
        <div
          className="glass-panel p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg sticky top-4 z-40"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-electric-500 animate-pulse"></span>
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {selectedLeadIds.size} Leads Selected
              </span>
            </div>

            {eligibilityData && (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold">
                  ✓ {eligibilityData.ready_for_outreach} Ready for Outreach
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/30 font-medium">
                  {eligibilityData.valid_emails} Valid Emails
                </span>
                {eligibilityData.already_contacted > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 font-medium">
                    {eligibilityData.already_contacted} Already Contacted
                  </span>
                )}
                {eligibilityData.invalid > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 font-medium">
                    ✕ {eligibilityData.invalid} Invalid / No Email
                  </span>
                )}
                {eligibilityData.duplicates > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/30 font-medium">
                    {eligibilityData.duplicates} Duplicates
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={clearSelection}
              className="px-3.5 py-2 rounded-xl text-xs border font-semibold hover:opacity-80 transition"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Clear Selection
            </button>

            <button
              onClick={handleOpenBulkPreview}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 text-white text-xs font-bold transition shadow-electric-glow flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preview &amp; Send ({eligibilityData ? eligibilityData.ready_for_outreach : selectedLeadIds.size})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleQuickAiOutreach}
              disabled={isQuickSending}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 disabled:opacity-60"
            >
              {isQuickSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>⚡ Quick AI Outreach ({selectedLeadIds.size})</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirmModal(true)}
              className="px-5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold transition shadow-lg flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedLeadIds.size})</span>
            </button>
          </div>

        </div>
      )}


      {/* KANBAN BOARD */}
      {isLoading ? (
        <div
          className="glass-panel p-12 text-center rounded-2xl border"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <Loader2 className="w-8 h-8 text-electric-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Loading Deal Pipeline Board...
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 select-none min-h-[600px]">
          {STAGES.map((stage) => {
            const leadsInStage = pipeline[stage] || [];
            return (
              <div
                key={stage}
                className="w-72 shrink-0 glass-panel p-4 rounded-2xl flex flex-col justify-between border"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <div className="space-y-4">
                  {/* Stage Header */}
                  <div
                    className="flex items-center justify-between pb-3 border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                      {stage}
                    </span>
                    <div className="flex items-center gap-2">
                      {leadsInStage.length > 0 && (
                        <button
                          onClick={() => selectAllInStage(stage)}
                          className="text-[10px] text-electric-500 font-bold hover:underline"
                          title="Select all leads in this stage"
                        >
                          Select All
                        </button>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: "var(--badge-bg)",
                          color: "var(--badge-text)",
                          border: "1px solid var(--badge-border)"
                        }}
                      >
                        {leadsInStage.length}
                      </span>
                    </div>
                  </div>

                  {/* Lead Cards in Stage */}
                  <div className="space-y-3">
                    {leadsInStage.map((lead: any) => {
                      const isSelected = selectedLeadIds.has(lead.id);
                      return (
                        <div
                          key={lead.id}
                          className={`p-3.5 rounded-xl border space-y-3 transition shadow-sm ${
                            isSelected ? "border-electric-500 ring-1 ring-electric-500" : "hover:border-electric-500/40"
                          }`}
                          style={{
                            backgroundColor: "var(--surface-secondary)",
                            borderColor: isSelected ? undefined : "var(--border)"
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => toggleSelectLead(lead.id)}
                                className="mt-0.5 text-electric-500 focus:outline-none"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-electric-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                                )}
                              </button>
                              <div>
                                <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                  {lead.name}
                                </h4>
                                {lead.email ? (
                                  <span className="text-[10px] font-mono text-emerald-400 block truncate max-w-[140px]">
                                    {lead.email}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-red-400 font-semibold block">
                                    No public email
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] font-black text-amber-500 shrink-0">
                              {lead.opportunity_score || lead.score?.opportunity_score || 85} pts
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            <p className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-electric-500" />
                              <span>{lead.country} • {lead.industry}</span>
                            </p>
                            <p className="text-[10px] text-electric-400 font-semibold truncate">
                              Service: {sanitizeServiceName(lead.primary_service || lead.services?.[0]?.service_name)}
                            </p>
                          </div>

                          {/* Card Actions */}
                          <div className="pt-2 border-t flex items-center justify-between gap-1" style={{ borderColor: "var(--border)" }}>
                            <button
                              onClick={() => handleOpenEditLead(lead)}
                              className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleOpenOutreach(lead)}
                              className="px-2 py-1 rounded bg-electric-500/10 hover:bg-electric-500/20 text-electric-400 text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Outreach</span>
                            </button>

                            <button
                              onClick={() => handleOpenThread(lead)}
                              className="px-2 py-1 rounded border text-[10px] font-bold hover:bg-slate-700/20 transition flex items-center gap-1"
                              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                            >
                              <MessageSquare className="w-2.5 h-2.5 text-purple-400" />
                              <span>Thread</span>
                            </button>
                          </div>


                          {/* Stage Selector */}
                          <div>
                            <select
                              value={stage}
                              onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              className="w-full px-2 py-1 rounded text-[10px] font-bold border focus:outline-none"
                              style={{
                                backgroundColor: "var(--input-bg)",
                                color: "var(--input-text)",
                                borderColor: "var(--border)"
                              }}
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s}>
                                  Move to: {s === "RESEARCHING" ? "RESEARCH / RESEARCHING" : s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}

                    {leadsInStage.length === 0 && (
                      <div className="py-8 text-center border border-dashed rounded-xl" style={{ borderColor: "var(--border)" }}>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          No deals in {stage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT / RESEARCH LEAD MODAL */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setEditingLead(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-700/20"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit / Research Lead</span>
              </div>
              <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                {editingLead.name}
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Stage: <strong>{editingLead.pipeline_stage}</strong> • Manually complete or correct lead data before outreach.
              </p>
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
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
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
                    onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-electric-500"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Social Presence</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Instagram", field: "instagram", placeholder: "@handle or URL" },
                  { label: "Facebook", field: "facebook", placeholder: "Page URL or name" },
                  { label: "LinkedIn", field: "linkedin", placeholder: "Profile/Company URL" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] text-slate-400">{label}</label>
                    <input
                      type="text"
                      value={(editForm as any)[field]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-electric-500"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Internal Notes</label>
              <textarea
                value={editForm.internal_notes}
                onChange={(e) => setEditForm((f) => ({ ...f, internal_notes: e.target.value }))}
                placeholder="Research notes, key contacts, opportunities observed..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-electric-500 resize-none"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleSaveEditLead(false)}
                disabled={savingEdit}
                className="flex-1 px-5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </button>
              <button
                onClick={() => handleSaveEditLead(true)}
                disabled={savingEdit}
                className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                Save &amp; Move to RESEARCHING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK AI OUTREACH RESULTS MODAL */}
      {showQuickSendModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => { setShowQuickSendModal(false); setQuickSendResults(null); }}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-700/20"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Quick AI Outreach — Zoho SMTP</span>
              </div>
              <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                {isQuickSending ? "Sending Personalized Emails..." : "Outreach Complete"}
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Generating grounded personalized emails and dispatching via contact@devarcher.com
              </p>
            </div>

            {isQuickSending && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Processing {selectedLeadIds.size} selected leads...
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Analyzing digital gaps, generating AI emails, dispatching via Zoho SMTP with {batchDelaySeconds}s delay between sends.
                </p>
              </div>
            )}

            {quickSendResults && (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
                  style={{
                    backgroundColor: quickSendResults.failed === 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                    borderColor: quickSendResults.failed === 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"
                  }}
                >
                  <div>
                    <p className="text-2xl font-black text-emerald-400">{quickSendResults.sent}</p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Sent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-amber-400">{quickSendResults.skipped}</p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Skipped</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-red-400">{quickSendResults.failed}</p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Failed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{quickSendResults.total}</p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Total</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(quickSendResults.results || []).map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border text-xs"
                      style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}
                    >
                      <div>
                        <p className="font-bold" style={{ color: "var(--text-primary)" }}>{r.business_name}</p>
                        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{r.recipient_email || "No email"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        r.status === "SENT" ? "bg-emerald-500/15 text-emerald-400" :
                        r.status === "SKIPPED" ? "bg-amber-500/15 text-amber-400" :
                        "bg-red-500/15 text-red-400"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setShowQuickSendModal(false); setQuickSendResults(null); clearSelection(); }}
                  className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 text-white text-xs font-bold"
                >
                  Done — Close &amp; Refresh Pipeline
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BULK OUTREACH PREVIEW & CAMPAIGN MODAL */}
      {showBulkPreviewModal && (

        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-4xl rounded-3xl p-6 sm:p-8 space-y-6 border shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setShowBulkPreviewModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-700/20"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zoho SMTP Campaign Suite • contact@devarcher.com</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Personalized Outreach Campaign Preview ({bulkPreviewList.length} Leads)
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Review and edit each AI-generated consultative email before approving batch delivery via Zoho SMTP.
              </p>
            </div>

            {/* Campaign Summary & Rate Limit Settings */}
            <div
              className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-electric-500" />
                <span>From: <strong>{senderEmail}</strong> (Zoho Mail:587)</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <label className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Inter-Message Delay:
                </label>
                <select
                  value={batchDelaySeconds}
                  onChange={(e) => setBatchDelaySeconds(Number(e.target.value))}
                  className="px-2.5 py-1 rounded-lg border text-xs font-bold focus:outline-none"
                  style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                >
                  <option value={1}>1 second (Fast)</option>
                  <option value={3}>3 seconds (Recommended)</option>
                  <option value={5}>5 seconds (Safe)</option>
                  <option value={10}>10 seconds (Throttled)</option>
                </select>
              </div>
            </div>

            {/* Final Dispatch Results Banner */}
            {bulkSendResults && (
              <div
                className="p-5 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: bulkSendResults.failed === 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  borderColor: bulkSendResults.failed === 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Outreach Batch Complete!</span>
                  </h3>
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    Sent: {bulkSendResults.sent} / {bulkSendResults.total} • Skipped: {bulkSendResults.skipped} • Failed: {bulkSendResults.failed}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] max-h-36 overflow-y-auto font-mono">
                  {bulkSendResults.results?.map((r: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-0.5" style={{ borderColor: "var(--border)" }}>
                      <span>{r.business_name || r.recipient_email}</span>
                      <span className={r.status === "SENT" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previews List */}
            {loadingBulkPreviews ? (
              <div className="p-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-electric-500 animate-spin mx-auto" />
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  Generating Grounded AI Email Previews...
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Analyzing business gaps, website status, and matching DevArcher solutions.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {bulkPreviewList.map((item, idx) => (
                  <div
                    key={item.lead_id}
                    className={`p-5 rounded-2xl border space-y-3 transition ${
                      item.approved ? "border-emerald-500/40" : "opacity-60 border-slate-700"
                    }`}
                    style={{ backgroundColor: "var(--surface-secondary)" }}
                  >
                    {/* Header: Lead Info & Approval Checkbox */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                            #{idx + 1}. {item.business_name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-400 border border-electric-500/30 font-bold">
                            {item.recommended_service}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {item.industry} • {item.city ? `${item.city}, ` : ''}{item.country} • Opportunity: {item.opportunity_reason}
                        </p>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer shrink-0 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={Boolean(item.approved)}
                          onChange={(e) => updatePreviewItem(idx, "approved", e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className={item.approved ? "text-emerald-400" : "text-slate-400"}>
                          {item.approved ? "Approved to Send" : "Excluded"}
                        </span>
                      </label>
                    </div>

                    {/* Email Inputs */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                          Recipient Email Address
                        </label>
                        <input
                          type="email"
                          value={item.recipient_email}
                          onChange={(e) => updatePreviewItem(idx, "recipient_email", e.target.value)}
                          placeholder="client@business.com"
                          className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none"
                          style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={item.subject}
                          onChange={(e) => updatePreviewItem(idx, "subject", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none"
                          style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                          Email Body
                        </label>
                        <textarea
                          rows={6}
                          value={item.body}
                          onChange={(e) => updatePreviewItem(idx, "body", e.target.value)}
                          className="w-full p-3 rounded-xl border text-xs leading-relaxed font-sans focus:outline-none"
                          style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowBulkPreviewModal(false)}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold hover:opacity-80 transition"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Close
              </button>

              <button
                disabled={isSendingBulk || loadingBulkPreviews || bulkPreviewList.filter(p => p.approved).length === 0}
                onClick={handleExecuteBulkSend}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isSendingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching via Zoho SMTP ({batchDelaySeconds}s delay)...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>SEND {bulkPreviewList.filter(p => p.approved).length} APPROVED EMAILS NOW</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE OUTREACH MODAL */}
      {outreachLead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setOutreachLead(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-700/20"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-500 text-xs font-bold uppercase tracking-wider">
                <Send className="w-3.5 h-3.5" />
                <span>Zoho Mail Outreach • {senderEmail}</span>
              </div>
              <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                AI Cold Outreach — {outreachLead.name}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Personalized email crafted from factual public audit observations.
              </p>
            </div>

            {outreachSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{outreachSuccess}</span>
              </div>
            )}

            {generatingEmail ? (
              <div className="p-12 text-center space-y-2">
                <Loader2 className="w-7 h-7 text-electric-500 animate-spin mx-auto" />
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Drafting consultative cold outreach...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={outreachRecipient}
                    onChange={(e) => setOutreachRecipient(e.target.value)}
                    placeholder="client@business.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={outreachSubject}
                    onChange={(e) => setOutreachSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
                    Message Body
                  </label>
                  <textarea
                    rows={8}
                    value={outreachBody}
                    onChange={(e) => setOutreachBody(e.target.value)}
                    className="w-full p-3.5 rounded-xl text-xs leading-relaxed border focus:outline-none"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Sender: <strong>{senderEmail}</strong> (Zoho SMTP)
                  </span>
                  <button
                    disabled={sendingEmail || !outreachRecipient.trim()}
                    onClick={handleSendEmail}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-500 to-royal-600 hover:from-electric-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                  >
                    {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>SEND VIA ZOHO SMTP</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEAD CONVERSATION THREAD MODAL */}
      {threadLead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-5 border shadow-2xl relative max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setThreadLead(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-700/20"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                Communication Thread — {threadLead.name}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Current Pipeline Stage: <span className="font-bold text-amber-500">{threadLead.pipeline_stage || "NEW"}</span>
              </p>
            </div>

            {loadingThread ? (
              <div className="p-12 text-center">
                <Loader2 className="w-7 h-7 text-electric-500 animate-spin mx-auto mb-2" />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading conversation thread...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Timeline Entries */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {threadData?.timeline?.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-xl" style={{ borderColor: "var(--border)" }}>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>No communication history recorded yet for this lead.</p>
                    </div>
                  ) : (
                    threadData?.timeline?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border space-y-1.5 text-xs"
                        style={{
                          backgroundColor: item.type === "REPLY" ? "rgba(168, 85, 247, 0.08)" : item.type === "OUTREACH" ? "rgba(59, 130, 246, 0.08)" : "var(--surface-secondary)",
                          borderColor: item.type === "REPLY" ? "rgba(168, 85, 247, 0.3)" : item.type === "OUTREACH" ? "rgba(59, 130, 246, 0.3)" : "var(--border)"
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: item.type === "REPLY" ? "#C084FC" : item.type === "OUTREACH" ? "#60A5FA" : "var(--text-muted)" }}>
                            {item.type === "REPLY" ? "📥 Client Reply (Zoho IMAP)" : item.type === "OUTREACH" ? "📤 Outreach Sent (Zoho SMTP)" : "📝 Internal Note"}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {item.subject && (
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>Subject: {item.subject}</p>
                        )}

                        <p className="whitespace-pre-line leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {item.body || item.note_text}
                        </p>

                        {/* AI Extracted Insights on Reply */}
                        {item.type === "REPLY" && item.extracted_budget && (
                          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-[11px] space-y-1 mt-2">
                            <span className="font-bold text-purple-400 block">AI Detected Deal Signals:</span>
                            <p>Budget: {item.extracted_budget} • Timeline: {item.extracted_timeline}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <label className="block text-xs font-bold uppercase" style={{ color: "var(--text-secondary)" }}>
                    Add Internal Note / Strategy Update
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="e.g. Preparing custom proposal for e-commerce ordering workflow..."
                      className="flex-1 px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                    />
                    <button
                      type="submit"
                      disabled={addingNote || !newNoteText.trim()}
                      className="px-4 py-2 rounded-xl bg-electric-500 text-white text-xs font-bold hover:bg-electric-600 disabled:opacity-50"
                    >
                      {addingNote ? "Adding..." : "Add Note"}
                    </button>
                  </div>
                </form>

                {/* Simulate Reply Testing Box */}
                <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400">⚡ Test Simulation: Simulate Client Reply</span>
                    <button
                      onClick={handleSimulateReply}
                      disabled={simulatingReply}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      {simulatingReply ? "Processing Reply..." : "Simulate Inbound Reply"}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={mockReplyText}
                    onChange={(e) => setMockReplyText(e.target.value)}
                    className="w-full p-2.5 rounded-lg text-xs border font-mono"
                    style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="glass-panel rounded-3xl p-8 w-full max-w-md border border-rose-500/30 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                  Confirm Lead Deletion
                </h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  This action cannot be undone. All associated outreach history, notes, and audit data will be permanently removed.
                </p>
              </div>
            </div>

            {(() => {
              const activeStages = ["CONTACTED", "INTERESTED", "MEETING", "PROPOSAL", "WON"];
              const activeLeads = getSelectedLeadObjects().filter((l: any) => activeStages.includes(l.pipeline_stage));
              if (activeLeads.length > 0) {
                return (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-300">⚠️ Warning: {activeLeads.length} lead(s) have active pipeline stages</p>
                      <ul className="mt-1 space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                        {activeLeads.map((l: any) => (
                          <li key={l.id}>• <strong>{l.name}</strong> — Stage: <span className="text-amber-400 font-bold">{l.pipeline_stage}</span></li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-amber-300/80">Deleting these leads will permanently erase all in-progress deal data.</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                You are about to permanently delete <strong className="text-rose-300">{selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? "s" : ""}</strong> from the CRM pipeline.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs border font-semibold hover:opacity-80 transition"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteLeads}
                disabled={isDeletingLeads}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isDeletingLeads ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete {selectedLeadIds.size} Lead{selectedLeadIds.size !== 1 ? "s" : ""}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
