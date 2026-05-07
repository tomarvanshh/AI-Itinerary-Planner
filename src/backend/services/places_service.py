import requests
from flask import current_app

from backend.utils.redis_client import redis_client
from backend.utils.cache_utils import normalize_city

GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"


def fetch_places_service(lat, lon, city_name=None):     #Added city_name for redis caching

    city = normalize_city(city_name) if city_name else f"{round(lat,2)}:{round(lon,2)}"
    cache_key = f"city:{city}:places"

    # 🔍 1. Check cache
    cached = redis_client.get(cache_key)
    if cached:
        return cached

    # 🌐 2. Call API (existing code)
    
    api_key = current_app.config["GOOGLE_PLACES_API_KEY"]

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.displayName,places.location,places.rating,places.userRatingCount,places.types,places.photos,places.generativeSummary,places.reviewSummary"
    }

    body = {
        "includedTypes": [
            "tourist_attraction",
            "mountain_peak",
            "scenic_spot",
            "hiking_area",
            "national_park",
            "historical_landmark",
            "museum",
            "amusement_park"
        ],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lon
                },
                "radius": 20000.0
            }
        }
    }

    response = requests.post(GOOGLE_PLACES_URL, headers=headers, json=body)
    data = response.json()


    places = []

    for p in data.get("places", []):
        location = p.get("location", {})
        display_name = p.get("displayName", {}).get("text")

        gen_summ =""
        review_summ = ""

        # Handle generative summary
        gen_data = p.get("generativeSummary")
        if(isinstance(gen_data,dict)):
            overview = gen_data.get("overview")
            if(isinstance(overview,dict)):
                gen_summ = overview.get("text","")

        # Handle review summary
        review_data = p.get("reviewSummary")
        if isinstance(review_data, dict):
            review_text = review_data.get("text")
            if isinstance(review_text, dict):
                review_summ = review_text.get("text", "")

        if not display_name or not location:
            continue

        photos = p.get("photos", [])
        photo_ref = None
        if photos:
            photo_ref = photos[0].get("name")

        places.append({
            "name": display_name,
            "lat": location.get("latitude"),
            "lon": location.get("longitude"),
            "rating": p.get("rating", 0),
            "user_ratings_total": p.get("userRatingCount", 0),
            "types": p.get("types", []),
            "photo_ref": photo_ref,
            "generative_summary": gen_summ[:200] if gen_summ else "",  # Truncate to 200 chars for brevity
            "review_summary": review_summ[:200] if review_summ else ""  # Truncate to 200 chars for brevity

        })

     # 💾 3. Save to Redis (TTL: 24h)
    redis_client.set(cache_key, places, ttl=86400)
    print(f"✅ Cached saved places for {city} with key: {cache_key}")

    return places