"""
OPPARCH AI — Multi-Provider AI Architecture Layer
Supports:
  1. DEMO MODE (Fast deterministic rule engine)
  2. LOCAL AI / OLLAMA (Zero cost, local open-source models, dynamic switching)
  3. GEMINI API (Google Gemini 1.5 Flash via user-supplied API key)
  4. OPENAI API (GPT-4o-mini via user-supplied API key)

Automatic 4-Tier Fallback:
  User Selected Cloud (Gemini/OpenAI)
                ↓ [API error / quota exceeded]
  Local Ollama (detected model)
                ↓ [Ollama offline / port closed]
  Deterministic Rule Engine
"""
import logging
from typing import Dict, Any, List, Optional

from app.core.location_registry import LocationRegistry, CITY_TO_COUNTRY_MAP
from app.providers.ollama_provider import OllamaProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.schemas.schemas import ParsedSearchCriteria

logger = logging.getLogger(__name__)


QUICK_SEARCH_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "businesses without a website": {
        "industry": "General Business",
        "service": "Full-Stack Web Development",
        "digital_gap": "Missing Website",
        "focus": "Online Presence & Modern Digital Storefront"
    },
    "businesses with outdated websites": {
        "industry": "General Business",
        "service": "UI/UX & Web Design",
        "digital_gap": "Outdated Website",
        "focus": "Website Redesign & Modern UI"
    },
    "businesses with poor website performance": {
        "industry": "General Business",
        "service": "SEO & Performance Optimization",
        "digital_gap": "Slow Website Performance",
        "focus": "Speed Optimization & Core Web Vitals"
    },
    "businesses with weak seo": {
        "industry": "General Business",
        "service": "SEO & Performance Optimization",
        "digital_gap": "Weak Search Ranking",
        "focus": "Technical SEO & Search Visibility"
    },
    "businesses with weak digital presence": {
        "industry": "General Business",
        "service": "Full-Stack Web Development",
        "digital_gap": "Weak Digital Presence",
        "focus": "Digital Modernization & Online Sales Conversion"
    },
    "businesses needing web design": {
        "industry": "General Business",
        "service": "UI/UX & Web Design",
        "digital_gap": "Sub-optimal UI/UX",
        "focus": "Brand Credibility & UX Design"
    },
    "businesses needing web development": {
        "industry": "General Business",
        "service": "Full-Stack Web Development",
        "digital_gap": "Missing Digital Infrastructure",
        "focus": "Custom Web Applications & Portals"
    },
    "businesses needing seo": {
        "industry": "General Business",
        "service": "SEO & Performance Optimization",
        "digital_gap": "Poor Search Indexing",
        "focus": "Organic Search Traffic Growth"
    },
    "businesses needing mobile apps": {
        "industry": "General Business",
        "service": "Custom Software & Mobile Solutions",
        "digital_gap": "Missing Mobile Experience",
        "focus": "Mobile Apps & Customer Booking Systems"
    },
    "businesses needing ai/automation": {
        "industry": "General Business",
        "service": "Custom Software & Mobile Solutions",
        "digital_gap": "Manual Operational Workflows",
        "focus": "AI Chatbots, Automated Booking & CRM"
    },
    "businesses with poor online presence": {
        "industry": "General Business",
        "service": "Full-Stack Web Development",
        "digital_gap": "Invisible Online Presence",
        "focus": "Digital Transformation & Lead Generation"
    },
    "freelance web development projects": {
        "industry": "Software Companies",
        "service": "Full-Stack Web Development",
        "digital_gap": "Client Contract Opportunity",
        "focus": "Project Procurement & Client Hunting"
    },
    "freelance web design projects": {
        "industry": "UI/UX & Web Design",
        "service": "UI/UX & Web Design",
        "digital_gap": "Client Contract Opportunity",
        "focus": "Project Procurement & Client Hunting"
    },
    "seo projects": {
        "industry": "Marketing Agencies",
        "service": "SEO & Performance Optimization",
        "digital_gap": "Client Contract Opportunity",
        "focus": "Project Procurement & Client Hunting"
    },
    "app development projects": {
        "industry": "Software Companies",
        "service": "Custom Software & Mobile Solutions",
        "digital_gap": "Client Contract Opportunity",
        "focus": "Project Procurement & Client Hunting"
    },
    "ai development projects": {
        "industry": "Software Companies",
        "service": "Custom Software & Mobile Solutions",
        "digital_gap": "Client Contract Opportunity",
        "focus": "Project Procurement & Client Hunting"
    },
    "custom software projects": {
        "industry": "Software Companies",
        "service": "Custom Software & Mobile Solutions",
        "digital_gap": "Client Contract Opportunity",
        "focus": "Project Procurement & Client Hunting"
    }
}


class AIProvider:
    """
    Unified Orchestrator for all AI Providers with transparent automatic fallback.
    """

    @classmethod
    async def generate_completion(
        cls,
        prompt: str,
        provider: str = "OLLAMA",
        gemini_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        ollama_model: Optional[str] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Executes a completion prompt with automatic fallback down the provider ladder.
        Returns: {"text": str, "provider_used": str, "fallback_triggered": bool}
        """
        prov = (provider or "OLLAMA").upper().strip()

        # ── 1. GEMINI PATH ───────────────────────────────────────────────────
        if prov == "GEMINI" and gemini_key:
            res = await GeminiProvider.generate_completion(prompt=prompt, api_key=gemini_key, temperature=temperature)
            if res:
                return {"text": res, "provider_used": "Gemini (gemini-1.5-flash)", "fallback_triggered": False}
            logger.warning("[AIProvider] Gemini failed or quota exceeded — falling back to Ollama.")

        # ── 2. OPENAI PATH ───────────────────────────────────────────────────
        elif prov == "OPENAI" and openai_key:
            res = await OpenAIProvider.generate_completion(prompt=prompt, api_key=openai_key, temperature=temperature)
            if res:
                return {"text": res, "provider_used": "OpenAI (gpt-4o-mini)", "fallback_triggered": False}
            logger.warning("[AIProvider] OpenAI failed or quota exceeded — falling back to Ollama.")

        # ── 3. OLLAMA PATH (Primary or Fallback) ──────────────────────────────
        if prov != "DEMO":
            res = await OllamaProvider.generate_completion(prompt=prompt, model=ollama_model, temperature=temperature)
            if res:
                used_model = ollama_model or OllamaProvider._default_model()
                return {
                    "text": res,
                    "provider_used": f"Ollama ({used_model})",
                    "fallback_triggered": (prov in ["GEMINI", "OPENAI"])
                }

        # ── 4. DETERMINISTIC FALLBACK ────────────────────────────────────────
        return {
            "text": "",
            "provider_used": "Deterministic Rule Engine (Fallback)",
            "fallback_triggered": True
        }

    @classmethod
    async def generate_json(
        cls,
        prompt: str,
        provider: str = "OLLAMA",
        gemini_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        ollama_model: Optional[str] = None,
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """
        Generates structured JSON with automatic fallback.
        """
        prov = (provider or "OLLAMA").upper().strip()

        # ── 1. GEMINI ────────────────────────────────────────────────────────
        if prov == "GEMINI" and gemini_key:
            res = await GeminiProvider.generate_json(prompt=prompt, api_key=gemini_key, temperature=temperature)
            if res:
                return {"json": res, "provider_used": "Gemini (gemini-1.5-flash)", "fallback_triggered": False}
            logger.warning("[AIProvider] Gemini JSON failed — falling back to Ollama.")

        # ── 2. OPENAI ────────────────────────────────────────────────────────
        elif prov == "OPENAI" and openai_key:
            res = await OpenAIProvider.generate_json(prompt=prompt, api_key=openai_key, temperature=temperature)
            if res:
                return {"json": res, "provider_used": "OpenAI (gpt-4o-mini)", "fallback_triggered": False}
            logger.warning("[AIProvider] OpenAI JSON failed — falling back to Ollama.")

        # ── 3. OLLAMA ────────────────────────────────────────────────────────
        if prov != "DEMO":
            res = await OllamaProvider.generate_json(prompt=prompt, model=ollama_model, temperature=temperature)
            if res:
                used_model = ollama_model or OllamaProvider._default_model()
                return {
                    "json": res,
                    "provider_used": f"Ollama ({used_model})",
                    "fallback_triggered": (prov in ["GEMINI", "OPENAI"])
                }

        return {
            "json": None,
            "provider_used": "Deterministic Rule Engine (Fallback)",
            "fallback_triggered": True
        }

    @classmethod
    async def parse_search_intent(
        cls,
        query: str,
        default_country: str = "Worldwide",
        mode: str = "DEMO",
        provider: str = "OLLAMA",
        gemini_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        ollama_model: Optional[str] = None
    ) -> ParsedSearchCriteria:
        """
        Parses natural language search query into structured search parameters.
        Checks QUICK_SEARCH_TEMPLATES first for template matching, then extracts locations & industries.
        """
        q = query.lower().strip()

        # Check template matching
        matched_template = None
        for t_key, t_val in QUICK_SEARCH_TEMPLATES.items():
            if t_key in q or q in t_key:
                matched_template = t_val
                break

        # Extract location with strict canonical resolution
        extracted_city = None
        extracted_country = None

        for city_key, canonical_c in CITY_TO_COUNTRY_MAP.items():
            if city_key in q:
                extracted_city = city_key.title()
                extracted_country = canonical_c
                break

        if not extracted_country and default_country and default_country != "Worldwide":
            extracted_country = default_country
        elif not extracted_country:
            countries_map = {
                "pakistan": "Pakistan", "dubai": "UAE", "uae": "UAE", "emirates": "UAE",
                "usa": "USA", "united states": "USA", "america": "USA",
                "uk": "UK", "united kingdom": "UK", "britain": "UK",
                "canada": "Canada", "australia": "Australia", "saudi": "Saudi Arabia",
                "ksa": "Saudi Arabia", "germany": "Germany", "france": "France",
                "singapore": "Singapore", "turkey": "Turkey", "india": "India"
            }
            for k, v in countries_map.items():
                if k in q:
                    extracted_country = v
                    break

        final_country, final_city = LocationRegistry.resolve_canonical_location(
            country=extracted_country or default_country,
            city=extracted_city
        )

        # Extract industry
        industry = matched_template["industry"] if matched_template else "General Business"
        industries = [
            ("restaurant", "Restaurants"), ("dining", "Restaurants"), ("cafe", "Restaurants"),
            ("coffee shop", "Restaurants"), ("food", "Restaurants"),
            ("medical store", "Medical Stores"), ("pharmacy", "Medical Stores"),
            ("medicine", "Medical Stores"), ("drug store", "Medical Stores"),
            ("clinic", "Clinics"), ("hospital", "Hospitals"), ("dentist", "Dentists"),
            ("real estate", "Real Estate"), ("property", "Real Estate"),
            ("hotel", "Hotels"), ("hostel", "Hotels"), ("guest house", "Hotels"),
            ("clothing", "Clothing Brands"), ("fashion", "Fashion"), ("boutique", "Fashion"),
            ("salon", "Salons"), ("hairdresser", "Salons"), ("beauty", "Salons"), ("barber", "Barbers"),
            ("gym", "Gyms"), ("fitness", "Gyms"),
            ("lawyer", "Law Firms"), ("legal", "Law Firms"), ("law firm", "Law Firms"),
            ("construction", "Construction"), ("builder", "Construction"), ("architecture", "Architecture"),
            ("car dealer", "Car Dealerships"), ("auto", "Automotive"), ("workshop", "Auto Workshops"),
            ("software", "Software Companies"), ("it company", "Software Companies"),
            ("startup", "Startups"), ("e-commerce", "E-commerce"), ("retail", "Retail"),
            ("travel", "Travel Agencies"), ("logistics", "Logistics")
        ]
        for term, cat in industries:
            if term in q:
                industry = cat
                break

        # Matched services
        matched = [matched_template["service"]] if matched_template else ["Web Development"]
        if "seo" in q or "traffic" in q:
            matched = ["SEO & Performance Optimization"]
        elif "app" in q or "mobile" in q or "ios" in q or "android" in q:
            matched = ["Custom Software & Mobile Solutions"]
        elif "design" in q or "ui" in q or "ux" in q:
            matched = ["UI/UX & Web Design"]
        elif "brand" in q or "logo" in q:
            matched = ["Branding & Visual Identity"]
        elif "content" in q or "copy" in q:
            matched = ["Copywriting & Content Strategy"]

        focus = matched_template["focus"] if matched_template else "Digital Modernization & Online Sales Conversion"
        gap = matched_template["digital_gap"] if matched_template else "Missing or Sub-optimal Web Presence"

        return ParsedSearchCriteria(
            country=final_country,
            city=final_city,
            industry=industry,
            opportunity_focus=focus,
            digital_gap=gap,
            priority="High",
            matched_services=matched
        )

    @classmethod
    async def analyze_business(
        cls,
        business_name: str,
        industry: str,
        country: str,
        city: Optional[str],
        has_website: bool,
        website_status: str,
        phone: Optional[str],
        email: Optional[str],
        audit_evidence: List[str],
        missing_features: List[str],
        opportunity_score: int,
        data_mode: str = "REAL_FREE",
        provider: str = "OLLAMA",
        gemini_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        ollama_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes qualitative AI reasoning across selected provider with fast automatic fallback.
        Enforces a 3.5s per-lead timeout so search discovery responses return in sub-second to low single-digit seconds.
        """
        prov = (provider or "OLLAMA").upper().strip()

        # Deterministic baseline values
        fallback_reasoning = f"{business_name} in {city or country} lacks a modernized digital presence, making it a prime candidate for DevArcher digital and web solutions."
        fallback_service = "Full-Stack Web Development" if not has_website else "SEO & Performance Optimization"
        fallback_hook = f"Help {business_name} capture lost local market share with a high-performance modern web application."
        fallback_urgency = "High" if not has_website else "Medium"

        if prov == "DEMO":
            return {
                "ai_analyzed": False,
                "ai_provider": "Deterministic Rule Engine",
                "ai_model": "Deterministic Rule Engine",
                "reasoning": fallback_reasoning,
                "recommended_service": fallback_service,
                "outreach_hook": fallback_hook,
                "urgency": fallback_urgency,
                "fallback_triggered": True
            }

        prompt = f"""You are OPPARCH AI, a business opportunity analyst for DevArcher.
Analyze this business and evaluate its digital modernization needs:
Business: {business_name} | Industry: {industry} | Location: {city or ''}, {country}
Has Website: {has_website} ({website_status}) | Phone: {phone or 'Not listed'}
Evidence: {'; '.join(audit_evidence) if audit_evidence else 'None'} | Missing: {'; '.join(missing_features) if missing_features else 'None'} | Score: {opportunity_score}/100

Return ONLY valid JSON:
{{"reasoning": "2-3 sentence explanation", "recommended_service": "Service Name", "outreach_hook": "1 sentence hook", "urgency": "High|Medium|Low"}}
"""
        try:
            import asyncio
            json_res = await asyncio.wait_for(
                cls.generate_json(
                    prompt=prompt,
                    provider=prov,
                    gemini_key=gemini_key,
                    openai_key=openai_key,
                    ollama_model=ollama_model,
                    temperature=0.2
                ),
                timeout=3.5
            )

            data = json_res.get("json")
            if data and isinstance(data, dict) and "reasoning" in data:
                return {
                    "ai_analyzed": True,
                    "ai_provider": json_res.get("provider_used", prov),
                    "ai_model": json_res.get("provider_used", prov),
                    "reasoning": data.get("reasoning", fallback_reasoning),
                    "recommended_service": data.get("recommended_service", fallback_service),
                    "outreach_hook": data.get("outreach_hook", fallback_hook),
                    "urgency": data.get("urgency", fallback_urgency),
                    "fallback_triggered": json_res.get("fallback_triggered", False)
                }
        except Exception as e:
            logger.debug(f"[AIProvider] Fast AI analysis timeout or error: {e}")

        # Instant explainable fallback
        return {
            "ai_analyzed": False,
            "ai_provider": "Deterministic Rule Engine (Fallback)",
            "ai_model": "Deterministic Rule Engine (Fallback)",
            "reasoning": fallback_reasoning,
            "recommended_service": fallback_service,
            "outreach_hook": fallback_hook,
            "urgency": fallback_urgency,
            "fallback_triggered": True
        }
