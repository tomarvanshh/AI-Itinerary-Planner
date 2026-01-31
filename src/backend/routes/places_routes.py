from flask import Blueprint, request, jsonify, current_app
import requests

places_bp = Blueprint("places", __name__)


# ---------------------------------------------------
# 🔹 Mapping Google place types → internal tags
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
# 🔹 Estimate time + priority weight
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
# 🔹 Main API Route
# ---------------------------------------------------
@places_bp.route("/places", methods=["POST"])
def fetch_places():
    data = request.get_json()

    lat = data.get("lat")
    lon = data.get("lon")

    if not lat or not lon:
        return jsonify({"error": "Missing coordinates"}), 400

    GOOGLE_API_KEY = current_app.config["GOOGLE_PLACES_API_KEY"]

    if not GOOGLE_API_KEY:
        return jsonify({"error": "Google Places API key not configured"}), 500

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

    params = {
        "location": f"{lat},{lon}",
        "radius": 15000,
        "keyword": "tourist attractions",
        "key": GOOGLE_API_KEY
    }

    try:
        res = requests.get(url, params=params, timeout=5)
        res.raise_for_status()
        data = res.json()

        raw_places = data.get("results", [])

        normalized = []

        for p in raw_places:
            tags = map_place_types(p.get("types", []))
            avg_time, priority = estimate_place_weight(tags)

            normalized.append({
                "id": p["place_id"],
                "name": p["name"],
                "tags": tags,
                "avg_time_hr": avg_time,
                "priority": priority,
                "lat": p["geometry"]["location"]["lat"],
                "lon": p["geometry"]["location"]["lng"],
                "rating": p.get("rating", 0)
            })

        return jsonify({"places": normalized})

    except requests.RequestException as e:
        print("Google Places API error:", e)
        return jsonify({"error": "Failed to fetch places"}), 500
