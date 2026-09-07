import pytest
from app.core.location_registry import LocationRegistry, CITY_TO_COUNTRY_MAP
from app.providers.search_provider import SearchProvider
from app.providers.ai_provider import AIProvider

def test_canonical_city_to_country_mappings():
    # Test strict canonical city resolution required by system specs
    assert LocationRegistry.get_country_by_city("Islamabad") == "Pakistan"
    assert LocationRegistry.get_country_by_city("Lahore") == "Pakistan"
    assert LocationRegistry.get_country_by_city("Karachi") == "Pakistan"
    assert LocationRegistry.get_country_by_city("Delhi") == "India"
    assert LocationRegistry.get_country_by_city("New Delhi") == "India"
    assert LocationRegistry.get_country_by_city("Mumbai") == "India"
    assert LocationRegistry.get_country_by_city("Dubai") == "UAE"
    assert LocationRegistry.get_country_by_city("Riyadh") == "Saudi Arabia"
    assert LocationRegistry.get_country_by_city("London") == "UK"
    assert LocationRegistry.get_country_by_city("New York") == "USA"

def test_city_country_conflict_resolution():
    # If city="Islamabad" and country="India" are passed, city MUST override conflict and return Pakistan!
    country, city = LocationRegistry.resolve_canonical_location(country="India", city="Islamabad")
    assert country == "Pakistan"
    assert city == "Islamabad"

    # If city="Mumbai" and country="Pakistan" are passed, city MUST override conflict and return India!
    country2, city2 = LocationRegistry.resolve_canonical_location(country="Pakistan", city="Mumbai")
    assert country2 == "India"
    assert city2 == "Mumbai"

def test_contact_info_internal_consistency():
    # Pakistan
    pk_info = LocationRegistry.generate_consistent_contact("Pakistan", "Islamabad", "Golden Spoon")
    assert pk_info["phone"].startswith("+92 51")
    assert "Pakistan" in pk_info["address"]
    assert pk_info["email"].endswith(".pk")

    # India
    in_info = LocationRegistry.generate_consistent_contact("India", "Delhi", "Delhi Curries")
    assert in_info["phone"].startswith("+91 11")
    assert "India" in in_info["address"]
    assert in_info["email"].endswith(".in")

    # UAE
    ae_info = LocationRegistry.generate_consistent_contact("UAE", "Dubai", "Modern Bites")
    assert ae_info["phone"].startswith("+971 4")
    assert "UAE" in ae_info["address"]
    assert ae_info["email"].endswith(".ae")

@pytest.mark.asyncio
async def test_natural_language_intent_inference():
    # Natural language query with city Islamabad must infer Pakistan
    res_pk = await AIProvider.parse_search_intent("Find restaurants in Islamabad needing website")
    assert res_pk.country == "Pakistan"
    assert res_pk.city == "Islamabad"

    # Natural language query with city Delhi must infer India
    res_in = await AIProvider.parse_search_intent("Find clinics in Delhi needing online booking")
    assert res_in.country == "India"
    assert res_in.city == "Delhi"

@pytest.mark.asyncio
async def test_search_provider_islamabad_pakistan_integrity():
    businesses = await SearchProvider.discover_businesses(
        country="Pakistan",
        city="Islamabad",
        industry="Restaurants",
        limit=10
    )
    assert len(businesses) > 0
    for biz in businesses:
        assert biz["country"] == "Pakistan"
        assert biz["city"] == "Islamabad"
        assert biz["phone"].startswith("+92")
        assert "Pakistan" in biz["address"]
        assert biz["is_demo_data"] is True
        assert "Demo" in biz["discovery_source"]
