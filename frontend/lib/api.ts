function getApiBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").trim();
  url = url.replace(/\/+$/, ""); // Remove any trailing slash
  if (!url.endsWith("/api/v1")) {
    url = `${url}/api/v1`;
  }
  return url;
}

export const API_BASE_URL = getApiBaseUrl();

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("opparch_token");
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("opparch_token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("opparch_token");
    localStorage.removeItem("opparch_user");
  }
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit, timeoutMs = 90000): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorData.detail || `Server returned ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    clearTimeout(timer);

    if (error?.name === "AbortError") {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s. The backend may be overloaded — please try again.`
      );
    }
    if (error?.message?.toLowerCase().includes("failed to fetch") || error?.message?.includes("NetworkError")) {
      throw new Error(
        `Cannot reach the OPPARCH AI backend at ${API_BASE_URL}. ` +
        `Please make sure the backend server is running (uvicorn main:app) and CORS is configured correctly.`
      );
    }

    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}


// --- Auth APIs ---
export async function registerUser(email: string, password: string, full_name: string) {
  const res = await fetchApi<any>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("opparch_user", JSON.stringify(res.user));
    }
  }
  return res;
}

export async function loginUser(email: string, password: string) {
  const res = await fetchApi<any>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("opparch_user", JSON.stringify(res.user));
    }
  }
  return res;
}

export async function fetchMyProfile() {
  return fetchApi<any>("/auth/me");
}

export async function updateProfile(data: { full_name?: string; password?: string }) {
  return fetchApi<any>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// --- Search API ---
export async function executeSearch(queryData: {
  query: string;
  country?: string;
  city?: string;
  industry?: string;
  service_target?: string;
  max_results?: number;
  data_mode?: string;
  mode?: string;
  limit?: number;
}) {
  return fetchApi<any>("/search/discover", {
    method: "POST",
    body: JSON.stringify(queryData),
  });
}

export async function parseSearchIntent(query: string) {
  return fetchApi<any>("/search/parse-intent", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function getSearchHistory() {
  return fetchApi<any[]>("/search/history");
}

// --- Leads APIs ---
export async function getLeads(params?: {
  country?: string;
  industry?: string;
  priority?: string;
  pipeline_stage?: string;
}) {
  const query = new URLSearchParams();
  if (params?.country && params.country !== "Worldwide") query.append("country", params.country);
  if (params?.industry && params.industry !== "All") query.append("industry", params.industry);
  if (params?.priority && params.priority !== "All") query.append("priority", params.priority);
  if (params?.pipeline_stage && params.pipeline_stage !== "All") query.append("pipeline_stage", params.pipeline_stage);

  const qs = query.toString();
  return fetchApi<any[]>(`/leads${qs ? `?${qs}` : ""}`);
}

export async function getLeadStats() {
  return fetchApi<any>("/leads/stats");
}

export async function refreshLeads(country?: string, city?: string, industry?: string) {
  const query = new URLSearchParams();
  if (country) query.append("country", country);
  if (city) query.append("city", city);
  if (industry) query.append("industry", industry);

  const qs = query.toString();
  return fetchApi<any>(`/leads/refresh${qs ? `?${qs}` : ""}`, {
    method: "POST",
  });
}

export async function getLeadDetails(leadId: string) {
  return fetchApi<any>(`/leads/${leadId}`);
}

export async function updateLeadDetails(leadId: string, data: any) {
  return fetchApi<any>(`/leads/${leadId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLead(leadId: string) {
  return fetchApi<any>(`/leads/${leadId}`, {
    method: "DELETE",
  });
}

export async function deleteBatchLeads(leadIds: string[]) {
  return fetchApi<any>("/leads/batch-delete", {
    method: "POST",
    body: JSON.stringify({ lead_ids: leadIds }),
  });
}

export async function auditWebsite(url: string, industry?: string) {
  return fetchApi<any>("/analyzer/audit", {
    method: "POST",
    body: JSON.stringify({ url, industry }),
  });
}

export async function verifyLeadWebPresence(leadId: string) {
  return fetchApi<any>(`/leads/${leadId}/verify`, { method: "POST" });
}


// --- CRM APIs ---

export async function getCrmPipeline() {
  return fetchApi<any>("/crm/pipeline");
}

export async function updateLeadCrmStage(leadId: string, stage: string, notes?: string, follow_up_date?: string) {
  return fetchApi<any>(`/crm/leads/${leadId}/stage`, {
    method: "PUT",
    body: JSON.stringify({ stage, internal_notes: notes, follow_up_date }),
  });
}

// --- Outreach & Reply Intelligence APIs ---
export async function generateOutreachEmail(leadId: string, channel: string = "Email", tone: string = "Consultative & Value-Focused") {
  return fetchApi<any>("/outreach/generate", {
    method: "POST",
    body: JSON.stringify({ lead_id: leadId, channel, tone }),
  });
}

export async function sendOutreachEmail(data: {
  lead_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  mode?: string;
}) {
  return fetchApi<any>("/outreach/send", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getLeadThread(leadId: string) {
  return fetchApi<any>(`/outreach/thread/${leadId}`);
}

export async function addLeadNote(leadId: string, noteText: string) {
  return fetchApi<any>(`/outreach/note/${leadId}`, {
    method: "POST",
    body: JSON.stringify({ note_text: noteText }),
  });
}

export async function simulateClientReply(leadId: string, replyBody: string, senderEmail?: string) {
  return fetchApi<any>(`/outreach/simulate-reply/${leadId}`, {
    method: "POST",
    body: JSON.stringify({ reply_body: replyBody, sender_email: senderEmail }),
  });
}

export async function generateReplyResponse(leadId: string, replyBody: string) {
  return fetchApi<any>("/outreach/generate-reply-response", {
    method: "POST",
    body: JSON.stringify({ lead_id: leadId, reply_body: replyBody }),
  });
}

export async function checkOutreachEligibility(leadIds: string[]) {
  return fetchApi<any>("/outreach/check-eligibility", {
    method: "POST",
    body: JSON.stringify({ lead_ids: leadIds }),
  });
}

export async function getBulkOutreachPreview(leadIds: string[]) {
  return fetchApi<any>("/outreach/bulk-preview", {
    method: "POST",
    body: JSON.stringify({ lead_ids: leadIds }),
  });
}

export async function sendBulkOutreach(
  emails: Array<{
    lead_id: string;
    recipient_email: string;
    subject: string;
    body: string;
    approved?: boolean;
  }>,
  delaySeconds?: number
) {
  return fetchApi<any>("/outreach/bulk-send", {
    method: "POST",
    body: JSON.stringify({ emails, delay_seconds: delaySeconds }),
  });
}

export async function quickAiOutreach(leadIds: string[], delaySeconds?: number) {
  return fetchApi<any>("/outreach/quick-send", {
    method: "POST",
    body: JSON.stringify({ lead_ids: leadIds, delay_seconds: delaySeconds }),
  });
}



// --- Projects & Procurement Hunter APIs ---
export async function getProcurementProjects(params?: {
  category?: string;
  country?: string;
  project_type?: string;
  min_fit_score?: number;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "All") query.append("category", params.category);
  if (params?.country && params.country !== "Worldwide") query.append("country", params.country);
  if (params?.project_type && params.project_type !== "All") query.append("project_type", params.project_type);
  if (params?.min_fit_score) query.append("min_fit_score", params.min_fit_score.toString());
  if (params?.search) query.append("search", params.search);

  const qs = query.toString();
  return fetchApi<any[]>(`/projects${qs ? `?${qs}` : ""}`);
}

export async function refreshProjects(category?: string) {
  const query = new URLSearchParams();
  if (category && category !== "All") query.append("category", category);
  const qs = query.toString();
  return fetchApi<any>(`/projects/refresh${qs ? `?${qs}` : ""}`, {
    method: "POST",
  });
}

// --- CSV Export APIs ---
export async function generateCSVExport(query: string = "All Leads") {
  return fetchApi<any>(`/export/csv?query=${encodeURIComponent(query)}`, {
    method: "POST",
  });
}

export async function getCSVExportHistory() {
  return fetchApi<any[]>("/export/history");
}

export async function downloadLeadsCsvDirect(allLeads: boolean = false) {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/export/download-leads-csv${allLeads ? "?all_leads=true" : ""}`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Export failed" }));
    throw new Error(err.detail || "Failed to download CSV");
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `opparch_leads_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function downloadExportFileDirect(exportId: string, filename: string) {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/export/download/${exportId}`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || "Failed to download file");
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename || `opparch_export.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// --- Admin APIs ---
export async function getAdminDashboard() {
  return fetchApi<any>("/admin/dashboard");
}

export async function getAdminUsers(query?: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : "";
  return fetchApi<any[]>(`/admin/users${qs}`);
}

export async function getUserFullDetails(userId: string) {
  return fetchApi<any>(`/admin/users/${userId}/details`);
}

export async function toggleUserStatus(userId: string, active: boolean) {
  return fetchApi<any>(`/admin/users/${userId}/status?active=${active}`, {
    method: "PUT",
  });
}

export async function updateUserRole(userId: string, role: string) {
  return fetchApi<any>(`/admin/users/${userId}/role?role=${role}`, {
    method: "PUT",
  });
}

export async function getAdminOutreachLogs() {
  return fetchApi<any>("/admin/outreach");
}

export async function getAdminLogs() {
  return fetchApi<any[]>("/admin/activity");
}

export async function getContactMessages() {
  return fetchApi<any[]>("/contact");
}

export async function markContactMessageAsRead(messageId: string) {
  return fetchApi<any>(`/contact/${messageId}/read`, {
    method: "PUT",
  });
}

// --- Health / Settings APIs ---
export async function checkOllamaStatus() {
  return fetchApi<any>("/settings/health");
}

// --- Analytics & Emerging Opportunities APIs ---
export async function getAnalyticsOverview() {
  return fetchApi<any>("/analytics/overview");
}

export async function getEmergingOpportunities(params?: { country?: string; industry?: string; limit?: number }) {
  const qs = params
    ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))).toString()
    : "";
  return fetchApi<any[]>(`/emerging${qs}`);
}

// --- Market Intelligence APIs ---
export async function getMarketTickers() {
  return fetchApi<any[]>("/market/tickers");
}

export async function getMarketKlines(symbol: string, interval?: string, limit?: number) {
  const p: Record<string, string> = { symbol };
  if (interval) p.interval = interval;
  if (limit) p.limit = String(limit);
  return fetchApi<any[]>(`/market/klines?${new URLSearchParams(p).toString()}`);
}

export async function getMarketSignals(symbol?: string) {
  const qs = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
  return fetchApi<any[]>(`/market/predictions${qs}`);
}

export async function getMarketAlerts() {
  return fetchApi<any[]>("/market/alerts");
}

export async function createMarketAlert(data: any) {
  return fetchApi<any>("/market/alerts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPaperTrades() {
  return fetchApi<any[]>("/market/paper-trades");
}

export async function createPaperTrade(data: any) {
  return fetchApi<any>("/market/paper-trades", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMarketNews(symbol?: string) {
  const qs = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
  return fetchApi<any[]>(`/market/news${qs}`);
}

export async function getMarketAnalysis(symbol?: string, timeframe?: string) {
  const p: Record<string, string> = {};
  if (symbol) p.symbol = symbol;
  if (timeframe) p.timeframe = timeframe;
  const qs = Object.keys(p).length ? "?" + new URLSearchParams(p).toString() : "";
  return fetchApi<any>(`/market/analysis${qs}`);
}

export async function getPredictionAccuracy() {
  return fetchApi<any>("/market/accuracy");
}

export async function getPsxCompanies(sector?: string, search?: string) {
  const p: Record<string, string> = {};
  if (sector && sector !== "All Sectors") p.sector = sector;
  if (search) p.search = search;
  const qs = Object.keys(p).length ? "?" + new URLSearchParams(p).toString() : "";
  return fetchApi<any[]>(`/market/psx/companies${qs}`);
}

export async function getPsxIndices() {
  return fetchApi<any[]>("/market/psx/indices");
}

export async function getPsxSectors() {
  return fetchApi<any[]>("/market/psx/sectors");
}

export async function getPsxMacroNews() {
  return fetchApi<any[]>("/market/psx/macro-news");
}

export async function calculatePsxProfit(data: { symbol: string; investment_amount: number; entry_price?: number }) {
  return fetchApi<any>("/market/psx/profit-calculator", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function analyzePsxCompany(symbol: string) {
  return fetchApi<any>(`/market/psx/analyze?symbol=${encodeURIComponent(symbol)}`);
}

export async function runBacktest(data: any) {
  return fetchApi<any>("/market/backtest", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAnalyticsData() {
  return fetchApi<any>("/analytics/overview");
}

// Backward-compatible aliases
export const generateOutreach = (params: { lead_id: string; channel?: string; tone?: string }) =>
  generateOutreachEmail(params.lead_id);
export const updateCrmLead = (leadId: string, payload: any) =>
  updateLeadCrmStage(leadId, payload.pipeline_stage || payload.stage, payload.internal_notes, payload.follow_up_date);
export const verifyLead = verifyLeadWebPresence;
export const getProjects = getProcurementProjects;
export const getAdminActivity = getAdminLogs;
export const toggleAdminUserStatus = toggleUserStatus;
export const updateAdminUserRole = updateUserRole;

// --- Project Hunter & AI Matching APIs ---
export async function getFreelancePlatformStatuses() {
  return fetchApi<any>("/projects/platforms");
}

export async function matchProjectWithAI(data: { title: string; description: string; budget?: string }) {
  return fetchApi<any>("/projects/match-ai", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function refreshProjectsFromProviders() {
  return fetchApi<any>("/projects/refresh", { method: "POST" });
}

// --- Email Settings (Admin) ---
export async function getAdminEmailSettings() {
  return fetchApi<any>("/admin/email-settings");
}

export async function updateAdminEmailSettings(config: {
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  from_email?: string;
  imap_host?: string;
  imap_port?: number;
}) {
  return fetchApi<any>("/admin/email-settings", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function testAdminSmtpConnection(testRecipient?: string) {
  return fetchApi<any>("/admin/email-settings/test", {
    method: "POST",
    body: JSON.stringify({ test_recipient: testRecipient }),
  });
}


// --- Inbound Email Check ---
export async function checkRealInboundEmails() {
  return fetchApi<any>("/outreach/check-inbound", { method: "POST" });
}

// --- Leads CSV + Projects CSV Download ---
export function downloadLeadsCsvUrl(allLeads = false) {
  const token = typeof window !== "undefined" ? localStorage.getItem("opparch_token") : "";
  return `${API_BASE_URL}/export/download-leads-csv?all_leads=${allLeads}&token=${token}`;
}

export function downloadProjectsCsvUrl() {
  const token = typeof window !== "undefined" ? localStorage.getItem("opparch_token") : "";
  return `${API_BASE_URL}/export/download-projects-csv?token=${token}`;
}

export async function downloadLeadsCSVBlob(allLeads = false): Promise<Blob> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/export/download-leads-csv?all_leads=${allLeads}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("CSV download failed");
  return res.blob();
}

export async function downloadProjectsCSVBlob(): Promise<Blob> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/export/download-projects-csv`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Projects CSV download failed");
  return res.blob();
}

// --- News Sentiment ---
export async function getNewsSentiment() {
  return fetchApi<any>("/market/news-sentiment");
}

// --- AI Provider Settings ---
export async function getAIConfig() {
  return fetchApi<any>("/settings/ai-config");
}

export async function updateAIConfig(config: {
  provider?: string;
  ollama_model?: string;
  gemini_api_key?: string;
  openai_api_key?: string;
}) {
  return fetchApi<any>("/settings/ai-config", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function getOllamaModels() {
  return fetchApi<any>("/settings/ollama-models");
}

export async function getOllamaStatus() {
  return fetchApi<any>("/settings/ollama-status");
}

export async function getOSMStatus() {
  return fetchApi<any>("/settings/osm-status");
}

export async function testGeminiKey(api_key: string) {
  return fetchApi<any>("/settings/test-gemini", {
    method: "POST",
    body: JSON.stringify({ api_key }),
  });
}

export async function testOpenAIKey(api_key: string) {
  return fetchApi<any>("/settings/test-openai", {
    method: "POST",
    body: JSON.stringify({ api_key }),
  });
}

// --- Admin: Dev DB Reset ---
export async function devResetDatabase() {
  return fetchApi<any>("/admin/dev-reset-db", {
    method: "POST",
    body: JSON.stringify({ confirmation: "RESET_CONFIRM" }),
  });
}
