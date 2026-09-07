import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SERVICES: List[Dict[str, Any]] = [
    {
        "id": "web-development",
        "name": "Full-Stack Web Development",
        "category": "Engineering",
        "tagline": "Fast, secure, scalable web applications optimized for conversion.",
        "description": "Custom web development optimized for high performance, modern architecture, and SEO.",
        "fit_tags": ["slow_website", "missing_website", "broken_functionality", "custom_web_app", "portal_need"]
    },
    {
        "id": "web-design",
        "name": "UI/UX & Web Design",
        "category": "UI/UX & Visuals",
        "tagline": "Modern responsive interface design that builds instant credibility.",
        "description": "Custom UI/UX design, visual hierarchy, mobile responsive layout, and modern brand alignment.",
        "fit_tags": ["poor_ux", "outdated_design", "ugly_interface", "not_responsive", "high_bounce_rate"]
    },
    {
        "id": "custom-software-mobile",
        "name": "Custom Software & Mobile Solutions",
        "category": "Mobile & Apps",
        "tagline": "Native & cross-platform mobile apps, customer portals, and cloud backends.",
        "description": "Cross-platform mobile applications, customer portals, booking engines, and custom SaaS systems.",
        "fit_tags": ["manual_workflow", "mobile_app_need", "custom_system", "booking_engine", "e_commerce_store"]
    },
    {
        "id": "seo-performance",
        "name": "SEO & Performance Optimization",
        "category": "Growth & Audit",
        "tagline": "Technical SEO, Core Web Vitals, and search ranking optimization.",
        "description": "Comprehensive technical SEO, speed optimization, Google Core Web Vitals, and search visibility.",
        "fit_tags": ["poor_seo", "slow_load_time", "low_traffic", "unindexed_pages", "bad_mobile_performance"]
    },
    {
        "id": "branding-logo",
        "name": "Branding & Visual Identity",
        "category": "Brand Identity",
        "tagline": "Cohesive visual identity, logo design, and brand system.",
        "description": "Logo design, brand identity systems, color palettes, visual guidelines, and brand positioning.",
        "fit_tags": ["missing_branding", "outdated_logo", "inconsistent_brand", "new_company"]
    },
    {
        "id": "web-copy",
        "name": "Copywriting & Content Strategy",
        "category": "Content Strategy",
        "tagline": "High-converting copy that clearly communicates value.",
        "description": "Persuasive copy that clearly communicates value proposition and drives action.",
        "fit_tags": ["weak_copy", "confusing_messaging", "no_clear_cta", "low_conversion"]
    },
    {
        "id": "web-maintenance",
        "name": "Maintenance & Operations",
        "category": "Operations",
        "tagline": "Continuous security monitoring, updates, and 24/7 reliability.",
        "description": "Continuous monitoring, security updates, feature additions, and ongoing performance optimization.",
        "fit_tags": ["unmaintained_site", "broken_links", "outdated_content", "security_vulnerability"]
    }
]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "OPPARCH AI"
    TAGLINE: str = "FIND THE OPPORTUNITIES BEHIND THE DATA"
    PLATFORM_NAME: str = "OPPARCH AI"
    
    # Mode
    DEMO_MODE: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./opparch_ai.db"
    
    # Security
    SECRET_KEY: str = "opparch_ai_super_secret_jwt_key_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # API Keys & External Providers (NOT required for Real Free Mode)
    OPENAI_API_KEY: str = ""
    SEARCH_API_KEY: str = ""
    SEARCH_ENGINE_ID: str = ""
    
    # ── LOCAL AI (Ollama) ───────────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "qwen3:4b"
    OLLAMA_TIMEOUT: int = 90
    OLLAMA_CONNECT_TIMEOUT: int = 3
    
    # ── EMAIL OUTREACH & ZOHO SMTP INFRASTRUCTURE ───────────────────────────
    SMTP_HOST: str = "mail.zoho.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "contact@devarcher.com"
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "contact@devarcher.com"
    SMTP_USE_TLS: bool = True
    
    IMAP_HOST: str = "imap.zoho.com"
    IMAP_PORT: int = 993
    
    OUTREACH_DELAY_SECONDS: int = 3
    OUTREACH_BATCH_SIZE: int = 10

    # Analysis Configuration
    DEFAULT_ANALYSIS_DEPTH: str = "BALANCED"

    # Services Catalog
    SERVICES_CATALOG: List[Dict[str, Any]] = DEFAULT_SERVICES
    DEVARCHER_SERVICES: List[Dict[str, Any]] = DEFAULT_SERVICES

settings = Settings()
