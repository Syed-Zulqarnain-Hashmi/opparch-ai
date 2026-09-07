from typing import Dict, Any, List, Tuple


class OpportunityScoringEngine:
    """
    OPPARCH AI - Opportunity Scoring Engine.
    Score = Sales Opportunity for DevArcher (website / app / SEO services).
    No website = VERY HIGH score (90+). Modern website = LOW score (<=30).
    """

    @staticmethod
    def calculate_score(
        has_website: bool,
        website_status: str,
        social_presence: Dict[str, Any],
        missing_features: List[str],
        page_speed: str,
        seo_quality: str,
        ux_rating: str,
        industry: str,
        target_service: str = ""
    ) -> Tuple[int, str, Dict[str, int], str]:

        target_svc = (target_service or "").lower()
        wants_app = any(k in target_svc for k in ["app", "mobile", "software"])
        wants_web = any(k in target_svc for k in ["web", "development", "design", "archer"])
        wants_seo = "seo" in target_svc

        # 1. Website Gap (max 50) - most important component
        if not has_website or website_status == "MISSING":
            w_gap = 50
        elif website_status in ("BROKEN", "UNREACHABLE"):
            w_gap = 44
        elif website_status == "TIMEOUT":
            w_gap = 40
        elif website_status == "OUTDATED":
            w_gap = 28
        elif website_status == "MODERN":
            w_gap = 4
        else:
            w_gap = 16

        # 2. Digital Weakness (max 20)
        d_weak = 0
        if not has_website:
            d_weak = 20
        else:
            if page_speed == "SLOW":
                d_weak += 8
            elif page_speed == "MODERATE":
                d_weak += 4
            if seo_quality == "POOR":
                d_weak += 8
            elif seo_quality == "MODERATE":
                d_weak += 4
            if missing_features:
                d_weak = min(20, d_weak + len(missing_features) * 2)

        # 3. Service-Target Fit Bonus (max 15)
        svc_bonus = 0
        if wants_web:
            if not has_website or website_status in ("MISSING", "BROKEN", "UNREACHABLE", "TIMEOUT"):
                svc_bonus = 15
            elif website_status == "OUTDATED":
                svc_bonus = 9
            # MODERN website: 0 bonus - low opportunity
        elif wants_app:
            if "Mobile App" in missing_features or not has_website:
                svc_bonus = 15
            else:
                svc_bonus = 6
        elif wants_seo:
            if seo_quality == "POOR":
                svc_bonus = 15
            elif seo_quality == "MODERATE":
                svc_bonus = 8
        else:
            if not has_website:
                svc_bonus = 10

        # 4. Business Activity (max 8)
        has_active_social = bool(
            social_presence.get("instagram") or
            social_presence.get("facebook") or
            social_presence.get("linkedin")
        )
        b_act = 0
        if website_status != "MODERN":
            b_act = 8 if has_active_social else 4
        else:
            b_act = 1

        # 5. UX/Mobile Opportunity (max 7)
        ux_opp = 0
        if not has_website:
            ux_opp = 7
        elif ux_rating == "POOR":
            ux_opp = 7
        elif ux_rating == "NEEDS_IMPROVEMENT":
            ux_opp = 4
        elif ux_rating == "MODERATE":
            ux_opp = 2

        # Total
        total_score = w_gap + d_weak + svc_bonus + b_act + ux_opp
        total_score = max(0, min(100, total_score))

        # Hard cap: modern website = max 30
        if website_status == "MODERN" and has_website:
            total_score = min(total_score, 30)

        # Priority
        if total_score >= 85:
            priority = "VERY_HIGH"
        elif total_score >= 65:
            priority = "HIGH"
        elif total_score >= 40:
            priority = "MEDIUM"
        else:
            priority = "LOW"

        breakdown = {
            "website_gap_score": w_gap,
            "digital_weakness_score": d_weak,
            "service_fit_bonus": svc_bonus,
            "business_activity_score": b_act,
            "ux_opportunity_score": ux_opp,
            "social_presence_score": b_act,
            "ecommerce_opportunity_score": 0,
            "mobile_opportunity_score": ux_opp,
            "branding_opportunity_score": 0,
        }

        reasons = []
        if not has_website or website_status == "MISSING":
            reasons.append("No official website detected - maximum opportunity for web/app development.")
        elif website_status in ("BROKEN", "UNREACHABLE"):
            reasons.append("Website is broken or unreachable - urgent rebuild opportunity.")
        elif website_status == "TIMEOUT":
            reasons.append("Website timed out - hosting and performance issues require urgent attention.")
        elif website_status == "OUTDATED":
            reasons.append("Website is outdated - redesign and modernization opportunity.")
        elif website_status == "MODERN":
            reasons.append("Business has a modern website - low web-dev opportunity.")
        if svc_bonus >= 12:
            reasons.append("Strong match for the selected target service.")
        if d_weak >= 14:
            reasons.append("Significant SEO and performance weaknesses found.")

        reasoning_summary = " ".join(reasons) or "Digital opportunity assessed from public sources."
        return total_score, priority, breakdown, reasoning_summary
