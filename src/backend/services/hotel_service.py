import requests
from flask import current_app
from backend.utils.redis_client import redis_client
from backend.utils.cache_utils import normalize_city

GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"


def fetch_hotels(lat, lon, city_name=None):

    city = normalize_city(city_name) if city_name else f"{round(lat,2)}:{round(lon,2)}"
    cache_key = f"city:{city}:hotels"

    # 🔍 Cache check
    cached = redis_client.get(cache_key)
    if cached:
        return cached

    api_key = current_app.config["GOOGLE_PLACES_API_KEY"]

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.displayName,places.location,places.rating,places.userRatingCount,places.types,places.priceLevel,places.photos"
    }

    body = {
        "includedTypes": ["lodging"],   # 🔥 important for hotels
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lon
                },
                "radius": 5000.0   # hotels should be closer
            }
        }
    }

    response = requests.post(GOOGLE_PLACES_URL, headers=headers, json=body)
    data = response.json()

    if "places" not in data:
        print("Google accomodation API error:", data)
        return []
    
    


    hotels = []

    for h in data["places"]:
        location = h.get("location", {})
        name = h.get("displayName", {}).get("text")

        if not name or not location:
            continue

        photos = h.get("photos", [])
        photo_ref = None

        if photos:
            photo_ref = photos[0].get("name")  # THIS IS CORRECT FOR NEW API

        hotels.append({
            "name": name,
            "lat": location.get("latitude"),
            "lon": location.get("longitude"),
            "rating": h.get("rating", 0),
            "user_ratings_total": h.get("userRatingCount", 0),
            "priceLevel": h.get("priceLevel", "PRICE_LEVEL_MODERATE"),
            "photo_ref": photo_ref,
            "address": h.get("formattedAddress", "Unknown")
        })

    # 💾 Cache (TTL: 6 hours)
    redis_client.set(cache_key, hotels, ttl=21600)
    print(f"✅ Cached saved hotels for {city} with key: {cache_key}")
    return hotels