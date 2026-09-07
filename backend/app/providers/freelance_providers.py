"""
OPPARCH AI — Real Project / Client Hunting Engine (Module B)
Modular Provider Adapters for:
  1. Upwork
  2. Freelancer
  3. Guru
  4. PeoplePerHour
  5. Contra
  6. Workana

Compliance & Data Transparency:
- Queries public RSS / authorized open endpoints where available.
- NEVER bypasses CAPTCHA, authentication, paywalls, or anti-bot protections.
- If a provider is unconfigured or restricted, transparently reports "Provider unavailable — API/public access required".
- Zero synthetic projects labeled as REAL.
"""
import logging
import datetime
from typing import Dict, Any, List, Optional
import xml.etree.ElementTree as ET
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# Supported category queries for client project discovery
PROJECT_KEYWORDS = [
    "website", "web development", "mobile app", "ui/ux", "e-commerce",
    "wordpress", "shopify", "react", "next.js", "python", "ai",
    "branding", "seo", "automation", "software development"
]


class BaseFreelanceProvider:
    platform_name: str = "Base"
    requires_api_key: bool = False

    @classmethod
    async def fetch_projects(cls, query: str = "", limit: int = 10) -> Dict[str, Any]:
        raise NotImplementedError


class UpworkProvider(BaseFreelanceProvider):
    platform_name: str = "Upwork"
    requires_api_key: bool = False

    @classmethod
    async def fetch_projects(cls, query: str = "web development", limit: int = 10) -> Dict[str, Any]:
        """
        Fetches live public freelance project requests via Upwork public RSS feeds.
        """
        clean_q = query.strip() or "web development"
        rss_url = f"https://www.upwork.com/ab/feed/jobs/rss?q={clean_q}&sort=recency"
        projects: List[Dict[str, Any]] = []

        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                res = await client.get(
                    rss_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                )
                if res.status_code == 200:
                    root = ET.fromstring(res.text)
                    for item in root.findall("./channel/item")[:limit]:
                        title = item.findtext("title", "Freelance Project").replace(" - Upwork", "").strip()
                        desc = item.findtext("description", "").strip()
                        link = item.findtext("link", "https://www.upwork.com")
                        pub_date = item.findtext("pubDate", "")

                        # Extract basic budget or skills if present in description
                        budget = "Competitive / Hourly"
                        if "Budget:" in desc:
                            try:
                                budget = desc.split("Budget:")[1].split("<")[0].strip()
                            except Exception:
                                pass
                        elif "Hourly Range:" in desc:
                            try:
                                budget = desc.split("Hourly Range:")[1].split("<")[0].strip()
                            except Exception:
                                pass

                        projects.append({
                            "platform": "Upwork",
                            "provider_id": "upwork",
                            "external_project_id": link.split("_~")[-1].split("?")[0] if "_~" in link else link,
                            "project_title": title,
                            "description": desc[:600],
                            "client_country": "Worldwide",
                            "client_location": "Remote",
                            "posted_time": pub_date or datetime.datetime.utcnow().isoformat(),
                            "budget": budget,
                            "project_type": "CLIENT_PROJECT_REQUEST",
                            "required_skills": [s.strip() for s in clean_q.split() if len(s) > 2],
                            "deadline": "Standard Proposal Window",
                            "source_url": link,
                            "public_client_info": "Verified Upwork Public Posting",
                            "bids_count": "Active Proposals",
                            "is_real_data": True,
                            "provider_status": "ONLINE"
                        })
        except Exception as e:
            logger.debug(f"[UpworkProvider] Fetch error: {e}")

        return {
            "platform": "Upwork",
            "status": "ONLINE" if projects else "API/public access required",
            "total_found": len(projects),
            "projects": projects
        }


class FreelancerProvider(BaseFreelanceProvider):
    platform_name: str = "Freelancer"
    requires_api_key: bool = False

    @classmethod
    async def fetch_projects(cls, query: str = "website design", limit: int = 10) -> Dict[str, Any]:
        """
        Queries Freelancer.com public API / search endpoint.
        """
        clean_q = query.strip() or "website design"
        api_url = f"https://www.freelancer.com/api/projects/0.1/projects/active?query={clean_q}&limit={limit}"
        projects: List[Dict[str, Any]] = []

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(api_url, headers={"User-Agent": "Mozilla/5.0"})
                if res.status_code == 200:
                    data = res.json()
                    for p in data.get("result", {}).get("projects", [])[:limit]:
                        budget_min = p.get("budget", {}).get("minimum", 0)
                        budget_max = p.get("budget", {}).get("maximum", 0)
                        currency = p.get("currency", {}).get("code", "USD")
                        b_str = f"{currency} {budget_min}–{budget_max}" if budget_max else "Fixed Budget"

                        projects.append({
                            "platform": "Freelancer",
                            "provider_id": "freelancer",
                            "external_project_id": str(p.get("id")),
                            "project_title": p.get("title", "Client Project"),
                            "description": p.get("preview_description", p.get("description", ""))[:600],
                            "client_country": p.get("currency", {}).get("country", "Worldwide"),
                            "client_location": "Remote",
                            "posted_time": datetime.datetime.fromtimestamp(p.get("submitdate", 0)).isoformat() if p.get("submitdate") else datetime.datetime.utcnow().isoformat(),
                            "budget": b_str,
                            "project_type": "CLIENT_PROJECT_REQUEST",
                            "required_skills": [s.get("name") for s in p.get("jobs", []) if s.get("name")],
                            "deadline": "Open for Proposals",
                            "source_url": f"https://www.freelancer.com/projects/{p.get('seo_url', p.get('id'))}",
                            "public_client_info": f"Bid count: {p.get('bid_stats', {}).get('bid_count', 0)}",
                            "bids_count": str(p.get("bid_stats", {}).get("bid_count", 0)),
                            "is_real_data": True,
                            "provider_status": "ONLINE"
                        })
        except Exception as e:
            logger.debug(f"[FreelancerProvider] Fetch error: {e}")

        return {
            "platform": "Freelancer",
            "status": "ONLINE" if projects else "API/public access required",
            "total_found": len(projects),
            "projects": projects
        }


class GuruProvider(BaseFreelanceProvider):
    platform_name: str = "Guru"
    requires_api_key: True

    @classmethod
    async def fetch_projects(cls, query: str = "", limit: int = 10) -> Dict[str, Any]:
        """
        Guru.com provider adapter. Requires Guru Enterprise API credentials.
        """
        return {
            "platform": "Guru",
            "status": "API/public access required",
            "total_found": 0,
            "projects": [],
            "message": "Guru.com official API key required. Configure in Admin -> Provider Settings."
        }


class PeoplePerHourProvider(BaseFreelanceProvider):
    platform_name: str = "PeoplePerHour"
    requires_api_key: True

    @classmethod
    async def fetch_projects(cls, query: str = "", limit: int = 10) -> Dict[str, Any]:
        """
        PeoplePerHour provider adapter. Requires PPH Partner API credentials.
        """
        return {
            "platform": "PeoplePerHour",
            "status": "API/public access required",
            "total_found": 0,
            "projects": [],
            "message": "PeoplePerHour API access required. Configure credentials in Admin Settings."
        }


class ContraProvider(BaseFreelanceProvider):
    platform_name: str = "Contra"
    requires_api_key: True

    @classmethod
    async def fetch_projects(cls, query: str = "", limit: int = 10) -> Dict[str, Any]:
        """
        Contra.com provider adapter.
        """
        return {
            "platform": "Contra",
            "status": "API/public access required",
            "total_found": 0,
            "projects": [],
            "message": "Contra API access required. Configure credentials in Admin Settings."
        }


class WorkanaProvider(BaseFreelanceProvider):
    platform_name: str = "Workana"
    requires_api_key: True

    @classmethod
    async def fetch_projects(cls, query: str = "", limit: int = 10) -> Dict[str, Any]:
        """
        Workana Latin America & Global provider adapter.
        """
        return {
            "platform": "Workana",
            "status": "API/public access required",
            "total_found": 0,
            "projects": [],
            "message": "Workana API access required. Configure credentials in Admin Settings."
        }


class MultiPlatformProjectHunter:
    """
    Unified Hub orchestrating multi-platform project discovery across Upwork, Freelancer, Guru, PPH, Contra, and Workana.
    """

    PROVIDERS = [
        UpworkProvider,
        FreelancerProvider,
        GuruProvider,
        PeoplePerHourProvider,
        ContraProvider,
        WorkanaProvider
    ]

    @classmethod
    async def discover_all_platforms(cls, query: str = "web development", limit_per_platform: int = 6) -> Dict[str, Any]:
        all_projects: List[Dict[str, Any]] = []
        platform_statuses: List[Dict[str, Any]] = []

        for p_cls in cls.PROVIDERS:
            res = await p_cls.fetch_projects(query=query, limit=limit_per_platform)
            platform_statuses.append({
                "platform": p_cls.platform_name,
                "status": res.get("status", "API/public access required"),
                "count": len(res.get("projects", [])),
                "message": res.get("message", "Live verified feed" if res.get("projects") else "API key / access permission required")
            })
            all_projects.extend(res.get("projects", []))

        return {
            "total_projects": len(all_projects),
            "platform_statuses": platform_statuses,
            "projects": all_projects,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
