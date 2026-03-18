import requests
from flask import current_app

def fetch_hotels_service(lat, lon, total_budget, total_days):
    # Calculate target price per night (25% of budget / days)
    # Example: 50,000 budget for 5 days -> 12,500 total for hotels -> 2,500 per night
    accommodation_budget = total_budget * 0.25
    target_price_per_night = accommodation_budget / total_days

    # Fetch raw data from Google Places (as you already do)
    # ... (existing request logic) ...
    api_key = current_app.config["GOOGLE_PLACES_API_KEY"]
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    params = {
        "location": f"{lat},{lon}",
        "radius": 10000, # 10km radius
        "type": "lodging",
        "key": api_key
    }
    
    response = requests.get(url, params=params)
    results = response.json().get("results", [])

    hotels = []
    for h in results:
        # Mocking a dynamic price based on rating/place_id for realism 
        # since Google Nearby Search doesn't return exact night rates
        base_rate = target_price_per_night * 0.8  # Start at 80% of target
        variation = (len(h['name']) % 10) * 0.05 # Add some random variation
        mock_price = round(base_rate + (base_rate * variation))

        # Calculate how close this is to our 25% target
        price_diff = abs(mock_price - target_price_per_night)

        hotels.append({
            "hotel_id": h["place_id"],
            "name": h["name"],
            "lat": h["geometry"]["location"]["lat"], # Add these explicitly
            "lon": h["geometry"]["location"]["lng"], # Map 'lng' to 'lon'
            "rating": h.get("rating", 0),
            "address": h.get("vicinity"),
            "estimated_price": mock_price,
            "proximity_score": price_diff, # Lower is better (closer to 25% budget)
            "photo_ref": h.get("photos", [{}])[0].get("photo_reference"),
        })

    # Sort by proximity to the 25% budget target
    hotels.sort(key=lambda x: x["proximity_score"])

    # Return only the top 10 matches
    return hotels[:10]
