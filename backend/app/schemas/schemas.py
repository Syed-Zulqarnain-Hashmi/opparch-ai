from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, EmailStr
import datetime

# ── Auth Schemas ─────────────────────────────────────────────────────────────
class UserRegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime
    last_login_at: datetime.datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

# ── Client Hunting Search Schemas ─────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str = Field(..., description="Natural language search prompt or explicit filter query")
    country: Optional[str] = "Worldwide"
    city: Optional[str] = None
    industry: Optional[str] = None
    service_target: Optional[str] = None
    opportunity_type: Optional[str] = "BUSINESS" # BUSINESS, PROJECT, BOTH
    mode: Optional[str] = "DEMO" # DEMO or REAL_FREE
    ai_engine: Optional[str] = "DEMO" # DEMO or LOCAL_AI
    limit: Optional[int] = 20
    analysis_depth: Optional[str] = "BALANCED" # FAST, BALANCED, DEEP

class ParsedSearchCriteria(BaseModel):
    country: str
    city: Optional[str] = None
    industry: str
    opportunity_focus: str
    digital_gap: str
    priority: str
    matched_services: List[str] = []

class ServiceMatchSchema(BaseModel):
    service_id: str
    service_name: str
    fit_rank: int
    match_confidence: int
    match_reason: str

class ScoreBreakdownSchema(BaseModel):
    website_gap_score: int
    digital_weakness_score: int
    business_activity_score: int
    social_presence_score: int
    ecommerce_opportunity_score: int
    ux_opportunity_score: int
    mobile_opportunity_score: int
    branding_opportunity_score: int

class LeadAuditSchema(BaseModel):
    website_status: str
    mobile_friendly: bool
    ssl_active: bool
    page_speed_rating: str
    seo_quality: str
    ux_rating: str
    missing_digital_features: List[str]
    evidence_points: List[str]
    pain_points: List[str]

class LeadScoreSchema(BaseModel):
    opportunity_score: int
    priority_level: str
    confidence: float
    breakdown: ScoreBreakdownSchema
    reasoning_summary: str

class BusinessLeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    name: str
    country: str
    city: Optional[str] = None
    industry: str
    website_url: Optional[str] = None
    has_website: bool
    phone: Optional[str] = None
    email: Optional[str] = None
    email_status: Optional[str] = "not_found"
    email_source: Optional[str] = None
    email_source_url: Optional[str] = None
    email_confidence: Optional[str] = None
    contact_person: Optional[str] = None
    address: Optional[str] = None
    social_presence: Dict[str, Any] = {}
    discovery_source: Optional[str] = None
    source_url: Optional[str] = None

    is_demo_data: bool = True
    data_mode: str = "DEMO"
    last_verified_at: Optional[str] = None
    pipeline_stage: str
    priority: str
    follow_up_date: Optional[str] = None
    internal_notes: Optional[str] = None
    deal_value: Optional[float] = 0.0
    created_at: datetime.datetime

    score: Optional[LeadScoreSchema] = None
    audit: Optional[LeadAuditSchema] = None
    services: List[ServiceMatchSchema] = []


class ProcurementProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    title: str
    organization: str
    country: str
    city: Optional[str] = None
    project_type: str
    deadline: Optional[str] = None
    source_name: str
    source_url: Optional[str] = None
    estimated_budget: Optional[str] = None
    devarcher_fit_score: int
    fit_level: str
    fit_breakdown: Dict[str, Any] = {}
    ai_summary: str
    requirements: List[str] = []
    eligibility_criteria: List[str] = []
    recommended_services: List[str] = []
    created_at: datetime.datetime

class SearchExecutionResponse(BaseModel):
    search_id: str
    query: str
    parsed_criteria: ParsedSearchCriteria
    total_found: int
    high_priority_count: int
    leads: List[BusinessLeadResponse] = []
    projects: List[ProcurementProjectResponse] = []
    mode: str = "DEMO"
    real_data: bool = False
    status: str = "success"
    provider_status: Optional[str] = "ONLINE"
    ollama_status: Optional[str] = "ONLINE"
    message: Optional[str] = None

# ── Module B: Market Intelligence Schemas ─────────────────────────────────────

class CryptoTickerResponse(BaseModel):
    symbol: str
    name: str
    price: float
    price_change_24h: float
    high_24h: float
    low_24h: float
    volume_24h: float
    source: str = "Binance / Bitget Live API"
    last_updated: str

class TechnicalSnapshotSchema(BaseModel):
    rsi_14: float
    macd: float
    macd_signal: float
    macd_hist: float
    ema_20: float
    ema_50: float
    sma_200: float
    bb_upper: float
    bb_lower: float
    atr_14: float
    technical_verdict: str # Bullish, Bearish, Neutral
    trend: str # Strong Uptrend, Downtrend, Sideways

class NewsSentimentSchema(BaseModel):
    title: str
    source: str
    sentiment: str
    score: float
    affected_coins: List[str]
    published_at: str
    market_confirmed: bool

class RedditPostSchema(BaseModel):
    subreddit: str
    title: str
    detected_coins: List[str]
    sentiment: str
    score: int
    num_comments: int

class MarketPredictionResponse(BaseModel):
    id: str
    symbol: str
    direction: str # LONG, SHORT, WAIT
    opportunity_score: int # 0-100
    model_probability: float # 0.0 - 1.0 (e.g. 0.78 = 78%)
    time_horizon: str # e.g. "1 hour"
    risk_level: str # Low, Medium, High
    entry_price: float
    invalidation_price: Optional[float] = None
    target_prices: List[float] = []
    technical_verdict: str
    news_verdict: str
    social_verdict: str
    volume_verdict: str
    btc_alignment: str
    reasons: List[str] = []
    ollama_explanation: Optional[str] = None
    status: str = "PENDING"
    actual_outcome_pnl: Optional[float] = None
    created_at: datetime.datetime

class BacktestRequest(BaseModel):
    symbol: str = "BTC/USDT"
    timeframe: str = "1h"
    days_history: int = 30
    initial_capital: float = 10000.0
    risk_per_trade_percent: float = 2.0

class BacktestResultResponse(BaseModel):
    symbol: str
    timeframe: str
    days_tested: int
    initial_capital: float
    final_equity: float
    total_return_percent: float
    total_signals: int
    winning_signals: int
    losing_signals: int
    win_rate_percent: float
    max_drawdown_percent: float
    profit_factor: float
    average_rr_ratio: float
    long_accuracy_percent: float
    short_accuracy_percent: float
    equity_curve: List[Dict[str, Any]] = []

class PaperTradeRequest(BaseModel):
    symbol: str
    direction: str # LONG or SHORT
    entry_price: float
    stop_loss: float
    take_profit: float
    position_size: float = 1000.0

class PaperTradeResponse(BaseModel):
    id: str
    symbol: str
    direction: str
    entry_price: float
    current_price: float
    stop_loss: float
    take_profit: float
    position_size: float
    status: str
    realized_pnl: float
    pnl_percent: float
    created_at: datetime.datetime

class MarketAlertResponse(BaseModel):
    id: str
    symbol: str
    direction: str
    opportunity_score: int
    message: str
    reasons: List[str] = []
    risk_level: str
    is_read: bool
    created_at: datetime.datetime

class OverallPerformanceAccuracyResponse(BaseModel):
    total_signals_logged: int
    correct_predictions: int
    actual_accuracy_percent: float
    long_win_rate_percent: float
    short_win_rate_percent: float
    win_loss_breakdown: Dict[str, int]
    data_note: str = "Calculated strictly from recorded historical outcomes (No fake accuracy)"


# ── Legacy Module A Schemas (preserved for existing API routers) ──────────────

class EmergingOpportunityResponse(BaseModel):
    id: str
    country: str
    industry: str
    opportunity_name: str
    description: str
    estimated_potential_businesses: int
    recommended_devarcher_solution: str
    growth_signal: str
    evidence_signals: List[str] = []


class CSVExportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    search_query: Optional[str] = None
    record_count: int
    created_at: datetime.datetime


class CRMUpdateRequest(BaseModel):
    stage: Optional[str] = None
    pipeline_stage: Optional[str] = None
    priority: Optional[str] = None
    follow_up_date: Optional[str] = None
    internal_notes: Optional[str] = None
    deal_value: Optional[float] = None


class LeadUpdateRequest(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website_url: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    social_presence: Optional[Dict[str, Any]] = None
    internal_notes: Optional[str] = None
    pipeline_stage: Optional[str] = None
    priority: Optional[str] = None
    deal_value: Optional[float] = None



class OutreachGenerateRequest(BaseModel):
    lead_id: str
    channel: str = "Email"
    tone: str = "Professional & Consultative"
    additional_context: Optional[str] = None


class OutreachDraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: str
    channel: str
    tone: str
    subject: Optional[str] = None
    message_body: str
    key_value_propositions: List[str] = []
    created_at: datetime.datetime


class AnalyticsOverviewResponse(BaseModel):
    total_leads: int
    total_projects: int
    high_priority_leads: int
    real_leads: int
    demo_leads: int
    pipeline_counts: Dict[str, int] = {}
    country_distribution: Dict[str, int] = {}
    industry_distribution: Dict[str, int] = {}
    score_distribution: Dict[str, int] = {}
    conversion_rate: float = 0.0
