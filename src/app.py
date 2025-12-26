from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import math
import os

app = Flask(__name__)
CORS(app)

MAPBOX_TOKEN = "pk.eyJ1IjoidmFuc2h0b21hciIsImEiOiJjbWpuNmI5NTUwN2lsM2NzazF0b3ZlYXpxIn0.qdxEH6eSdLE0YcArJQ9EUw"

MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

@app.route("/api/search-city")
def search_city():
    query = request.args.get("q", "").strip()

    if len(query) < 2:
        return jsonify([])

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
    

import math

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
    data = request.get_json()

    try:
        distance = float(data["distance_km"])
        days = int(data["days"])
        budget = float(data["budget"])

        options = []

        # Bus
        bus_cost = distance * 1.5
        bus_time = distance / 40
        if distance <= 300 and bus_cost <= budget:
            options.append({
                "mode": "Bus",
                "estimated_cost": round(bus_cost, 2),
                "estimated_time_hr": round(bus_time, 1)
            })

        # Train
        train_cost = distance * 2.5
        train_time = distance / 70
        if distance <= 800 and train_cost <= budget:
            options.append({
                "mode": "Train",
                "estimated_cost": round(train_cost, 2),
                "estimated_time_hr": round(train_time, 1)
            })

        # Flight
        flight_cost = distance * 5
        flight_time = (distance / 600) + 2  # incl airport time
        if distance >= 300 and flight_cost <= budget:
            options.append({
                "mode": "Flight",
                "estimated_cost": round(flight_cost, 2),
                "estimated_time_hr": round(flight_time, 1)
            })

        # Prefer flight if days are very limited
        recommended = options[0]["mode"] if options else "No suitable transport found"

        return jsonify({
            "recommended": recommended,
            "options": options
        })

    except Exception as e:
        print("Transport logic error:", e)
        return jsonify({"error": "Invalid input"}), 400



if __name__ == "__main__":
    app.run(debug=True)
