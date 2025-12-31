from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import math
import os
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
CORS(app)

# Load Mapbox token from environment variable to avoid committing secrets to source control
MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")
if not MAPBOX_TOKEN:
    raise RuntimeError("MAPBOX_TOKEN not found in environment variables")


MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

@app.route("/api/search-city")
def search_city():
    query = request.args.get("q", "").strip()

    if len(query) < 2:
        return jsonify([])

    if not MAPBOX_TOKEN:
        return jsonify({"error": "Mapbox API token not configured. Set MAPBOX_TOKEN environment variable."}), 500

    url = f"{MAPBOX_URL}/{query}.json"

    params = {
        "access_token": MAPBOX_TOKEN,
        "autocomplete": "true",
        "types": "place",
        "country": "IN",
        "limit": 7
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        return jsonify(data.get("features", []))

    except requests.RequestException as e:
        print("Mapbox error:", e)
        return jsonify([]), 500
    

@app.route("/api/distance", methods=["POST"])
def calculate_distance():
    data = request.get_json()

    try:
        lat1 = float(data["source"]["lat"])
        lon1 = float(data["source"]["lon"])
        lat2 = float(data["destination"]["lat"])
        lon2 = float(data["destination"]["lon"])

        # Haversine formula
        R = 6371  # Earth radius in km

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
        )

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance_km = R * c

        return jsonify({
            "distance_km": round(distance_km, 2)
        })

    except Exception as e:
        print("Distance calculation error:", e)
        return jsonify({"error": "Invalid coordinates"}), 400


@app.route("/api/transport", methods=["POST"])
def recommend_transport():
    data = request.json

    distance = float(data["distance_km"])
    days = int(data["days"])
    budget = float(data["budget"])

    # Transport profiles
    transport_modes = [
        {
            "mode": "Bus",
            "speed": 50,            # km/h
            "cost_per_km": 2,
            "max_distance": 500
        },
        {
            "mode": "Train",
            "speed": 80,
            "cost_per_km": 1.5,
            "max_distance": 1200
        },
        {
            "mode": "Flight",
            "speed": 600,
            "cost_per_km": 5,
            "max_distance": 5000
        },
        {
            "mode": "Car",
            "speed": 60,
            "cost_per_km": 3,
            "max_distance": 700
        }
    ]

    results = []

    for t in transport_modes:
        time_hr = distance / t["speed"]
        cost = distance * t["cost_per_km"]

        score = 100

        # Distance penalty
        if distance > t["max_distance"]:
            score -= 40

        # Budget penalty
        if cost > budget:
            score -= 50
        else:
            score += 10

        # Time penalty (more than 1 day travel)
        if time_hr > 24:
            score -= 20

        # Soft realism penalty
        if t["mode"] == "Flight" and distance < 200:
            score -= 30
        if t["mode"] == "Bus" and distance > 800:
            score -= 30

        results.append({
            "mode": t["mode"],
            "score": score,
            "estimated_time_hr": round(time_hr, 1),
            "estimated_cost": int(cost)
        })

    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)

    return jsonify({
        "recommended": results[0]["mode"],
        "options": results[:3]
    })


if __name__ == "__main__":
    app.run(debug=True)
