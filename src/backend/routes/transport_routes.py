from flask import Blueprint, request, jsonify
from backend.services.transport_service import recommend_transport
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
def transport():
    data = request.get_json()

    result = recommend_transport(
        float(data["distance_km"]),
        int(data["days"]),
        float(data["budget"])
    )

    return jsonify(result)

@transport_bp.route("/lock-transport", methods=["POST"])
def lock_transport():
    data = request.json
    current_trip["transport"] = data
    return jsonify({"message": "Transport locked", "transport": data})
