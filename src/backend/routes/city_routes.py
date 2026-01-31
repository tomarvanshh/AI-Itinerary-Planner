from flask import Blueprint, request, jsonify
import requests
from flask import current_app

city_bp = Blueprint("city", __name__)

MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

@city_bp.route("/search-city")
def search_city():
    query = request.args.get("q", "").strip()

    if len(query) < 2:
        return jsonify([])

    MAPBOX_TOKEN = current_app.config["MAPBOX_TOKEN"]

    url = f"{MAPBOX_URL}/{query}.json"

    params = {
        "access_token": MAPBOX_TOKEN,
        "autocomplete": "true",
        "types": "place",
        "country": "IN",
        "limit": 7
    }

    response = requests.get(url, params=params)
    data = response.json()

    return jsonify(data.get("features", []))
