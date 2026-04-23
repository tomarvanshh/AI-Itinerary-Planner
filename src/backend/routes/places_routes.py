import os
from flask import current_app 

from flask import Blueprint, redirect, request, jsonify
from backend.services.places_service import fetch_places_service
from backend.services.hotel_service import fetch_hotels
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
    
@places_bp.route("/hotels", methods=["POST"])
def get_hotels():
    data = request.get_json()
    lat, lon = data.get("lat"), data.get("lon")
    budget = float(data.get("budget", 50000))
    days = int(data.get("days", 1))
    
    if not lat or not lon:
        return jsonify({"error": "Location missing"}), 400
        
    hotels = fetch_hotels(lat, lon)
    return jsonify({"hotels": hotels})

@places_bp.route('/hotel/photo', methods=['GET'])
def get_hotel_photo():
    photo_ref = request.args.get('photoreference')
    api_key = os.getenv('GOOGLE_PLACES_API_KEY')
    
    if not photo_ref:
        return jsonify({"error": "Missing photoreference"}), 400
    
    if not api_key:
        return jsonify({"error": "API key not configured on server"}), 500
        
    url = f"https://places.googleapis.com/v1/{photo_ref}/media?maxHeightPx=400&key={api_key}"
    return redirect(url)

@places_bp.route("/restaurants", methods=["POST"])
def get_restaurants():
    data = request.get_json()

    lat = data.get("lat")
    lon = data.get("lon")

    if not lat or not lon:
        return jsonify({"error": "Missing coordinates"}), 400

    try:
        from backend.services.restaurant_service import fetch_nearby_restaurants

        restaurants = fetch_nearby_restaurants(lat, lon, radius=1000)

        return jsonify({"restaurants": restaurants})

    except Exception as e:
        print("Restaurant fetch error:", e)
        return jsonify({"error": "Failed to fetch restaurants"}), 500
