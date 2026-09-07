import datetime
import uuid
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

# ──────────────────────────────────────────────────────────────────────────────
# MODULE A: AUTH & USER MANAGEMENT
# ──────────────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="USER", index=True) # USER or ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login_at = Column(DateTime, default=datetime.datetime.utcnow)

    # User AI Provider Preferences & Isolated Credentials
    ai_provider_preference = Column(String, default="OLLAMA") # OLLAMA, GEMINI, OPENAI, DEMO
    ollama_model_preference = Column(String, default="qwen3:4b")
    gemini_api_key = Column(Text, nullable=True)
    openai_api_key = Column(Text, nullable=True)

    # Relationships
    leads = relationship("BusinessLead", back_populates="user", cascade="all, delete-orphan")
    searches = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")
    csv_exports = relationship("CSVExport", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    paper_trades = relationship("PaperTrade", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("MarketAlert", back_populates="user", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────────────────────────
# MODULE A: CLIENT HUNTING & LEAD INTELLIGENCE
# ──────────────────────────────────────────────────────────────────────────────

class BusinessLead(Base):
    __tablename__ = "business_leads"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    country = Column(String, nullable=False, index=True)
    city = Column(String, nullable=True, index=True)
    region = Column(String, nullable=True)
    industry = Column(String, nullable=False, index=True)
    
    # Contact & Web
    website_url = Column(String, nullable=True)
    domain = Column(String, nullable=True, index=True)
    has_website = Column(Boolean, default=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    email_status = Column(String, default="not_found") # found or not_found
    email_source = Column(String, nullable=True) # official_website, contact_page, osm_listing
    email_source_url = Column(String, nullable=True)
    email_confidence = Column(String, nullable=True) # HIGH, MEDIUM, LOW
    contact_person = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    social_presence = Column(JSON, default=dict)

    
    # Discovery & Real Mode Metadata
    discovery_source = Column(String, default="OpenStreetMap / Overpass API")
    source_url = Column(String, nullable=True)
    is_demo_data = Column(Boolean, default=True)
    data_mode = Column(String, default="DEMO", index=True) # DEMO or REAL_FREE
    last_verified_at = Column(String, nullable=True)
    search_id = Column(String, nullable=True, index=True)
    
    # CRM Status
    pipeline_stage = Column(String, default="NEW", index=True)
    priority = Column(String, default="MEDIUM", index=True)
    follow_up_date = Column(String, nullable=True)
    internal_notes = Column(Text, nullable=True)
    deal_value = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships with eager selectin loading
    user = relationship("User", back_populates="leads")
    score = relationship("LeadScore", uselist=False, back_populates="lead", cascade="all, delete-orphan", lazy="selectin")
    audit = relationship("LeadAudit", uselist=False, back_populates="lead", cascade="all, delete-orphan", lazy="selectin")
    services = relationship("LeadServiceMatch", back_populates="lead", cascade="all, delete-orphan", lazy="selectin")
    outreach_drafts = relationship("OutreachDraft", back_populates="lead", cascade="all, delete-orphan", lazy="selectin")
    outreach_emails = relationship("EmailOutreach", back_populates="lead", cascade="all, delete-orphan", lazy="selectin")
    replies = relationship("EmailReply", back_populates="lead", cascade="all, delete-orphan", lazy="selectin")
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan", lazy="selectin")


class LeadScore(Base):
    __tablename__ = "lead_scores"

    id = Column(String, primary_key=True, default=generate_uuid)
    lead_id = Column(String, ForeignKey("business_leads.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    opportunity_score = Column(Integer, nullable=False, default=0, index=True)
    priority_level = Column(String, nullable=False, default="MEDIUM", index=True)
    confidence = Column(Float, default=0.85)
    
    website_gap_score = Column(Integer, default=0)
    digital_weakness_score = Column(Integer, default=0)
    business_activity_score = Column(Integer, default=0)
    social_presence_score = Column(Integer, default=0)
    ecommerce_opportunity_score = Column(Integer, default=0)
    ux_opportunity_score = Column(Integer, default=0)
    mobile_opportunity_score = Column(Integer, default=0)
    branding_opportunity_score = Column(Integer, default=0)
    
    reasoning_summary = Column(Text, nullable=True)
    
    lead = relationship("BusinessLead", back_populates="score")


class LeadAudit(Base):
    __tablename__ = "lead_audits"

    id = Column(String, primary_key=True, default=generate_uuid)
    lead_id = Column(String, ForeignKey("business_leads.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    website_status = Column(String, default="UNKNOWN")
    mobile_friendly = Column(Boolean, default=False)
    ssl_active = Column(Boolean, default=False)
    page_speed_rating = Column(String, default="MODERATE")
    seo_quality = Column(String, default="POOR")
    ux_rating = Column(String, default="NEEDS_IMPROVEMENT")
    
    missing_digital_features = Column(JSON, default=list)
    evidence_points = Column(JSON, default=list)
    pain_points = Column(JSON, default=list)
    raw_audit_data = Column(JSON, default=dict)
    
    audited_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    lead = relationship("BusinessLead", back_populates="audit")


class LeadServiceMatch(Base):
    __tablename__ = "lead_service_matches"

    id = Column(String, primary_key=True, default=generate_uuid)
    lead_id = Column(String, ForeignKey("business_leads.id", ondelete="CASCADE"), nullable=False)
    
    service_id = Column(String, nullable=False)
    service_name = Column(String, nullable=False)
    fit_rank = Column(Integer, default=1)
    match_confidence = Column(Integer, default=90)
    match_reason = Column(Text, nullable=False)
    
    lead = relationship("BusinessLead", back_populates="services")


class ProcurementProject(Base):
    __tablename__ = "procurement_projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, nullable=False, index=True)
    organization = Column(String, nullable=False, index=True)
    country = Column(String, nullable=False, index=True)
    city = Column(String, nullable=True)
    project_type = Column(String, default="Web & Software Engineering")
    category = Column(String, default="PROCUREMENT", index=True) # PROCUREMENT, CLIENT_PROJECT_REQUEST, FREELANCE
    status = Column(String, default="ACTIVE", index=True) # ACTIVE or EXPIRED
    published_date = Column(String, nullable=True)
    last_updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    deadline = Column(String, nullable=True)
    source_name = Column(String, default="PPRA / Official Procurement")
    source_url = Column(String, nullable=True)
    estimated_budget = Column(String, nullable=True)
    
    devarcher_fit_score = Column(Integer, default=85, index=True)
    fit_level = Column(String, default="HIGH")
    fit_breakdown = Column(JSON, default=dict)
    
    ai_summary = Column(Text, nullable=True)
    requirements = Column(JSON, default=list)
    eligibility_criteria = Column(JSON, default=list)
    recommended_services = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EmergingOpportunity(Base):
    __tablename__ = "emerging_opportunities"

    id = Column(String, primary_key=True, default=generate_uuid)
    country = Column(String, nullable=False, index=True)
    industry = Column(String, nullable=False, index=True)
    opportunity_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    estimated_potential_businesses = Column(Integer, default=10)
    recommended_devarcher_solution = Column(String, nullable=False)
    growth_signal = Column(String, default="HIGH")
    evidence_signals = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SearchHistory(Base):
    __tablename__ = "search_histories"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    query = Column(String, nullable=False)
    search_type = Column(String, default="BUSINESS")
    mode = Column(String, default="DEMO") # DEMO or REAL_FREE
    parsed_criteria = Column(JSON, default=dict)
    country = Column(String, default="Worldwide")
    city = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    service_target = Column(String, nullable=True)
    
    results_count = Column(Integer, default=0)
    high_priority_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="searches")


class CSVExport(Base):
    __tablename__ = "csv_exports"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    search_query = Column(String, nullable=True)
    record_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="csv_exports")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    action = Column(String, nullable=False, index=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="activity_logs")


class OutreachDraft(Base):
    __tablename__ = "outreach_drafts"

    id = Column(String, primary_key=True, default=generate_uuid)
    lead_id = Column(String, ForeignKey("business_leads.id", ondelete="CASCADE"), nullable=False)
    
    channel = Column(String, nullable=False)
    tone = Column(String, default="Professional & Consultative")
    subject = Column(String, nullable=True)
    message_body = Column(Text, nullable=False)
    key_value_propositions = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    lead = relationship("BusinessLead", back_populates="outreach_drafts")


class EmailOutreach(Base):
    __tablename__ = "email_outreaches"

    id = Column(String, primary_key=True, default=generate_uuid)
    lead_id = Column(String, ForeignKey("business_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    recipient_email = Column(String, nullable=False)
    sender_email = Column(String, default="syedzulqarnain164@gmail.com")
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    
    status = Column(String, default="SENT", index=True) # DRAFT, SENT, FAILED
    error_message = Column(Text, nullable=True)
    mode = Column(String, default="MANUAL") # MANUAL, ASSISTED, AUTO
    
    sent_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    lead = relationship("BusinessLead", back_populates="outreach_emails")
    replies = relationship("EmailReply", back_populates="outreach", cascade="all, delete-orphan", lazy="selectin")


class EmailReply(Base):
    __tablename__ = "email_replies"

    id = Column(String, primary_key=True, default=generate_uuid)
    lead_id = Column(String, ForeignKey("business_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    outreach_id = Column(String, ForeignKey("email_outreaches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    sender_email = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    
    # AI Extracted Insights
    extracted_requirements = Column(JSON, default=list)
    extracted_budget = Column(String, nullable=True)
    extracted_timeline = Column(String, nullable=True)
    extracted_questions = Column(JSON, default=list)
    ai_summary = Column(Text, nullable=True)
    suggested_response = Column(Text, nullable=True)
    
    received_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    lead = relationship("BusinessLead", back_populates="replies")
    outreach = relationship("EmailOutreach", back_populates="replies")


class LeadNote(Base):
    __tablename__ = "lead_notes"

    id = Column(String, primary_key=True, default=generate_uuid)
    lead_id = Column(String, ForeignKey("business_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    author_name = Column(String, default="Syed Zulqarnain")
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    lead = relationship("BusinessLead", back_populates="notes")


# ──────────────────────────────────────────────────────────────────────────────
# MODULE B: MARKET INTELLIGENCE & CRYPTO OPPORTUNITY DETECTION
# ──────────────────────────────────────────────────────────────────────────────

class MarketPrediction(Base):
    __tablename__ = "market_predictions"

    id = Column(String, primary_key=True, default=generate_uuid)
    symbol = Column(String, nullable=False, index=True) # e.g. BTC/USDT, ETH/USDT, SOL/USDT
    direction = Column(String, nullable=False, index=True) # LONG, SHORT, WAIT
    opportunity_score = Column(Integer, nullable=False, default=50, index=True) # 0-100
    model_probability = Column(Float, nullable=False, default=0.50) # 0.0 - 1.0
    time_horizon = Column(String, default="1 hour") # 15m, 1h, 4h, 1D
    risk_level = Column(String, default="Medium") # Low, Medium, High
    
    entry_price = Column(Float, nullable=False)
    invalidation_price = Column(Float, nullable=True) # Stop Loss zone
    target_prices = Column(JSON, default=list) # Take Profit zones
    
    technical_verdict = Column(String, default="NEUTRAL") # Bullish, Bearish, Neutral
    news_verdict = Column(String, default="NEUTRAL")
    social_verdict = Column(String, default="NEUTRAL")
    volume_verdict = Column(String, default="NEUTRAL")
    btc_alignment = Column(String, default="NEUTRAL")
    
    reasons = Column(JSON, default=list)
    ollama_explanation = Column(Text, nullable=True)
    
    # Validation & Performance Tracking (No Fake Accuracy!)
    status = Column(String, default="PENDING", index=True) # PENDING, WIN, LOSS, EXPIRED
    actual_outcome_pnl = Column(Float, nullable=True) # e.g. +3.45% or -1.20%
    exit_price = Column(Float, nullable=True)
    validated_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)


class MarketDataPoint(Base):
    __tablename__ = "market_data_points"

    id = Column(String, primary_key=True, default=generate_uuid)
    symbol = Column(String, nullable=False, index=True)
    timeframe = Column(String, default="1h", index=True)
    price = Column(Float, nullable=False)
    high_24h = Column(Float, nullable=True)
    low_24h = Column(Float, nullable=True)
    volume_24h = Column(Float, nullable=True)
    price_change_24h = Column(Float, nullable=True)
    
    # Technical Indicators Snapshot
    rsi_14 = Column(Float, nullable=True)
    macd_val = Column(Float, nullable=True)
    macd_signal = Column(Float, nullable=True)
    ema_20 = Column(Float, nullable=True)
    ema_50 = Column(Float, nullable=True)
    sma_200 = Column(Float, nullable=True)
    bb_upper = Column(Float, nullable=True)
    bb_lower = Column(Float, nullable=True)
    atr_14 = Column(Float, nullable=True)
    volatility_score = Column(Float, nullable=True)
    
    source = Column(String, default="Binance / Bitget WebSocket")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class NewsIntelligenceItem(Base):
    __tablename__ = "news_intelligence_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    source = Column(String, nullable=False, index=True)
    url = Column(String, nullable=True)
    sentiment = Column(String, default="NEUTRAL") # POSITIVE, NEGATIVE, NEUTRAL
    sentiment_score = Column(Float, default=0.0) # -1.0 to +1.0
    affected_coins = Column(JSON, default=list)
    credibility_score = Column(Float, default=0.85)
    market_confirmed = Column(Boolean, default=False) # News confirmed by price/volume move
    published_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class RedditPostItem(Base):
    __tablename__ = "reddit_post_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    subreddit = Column(String, default="r/CryptoCurrency", index=True)
    title = Column(String, nullable=False)
    post_url = Column(String, nullable=True)
    detected_coins = Column(JSON, default=list)
    sentiment = Column(String, default="NEUTRAL") # BULLISH, BEARISH, NEUTRAL
    score = Column(Integer, default=1)
    num_comments = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(String, ForeignKey("market_predictions.id", ondelete="SET NULL"), nullable=True)
    
    symbol = Column(String, nullable=False, index=True)
    direction = Column(String, nullable=False) # LONG or SHORT
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    take_profit = Column(Float, nullable=False)
    position_size = Column(Float, default=1000.0) # USD value
    
    status = Column(String, default="OPEN", index=True) # OPEN, CLOSED_TP, CLOSED_SL, CLOSED_MANUAL
    realized_pnl = Column(Float, default=0.0)
    pnl_percent = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="paper_trades")


class MarketAlert(Base):
    __tablename__ = "market_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    direction = Column(String, nullable=False) # LONG, SHORT, WAIT
    opportunity_score = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    reasons = Column(JSON, default=list)
    risk_level = Column(String, default="Medium")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="alerts")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
