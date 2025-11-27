from flask import Flask, request, jsonify
from flask_cors import CORS 
import json
import os
import sys

# --- Fix for Python Module Imports (Ensures nlp_preference_engine is found) ---
sys.path.insert(0, os.getcwd())

# Import the ML module (which also contains the data loading logic)
try:
    from nlp_preference_engine import initialize_model
except ModuleNotFoundError:
    print("\n--- CRITICAL MODULE ERROR ---")
    print("Failed to import 'nlp_preference_engine'. Please ensure:")
    print("1. You have saved the model file as 'nlp_preference_engine.py'.")
    print("2. You have installed all dependencies (Flask, scikit-learn, numpy).")
    print("--- --------------------- ---")
    sys.exit(1)


# --- FLASK SETUP ---
app = Flask(__name__)
CORS(app) 

# --- GLOBAL MODEL & DATA STORAGE ---
matcher = None
all_pois = []

@app.route('/')
def index():
    if matcher is None:
        return jsonify({"status": "ERROR", "message": "ML Model failed to initialize. Check console for CSV file path error."}), 500
    else:
        return jsonify({"status": "RUNNING", "message": "AI Itinerary Planner Backend is active and the ML model is loaded."})

@app.route('/api/cities', methods=['GET'])
def get_cities():
    """
    NEW: Endpoint to provide the list of unique Uttarakhand cities from the dataset.
    Used by the JS frontend for autocomplete and validation.
    """
    if matcher is None:
        return jsonify({"error": "ML Model not initialized."}), 503
    
    # Call the new method on the PreferenceMatcher instance
    unique_cities = matcher.get_unique_cities()
    return jsonify({"cities": unique_cities})


def create_context_string(top_pois: list) -> str:
    """
    Formats the highly ranked POI data into a concise string prompt for Gemini.
    """
    context_parts = []
    for poi in top_pois[:10]:
        context_parts.append(
            f"Name: {poi['name']}, City: {poi['city']}, Category: {poi['category']}, Description: {poi['description']}"
        )
    
    return "Use ONLY the following highly-ranked, personalized POIs from the Uttarakhand Tourism dataset for your itinerary. Prioritize these places: " + "; ".join(context_parts)

# --- Initialization Function ---

def initialize_ml_model():
    """
    Loads data and initializes the ML model once when the Flask app starts.
    """
    global matcher, all_pois
    LOCAL_CSV_FILENAME = "uttarakhand_tourism_dataset.csv" 
    
    try:
        with open(LOCAL_CSV_FILENAME, 'r') as f:
            csv_content = f.read()
    except FileNotFoundError:
        print(f"CRITICAL ERROR: Uttarakhand dataset not found! Looking for '{LOCAL_CSV_FILENAME}' in the current directory.")
        matcher = None 
        return

    try:
        matcher = initialize_model(csv_content)
        all_pois = matcher.poi_data
        print(f"SUCCESS: ML Preference Matcher initialized with {len(all_pois)} POIs.")
    except NameError:
        print("CRITICAL ERROR: 'initialize_model' function was not found after import attempt.")
        matcher = None
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to initialize ML model: {e}")
        matcher = None


@app.route('/api/rank_pois', methods=['POST'])
def rank_pois_endpoint():
    """
    Endpoint for the JavaScript frontend. Performs the ML ranking step.
    """
    if matcher is None:
        return jsonify({"error": "ML Model not initialized. Check server logs."}), 503

    try:
        data = request.json
        user_preference = data.get('preferences', '')
        user_city = data.get('destination', '').strip()
        
        # --- NEW VALIDATION CHECK ---
        # Perform initial validation to prevent unnecessary processing
        if matcher.get_unique_cities() and user_city not in matcher.get_unique_cities():
            return jsonify({"error": f"Invalid Destination: '{user_city}' is not a valid city in the Uttarakhand dataset."}), 400

        if not user_preference:
             return jsonify({"error": "Preferences must be provided for ranking."}), 400

        # --- ML STEP: Call the custom Preference Matcher ---
        ranked_list = matcher.rank_pois(user_preference)
        
        # --- LOGIC STEP: Filter POIs by selected city before sending to Gemini ---
        # This ensures Gemini only suggests places the user can actually visit.
        city_filtered_pois = [poi for poi in ranked_list if poi['city'].lower() == user_city.lower()]
        
        if not city_filtered_pois:
             return jsonify({"error": f"No relevant POIs found in {user_city} matching your preferences."}), 400


        # Select the top 15 relevant and city-filtered POIs
        top_pois = city_filtered_pois[:15] 
        
        # Create the specific prompt augmentation for the Gemini API
        context_for_gemini = create_context_string(top_pois)
        
        return jsonify({
            "ranked_pois": top_pois,
            "context_for_gemini": context_for_gemini
        })

    except Exception as e:
        print(f"Error during POI ranking: {e}")
        return jsonify({"error": f"Internal server error during ML processing: {str(e)}"}), 500

if __name__ == '__main__':
    initialize_ml_model() 
    app.run(port=5000, debug=True, use_reloader=False)