import requests
from flask import current_app


# ---------------------------------------------------
# Mapping Google place types → internal tags
# ---------------------------------------------------
def map_place_types(types):
    tag_map = {
        "natural_feature": "nature",
        "park": "nature",
        "museum": "culture",
        "hindu_temple": "temple",
        "church": "culture",
        "mosque": "culture",
        "cafe": "cafes",
        "restaurant": "food",
        "amusement_park": "adventure",
        "zoo": "family"
    }

    tags = set()

    for t in types:
        if t in tag_map:
            tags.add(tag_map[t])

    if not tags:
        tags.add("general")

    return list(tags)


# ---------------------------------------------------
# Estimate time + priority weight
# ---------------------------------------------------
def estimate_place_weight(tags):
    avg_time = 1.5
    priority = 5

    if "nature" in tags:
        avg_time += 0.5
        priority += 2

    if "adventure" in tags:
        avg_time += 1
        priority += 2

    if "culture" in tags or "temple" in tags:
        priority += 1

    if "cafes" in tags:
        avg_time += 0.3

    return avg_time, priority


# ---------------------------------------------------
# Main fetch service
# ---------------------------------------------------
def fetch_places_service(lat, lon):

    GOOGLE_API_KEY = current_app.config["GOOGLE_PLACES_API_KEY"]

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

    params = {
        "location": f"{lat},{lon}",
        "radius": 15000,
        "keyword": "tourist attractions",
        "key": GOOGLE_API_KEY
    }

    res = requests.get(url, params=params, timeout=5)
    res.raise_for_status()

    raw_places = res.json().get("results", [])

    normalized = []

    for p in raw_places:

        tags = map_place_types(p.get("types", []))
        avg_time, priority = estimate_place_weight(tags)

        normalized.append({
            "id": p.get("place_id"),
            "name": p.get("name"),
            "tags": tags,
            "avg_time_hr": avg_time,
            "priority": priority,
            "lat": p["geometry"]["location"]["lat"],
            "lon": p["geometry"]["location"]["lng"],
            "rating": p.get("rating", 0)
        })

    return normalized
