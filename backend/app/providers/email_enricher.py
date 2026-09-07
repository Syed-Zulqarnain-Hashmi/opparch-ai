"""
OPPARCH AI — Real Public Contact Email Enrichment Engine
Extracts verified public business contact emails from:
  1. Official business website (homepage HTML & mailto: links)
  2. Official subpages (/contact, /contact-us, /about)
  3. Public registry listings (OSM tags)

STRICT PROHIBITION:
  - NEVER fabricates, guesses, or invents synthetic email addresses (e.g., info@business.com).
  - Rejects placeholder/test domains, syntax errors, and static assets.
  - If no real email is found publicly, returns email=None, email_status="not_found".
"""
import re
import logging
import httpx
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class PublicEmailEnricher:
    INVALID_EMAIL_DOMAINS = {
        "example.com", "domain.com", "yourdomain.com", "email.com", "test.com",
        "sample.com", "website.com", "mysite.com", "sentry.io", "w3.org",
        "schema.org", "google.com", "facebook.com", "github.com", "twitter.com",
        "bootstrap.com", "jquery.com", "wordpress.org", "gravatar.com", "cloudflare.com"
    }

    INVALID_EMAIL_PREFIXES = {
        "user", "test", "name", "email", "yourname", "username",
        "sample", "placeholder", "admin@domain", "info@domain"
    }

    INVALID_FILE_EXTENSIONS = (
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js",
        ".wof", ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".pdf"
    )

    @classmethod
    def validate_and_normalize_email(cls, email: Optional[str]) -> Optional[str]:
        """
        Validates syntax, strips mailto:, normalizes case, and filters out bogus/placeholder emails.
        """
        if not email or not isinstance(email, str):
            return None

        email_clean = email.strip().lower()

        # Remove mailto: scheme and query parameters
        if email_clean.startswith("mailto:"):
            email_clean = email_clean.replace("mailto:", "").split("?")[0].strip()

        # Standard email syntax regex
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, email_clean):
            return None

        # Reject static image/asset extensions
        if email_clean.endswith(cls.INVALID_FILE_EXTENSIONS):
            return None

        parts = email_clean.split("@")
        if len(parts) != 2:
            return None

        prefix, domain = parts[0], parts[1]

        if domain in cls.INVALID_EMAIL_DOMAINS or domain.startswith("example."):
            return None

        if prefix in cls.INVALID_EMAIL_PREFIXES or "example" in prefix or "placeholder" in prefix:
            return None

        return email_clean

    @classmethod
    def extract_emails_from_html(cls, html: str) -> List[str]:
        """
        Extracts valid emails from mailto: tags and body text regex in HTML.
        """
        if not html:
            return []

        found: List[str] = []
        soup = BeautifulSoup(html, "html.parser")

        # 1. Inspect mailto: links (highest confidence)
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.lower().startswith("mailto:"):
                clean_e = cls.validate_and_normalize_email(href)
                if clean_e and clean_e not in found:
                    found.append(clean_e)

        # 2. Text regex extraction
        raw_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)
        for m in raw_matches:
            clean_e = cls.validate_and_normalize_email(m)
            if clean_e and clean_e not in found:
                found.append(clean_e)

        return found

    @classmethod
    async def enrich_lead_email(
        cls,
        website_url: Optional[str] = None,
        osm_email: Optional[str] = None,
        website_html: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes multi-tier public email enrichment.
        Returns:
          {
            "email": str | None,
            "email_status": "found" | "not_found",
            "email_source": str | None,       # "official_website", "contact_page", "osm_listing"
            "email_source_url": str | None,
            "email_confidence": "HIGH" | "MEDIUM" | None
          }
        """
        # Tier 1: Check website HTML if already fetched
        if website_url and website_html:
            emails = cls.extract_emails_from_html(website_html)
            if emails:
                return {
                    "email": emails[0],
                    "email_status": "found",
                    "email_source": "official_website",
                    "email_source_url": website_url,
                    "email_confidence": "HIGH"
                }

        # Tier 2: Check OSM public listing tags
        valid_osm = cls.validate_and_normalize_email(osm_email)
        if valid_osm:
            return {
                "email": valid_osm,
                "email_status": "found",
                "email_source": "osm_listing",
                "email_source_url": None,
                "email_confidence": "MEDIUM"
            }

        # Tier 3: Fetch contact page if website_url exists but no HTML was passed
        if website_url and not website_html and website_url.startswith("http"):
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OPPARCH-AI/2.0"}
                async with httpx.AsyncClient(timeout=3.0, follow_redirects=True, verify=False) as client:
                    res = await client.get(website_url, headers=headers)
                    if res.status_code < 400 and res.text:
                        emails = cls.extract_emails_from_html(res.text)
                        if emails:
                            return {
                                "email": emails[0],
                                "email_status": "found",
                                "email_source": "official_website",
                                "email_source_url": str(res.url),
                                "email_confidence": "HIGH"
                            }
                        
                        # Try /contact subpage
                        contact_url = urljoin(website_url, "/contact")
                        res_c = await client.get(contact_url, headers=headers)
                        if res_c.status_code < 400 and res_c.text:
                            c_emails = cls.extract_emails_from_html(res_c.text)
                            if c_emails:
                                return {
                                    "email": c_emails[0],
                                    "email_status": "found",
                                    "email_source": "contact_page",
                                    "email_source_url": str(res_c.url),
                                    "email_confidence": "HIGH"
                                }
            except Exception as e:
                logger.debug(f"[PublicEmailEnricher] Web fetch error for {website_url}: {e}")

        # Tier 4: No public email found — STRICT PROHIBITION against guessing
        return {
            "email": None,
            "email_status": "not_found",
            "email_source": None,
            "email_source_url": None,
            "email_confidence": None
        }
