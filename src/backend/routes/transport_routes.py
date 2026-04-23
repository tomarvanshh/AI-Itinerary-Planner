from flask import Blueprint, request, jsonify
from backend.services.transport_service import get_fallback_transport
from backend.state.trip_state import current_trip
from backend.services.distance_service import calculate_haversine


transport_bp = Blueprint("transport", __name__)

@transport_bp.route("/distance", methods=["POST"])
def calculate_distance():
    data = request.get_json()

    try:
        lat1 = float(data["source"]["lat"])
        lon1 = float(data["source"]["lon"])
        lat2 = float(data["destination"]["lat"])
        lon2 = float(data["destination"]["lon"])

        distance_km = calculate_haversine(lat1, lon1, lat2, lon2)

        return jsonify({"distance_km": distance_km})

    except Exception as e:
        print("Distance error:", e)
        return jsonify({"error": "Invalid coordinates"}), 400


@transport_bp.route("/transport", methods=["POST"])
def get_transport():
    data = request.get_json()

    distance_km = float(data.get("distance_km", 500))   # default dist if not provided = 500km
    budget = float(data.get("budget", 10000))   # default budget if not provided = 10,000
    adults = int(data.get("adults", 1)) # default to 1 adult if not provided

    source = data.get("source", {}).get("name")
    destination = data.get("destination", {}).get("name")

    if not source or not destination:
        return jsonify({"error": "City names required"}), 400

    options = get_fallback_transport(
        source,
        destination,
        distance_km,
        budget,
        adults
    )

    return jsonify(options)
@transport_bp.route("/lock-transport", methods=["POST"])
def lock_transport():
    data = request.get_json()
    current_trip["transport"] = data
    return jsonify({"message": "Transport locked", "transport": data})
