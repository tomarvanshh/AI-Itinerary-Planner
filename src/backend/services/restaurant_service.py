import requests,os
from flask import current_app

GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"


def fetch_nearby_restaurants(lat, lon, radius=1000):
    api_key = os.getenv("GOOGLE_MAPS_RESTAURANT_API_KEY")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.displayName,places.rating,places.priceLevel,places.location,places.servesLunch,places.servesDinner,places.websiteUri"
    }

    body = {
        "includedTypes": ["restaurant", "cafe"],
        "maxResultCount": 10,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lon
                },
                "radius": radius
            }
        }
    }

    response = requests.post(GOOGLE_PLACES_URL, headers=headers, json=body)
    data = response.json()
    if "error" in data:
        print("Google Places API Error:", data["error"])
        return []
    return data.get("places", [])


def score_restaurant(place, meal_type):
    score = 0
    # place holds restaurants json details from api

    # ------------------------------------------
    # 1️⃣ Rating score
    # ------------------------------------------
    rating = place.get("rating", 0)
    score += rating * 2

    # ------------------------------------------
    # 2️⃣ Price level handling (FIXED)
    # ------------------------------------------
    price_level = place.get("priceLevel", "PRICE_LEVEL_MODERATE")

    price_map = {
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4
    }

    numeric_price = price_map.get(price_level, 2)  # default moderate

    # ------------------------------------------
    # 3️⃣ Meal suitability
    # ------------------------------------------
    if meal_type == "lunch" and place.get("servesLunch"):
        score += 3

    if meal_type == "dinner" and place.get("servesDinner"):
        score += 3

    # ------------------------------------------
    # 4️⃣ Bonus: premium features
    # ------------------------------------------
    if place.get("reservable"):
        score += 1

    if place.get("websiteUri"):
        score += 1

    return score


def select_best_restaurant(places, meal_type, budget_per_meal):
    if not places:
        return None

    scored = []

    for p in places:
        s = score_restaurant(p, meal_type)
        scored.append((s, p))

    scored.sort(reverse=True, key=lambda x: x[0])

    best = scored[0][1]

    return {
        "name": best.get("displayName", {}).get("text"),
        "rating": best.get("rating"),
        "priceLevel": best.get("priceLevel"),
        "type": meal_type,
        "website":  best.get("websiteUri","")
    }