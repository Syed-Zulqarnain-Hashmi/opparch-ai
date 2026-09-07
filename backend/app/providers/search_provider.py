import random
from typing import List, Dict, Any, Optional
from app.core.location_registry import LocationRegistry
from app.providers.free_real_business_provider import FreeRealBusinessProvider

class SearchProvider:
    """
    Search & Business Discovery Provider Engine.
    Supports two clearly separated operational modes:
      1. REAL FREE MODE: Discovers real businesses from OpenStreetMap (Overpass API). NEVER fabricates synthetic records.
      2. DEMO MODE: Synthesizes realistic business opportunities labeled DEMO DATA — FOR DEMONSTRATION ONLY.
    """

    # Multi-country dataset repository for rich Demo Mode workflows
    GLOBAL_BUSINESS_REPOSITORY = [
        # --- PAKISTAN ---
        {
            "name": "Al-Noor Medical Store & Surgical",
            "country": "Pakistan",
            "city": "Islamabad",
            "industry": "Medical Stores",
            "website_url": None,
            "has_website": False,
            "phone": "+92 51 2289401",
            "email": "contact@alnoormedical.pk",
            "address": "Sector F-10 Markaz, Islamabad, Pakistan",
            "social_presence": {"facebook": "facebook.com/alnoormedicalisb", "instagram": "@alnoor_meds_isb"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        {
            "name": "Khyber Shinwari Traditional Restaurant",
            "country": "Pakistan",
            "city": "Peshawar",
            "industry": "Restaurants",
            "website_url": "http://khybershinwari-pesh.com",
            "has_website": True,
            "phone": "+92 91 5841290",
            "email": "info@khybershinwari-pesh.com",
            "address": "Ring Road, Peshawar, Pakistan",
            "social_presence": {"facebook": "facebook.com/khybershinwaripesh"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        {
            "name": "ZamZam Real Estate & Builders",
            "country": "Pakistan",
            "city": "Lahore",
            "industry": "Real Estate",
            "website_url": None,
            "has_website": False,
            "phone": "+92 42 35789123",
            "email": "info@zamzamrealestate.com.pk",
            "address": "DHA Phase 6, Lahore, Pakistan",
            "social_presence": {"instagram": "@zamzam_realestate_lahore"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        {
            "name": "Crescent Dental & Implant Clinic",
            "country": "Pakistan",
            "city": "Karachi",
            "industry": "Dentists",
            "website_url": "http://crescentdental.pk",
            "has_website": True,
            "phone": "+92 21 34567890",
            "email": "appointments@crescentdental.pk",
            "address": "Clifton Block 4, Karachi, Pakistan",
            "social_presence": {"facebook": "facebook.com/crescentdentalkhi"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        {
            "name": "Margalla Spice & Grill House",
            "country": "Pakistan",
            "city": "Islamabad",
            "industry": "Restaurants",
            "website_url": None,
            "has_website": False,
            "phone": "+92 51 8472910",
            "email": "orders@margallaspice.pk",
            "address": "F-7 Markaz, Islamabad, Pakistan",
            "social_presence": {"instagram": "@margalla_spice_isb"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        # --- INDIA ---
        {
            "name": "Delhi Curries & Tandoor House",
            "country": "India",
            "city": "Delhi",
            "industry": "Restaurants",
            "website_url": None,
            "has_website": False,
            "phone": "+91 11 41529000",
            "email": "contact@delhicurries.in",
            "address": "Connaught Place, Delhi, India",
            "social_presence": {"instagram": "@delhicurries_official"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        # --- UAE ---
        {
            "name": "Modern Bites Gourmet Cafe & Lounge",
            "country": "UAE",
            "city": "Dubai",
            "industry": "Restaurants",
            "website_url": None,
            "has_website": False,
            "phone": "+971 4 394 8200",
            "email": "hello@modernbites.ae",
            "address": "Jumeirah Beach Road, Dubai, UAE",
            "social_presence": {"instagram": "@modernbites_dxb"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        # --- USA ---
        {
            "name": "Pacific View Dental Center",
            "country": "USA",
            "city": "Los Angeles",
            "industry": "Dentists",
            "website_url": None,
            "has_website": False,
            "phone": "+1 310 555 0147",
            "email": "contact@pacificviewdental.com",
            "address": "Santa Monica Blvd, Los Angeles, CA, USA",
            "social_presence": {"facebook": "facebook.com/pacificviewdental"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        },
        # --- UK ---
        {
            "name": "The Thames Bistro & Bar",
            "country": "UK",
            "city": "London",
            "industry": "Restaurants",
            "website_url": None,
            "has_website": False,
            "phone": "+44 20 7123 4567",
            "email": "bookings@thamesbistro.co.uk",
            "address": "South Bank, London, United Kingdom",
            "social_presence": {"instagram": "@thamesbistro_london"},
            "discovery_source": "Demo Business Registry",
            "source_url": None,
            "is_demo_data": True,
            "data_mode": "DEMO"
        }
    ]

    @classmethod
    async def discover_businesses(
        cls,
        country: str = "Worldwide",
        city: Optional[str] = None,
        industry: Optional[str] = None,
        limit: int = 20,
        mode: str = "DEMO"
    ) -> List[Dict[str, Any]]:
        """
        Routes business discovery to REAL FREE MODE (Overpass API) or DEMO MODE.
        In REAL FREE MODE: NEVER returns synthetic or fabricated records.
        """
        if mode == "REAL_FREE":
            # Delegate strictly to real provider. No synthetic fallbacks allowed!
            return await FreeRealBusinessProvider.discover_businesses(
                country=country,
                city=city,
                industry=industry,
                limit=limit
            )

        # --- DEMO MODE DISCOVERY ---
        canonical_country, canonical_city = LocationRegistry.resolve_canonical_location(country, city)

        results = []
        c_filter = canonical_country.lower() if country and country != "Worldwide" else None
        ci_filter = city.lower().strip() if city else None
        ind_filter = industry.lower().strip() if industry and industry != "All Industries" and industry != "General Business" else None

        for item in cls.GLOBAL_BUSINESS_REPOSITORY:
            if c_filter and c_filter not in item["country"].lower():
                continue
            if ci_filter and ci_filter not in item["city"].lower():
                continue
            if ind_filter and ind_filter not in item["industry"].lower():
                continue

            results.append(dict(item))

        # Synthetic generator for Demo Mode evaluation workflows
        if len(results) < limit:
            target_ind = industry if (industry and industry != "All Industries" and industry != "General Business") else "Restaurants"
            sample_prefixes = ["Royal", "Grand", "Metro", "Prime", "Apex", "Heritage", "Crescent", "Crown"]

            for i in range(limit - len(results)):
                prefix = sample_prefixes[i % len(sample_prefixes)]
                biz_name = f"{prefix} {target_ind[:-1] if target_ind.endswith('s') else target_ind} ({canonical_city})"

                contact_info = LocationRegistry.generate_consistent_contact(
                    country=canonical_country,
                    city=canonical_city,
                    business_name=biz_name
                )

                has_web = (i % 2 == 1)
                domain_slug = "".join(e for e in biz_name.lower() if e.isalnum())[:12]
                web_url = f"http://{domain_slug}.com" if has_web else None

                results.append({
                    "name": biz_name,
                    "country": canonical_country,
                    "city": canonical_city,
                    "industry": target_ind,
                    "website_url": web_url,
                    "has_website": has_web,
                    "phone": contact_info["phone"],
                    "email": contact_info["email"],
                    "address": contact_info["address"],
                    "social_presence": {
                        "instagram": f"@{domain_slug}"
                    },
                    "discovery_source": "Demo Business Registry",
                    "source_url": None,
                    "is_demo_data": True,
                    "data_mode": "DEMO"
                })

        return results[:limit]
