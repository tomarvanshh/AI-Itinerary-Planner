from flask import Blueprint, request, jsonify
# from backend.services.transport_service import recommend_transport
from backend.services.transport_service import fetch_flights_realtime, fetch_trains_realtime, resolve_iata_code, resolve_station_code, get_fallback_transport
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
    distance_km = float(data.get("distance_km", 500)) # Default to 500 if missing
    source_city_name = data.get("source", {}).get("name") 
    dest_city_name = data.get("destination", {}).get("name")
    # Add a safety check to prevent passing None to the service
    if not source_city_name or not dest_city_name:
        print("Error: Source or Destination name is missing from request")
        return jsonify({"error": "City names are required"}), 400
    
    # 1. Resolve codes in real-time
    source_iata = resolve_iata_code(source_city_name)
    dest_iata = resolve_iata_code(dest_city_name)
    
    from_station = resolve_station_code(source_city_name)
    to_station = resolve_station_code(dest_city_name)
    
    # 2. Proceed to fetch flights and trains only if codes were found
    flights = []
    if source_iata and dest_iata:
        flights = fetch_flights_realtime(source_iata, dest_iata, data.get("date"), distance_km)
        
    trains = []
    if from_station and to_station:
        trains = fetch_trains_realtime(from_station, to_station, data.get("date"), distance_km)

    if not flights and not trains:
        return jsonify(get_fallback_transport(source_city_name, dest_city_name, distance_km))
        
    return jsonify(flights + trains)
@transport_bp.route("/lock-transport", methods=["POST"])
def lock_transport():
    data = request.get_json()
    current_trip["transport"] = data
    return jsonify({"message": "Transport locked", "transport": data})
