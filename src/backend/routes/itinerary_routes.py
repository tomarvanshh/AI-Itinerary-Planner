from flask import Blueprint, request, jsonify
from backend.services.itinerary_service import generate_itinerary
from backend.services.llm_service import generate_city_summary

itinerary_bp = Blueprint("itinerary", __name__)

@itinerary_bp.route("/generate-itinerary", methods=["POST"])
def generate():
    data = request.get_json()

    try:
        places = data.get("places", [])
        days = int(data.get("days", 1))
        preferences = data.get("preferences", [])
        # ADD THIS: Capture the hotel selected by the user
        selected_hotel = data.get("selected_hotel")
        budget = float(data.get("budget", 10000))
        dest_city = data.get("destination", {}).get("name", "the city")
        if not places:
            return jsonify({"error": "No places provided"}), 400

        raw_itinerary = generate_itinerary(
            places,
            days,
            preferences,
            selected_hotel=selected_hotel,  # Pass the selected hotel to the itinerary generator
            budget=budget  # Pass the user's total budget to the itinerary generator
        )
        # New: Fetch the final summary
        city_overview = generate_city_summary(dest_city)

        # Return a combined object instead of just a list
        return jsonify({
            "itinerary": raw_itinerary,
            "overview": city_overview
        })

    except Exception as e:
        print("Itinerary generation error:", e)
        return jsonify({"error": "Failed to generate itinerary"}), 500
