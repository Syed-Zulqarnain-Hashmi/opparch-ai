import pytest
from app.scoring.scoring_engine import OpportunityScoringEngine
from app.scoring.service_matcher import ServiceMatcher

def test_explainable_scoring_missing_website():
    score, priority, breakdown, reasoning = OpportunityScoringEngine.calculate_score(
        has_website=False,
        website_status="MISSING",
        social_presence={"instagram": "@testbiz"},
        missing_features=["Business Website", "Mobile Layout", "Online Booking"],
        page_speed="SLOW",
        seo_quality="POOR",
        ux_rating="POOR",
        industry="Restaurants"
    )
    
    assert score >= 90
    assert priority == "VERY_HIGH"
    assert breakdown["website_gap_score"] >= 25
    assert breakdown["business_activity_score"] >= 8
    assert "website" in reasoning.lower()

def test_service_matcher_missing_website():
    matches = ServiceMatcher.match_services(
        has_website=False,
        website_status="MISSING",
        mobile_friendly=False,
        page_speed="SLOW",
        seo_quality="POOR",
        ux_rating="POOR",
        missing_features=["Business Website"],
        industry="Restaurants"
    )
    
    assert len(matches) >= 2
    service_ids = [m["service_id"] for m in matches]
    assert "the-archer" in service_ids or "web-development" in service_ids
