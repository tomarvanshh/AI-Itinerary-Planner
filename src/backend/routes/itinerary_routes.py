from flask import Blueprint, request, jsonify
from backend.services.itinerary_service import generate_itinerary
from backend.services.llm_service import refine_itinerary

itinerary_bp = Blueprint("itinerary", __name__)

@itinerary_bp.route("/generate-itinerary", methods=["POST"])
def generate():
    data = request.get_json()

    try:
        places = data.get("places", [])
        days = int(data.get("days", 1))
        preferences = data.get("preferences", [])

        if not places:
            return jsonify({"error": "No places provided"}), 400

        raw_itinerary = generate_itinerary(
            places,
            days,
            preferences
        )

        # Optional LLM refinement
        final_itinerary = refine_itinerary(raw_itinerary, preferences)

        return jsonify(final_itinerary)

    except Exception as e:
        print("Itinerary generation error:", e)
        return jsonify({"error": "Failed to generate itinerary"}), 500
