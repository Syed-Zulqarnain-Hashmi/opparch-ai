import asyncio
import httpx
import logging
import datetime
from typing import List, Dict, Any, Optional
from app.core.location_registry import LocationRegistry, CITY_TO_COUNTRY_MAP

logger = logging.getLogger(__name__)

# Primary Overpass API endpoints (fastest verified global mirrors first)
OVERPASS_ENDPOINTS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
]

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Mapping user-selected industry categories to OpenStreetMap (OSM) key-value tags
OSM_INDUSTRY_TAGS: Dict[str, List[tuple]] = {
    "Restaurants": [("amenity", "restaurant"), ("amenity", "fast_food"), ("amenity", "cafe"), ("amenity", "food_court")],
    "Hotels": [("tourism", "hotel"), ("tourism", "guest_house"), ("tourism", "hostel"), ("tourism", "motel")],
    "Medical Stores": [("amenity", "pharmacy"), ("healthcare", "pharmacy"), ("shop", "chemist"), ("shop", "medical_supply")],
    "Clinics": [("amenity", "clinic"), ("healthcare", "clinic"), ("amenity", "doctors")],
    "Hospitals": [("amenity", "hospital"), ("healthcare", "hospital")],
    "Dentists": [("amenity", "dentist"), ("healthcare", "dentist")],
    "Salons": [("shop", "hairdresser"), ("shop", "beauty"), ("shop", "salon")],
    "Barbers": [("shop", "hairdresser"), ("shop", "barber")],
    "Gyms": [("leisure", "fitness_centre"), ("leisure", "sports_centre"), ("leisure", "gym")],
    "Real Estate": [("office", "estate_agent")],
    "Law Firms": [("office", "lawyer"), ("office", "legal")],
    "Schools": [("amenity", "school")],
    "Colleges": [("amenity", "college")],
    "Universities": [("amenity", "university")],
    "Travel Agencies": [("office", "travel_agent")],
    "Car Dealerships": [("shop", "car")],
    "Auto Workshops": [("shop", "car_repair"), ("shop", "car_service")],
    "Construction": [("office", "construction")],
    "Architecture": [("office", "architect")],
    "Software Companies": [("office", "it"), ("office", "telecommunication"), ("office", "company"), ("office", "software")],
    "Marketing Agencies": [("office", "advertising_agency"), ("office", "marketing")],
    "Clothing Brands": [("shop", "clothes"), ("shop", "boutique"), ("shop", "fashion")],
    "Fashion": [("shop", "clothes"), ("shop", "boutique")],
    "Retail": [("shop", "supermarket"), ("shop", "department_store"), ("shop", "convenience"), ("shop", "clothes")],
}

# Major economic hubs per country for fast location radius discovery
COUNTRY_HUBS: Dict[str, List[tuple]] = {
    "Pakistan": [("Lahore", 31.5204, 74.3587), ("Karachi", 24.8607, 67.0011), ("Islamabad", 33.6844, 73.0479)],
    "USA": [("New York", 40.7128, -74.0060), ("Los Angeles", 34.0522, -118.2437), ("Chicago", 41.8781, -87.6298), ("Houston", 29.7604, -95.3698), ("Miami", 25.7617, -80.1918)],
    "UK": [("London", 51.5074, -0.1278), ("Manchester", 53.4808, -2.2426), ("Birmingham", 52.4862, -1.8904)],
    "Canada": [("Toronto", 43.6532, -79.3832), ("Vancouver", 49.2827, -123.1207), ("Montreal", 45.5017, -73.5673)],
    "UAE": [("Dubai", 25.2048, 55.2708), ("Abu Dhabi", 24.4539, 54.3773), ("Sharjah", 25.3463, 55.4209)],
    "Saudi Arabia": [("Riyadh", 24.7136, 46.6753), ("Jeddah", 21.4858, 39.1925), ("Dammam", 26.4207, 50.0888)],
    "Germany": [("Berlin", 52.5200, 13.4050), ("Munich", 48.1351, 11.5820), ("Frankfurt", 50.1109, 8.6821)],
    "France": [("Paris", 48.8566, 2.3522), ("Lyon", 45.7640, 4.8357), ("Marseille", 43.2965, 5.3698)],
    "Australia": [("Sydney", -33.8688, 151.2093), ("Melbourne", -37.8136, 144.9631), ("Brisbane", -27.4698, 153.0251)],
    "India": [("Delhi", 28.6139, 77.2090), ("Mumbai", 19.0760, 72.8777), ("Bangalore", 12.9716, 77.5946)],
    "Turkey": [("Istanbul", 41.0082, 28.9784), ("Ankara", 39.9334, 32.8597)],
    "Singapore": [("Singapore", 1.3521, 103.8198)],
    "Italy": [("Rome", 41.9028, 12.4964), ("Milan", 45.4642, 9.1900)],
    "Spain": [("Madrid", 40.4168, -3.7038), ("Barcelona", 41.3851, 2.1734)],
}

COUNTRY_ISO_CODES: Dict[str, str] = {
    "Pakistan": "PK", "USA": "US", "Canada": "CA", "UK": "GB", "Australia": "AU",
    "India": "IN", "UAE": "AE", "Saudi Arabia": "SA", "Germany": "DE", "France": "FR",
    "Singapore": "SG", "Turkey": "TR", "Italy": "IT", "Spain": "ES"
}


class FreeRealBusinessProvider:
    """
    Real Free Business Discovery Provider.
    Queries OpenStreetMap via public Overpass API and Nominatim for real businesses.
    Enforces strict data integrity: NEVER fabricates or returns synthetic data.
    If zero businesses are found, returns an empty list with clear telemetry messaging.
    """

    @classmethod
    def _build_overpass_query(
        cls,
        country: str,
        city: Optional[str],
        industry: Optional[str],
        limit: int = 20,
        coords: Optional[tuple] = None,
    ) -> str:
        tag_pairs = OSM_INDUSTRY_TAGS.get(
            industry,
            [("amenity", "restaurant"), ("amenity", "pharmacy"), ("shop", "clothes"), ("office", "company")]
        )

        filters = []
        if coords:
            lat, lon = coords
            for k, v in tag_pairs:
                filters.append(f'node["{k}"="{v}"](around:20000,{lat},{lon});')
                filters.append(f'way["{k}"="{v}"](around:20000,{lat},{lon});')

            filter_block = "\n  ".join(filters)
            query = f"""[out:json][timeout:10];
(
  {filter_block}
);
out center body {limit * 2};
"""
        else:
            canonical_c, canonical_ci = LocationRegistry.resolve_canonical_location(country, city)
            search_city = canonical_ci if canonical_ci else (city if city else country)
            for k, v in tag_pairs:
                filters.append(f'node["{k}"="{v}"](area.searchArea);')
                filters.append(f'way["{k}"="{v}"](area.searchArea);')

            filter_block = "\n  ".join(filters)
            query = f"""[out:json][timeout:15];
(
  area["name"="{search_city}"]["boundary"="administrative"]["admin_level"~"[4-9]"];
  area["name:en"="{search_city}"]["boundary"="administrative"]["admin_level"~"[4-9]"];
)->.searchArea;
(
  {filter_block}
);
out center body {limit * 2};
"""
        return query

    @classmethod
    async def _query_single_mirror(
        cls,
        client: httpx.AsyncClient,
        endpoint: str,
        query_payload: str,
        headers: dict,
        timeout_secs: float = 6.0
    ) -> List[Dict]:
        try:
            res = await client.post(
                endpoint,
                data={"data": query_payload},
                headers=headers,
                timeout=timeout_secs
            )
            if res.status_code == 200:
                data = res.json()
                elems = data.get("elements", [])
                if elems:
                    return elems
        except Exception:
            pass
        return []

    @classmethod
    async def _race_mirrors(cls, query_payload: str, timeout_secs: float = 6.0) -> List[Dict]:
        headers = {
            "User-Agent": "OPPARCH-AI/2.0 (Opportunity Intelligence Platform; opparch.ai)",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "*/*"
        }
        async with httpx.AsyncClient() as client:
            tasks = [
                asyncio.create_task(cls._query_single_mirror(client, ep, query_payload, headers, timeout_secs))
                for ep in OVERPASS_ENDPOINTS
            ]
            for completed in asyncio.as_completed(tasks):
                try:
                    elems = await completed
                    if elems:
                        for t in tasks:
                            if not t.done():
                                t.cancel()
                        return elems
                except Exception:
                    continue
        return []

    @classmethod
    async def _search_nominatim_fallback(
        cls,
        country: str,
        city: Optional[str],
        industry: str,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Fallback discovery using OpenStreetMap Nominatim search API.
        """
        loc_part = f"{city}, {country}" if city else country
        query = f"{industry} in {loc_part}" if loc_part and loc_part != "Worldwide" else industry

        params = {
            "q": query,
            "format": "json",
            "addressdetails": 1,
            "extratags": 1,
            "limit": limit
        }
        headers = {
            "User-Agent": "OPPARCH-AI/2.0 (DevArcher Opportunity Hunter; contact@devarcher.com)"
        }

        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(NOMINATIM_URL, params=params, headers=headers, timeout=6.0)
                if res.status_code == 200:
                    items = res.json()
                    results: List[Dict[str, Any]] = []
                    seen_names = set()

                    for it in items:
                        name = it.get("display_name", "").split(",")[0].strip()
                        if not name or name in seen_names or len(name) < 2:
                            continue
                        seen_names.add(name)

                        extratags = it.get("extratags") or {}
                        addr = it.get("address") or {}

                        item_country = addr.get("country") or country
                        item_city = addr.get("city") or addr.get("town") or addr.get("state_district") or addr.get("county") or city or country

                        raw_web = extratags.get("website") or extratags.get("contact:website") or extratags.get("url")
                        raw_email = extratags.get("email") or extratags.get("contact:email")
                        raw_phone = extratags.get("phone") or extratags.get("contact:phone") or extratags.get("phone:mobile")

                        social_dict = {
                            "facebook": extratags.get("facebook") or extratags.get("contact:facebook"),
                            "instagram": extratags.get("instagram") or extratags.get("contact:instagram"),
                            "twitter": extratags.get("twitter") or extratags.get("contact:twitter"),
                            "linkedin": extratags.get("linkedin") or extratags.get("contact:linkedin"),
                            "osm_tags": list(extratags.keys())[:5]
                        }

                        # Separate social profiles from real website
                        web_url = None
                        if raw_web:
                            raw_clean = raw_web.strip()
                            if not raw_clean.startswith("http"):
                                raw_clean = f"http://{raw_clean}"
                            lower_web = raw_clean.lower()
                            if any(soc in lower_web for soc in ["facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "tiktok.com"]):
                                if "facebook.com" in lower_web and not social_dict["facebook"]:
                                    social_dict["facebook"] = raw_clean
                                elif "instagram.com" in lower_web and not social_dict["instagram"]:
                                    social_dict["instagram"] = raw_clean
                                elif ("twitter.com" in lower_web or "x.com" in lower_web) and not social_dict["twitter"]:
                                    social_dict["twitter"] = raw_clean
                                elif "linkedin.com" in lower_web and not social_dict["linkedin"]:
                                    social_dict["linkedin"] = raw_clean
                            else:
                                web_url = raw_clean

                        lat = it.get("lat")
                        lon = it.get("lon")
                        osm_type = it.get("osm_type", "node")
                        osm_id = it.get("osm_id")

                        results.append({
                            "name": name,
                            "country": item_country,
                            "city": item_city,
                            "industry": industry,
                            "website_url": web_url,
                            "has_website": bool(web_url),
                            "phone": raw_phone,
                            "email": raw_email,
                            "address": it.get("display_name", f"{item_city}, {item_country}"),
                            "latitude": float(lat) if lat else None,
                            "longitude": float(lon) if lon else None,
                            "social_presence": social_dict,
                            "discovery_source": "OpenStreetMap / Nominatim",
                            "source_url": f"https://www.openstreetmap.org/{osm_type}/{osm_id}" if osm_id else "https://www.openstreetmap.org",
                            "business_id": f"osm_{osm_type}_{osm_id}" if osm_id else None,
                            "is_demo_data": False,
                            "data_mode": "REAL_FREE",
                            "last_checked": datetime.datetime.now(datetime.timezone.utc).isoformat()
                        })

                        if len(results) >= limit:
                            break

                    return results
        except Exception as e:
            logger.debug(f"[Nominatim] Fallback query failed: {e}")
        return []

    @classmethod
    async def discover_businesses(
        cls,
        country: str = "Worldwide",
        city: Optional[str] = None,
        industry: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Discovers real businesses from OpenStreetMap.
        Strategy:
          1. If specific city provided: query Overpass radius around city coords.
          2. If country provided without city: query Overpass radius across major hubs of that country.
          3. If Overpass returns 0 elements: fall back to Nominatim OSM search.
          4. Validates country integrity on every record.
        """
        canonical_country, canonical_city = LocationRegistry.resolve_canonical_location(country, city)
        target_city = canonical_city if canonical_city else city
        target_industry = industry if (industry and industry != "All Industries" and industry != "General Business") else "Restaurants"

        logger.info(f"[Discovery] target_country={canonical_country!r} target_city={target_city!r} industry={target_industry!r}")

        elements: List[Dict] = []

        # ── Strategy 1: Specific city coords ──────────────────────────────────
        if target_city:
            coords = LocationRegistry.get_city_coordinates(target_city)
            if coords:
                q = cls._build_overpass_query(canonical_country, target_city, target_industry, limit, coords=coords)
                elements = await cls._race_mirrors(q, timeout_secs=6.0)
                logger.info(f"[Discovery] Strategy 1 (city coords): {len(elements)} elements")

        # ── Strategy 2: Multi-hub queries for country-wide or worldwide searches ───────────
        if not elements:
            if canonical_country in COUNTRY_HUBS:
                hubs = COUNTRY_HUBS[canonical_country]
                async def _query_hub(hub_city: str, h_lat: float, h_lon: float) -> List[Dict]:
                    q_hub = cls._build_overpass_query(canonical_country, hub_city, target_industry, limit=max(5, limit // len(hubs)), coords=(h_lat, h_lon))
                    hub_elems = await cls._race_mirrors(q_hub, timeout_secs=5.0)
                    for e in hub_elems:
                        e["_hub_city"] = hub_city
                        e["_hub_country"] = canonical_country
                    return hub_elems

                hub_tasks = [_query_hub(h_city, h_lat, h_lon) for h_city, h_lat, h_lon in hubs[:3]]
                hub_results = await asyncio.gather(*hub_tasks, return_exceptions=True)
                for res in hub_results:
                    if isinstance(res, list) and res:
                        elements.extend(res)
                logger.info(f"[Discovery] Strategy 2 (multi-hub Overpass): {len(elements)} elements")
            elif country == "Worldwide":
                global_hubs = [
                    ("New York", "USA", 40.7128, -74.0060),
                    ("London", "UK", 51.5074, -0.1278),
                    ("Dubai", "UAE", 25.2048, 55.2708),
                    ("Toronto", "Canada", 43.6532, -79.3832),
                ]
                async def _query_global_hub(h_city: str, h_country: str, h_lat: float, h_lon: float) -> List[Dict]:
                    q_hub = cls._build_overpass_query(h_country, h_city, target_industry, limit=5, coords=(h_lat, h_lon))
                    hub_elems = await cls._race_mirrors(q_hub, timeout_secs=5.0)
                    for e in hub_elems:
                        e["_hub_city"] = h_city
                        e["_hub_country"] = h_country
                    return hub_elems

                g_tasks = [_query_global_hub(c, k, lat, lon) for c, k, lat, lon in global_hubs]
                g_results = await asyncio.gather(*g_tasks, return_exceptions=True)
                for res in g_results:
                    if isinstance(res, list) and res:
                        elements.extend(res)
                logger.info(f"[Discovery] Strategy 2 (Worldwide global hubs): {len(elements)} elements")

        # ── Strategy 3: Area query fallback ───────────────────────────────────
        if not elements:
            q_area = cls._build_overpass_query(canonical_country, target_city, target_industry, limit, coords=None)
            elements = await cls._race_mirrors(q_area, timeout_secs=8.0)
            logger.info(f"[Discovery] Strategy 3 (Overpass area): {len(elements)} elements")

        # ── Strategy 4: Nominatim OSM Fallback ────────────────────────────────
        if not elements:
            logger.info("[Discovery] Overpass yielded 0 elements, trying Nominatim OSM fallback...")
            nom_results = await cls._search_nominatim_fallback(
                country=canonical_country,
                city=target_city,
                industry=target_industry,
                limit=limit
            )
            if nom_results:
                logger.info(f"[Discovery] Strategy 4 (Nominatim): {len(nom_results)} real businesses found")
                return nom_results

        # ── Parse Overpass Elements ───────────────────────────────────────────
        results: List[Dict[str, Any]] = []
        seen_names = set()

        for el in elements:
            tags = el.get("tags", {})
            if not tags:
                continue

            name = tags.get("name") or tags.get("name:en") or tags.get("brand") or tags.get("operator")
            if not name or name in seen_names or len(name.strip()) < 2:
                continue

            # Country integrity check
            osm_country = (tags.get("addr:country") or "").strip().upper()
            if osm_country and canonical_country != "Worldwide":
                expected_iso = COUNTRY_ISO_CODES.get(canonical_country, "")
                if osm_country not in [canonical_country.upper(), expected_iso, "US" if canonical_country == "USA" else "", "GB" if canonical_country == "UK" else ""]:
                    continue

            seen_names.add(name)

            raw_web = tags.get("website") or tags.get("contact:website") or tags.get("url")
            web_url = None
            social_dict = {
                "facebook": tags.get("facebook") or tags.get("contact:facebook"),
                "instagram": tags.get("instagram") or tags.get("contact:instagram"),
                "twitter": tags.get("twitter") or tags.get("contact:twitter"),
                "linkedin": tags.get("linkedin") or tags.get("contact:linkedin"),
                "osm_tags": list(tags.keys())[:5]
            }

            if raw_web:
                raw_clean = raw_web.strip()
                if not raw_clean.startswith("http"):
                    raw_clean = f"http://{raw_clean}"

                lower_web = raw_clean.lower()
                if any(soc in lower_web for soc in ["facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "tiktok.com"]):
                    if "facebook.com" in lower_web and not social_dict["facebook"]:
                        social_dict["facebook"] = raw_clean
                    elif "instagram.com" in lower_web and not social_dict["instagram"]:
                        social_dict["instagram"] = raw_clean
                    elif ("twitter.com" in lower_web or "x.com" in lower_web) and not social_dict["twitter"]:
                        social_dict["twitter"] = raw_clean
                    elif "linkedin.com" in lower_web and not social_dict["linkedin"]:
                        social_dict["linkedin"] = raw_clean
                    web_url = None
                else:
                    web_url = raw_clean

            phone = tags.get("phone") or tags.get("contact:phone") or tags.get("phone:mobile")
            email = tags.get("email") or tags.get("contact:email")

            osm_addr_city = tags.get("addr:city") or el.get("_hub_city") or target_city
            addr_parts = []
            if tags.get("addr:housenumber"): addr_parts.append(tags["addr:housenumber"])
            if tags.get("addr:street"): addr_parts.append(tags["addr:street"])
            if tags.get("addr:suburb"): addr_parts.append(tags["addr:suburb"])
            if osm_addr_city: addr_parts.append(osm_addr_city)
            if canonical_country: addr_parts.append(canonical_country)

            formatted_addr = ", ".join(addr_parts) if addr_parts else (osm_addr_city or canonical_country or "")

            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")

            osm_type = el.get("type", "node")
            osm_id = el.get("id")
            osm_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}" if osm_id else "https://www.openstreetmap.org"

            display_city = tags.get("addr:city") or el.get("_hub_city") or target_city or canonical_city
            display_country = el.get("_hub_country") or canonical_country

            results.append({
                "name": name.strip(),
                "country": display_country,
                "city": display_city,
                "industry": target_industry,
                "website_url": web_url,
                "has_website": bool(web_url),
                "phone": phone,
                "email": email,
                "address": formatted_addr,
                "latitude": lat,
                "longitude": lon,
                "social_presence": social_dict,
                "discovery_source": "OpenStreetMap / Overpass API",
                "source_url": osm_url,
                "business_id": f"osm_{osm_type}_{osm_id}" if osm_id else None,
                "is_demo_data": False,
                "data_mode": "REAL_FREE",
                "last_checked": datetime.datetime.now(datetime.timezone.utc).isoformat()
            })

            if len(results) >= limit:
                break

        logger.info(f"[Discovery] Final real businesses: {len(results)} for {target_industry!r} in {target_city or canonical_country!r}")
        return results


