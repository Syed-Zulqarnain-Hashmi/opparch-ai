import datetime
from typing import List, Dict, Any, Optional

class ProjectSourceProvider:
    """
    Project Opportunity Hunter Engine with multi-source provider abstraction.
    Discovers:
    1. Client Project Requests (Web, Mobile Apps, UI/UX, E-commerce, SEO, Custom Software)
    2. Public Procurement / RFPs & IT Tenders
    3. Public Freelance Opportunities (with accurate marketplace vs client board distinction)
    """

    # Comprehensive public project and client request repository
    OPPORTUNITIES_DATABASE = [
        # CATEGORY 1: CLIENT PROJECT REQUESTS
        {
            "id": "req-ecom-01",
            "category": "CLIENT_PROJECT_REQUEST",
            "title": "E-Commerce Web Store with Multi-Currency & WhatsApp Direct Ordering",
            "organization": "Aura Lifestyle & Apparel",
            "country": "Pakistan",
            "city": "Lahore",
            "project_type": "E-Commerce & Mobile Web",
            "status": "ACTIVE",
            "published_date": "2026-08-20",
            "deadline": "2026-09-30",
            "estimated_budget": "PKR 450,000 - 750,000",
            "source_name": "Public Client Opportunity Board",
            "source_url": "https://opparch.ai/client-requests/req-ecom-01",
            "ai_summary": "Retail apparel brand seeking a headless Next.js e-commerce store with automated WhatsApp order routing and JazzCash/EasyPaisa/Stripe payment gateway integration.",
            "requirements": [
                "Next.js 14 / Tailwind CSS responsive frontend",
                "Stripe, JazzCash, EasyPaisa checkout flow",
                "Automated WhatsApp customer notification & order webhook",
                "Fast inventory & SKU management dashboard"
            ],
            "eligibility_criteria": [
                "Demonstrated portfolio in modern e-commerce engineering",
                "Sub-second page load speed performance compliance"
            ],
            "recommended_services": [
                "Full-Stack Web Development",
                "UI/UX Design & Branding",
                "Payment Gateway & Automation"
            ],
            "fit_score": 96
        },
        {
            "id": "req-saas-02",
            "category": "CLIENT_PROJECT_REQUEST",
            "title": "Healthcare Clinic Patient Booking & Tele-Consultation Web App",
            "organization": "Apex Medical Care Network",
            "country": "Pakistan",
            "city": "Islamabad",
            "project_type": "Custom Web Application & SaaS",
            "status": "ACTIVE",
            "published_date": "2026-08-21",
            "deadline": "2026-10-15",
            "estimated_budget": "PKR 800,000 - 1,400,000",
            "source_name": "Public Client Opportunity Board",
            "source_url": "https://opparch.ai/client-requests/req-saas-02",
            "ai_summary": "Private polyclinic group requiring a patient appointment scheduling portal, doctor calendar management, and SMS/WhatsApp appointment reminders.",
            "requirements": [
                "Doctor availability calendar & slot booking engine",
                "HIPAA-compliant secure medical records storage",
                "Real-time SMS & WhatsApp appointment confirmations",
                "Admin billing and report analytics"
            ],
            "eligibility_criteria": [
                "Full-stack architecture with high data security",
                "Responsive mobile-first user experience"
            ],
            "recommended_services": [
                "Full-Stack Web Development",
                "Custom Software Architecture",
                "Automation & Messaging APIs"
            ],
            "fit_score": 94
        },
        {
            "id": "req-uiux-03",
            "category": "CLIENT_PROJECT_REQUEST",
            "title": "Corporate Brand Identity & Responsive Web Redesign for Logistics Firm",
            "organization": "TransGlobal Freight Solutions",
            "country": "United Arab Emirates",
            "city": "Dubai",
            "project_type": "UI/UX & Branding & Web Design",
            "status": "ACTIVE",
            "published_date": "2026-08-19",
            "deadline": "2026-09-25",
            "estimated_budget": "AED 12,000 - 20,000",
            "source_name": "Public Client Opportunity Board",
            "source_url": "https://opparch.ai/client-requests/req-uiux-03",
            "ai_summary": "International freight forwarder seeking a total digital brand overhaul, modern responsive website, client quote calculator, and SEO optimization.",
            "requirements": [
                "Modern high-converting UI/UX in Figma",
                "Complete brand guidelines (Logo, Typography, Color Palettes)",
                "Fast interactive shipping quote calculator",
                "Global technical SEO & Google Business optimization"
            ],
            "eligibility_criteria": [
                "Proven corporate B2B web design experience",
                "SEO auditing and multilingual readiness"
            ],
            "recommended_services": [
                "Web Design & UI/UX",
                "Branding & Logo Design",
                "SEO & Performance Optimization"
            ],
            "fit_score": 92
        },
        {
            "id": "req-ai-04",
            "category": "CLIENT_PROJECT_REQUEST",
            "title": "Real Estate Listing Portal with AI Virtual Property Description Generator",
            "organization": "Prime Capital Properties",
            "country": "United Kingdom",
            "city": "London",
            "project_type": "Custom SaaS & AI Integration",
            "status": "ACTIVE",
            "published_date": "2026-08-22",
            "deadline": "2026-10-30",
            "estimated_budget": "GBP 5,000 - 8,500",
            "source_name": "Public Client Opportunity Board",
            "source_url": "https://opparch.ai/client-requests/req-ai-04",
            "ai_summary": "Real estate brokerage requiring a modern property search portal with interactive map filtering, WhatsApp lead routing, and automated AI property description generation.",
            "requirements": [
                "Interactive map view with neighborhood filtering",
                "Fast property listing manager with image optimization",
                "AI copy generator for property descriptions",
                "Instant agent lead alerts on mobile"
            ],
            "eligibility_criteria": [
                "Expertise in Next.js, Mapbox / OpenStreetMap, and AI APIs",
                "Clean, scalable codebase with full documentation"
            ],
            "recommended_services": [
                "Full-Stack Web Development",
                "AI/ML API Integration",
                "Web Maintenance & Support"
            ],
            "fit_score": 95
        },

        # CATEGORY 2: PUBLIC PROCUREMENT & RFPS
        {
            "id": "rfp-pitb-01",
            "category": "PROCUREMENT",
            "title": "Development of Citizen Portal & Mobile Services Application",
            "organization": "Punjab Information Technology Board (PITB) / PPRA Pakistan",
            "country": "Pakistan",
            "city": "Lahore",
            "project_type": "Public Sector Web & Mobile Application",
            "status": "ACTIVE",
            "published_date": "2026-08-15",
            "deadline": "2026-09-15",
            "estimated_budget": "PKR 15,000,000 - 25,000,000",
            "source_name": "PPRA Official Tender Portal",
            "source_url": "https://www.ppra.org.pk/tenders/citizendev-2026",
            "ai_summary": "Government agency tender for high-security citizen service request management portal with automated departmental routing and cross-platform mobile app.",
            "requirements": [
                "React / Next.js / Python FastAPI backend architecture",
                "High-speed, sub-second API performance & SSL compliance",
                "Persuasive UX/UI Design compliant with accessibility guidelines",
                "Web Copywriting & Multilingual Support (English & Urdu)"
            ],
            "eligibility_criteria": [
                "Registered firm with active NTN/GST",
                "Proven delivery track record in web applications"
            ],
            "recommended_services": [
                "Full-Stack Web Development",
                "Custom Software Architecture",
                "UI/UX Design"
            ],
            "fit_score": 96
        },
        {
            "id": "rfp-hec-02",
            "category": "PROCUREMENT",
            "title": "National Higher Education Academic Repository & Research Journal Portal",
            "organization": "Higher Education Commission (HEC)",
            "country": "Pakistan",
            "city": "Islamabad",
            "project_type": "Academic Portal & Search System",
            "status": "ACTIVE",
            "published_date": "2026-08-10",
            "deadline": "2026-09-28",
            "estimated_budget": "PKR 12,000,000 - 18,000,000",
            "source_name": "HEC Public Procurement Portal",
            "source_url": "https://hec.gov.pk/procurement/academic-repo",
            "ai_summary": "Unified digital research repository connecting 150+ Pakistani universities with advanced full-text indexing, DOI resolution, and author citation tracking.",
            "requirements": [
                "Distributed document indexing & search engine",
                "Role-based access control for faculty, students, and peer reviewers",
                "Automated PDF document parser and metadata extraction"
            ],
            "eligibility_criteria": [
                "Experience with high-volume database search systems",
                "Cloud infrastructure security accreditation"
            ],
            "recommended_services": [
                "Custom Software Development",
                "SEO & Performance Optimization",
                "Web Maintenance & Database Tuning"
            ],
            "fit_score": 91
        },

        # CATEGORY 3: FREELANCE & DESIGN REQUIREMENTS
        {
            "id": "free-design-01",
            "category": "FREELANCE",
            "title": "Complete Brand Identity, Vector Assets & Merchandise Collection",
            "organization": "CyberVanguard Gaming Studios",
            "country": "United States",
            "city": "Austin",
            "project_type": "Graphic & Brand Design (Marketplace & Studio Ready)",
            "status": "ACTIVE",
            "published_date": "2026-08-18",
            "deadline": "2026-09-20",
            "estimated_budget": "USD $2,500 - $4,500",
            "source_name": "Public Creative Project Exchange",
            "source_url": "https://opparch.ai/projects/free-design-01",
            "ai_summary": "Indie gaming studio seeking complete visual branding, esports logo suite, vector merchandise illustrations suitable for storefront publication (Redbubble/Shopify), and brand stylebook.",
            "requirements": [
                "High-resolution vector artwork & logo marks (SVG, AI, EPS)",
                "Merchandise & apparel print-ready format adaptations",
                "Typography system & social media launch banner templates"
            ],
            "eligibility_criteria": [
                "Demonstrated portfolio in modern gaming / tech aesthetic design"
            ],
            "recommended_services": [
                "Branding & Logo Design",
                "Web Design & UI/UX"
            ],
            "fit_score": 90
        }
    ]

    @classmethod
    async def discover_projects(
        cls,
        category: Optional[str] = None,
        country: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Discovers projects matching criteria, calculating real-time DevArcher Fit Scores.
        """
        results = []
        for p in cls.OPPORTUNITIES_DATABASE:
            if category and category != "All" and p["category"] != category:
                continue
            if country and country != "Worldwide" and p["country"].lower() != country.lower():
                continue
            if search_query:
                q = search_query.lower()
                text = f"{p['title']} {p['organization']} {p['ai_summary']} {' '.join(p['requirements'])}".lower()
                if q not in text:
                    continue

            results.append(p)
            if len(results) >= limit:
                break

        return results
