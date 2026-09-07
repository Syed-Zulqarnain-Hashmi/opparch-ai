"""
OPPARCH AI — Location & City-Country Registry
Authoritative location resolution engine ensuring country, city, and phone numbers remain internally consistent.
Rules:
  - Islamabad -> Pakistan (+92)
  - Lahore -> Pakistan (+92)
  - Karachi -> Pakistan (+92)
  - Delhi / New Delhi -> India (+91)
  - Mumbai -> India (+91)
  - Dubai / Abu Dhabi -> UAE (+971)
  - London -> UK (+44)
"""
from typing import Tuple, Optional, Dict, Any
import random

# Authoritative City to Country Mapping
CITY_TO_COUNTRY_MAP: Dict[str, str] = {
    # --- PAKISTAN ---
    "islamabad": "Pakistan",
    "lahore": "Pakistan",
    "karachi": "Pakistan",
    "peshawar": "Pakistan",
    "rawalpindi": "Pakistan",
    "faisalabad": "Pakistan",
    "multan": "Pakistan",
    "quetta": "Pakistan",
    "sialkot": "Pakistan",
    "gujranwala": "Pakistan",

    # --- INDIA ---
    "delhi": "India",
    "new delhi": "India",
    "mumbai": "India",
    "bangalore": "India",
    "bengaluru": "India",
    "hyderabad": "India",
    "chennai": "India",
    "kolkata": "India",
    "pune": "India",
    "ahmedabad": "India",
    "jaipur": "India",

    # --- UAE ---
    "dubai": "UAE",
    "abu dhabi": "UAE",
    "sharjah": "UAE",
    "ajman": "UAE",
    "ras al khaimah": "UAE",

    # --- SAUDI ARABIA ---
    "riyadh": "Saudi Arabia",
    "jeddah": "Saudi Arabia",
    "dammam": "Saudi Arabia",
    "mecca": "Saudi Arabia",
    "medina": "Saudi Arabia",
    "khobar": "Saudi Arabia",

    # --- USA ---
    "new york": "USA",
    "los angeles": "USA",
    "california": "USA",
    "chicago": "USA",
    "miami": "USA",
    "san francisco": "USA",
    "houston": "USA",
    "dallas": "USA",
    "seattle": "USA",
    "boston": "USA",
    "atlanta": "USA",
    "denver": "USA",
    "washington": "USA",
    "phoenix": "USA",
    "philadelphia": "USA",
    "san diego": "USA",

    # --- UK ---
    "london": "UK",
    "manchester": "UK",
    "birmingham": "UK",
    "edinburgh": "UK",
    "glasgow": "UK",
    "leeds": "UK",
    "bristol": "UK",
    "liverpool": "UK",

    # --- CANADA ---
    "toronto": "Canada",
    "vancouver": "Canada",
    "montreal": "Canada",
    "calgary": "Canada",
    "ottawa": "Canada",

    # --- AUSTRALIA ---
    "sydney": "Australia",
    "melbourne": "Australia",
    "brisbane": "Australia",
    "perth": "Australia",

    # --- GERMANY ---
    "berlin": "Germany",
    "munich": "Germany",
    "frankfurt": "Germany",
    "hamburg": "Germany",
    "cologne": "Germany",

    # --- FRANCE ---
    "paris": "France",
    "lyon": "France",
    "marseille": "France",
    "toulouse": "France",
    "nice": "France",
    "bordeaux": "France",

    # --- SINGAPORE ---
    "singapore": "Singapore",

    # --- TURKEY ---
    "istanbul": "Turkey",
    "ankara": "Turkey",
    "izmir": "Turkey",

    # --- SPAIN & ITALY ---
    "madrid": "Spain",
    "barcelona": "Spain",
    "rome": "Italy",
    "milan": "Italy",
}

# Coordinates mapping for Overpass API radius searches
CITY_COORDINATES: Dict[str, Tuple[float, float]] = {
    # Pakistan
    "islamabad": (33.6844, 73.0479),
    "rawalpindi": (33.5651, 73.0169),
    "lahore": (31.5204, 74.3587),
    "karachi": (24.8607, 67.0011),
    "peshawar": (34.0151, 71.5249),
    "multan": (30.1575, 71.5249),
    "faisalabad": (31.4504, 73.1350),
    "quetta": (30.1798, 66.9750),
    "sialkot": (32.4945, 74.5229),

    # India
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),

    # UAE & Saudi
    "dubai": (25.2048, 55.2708),
    "abu dhabi": (24.4539, 54.3773),
    "sharjah": (25.3463, 55.4209),
    "riyadh": (24.7136, 46.6753),
    "jeddah": (21.5433, 39.1728),

    # UK
    "london": (51.5074, -0.1278),
    "manchester": (53.4808, -2.2426),
    "birmingham": (52.4862, -1.8904),
    "edinburgh": (55.9533, -3.1883),
    "glasgow": (55.8642, -4.2518),
    "leeds": (53.8008, -1.5491),

    # USA
    "new york": (40.7128, -74.0060),
    "los angeles": (34.0522, -118.2437),
    "chicago": (41.8781, -87.6298),
    "san francisco": (37.7749, -122.4194),
    "miami": (25.7617, -80.1918),
    "houston": (29.7604, -95.3698),
    "dallas": (32.7767, -96.7970),
    "seattle": (47.6062, -122.3321),
    "boston": (42.3601, -71.0589),
    "atlanta": (33.7490, -84.3880),

    # Canada & Australia
    "toronto": (43.6532, -79.3832),
    "vancouver": (49.2827, -123.1207),
    "montreal": (45.5017, -73.5673),
    "sydney": (-33.8688, 151.2093),
    "melbourne": (-37.8136, 144.9631),

    # Europe
    "singapore": (1.3521, 103.8198),
    "istanbul": (41.0082, 28.9784),
    "berlin": (52.5200, 13.4050),
    "munich": (48.1351, 11.5820),
    "frankfurt": (50.1109, 8.6821),
    "paris": (48.8566, 2.3522),
    "lyon": (45.7640, 4.8357),
    "marseille": (43.2965, 5.3698),
    "toulouse": (43.6047, 1.4442),
    "nice": (43.7102, 7.2620),
    "madrid": (40.4168, -3.7038),
    "barcelona": (41.3851, 2.1734),
    "rome": (41.9028, 12.4964),
    "milan": (45.4642, 9.1900),
}


# Country Metadata
COUNTRY_METADATA: Dict[str, Dict[str, Any]] = {
    "Pakistan": {
        "code": "+92",
        "area_codes": {"Islamabad": "51", "Lahore": "42", "Karachi": "21", "Peshawar": "91", "Rawalpindi": "51"},
        "default_city": "Islamabad",
        "domain_tld": ".pk",
        "address_format": "{building}, {district}, {city}, Pakistan"
    },
    "India": {
        "code": "+91",
        "area_codes": {"Delhi": "11", "Mumbai": "22", "Bangalore": "80", "Hyderabad": "40", "Chennai": "44"},
        "default_city": "Delhi",
        "domain_tld": ".in",
        "address_format": "{building}, {district}, {city}, India"
    },
    "UAE": {
        "code": "+971",
        "area_codes": {"Dubai": "4", "Abu Dhabi": "2", "Sharjah": "6"},
        "default_city": "Dubai",
        "domain_tld": ".ae",
        "address_format": "{building}, {district}, {city}, UAE"
    },
    "Saudi Arabia": {
        "code": "+966",
        "area_codes": {"Riyadh": "11", "Jeddah": "12", "Dammam": "13"},
        "default_city": "Riyadh",
        "domain_tld": ".sa",
        "address_format": "{building}, {district}, {city}, Saudi Arabia"
    },
    "USA": {
        "code": "+1",
        "area_codes": {"New York": "212", "Los Angeles": "310", "Chicago": "312", "Miami": "305"},
        "default_city": "New York",
        "domain_tld": ".com",
        "address_format": "{building} {district} St, {city}, USA"
    },
    "UK": {
        "code": "+44",
        "area_codes": {"London": "20", "Manchester": "161", "Birmingham": "121"},
        "default_city": "London",
        "domain_tld": ".co.uk",
        "address_format": "{building} {district} Rd, {city}, United Kingdom"
    },
    "Canada": {
        "code": "+1",
        "area_codes": {"Toronto": "416", "Vancouver": "604", "Montreal": "514"},
        "default_city": "Toronto",
        "domain_tld": ".ca",
        "address_format": "{building} {district} Ave, {city}, Canada"
    },
    "Australia": {
        "code": "+61",
        "area_codes": {"Sydney": "2", "Melbourne": "3", "Brisbane": "7"},
        "default_city": "Sydney",
        "domain_tld": ".com.au",
        "address_format": "{building} {district} St, {city}, Australia"
    },
    "Germany": {
        "code": "+49",
        "area_codes": {"Berlin": "30", "Munich": "89", "Frankfurt": "69"},
        "default_city": "Berlin",
        "domain_tld": ".de",
        "address_format": "{district}straße {building}, {city}, Germany"
    },
    "France": {
        "code": "+33",
        "area_codes": {"Paris": "1", "Lyon": "4", "Marseille": "4"},
        "default_city": "Paris",
        "domain_tld": ".fr",
        "address_format": "{building} Rue de {district}, {city}, France"
    },
    "Singapore": {
        "code": "+65",
        "area_codes": {"Singapore": "6"},
        "default_city": "Singapore",
        "domain_tld": ".sg",
        "address_format": "{building} {district} Rd, Singapore"
    },
    "Turkey": {
        "code": "+90",
        "area_codes": {"Istanbul": "212", "Ankara": "312"},
        "default_city": "Istanbul",
        "domain_tld": ".tr",
        "address_format": "{district} Cad. No:{building}, {city}, Turkey"
    }
}


class LocationRegistry:

    @classmethod
    def get_country_by_city(cls, city: str) -> Optional[str]:
        """
        Returns canonical country name for a given city string.
        """
        if not city:
            return None
        c_clean = city.strip().lower()
        return CITY_TO_COUNTRY_MAP.get(c_clean)

    @classmethod
    def resolve_canonical_location(cls, country: Optional[str], city: Optional[str]) -> Tuple[str, str]:
        """
        Enforces strict location resolution.
        If city is provided (e.g. Islamabad), returns canonical Country ("Pakistan") and City ("Islamabad").
        Prevents location mismatches (e.g. Islamabad -> India).
        """
        raw_city = (city or "").strip().lower()
        raw_country = (country or "").strip()

        # Check city lookup if provided
        if raw_city and raw_city in CITY_TO_COUNTRY_MAP:
            canonical_c = CITY_TO_COUNTRY_MAP[raw_city]
            canonical_ci = raw_city.title()
            return canonical_c, canonical_ci

        # Check partial city match only if non-empty string with at least 3 chars
        if raw_city and len(raw_city) >= 3:
            for city_key, canonical_c in CITY_TO_COUNTRY_MAP.items():
                if city_key in raw_city or raw_city in city_key:
                    return canonical_c, city_key.title()

        # Fallback to country — do NOT default to a single city for country-only searches.
        # Defaulting to a specific city (e.g. "New York" for USA) caused all results to be
        # geofenced to a 20km radius around that one city, producing near-zero results for
        # other regions. Instead, return None for city so the Overpass layer performs a
        # proper country-wide bounding-box search using ISO3166 area filtering.
        target_country = raw_country if raw_country and raw_country != "Worldwide" else "Pakistan"
        provided_city = city.title() if (city and city.strip()) else None
        return target_country, provided_city


    @classmethod
    def get_city_coordinates(cls, city: Optional[str]) -> Optional[Tuple[float, float]]:
        """
        Returns lat/lon coordinates tuple for a given city if registered.
        """
        if not city:
            return None
        c_clean = city.strip().lower()
        return CITY_COORDINATES.get(c_clean)

    @classmethod
    def generate_consistent_contact(cls, country: str, city: str, business_name: str) -> Dict[str, str]:
        """
        Generates location-consistent demo contact information matching country dial code and city address.
        Used ONLY for Demo Mode synthetic dataset generation.
        """
        canonical_c, canonical_ci = cls.resolve_canonical_location(country, city)
        meta = COUNTRY_METADATA.get(canonical_c, COUNTRY_METADATA["Pakistan"])

        dial_code = meta["code"]
        city_area_code = meta["area_codes"].get(canonical_ci, "51")
        random_subscriber = f"{random.randint(100, 999)}{random.randint(1000, 9999)}"
        phone = f"{dial_code} {city_area_code} {random_subscriber}"

        building = random.randint(1, 150)
        districts = ["Central", "Commercial Area", "Market", "Main Boulevard", "Phase 1", "Phase 2", "Sector F-7", "Sector F-10"]
        district = random.choice(districts)
        address = meta["address_format"].format(building=building, district=district, city=canonical_ci)

        clean_slug = "".join(c for c in business_name.lower() if c.isalnum())[:12]
        tld = meta["domain_tld"]
        email = f"contact@{clean_slug}{tld}"

        return {
            "country": canonical_c,
            "city": canonical_ci,
            "phone": phone,
            "email": email,
            "address": address
        }
