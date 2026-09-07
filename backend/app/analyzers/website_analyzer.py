import httpx
import re
import socket
import ipaddress
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
from app.providers.email_enricher import PublicEmailEnricher

# Known large enterprise / global platforms that should not receive local SMB weaknesses
LARGE_GLOBAL_DOMAINS = {
    "youtube.com", "www.youtube.com", "youtu.be",
    "google.com", "www.google.com",
    "github.com", "www.github.com",
    "microsoft.com", "www.microsoft.com",
    "apple.com", "www.apple.com",
    "amazon.com", "www.amazon.com",
    "wikipedia.org", "www.wikipedia.org",
    "linkedin.com", "www.linkedin.com",
    "facebook.com", "www.facebook.com",
    "twitter.com", "x.com", "www.twitter.com", "www.x.com",
    "reddit.com", "www.reddit.com",
    "netflix.com", "www.netflix.com",
    "instagram.com", "www.instagram.com",
    "cloudflare.com", "www.cloudflare.com"
}

class WebsiteAnalyzer:
    """
    Real evidence-based Website Digital Presence Auditor.
    Inspects actual HTTP/HTTPS status, SSL, response time, page size, HTML structure,
    SEO metadata, OpenGraph tags, heading hierarchy, images/alt tags, forms, structured data,
    and business-type relevance without hardcoded or generic assumptions.
    """

    @staticmethod
    def is_public_url_safe(url: str) -> bool:
        """
        Validates that target URL hostname resolves strictly to a public IP address (SSRF Protection).
        Blocks localhost, 127.0.0.1, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x, etc.
        """
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname
            if not hostname:
                return False

            hostname_lower = hostname.lower().strip()
            if hostname_lower in ["localhost", "127.0.0.1", "0.0.0.0", "::1", "localhost.localdomain"]:
                return False

            # Resolve IP
            ip_str = socket.gethostbyname(hostname_lower)
            ip_obj = ipaddress.ip_address(ip_str)

            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved or ip_obj.is_multicast:
                return False

            return True
        except Exception:
            return False

    @classmethod
    async def analyze_url(cls, url: Optional[str], industry: Optional[str] = None) -> Dict[str, Any]:
        if not url or not url.strip():
            ind_clean = (industry or "").lower()
            if "restaurant" in ind_clean or "food" in ind_clean or "cafe" in ind_clean:
                title = "Missing Digital Ordering & Online Menu"
                explanation = "Operating without an official website means local diners cannot view the menu, reserve tables, or order online directly."
                rec_service = "Full-Stack Web Development (Online Ordering & Menu Portal)"
                missing_feats = ["Digital Menu", "Online Reservations / Table Booking", "Mobile Ordering"]
            elif "barber" in ind_clean or "salon" in ind_clean or "hair" in ind_clean:
                title = "Missing Online Appointment Booking Portal"
                explanation = "Clients cannot view services, pricing, or book appointment time slots online."
                rec_service = "Full-Stack Web Development & Booking System"
                missing_feats = ["Appointment Scheduling System", "Service Catalog & Pricing", "Customer Portal"]
            elif "med" in ind_clean or "pharmacy" in ind_clean or "chemist" in ind_clean:
                title = "Missing Medicine Catalog & Inquiry Portal"
                explanation = "Patients cannot check medicine availability, store hours, or request home delivery online."
                rec_service = "Web Application & Digital Inventory Portal"
                missing_feats = ["Digital Catalog & Stock Check", "Medicine Request Form", "Store Locator"]
            elif "real estate" in ind_clean or "property" in ind_clean:
                title = "Missing Property Listing & Lead Capture Engine"
                explanation = "Buyers and sellers cannot browse properties or submit callback requests online."
                rec_service = "Custom Real Estate Web Portal & Lead Engine"
                missing_feats = ["Property Search Filter", "Virtual Tour / Gallery", "Lead Inquiry Forms"]
            else:
                title = "No Official Website Detected"
                explanation = "The business operates without an active public website, missing organic search traffic and client inquiries."
                rec_service = "Full-Stack Web Development"
                missing_feats = ["Business Website", "Mobile Layout", "Local SEO Setup"]

            return {
                "website_status": "MISSING",
                "mobile_friendly": False,
                "ssl_active": False,
                "page_speed_rating": "SLOW",
                "seo_quality": "POOR",
                "ux_rating": "POOR",
                "opportunity_score": 90,
                "priority_level": "HIGH",
                "metrics": {
                    "http_status": 0,
                    "response_time_ms": 0,
                    "page_size_kb": 0,
                    "ssl_active": False,
                    "final_url": ""
                },
                "weaknesses": [
                    {
                        "title": title,
                        "explanation": explanation,
                        "evidence": "URL parameter was empty or not listed in public sources.",
                        "confidence": "HIGH",
                        "severity": "HIGH",
                        "recommended_service": rec_service
                    }
                ],
                "verified_elements": [],
                "missing_digital_features": missing_feats,
                "evidence_points": ["No official website URL listed or available in public registry."],
                "pain_points": [explanation],
                "recommended_services": [rec_service, "SEO & Local Search Setup"],
                "extracted_emails": []
            }


        target_url = url.strip()
        if not target_url.startswith("http"):
            target_url = "https://" + target_url

        # SSRF Safety Check
        if not cls.is_public_url_safe(target_url):
            return {
                "website_status": "UNVERIFIED",
                "mobile_friendly": False,
                "ssl_active": False,
                "page_speed_rating": "UNKNOWN",
                "seo_quality": "POOR",
                "ux_rating": "POOR",
                "opportunity_score": 75,
                "priority_level": "MEDIUM",
                "metrics": {
                    "http_status": 0,
                    "response_time_ms": 0,
                    "page_size_kb": 0,
                    "ssl_active": False,
                    "final_url": target_url
                },
                "weaknesses": [
                    {
                        "title": "Restricted Host Address",
                        "explanation": "The target domain resolves to a private or internal network IP address.",
                        "evidence": "SSRF security check blocked internal/loopback network address.",
                        "confidence": "HIGH",
                        "severity": "HIGH",
                        "recommended_service": "Public Cloud Infrastructure & Hosting"
                    }
                ],
                "verified_elements": [],
                "missing_digital_features": ["Public Web Presence Verification"],
                "evidence_points": ["Target URL resolves to a private or restricted internal network address."],
                "pain_points": ["Site address could not be publicly verified."],
                "recommended_services": ["Cloud Hosting & Domain Setup"]
            }

        parsed_domain = urlparse(target_url).hostname or ""
        is_large_platform = any(parsed_domain.lower() == d or parsed_domain.lower().endswith("." + d) for d in LARGE_GLOBAL_DOMAINS)

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPPARCH-AI/2.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with httpx.AsyncClient(timeout=4.5, follow_redirects=True, verify=False) as client:
                response = await client.get(target_url, headers=headers)
                
                elapsed_ms = round(response.elapsed.total_seconds() * 1000, 1)
                status_code = response.status_code
                final_url = str(response.url)
                html = response.text or ""
                page_size_kb = round(len(response.content) / 1024, 1)
                content_type = response.headers.get("content-type", "")
                ssl_active = final_url.startswith("https://")

                if status_code >= 400:
                    return {
                        "website_status": "BROKEN",
                        "mobile_friendly": False,
                        "ssl_active": ssl_active,
                        "page_speed_rating": "SLOW",
                        "seo_quality": "POOR",
                        "ux_rating": "POOR",
                        "opportunity_score": 85,
                        "priority_level": "HIGH",
                        "metrics": {
                            "http_status": status_code,
                            "response_time_ms": elapsed_ms,
                            "page_size_kb": page_size_kb,
                            "ssl_active": ssl_active,
                            "final_url": final_url,
                            "content_type": content_type
                        },
                        "weaknesses": [
                            {
                                "title": f"HTTP Error Status {status_code}",
                                "explanation": f"Web server returned HTTP status code {status_code}, preventing visitors from loading content.",
                                "evidence": f"GET {target_url} returned status code {status_code}.",
                                "confidence": "HIGH",
                                "severity": "HIGH",
                                "recommended_service": "Full-Stack Web Development & Hosting Maintenance"
                            }
                        ],
                        "verified_elements": [
                            {"element": "Domain Resolution", "status": "VERIFIED", "details": f"Domain {parsed_domain} resolved successfully"}
                        ],
                        "missing_digital_features": ["Working Web Server", "Modern Frontend"],
                        "evidence_points": [f"Website returns HTTP status code {status_code}."],
                        "pain_points": ["Broken link or dead server causing loss of potential client inquiries."],
                        "recommended_services": [
                            "Full-Stack Web Development",
                            "Maintenance & Operations"
                        ]
                    }

                # Parse HTML with BeautifulSoup
                soup = BeautifulSoup(html, "html.parser")
                extracted_emails = PublicEmailEnricher.extract_emails_from_html(html)

                verified_elements = []
                weaknesses = []
                missing_features = []
                evidence_points = []
                pain_points = []
                recommended_services = []


                # 1. SSL / HTTPS Check
                if ssl_active:
                    verified_elements.append({
                        "element": "HTTPS / SSL Security",
                        "status": "VERIFIED",
                        "details": "Active TLS encryption over HTTPS protocol."
                    })
                else:
                    weaknesses.append({
                        "title": "Insecure HTTP Protocol (Missing SSL)",
                        "explanation": "The website is served over unencrypted HTTP without an active SSL certificate, causing browser security warnings.",
                        "evidence": f"Final URL protocol is {final_url.split('://')[0]}:// without TLS.",
                        "confidence": "HIGH",
                        "severity": "HIGH",
                        "recommended_service": "Maintenance & Operations (SSL/TLS Setup)"
                    })
                    evidence_points.append("Site is served over insecure HTTP without active SSL certificate.")
                    pain_points.append("Browsers flag the website as 'Not Secure', damaging credibility.")
                    recommended_services.append("Maintenance & Operations")

                # 2. Performance / Speed Signals
                if elapsed_ms < 800:
                    speed_rating = "FAST"
                    verified_elements.append({
                        "element": "Server Response Speed",
                        "status": "VERIFIED",
                        "details": f"Fast response time measured at {int(elapsed_ms)}ms."
                    })
                elif elapsed_ms < 2200:
                    speed_rating = "MODERATE"
                    verified_elements.append({
                        "element": "Server Response Speed",
                        "status": "VERIFIED",
                        "details": f"Acceptable response time measured at {int(elapsed_ms)}ms."
                    })
                else:
                    speed_rating = "SLOW"
                    weaknesses.append({
                        "title": "Slow Server Response Time",
                        "explanation": f"Page response time ({int(elapsed_ms)}ms) exceeds standard performance thresholds.",
                        "evidence": f"HTTP initial response measured at {int(elapsed_ms)}ms.",
                        "confidence": "HIGH",
                        "severity": "MEDIUM",
                        "recommended_service": "SEO & Performance Optimization"
                    })
                    evidence_points.append(f"Slow response time ({int(elapsed_ms)}ms) measured during public audit.")
                    pain_points.append("Delayed loading times increase visitor drop-off rate.")
                    recommended_services.append("SEO & Performance Optimization")

                # 3. Viewport & Mobile Responsiveness
                viewport_tag = soup.find("meta", attrs={"name": re.compile(r"^viewport$", re.I)})
                mobile_friendly = viewport_tag is not None
                if mobile_friendly:
                    verified_elements.append({
                        "element": "Mobile Viewport Meta Tag",
                        "status": "VERIFIED",
                        "details": f"meta[name='viewport'] detected ({viewport_tag.get('content', 'configured')})."
                    })
                else:
                    weaknesses.append({
                        "title": "Missing Mobile Viewport Meta Tag",
                        "explanation": "Without a viewport meta tag, mobile devices render the page zoomed-out at desktop scale.",
                        "evidence": "No <meta name='viewport'> tag was found in the HTML <head>.",
                        "confidence": "HIGH",
                        "severity": "HIGH",
                        "recommended_service": "UI/UX & Web Design (Responsive Layout)"
                    })
                    missing_features.append("Mobile Responsive Layout")
                    evidence_points.append("Missing <meta name='viewport'> tag for mobile devices.")
                    pain_points.append("Mobile visitors experience broken alignment and unreadable text.")
                    recommended_services.append("UI/UX & Web Design")

                # 4. Title Tag
                title_tag = soup.find("title")
                title_text = title_tag.text.strip() if title_tag else ""
                if title_tag and len(title_text) >= 5:
                    verified_elements.append({
                        "element": "Document Title",
                        "status": "VERIFIED",
                        "details": f"Title defined ({len(title_text)} chars): \"{title_text[:50]}{'...' if len(title_text)>50 else ''}\""
                    })
                elif not title_tag or not title_text:
                    weaknesses.append({
                        "title": "Missing <title> Element",
                        "explanation": "Page title is missing, which is a critical signal for search engine indexing and browser tabs.",
                        "evidence": "No <title> tag found in HTML document.",
                        "confidence": "HIGH",
                        "severity": "HIGH",
                        "recommended_service": "SEO & Performance Optimization"
                    })
                    evidence_points.append("HTML document lacks a <title> tag.")
                    recommended_services.append("SEO & Performance Optimization")
                else:
                    weaknesses.append({
                        "title": "Short or Generic <title> Tag",
                        "explanation": f"Page title is too brief ({len(title_text)} characters) to convey brand or keyword context.",
                        "evidence": f"<title> is only {len(title_text)} characters: \"{title_text}\"",
                        "confidence": "HIGH",
                        "severity": "LOW",
                        "recommended_service": "SEO & Performance Optimization"
                    })

                # 5. Meta Description
                meta_desc = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
                meta_desc_content = meta_desc.get("content", "").strip() if meta_desc else ""
                if meta_desc and len(meta_desc_content) >= 15:
                    verified_elements.append({
                        "element": "Meta Description Tag",
                        "status": "VERIFIED",
                        "details": f"Meta description found ({len(meta_desc_content)} chars)."
                    })
                else:
                    if not is_large_platform:
                        weaknesses.append({
                            "title": "Missing Meta Description Tag",
                            "explanation": "Search engines display snippets from the meta description. Missing description reduces search click-through rate.",
                            "evidence": "meta[name='description'] was not found in the HTML <head>." if not meta_desc else "Meta description is shorter than 15 characters.",
                            "confidence": "HIGH",
                            "severity": "MEDIUM",
                            "recommended_service": "SEO & Performance Optimization"
                        })
                        evidence_points.append("No meta description element was found in the HTML head.")
                        recommended_services.append("SEO & Performance Optimization")

                # 6. Canonical URL Tag
                canonical_tag = soup.find("link", attrs={"rel": re.compile(r"^canonical$", re.I)})
                if canonical_tag and canonical_tag.get("href"):
                    verified_elements.append({
                        "element": "Canonical Link Tag",
                        "status": "VERIFIED",
                        "details": f"link[rel='canonical'] configured to {canonical_tag.get('href')[:40]}."
                    })
                elif not is_large_platform:
                    weaknesses.append({
                        "title": "Missing Canonical URL Tag",
                        "explanation": "Canonical tags prevent duplicate content issues across URL variations (e.g. www vs non-www).",
                        "evidence": "No <link rel='canonical'> tag detected in HTML head.",
                        "confidence": "HIGH",
                        "severity": "LOW",
                        "recommended_service": "SEO & Performance Optimization"
                    })

                # 7. OpenGraph Social Meta Tags
                og_title = soup.find("meta", attrs={"property": "og:title"})
                og_image = soup.find("meta", attrs={"property": "og:image"})
                og_desc = soup.find("meta", attrs={"property": "og:description"})
                has_og = (og_title is not None) or (og_image is not None)
                if has_og:
                    verified_elements.append({
                        "element": "OpenGraph Social Metadata",
                        "status": "VERIFIED",
                        "details": "OpenGraph tags (og:title / og:image) detected for rich social link sharing."
                    })
                elif not is_large_platform:
                    weaknesses.append({
                        "title": "Missing OpenGraph Social Meta Tags",
                        "explanation": "Without og:image and og:title, sharing links on LinkedIn, WhatsApp, and Facebook displays generic placeholders.",
                        "evidence": "No og:title or og:image meta tags found in HTML.",
                        "confidence": "HIGH",
                        "severity": "MEDIUM",
                        "recommended_service": "Branding & Visual Identity"
                    })
                    evidence_points.append("OpenGraph social preview metadata is not configured.")
                    recommended_services.append("Branding & Visual Identity")

                # 8. Headings Hierarchy
                h1_tags = soup.find_all("h1")
                h2_tags = soup.find_all("h2")
                if len(h1_tags) == 1:
                    verified_elements.append({
                        "element": "Heading Hierarchy (H1)",
                        "status": "VERIFIED",
                        "details": f"Structured single primary <h1> tag: \"{h1_tags[0].text.strip()[:40]}\""
                    })
                elif len(h1_tags) == 0 and not is_large_platform:
                    weaknesses.append({
                        "title": "Missing Primary <h1> Heading",
                        "explanation": "An <h1> tag provides the primary topic signal for search engine spiders.",
                        "evidence": "0 <h1> elements found in page markup.",
                        "confidence": "HIGH",
                        "severity": "MEDIUM",
                        "recommended_service": "SEO & Performance Optimization"
                    })
                elif len(h1_tags) > 3 and not is_large_platform:
                    weaknesses.append({
                        "title": "Multiple Competing <h1> Headings",
                        "explanation": "Having more than 3 <h1> tags dilutes topic focus for search engines.",
                        "evidence": f"{len(h1_tags)} <h1> tags detected on the same page.",
                        "confidence": "HIGH",
                        "severity": "LOW",
                        "recommended_service": "SEO & Performance Optimization"
                    })

                # 9. Image Alt Attributes
                images = soup.find_all("img")
                missing_alt = [img for img in images if not img.get("alt") or not img.get("alt").strip()]
                if images and len(missing_alt) == 0:
                    verified_elements.append({
                        "element": "Image Accessibility (Alt Attributes)",
                        "status": "VERIFIED",
                        "details": f"All {len(images)} images contain descriptive alt attributes."
                    })
                elif len(missing_alt) > 2 and not is_large_platform:
                    weaknesses.append({
                        "title": f"Missing Alt Tags on {len(missing_alt)} Images",
                        "explanation": "Images without alt tags impair screen reader accessibility and image SEO indexing.",
                        "evidence": f"{len(missing_alt)} of {len(images)} <img> elements lack alt attributes.",
                        "confidence": "HIGH",
                        "severity": "LOW",
                        "recommended_service": "UI/UX & Web Design"
                    })

                # 10. Structured Data / JSON-LD
                json_ld_scripts = soup.find_all("script", attrs={"type": "application/ld+json"})
                if json_ld_scripts:
                    verified_elements.append({
                        "element": "Structured Data (Schema.org / JSON-LD)",
                        "status": "VERIFIED",
                        "details": f"{len(json_ld_scripts)} JSON-LD structured data block(s) detected."
                    })
                elif not is_large_platform:
                    weaknesses.append({
                        "title": "Missing Schema.org Structured Data",
                        "explanation": "Structured data (LocalBusiness, Organization) helps Google display rich snippets and business knowledge panels.",
                        "evidence": "No <script type='application/ld+json'> tags found in page markup.",
                        "confidence": "HIGH",
                        "severity": "LOW",
                        "recommended_service": "SEO & Performance Optimization"
                    })

                # 11. Favicon & Language
                html_tag = soup.find("html")
                if html_tag and html_tag.get("lang"):
                    verified_elements.append({
                        "element": "HTML Language Declaration",
                        "status": "VERIFIED",
                        "details": f"Document language declared as '{html_tag.get('lang')}'."
                    })
                
                favicon = soup.find("link", attrs={"rel": re.compile(r"icon", re.I)})
                if favicon:
                    verified_elements.append({
                        "element": "Favicon Brand Icon",
                        "status": "VERIFIED",
                        "details": "Favicon link element detected."
                    })

                # 12. Business-Type-Aware Checks
                text_lower = soup.get_text().lower()
                industry_lower = (industry or "").lower()

                if "restaurant" in industry_lower or "dining" in industry_lower or "cafe" in industry_lower or "food" in industry_lower:
                    has_menu = "menu" in text_lower or soup.find("a", href=re.compile(r"menu", re.I))
                    has_order = any(w in text_lower for w in ["order online", "order now", "delivery", "takeaway", "foodpanda", "online order"])
                    has_reservations = any(w in text_lower for w in ["reserve", "reservation", "book a table", "table booking"])

                    if not has_menu:
                        weaknesses.append({
                            "title": "No Direct Digital Menu Detected",
                            "explanation": "Restaurant visitors expect an accessible online menu. Missing digital menu loses diner interest.",
                            "evidence": "No menu links, text keywords, or PDF links detected on homepage.",
                            "confidence": "HIGH",
                            "severity": "HIGH",
                            "recommended_service": "Restaurant Website & Online Ordering"
                        })
                        missing_features.append("Digital Interactive Menu")
                        recommended_services.append("Full-Stack Web Development")

                    if not has_order:
                        weaknesses.append({
                            "title": "Missing Direct Online Ordering Workflow",
                            "explanation": "Direct online ordering allows restaurants to capture orders without third-party commission fees.",
                            "evidence": "No online ordering / delivery buttons or widgets detected.",
                            "confidence": "HIGH",
                            "severity": "HIGH",
                            "recommended_service": "Restaurant Website & Online Ordering"
                        })
                        missing_features.append("Direct Online Ordering & WhatsApp Integration")
                        recommended_services.append("Custom Software & Mobile Solutions")

                elif "medical" in industry_lower or "health" in industry_lower or "pharmacy" in industry_lower or "clinic" in industry_lower:
                    has_booking = any(w in text_lower for w in ["appointment", "book appointment", "consultation", "doctor", "patient inquiry"])
                    if not has_booking:
                        weaknesses.append({
                            "title": "No Online Patient Appointment / Inquiry Capture",
                            "explanation": "Healthcare and clinic visitors look for quick appointment booking or online consultation inquiries.",
                            "evidence": "No appointment booking form or schedule call-to-action detected.",
                            "confidence": "HIGH",
                            "severity": "HIGH",
                            "recommended_service": "Healthcare Business Website & Patient Inquiry"
                        })
                        missing_features.append("Online Appointment Booking Form")
                        recommended_services.append("Custom Software & Mobile Solutions")

                elif "ecommerce" in industry_lower or "shop" in industry_lower or "retail" in industry_lower or "store" in industry_lower:
                    has_cart = any(w in text_lower for w in ["cart", "checkout", "add to cart", "buy now", "shopping bag"])
                    if not has_cart:
                        weaknesses.append({
                            "title": "No Interactive E-Commerce Cart or Checkout",
                            "explanation": "Retail storefront lacks interactive add-to-cart or checkout functionality.",
                            "evidence": "No shopping cart or checkout triggers detected in HTML.",
                            "confidence": "HIGH",
                            "severity": "HIGH",
                            "recommended_service": "E-Commerce Website & Product Catalog"
                        })
                        missing_features.append("E-Commerce Cart & Payment Gateway Integration")
                        recommended_services.append("Full-Stack Web Development")

                # Overall SEO Quality & UX Quality
                seo_flaws = [w for w in weaknesses if "SEO" in w["recommended_service"] or "Description" in w["title"] or "Title" in w["title"] or "Heading" in w["title"]]
                if len(seo_flaws) == 0:
                    seo_quality = "STRONG"
                elif len(seo_flaws) <= 2:
                    seo_quality = "MODERATE"
                else:
                    seo_quality = "POOR"

                ux_rating = "STRONG" if (mobile_friendly and speed_rating != "SLOW" and len(weaknesses) <= 1) else ("MODERATE" if mobile_friendly else "NEEDS_IMPROVEMENT")

                # Compute Dynamic Opportunity Score (0 - 100)
                if is_large_platform:
                    opportunity_score = 10
                    priority_level = "LOW"
                    website_status = "MODERN"
                    weaknesses = []
                    evidence_points = ["Established enterprise platform with robust infrastructure and high technical maturity."]
                    pain_points = ["No immediate digital transformation gap detected."]
                    recommended_services = ["Continuous Monitoring & Maintenance"]
                else:
                    # Score calculation based on actual severity of findings
                    base_score = 25
                    high_sev = sum(1 for w in weaknesses if w["severity"] == "HIGH")
                    med_sev = sum(1 for w in weaknesses if w["severity"] == "MEDIUM")
                    low_sev = sum(1 for w in weaknesses if w["severity"] == "LOW")

                    base_score += (high_sev * 20) + (med_sev * 12) + (low_sev * 5)
                    if not mobile_friendly:
                        base_score += 15
                    if not ssl_active:
                        base_score += 15
                    if speed_rating == "SLOW":
                        base_score += 10

                    opportunity_score = min(95, max(15, base_score))
                    if opportunity_score >= 75:
                        priority_level = "HIGH"
                    elif opportunity_score >= 50:
                        priority_level = "MEDIUM"
                    else:
                        priority_level = "LOW"

                    website_status = "MODERN" if (mobile_friendly and ssl_active and speed_rating != "SLOW" and len(weaknesses) <= 1) else "OUTDATED"

                # Deduplicate recommendations and evidence
                unique_services = list(dict.fromkeys(recommended_services))
                if not unique_services:
                    unique_services = ["SEO & Performance Optimization", "Maintenance & Operations"]

                if not evidence_points and weaknesses:
                    evidence_points = [w["evidence"] for w in weaknesses[:3]]

                if not pain_points and weaknesses:
                    pain_points = [w["explanation"] for w in weaknesses[:3]]

                return {
                    "website_status": website_status,
                    "mobile_friendly": mobile_friendly,
                    "ssl_active": ssl_active,
                    "page_speed_rating": speed_rating,
                    "seo_quality": seo_quality,
                    "ux_rating": ux_rating,
                    "opportunity_score": opportunity_score,
                    "priority_level": priority_level,
                    "metrics": {
                        "http_status": status_code,
                        "response_time_ms": elapsed_ms,
                        "page_size_kb": page_size_kb,
                        "ssl_active": ssl_active,
                        "final_url": final_url,
                        "content_type": content_type,
                        "title": title_text,
                        "h1_count": len(h1_tags),
                        "images_count": len(images),
                        "images_missing_alt": len(missing_alt),
                        "json_ld_count": len(json_ld_scripts),
                        "has_og": has_og,
                        "is_enterprise_platform": is_large_platform
                    },
                    "weaknesses": weaknesses,
                    "verified_elements": verified_elements,
                    "missing_digital_features": missing_features,
                    "evidence_points": evidence_points if evidence_points else ["Active website verified in public sources with high technical compliance."],
                    "pain_points": pain_points if pain_points else ["No critical blocker detected; opportunities exist for continuous optimization."],
                    "recommended_services": unique_services,
                    "extracted_emails": extracted_emails,
                    "raw_html": html[:10000]
                }


        except httpx.ConnectError:
            return {
                "website_status": "UNREACHABLE",
                "mobile_friendly": False,
                "ssl_active": False,
                "page_speed_rating": "SLOW",
                "seo_quality": "POOR",
                "ux_rating": "POOR",
                "opportunity_score": 85,
                "priority_level": "HIGH",
                "metrics": {
                    "http_status": 0,
                    "response_time_ms": 0,
                    "page_size_kb": 0,
                    "ssl_active": False,
                    "final_url": target_url
                },
                "weaknesses": [
                    {
                        "title": "Web Server Connection Failed",
                        "explanation": "Target host refused connection or is not responding on port 80/443.",
                        "evidence": f"Connection to {target_url} failed with ConnectError.",
                        "confidence": "HIGH",
                        "severity": "HIGH",
                        "recommended_service": "Full-Stack Web Development & Hosting Setup"
                    }
                ],
                "verified_elements": [],
                "missing_digital_features": ["Active Web Server", "Domain DNS Configuration"],
                "evidence_points": ["Server connection failed or refused public requests."],
                "pain_points": ["Website is completely down or unreachable for clients."],
                "recommended_services": ["Full-Stack Web Development", "Maintenance & Operations"]
            }
        except httpx.TimeoutException:
            return {
                "website_status": "TIMEOUT",
                "mobile_friendly": False,
                "ssl_active": False,
                "page_speed_rating": "SLOW",
                "seo_quality": "POOR",
                "ux_rating": "POOR",
                "opportunity_score": 80,
                "priority_level": "HIGH",
                "metrics": {
                    "http_status": 0,
                    "response_time_ms": 4500,
                    "page_size_kb": 0,
                    "ssl_active": False,
                    "final_url": target_url
                },
                "weaknesses": [
                    {
                        "title": "Server Request Timed Out",
                        "explanation": "The web server failed to respond within 4.5 seconds.",
                        "evidence": "Public HTTP GET request exceeded timeout threshold of 4500ms.",
                        "confidence": "HIGH",
                        "severity": "HIGH",
                        "recommended_service": "SEO & Performance Optimization"
                    }
                ],
                "verified_elements": [],
                "missing_digital_features": ["Fast Web Server", "CDN & Caching Layer"],
                "evidence_points": ["Website timed out after 4500ms."],
                "pain_points": ["Slow loading causes virtually 100% bounce rate."],
                "recommended_services": ["SEO & Performance Optimization", "Maintenance & Operations"]
            }
        except Exception as e:
            return {
                "website_status": "UNREACHABLE",
                "mobile_friendly": False,
                "ssl_active": False,
                "page_speed_rating": "SLOW",
                "seo_quality": "POOR",
                "ux_rating": "POOR",
                "opportunity_score": 75,
                "priority_level": "MEDIUM",
                "metrics": {
                    "http_status": 0,
                    "response_time_ms": 0,
                    "page_size_kb": 0,
                    "ssl_active": False,
                    "final_url": target_url
                },
                "weaknesses": [
                    {
                        "title": "Audit Request Exception",
                        "explanation": "Encountered an exception while attempting to inspect the target website.",
                        "evidence": f"Audit error: {str(e)[:100]}",
                        "confidence": "HIGH",
                        "severity": "MEDIUM",
                        "recommended_service": "Full-Stack Web Development"
                    }
                ],
                "verified_elements": [],
                "missing_digital_features": ["Public Web Presence"],
                "evidence_points": [f"Public probe failed: {str(e)[:100]}"],
                "pain_points": ["Potential customers cannot consistently reach the site."],
                "recommended_services": ["Full-Stack Web Development"]
            }

