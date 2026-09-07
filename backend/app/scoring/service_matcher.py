from typing import List, Dict, Any
from app.core.config import settings

class ServiceMatcher:
    """
    Matches business digital gaps and project requirements to the OPPARCH AI generic services catalog.
    """
    
    @staticmethod
    def match_services(
        has_website: bool,
        website_status: str,
        mobile_friendly: bool,
        page_speed: str,
        seo_quality: str,
        ux_rating: str,
        missing_features: List[str],
        industry: str
    ) -> List[Dict[str, Any]]:
        
        matches = []
        
        # Rule 1: Missing website -> Full-Stack Web Development + Branding
        if not has_website or website_status == "MISSING":
            matches.append({
                "service_id": "web-development",
                "service_name": "Full-Stack Web Development",
                "fit_rank": 1,
                "match_confidence": 95,
                "match_reason": "No active web footprint detected. A complete custom website (Design + Code + SEO) is the highest-priority digital opportunity."
            })
            matches.append({
                "service_id": "web-design",
                "service_name": "UI/UX & Web Design",
                "fit_rank": 2,
                "match_confidence": 92,
                "match_reason": "Building a website from scratch requires professional UI/UX design to establish trust and brand credibility."
            })
            matches.append({
                "service_id": "branding-logo",
                "service_name": "Branding & Visual Identity",
                "fit_rank": 3,
                "match_confidence": 85,
                "match_reason": "New digital rollout requires cohesive logo design, brand guidelines, and visual identity."
            })
            return matches

        # Rule 2: Outdated or poor UX site -> Web Design & Web Copy
        if website_status == "OUTDATED" or ux_rating in ["POOR", "NEEDS_IMPROVEMENT"]:
            matches.append({
                "service_id": "web-design",
                "service_name": "UI/UX & Web Design",
                "fit_rank": 1,
                "match_confidence": 94,
                "match_reason": "Current website design lags behind modern industry standards. A responsive redesign is needed to convert visitors into buyers."
            })
            matches.append({
                "service_id": "web-copy",
                "service_name": "Copywriting & Content Strategy",
                "fit_rank": 2,
                "match_confidence": 88,
                "match_reason": "Cluttered or non-compelling content structure. Clear value messaging required to drive conversions."
            })

        # Rule 3: Slow speed or poor SEO -> SEO & Performance Optimization
        if page_speed in ["SLOW", "MODERATE"] or seo_quality in ["POOR", "MODERATE"]:
            matches.append({
                "service_id": "seo-performance",
                "service_name": "SEO & Performance Optimization",
                "fit_rank": len(matches) + 1,
                "match_confidence": 90,
                "match_reason": "Sub-optimal page load speed and search visibility are reducing organic customer acquisition."
            })

        # Rule 4: Mobile App & Custom Solutions (Mobile App Development)
        mobile_industries = ["Restaurants", "Medical Stores", "Clinics", "Salons", "Barbers", "Gyms", "Real Estate", "Clothing Brands", "Fashion", "E-commerce", "Retail", "Hotels"]
        if industry in mobile_industries or any(feat in ["E-commerce Store", "Online Ordering", "Appointment Booking", "Mobile App", "Customer Portal"] for feat in missing_features):
            matches.append({
                "service_id": "mobile-app-development",
                "service_name": "Mobile App Development",
                "fit_rank": 1 if any("app" in f.lower() or "order" in f.lower() or "book" in f.lower() for f in missing_features) else len(matches) + 1,
                "match_confidence": 93,
                "match_reason": f"High customer engagement industry ({industry}). A dedicated mobile app (iOS & Android) enables direct customer ordering, push notifications, and client retention."
            })

            matches.append({
                "service_id": "custom-software-mobile",
                "service_name": "Custom Software & Mobile Solutions",
                "fit_rank": len(matches) + 1,
                "match_confidence": 91,
                "match_reason": f"Business currently lacks automated digital channels ({', '.join([f for f in missing_features if 'Booking' in f or 'Store' in f or 'Ordering' in f or 'App' in f]) or 'Digital ordering & booking portal'})."
            })

        # Rule 5: Default fallback maintenance
        if not matches:
            matches.append({
                "service_id": "web-maintenance",
                "service_name": "Maintenance & Ongoing Support",
                "fit_rank": 1,
                "match_confidence": 80,
                "match_reason": "Existing web assets require ongoing maintenance, security updates, and performance tuning."
            })

        matches.sort(key=lambda x: x["fit_rank"])
        return matches
