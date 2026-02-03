from flask import Blueprint, request, jsonify
from backend.services.places_service import fetch_places_service

places_bp = Blueprint("places", __name__)

@places_bp.route("/places", methods=["POST"])
def fetch_places():
    data = request.get_json()

    lat = data.get("lat")
    lon = data.get("lon")

    if not lat or not lon:
        return jsonify({"error": "Missing coordinates"}), 400

    try:
        places = fetch_places_service(lat, lon)
        return jsonify({"places": places})

    except Exception as e:
        print("Places route error:", e)
        return jsonify({"error": "Failed to fetch places"}), 500
