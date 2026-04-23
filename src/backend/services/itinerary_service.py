from backend.services.distance_service import calculate_haversine
from backend.services.clustering_service import kmeans_cluster_places
from backend.services.semantic_service import compute_similarity
from typing import List, Dict, Any, Optional

# NEW IMPORT
from backend.services.restaurant_service import (
    fetch_nearby_restaurants,
    select_best_restaurant
)

MAX_DAYS = 7
MAX_HOURS_PER_DAY = 8
CITY_TRAVEL_SPEED = 15 # km/h average city travel speed (adjust as needed) with traffic


def generate_itinerary(places, days_requested, user_preferences, selected_hotel=None, budget=10000):
    if not places:
        return []

    days_requested = min(days_requested, MAX_DAYS)

    # ------------------------------------------
    # 1️⃣ Semantic ranking (NLP personalization)
    # ------------------------------------------
    ranked_places = compute_similarity(user_preferences, places)

    filtered_places = [
        p for p in ranked_places
        if p.get("semantic_score", 0) > 0.2
    ]

    if not filtered_places:
        filtered_places = ranked_places

    unused_places = [
    p for p in ranked_places
    if p not in filtered_places
    ]

    # ------------------------------------------
    # 2️⃣ Cluster places by geography (K-means)
    # ------------------------------------------
    clusters = kmeans_cluster_places(filtered_places, days_requested)

    itinerary = []

    # ------------------------------------------
    # 3️⃣ FOOD BUDGET (simple version)
    # ------------------------------------------
    total_budget = budget  
    food_budget = total_budget * 0.2
    budget_per_day = food_budget / days_requested
    budget_per_meal = budget_per_day / 2

    # ------------------------------------------
    # 4️⃣ BUILD EACH DAY PLAN
    # ------------------------------------------
    for day_index, cluster in enumerate(clusters):

        # Sort places by priority + rating
        cluster_sorted = sorted(
            cluster,
            key=lambda x: (
                x.get("priority", 0),
                x.get("rating", 0)
            ),
            reverse=True
        )

        day_plan: List[Dict[str, Any]] = []
        total_time = 0
        previous_place = selected_hotel  # start from hotel

        # ------------------------------------------
        # 5️⃣ BUILD NORMAL ITINERARY (PLACES)
        # ------------------------------------------
        for place in cluster_sorted:
            place_time = place.get("avg_time_hr", 1.5)
            travel_time = 0

            if previous_place is not None:
                if all(k in previous_place for k in ("lat", "lon")) and \
                   all(k in place for k in ("lat", "lon")):

                    distance = calculate_haversine(
                        previous_place["lat"],
                        previous_place["lon"],
                        place["lat"],
                        place["lon"]
                    )

                    travel_time = distance / CITY_TRAVEL_SPEED

            # Check constraints (max 8 hrs + max 6 places)
            if total_time + place_time + travel_time <= MAX_HOURS_PER_DAY and len(day_plan) < 6:
                day_plan.append({
                    "name": place["name"],
                    "lat": place["lat"],   # IMPORTANT (needed for restaurants)
                    "lon": place["lon"],
                    "sightseeing_hr": round(place_time, 2),
                    "travel_hr": round(travel_time, 2),
                    "type": "place",
                    "generative_summary": place.get("generative_summary", ""),
                    "review_summary": place.get("review_summary", ""),
                    "photo_ref": place.get("photo_ref")
                })


                total_time += place_time + travel_time
                previous_place = place

        # ------------------------------------------
        # LOOP ENDS HERE
        # ------------------------------------------

        # 🔥 INSERT FALLBACK HERE (CORRECT PLACE)
        if len(day_plan) <= 2 and unused_places:
            base_place = next(
                (p for p in day_plan if isinstance(p, dict) and "lat" in p and "lon" in p),
                None
            )

            if base_place and isinstance(base_place, dict) and "lat" in base_place and "lon" in base_place:
                nearby_unused = sorted(
                    unused_places,
                    key=lambda p: calculate_haversine(
                        base_place["lat"],
                        base_place["lon"],
                        p["lat"],
                        p["lon"]
                    )
                )

                for extra_place in nearby_unused:
                    place_time = extra_place.get("avg_time_hr", 1.5)

                    # OPTIONAL FILTER
                    if extra_place.get("semantic_score", 0) < 0.08:
                        continue

                    if total_time + place_time > MAX_HOURS_PER_DAY:
                        break
                    if len(day_plan) >= 5:
                        break
                    day_plan.append({
                        "name": extra_place["name"],
                        "lat": extra_place["lat"],
                        "lon": extra_place["lon"],
                        "type": "fallback_place",
                    })

                    total_time += place_time
                    unused_places.remove(extra_place)


        # ------------------------------------------
        # 6️⃣ INSERT LUNCH (MIDPOINT)
        # ------------------------------------------
        if day_plan:
            mid_index = len(day_plan) // 2
            mid_place = day_plan[mid_index]

            restaurants = fetch_nearby_restaurants(
                mid_place["lat"],
                mid_place["lon"],
                radius=2000 # 2km radius for lunch options
            )

            lunch = select_best_restaurant(
                restaurants,
                "lunch",
                budget_per_meal
            )

            if lunch:
                day_plan.insert(mid_index, {
                    "name": f"🍱 Lunch at {lunch['name']}",
                    "type": "meal",
                    "meal_type": "lunch",
                    "lat": mid_place["lat"],   # 🔥 important
                    "lon": mid_place["lon"],
                    "website": lunch["website"]
                })

        # ------------------------------------------
        # 7️⃣ INSERT DINNER (END OF DAY)
        # ------------------------------------------
        if day_plan:
            # Prefer hotel for dinner if available
            # dinner place must be close to last sightseeing place to minimize travel time after a long day
            last_place = day_plan[-1]
            dinner_lat = last_place["lat"]
            dinner_lon = last_place["lon"]

            restaurants = fetch_nearby_restaurants(
                dinner_lat,
                dinner_lon,
                radius=1500
            )

            dinner = select_best_restaurant(
                restaurants,
                "dinner",
                budget_per_meal
            )

            if dinner:
                day_plan.append({
                    "name": f"🍽️ Dinner at {dinner['name']}",
                    "type": "meal",
                    "meal_type": "dinner",
                    "lat": dinner_lat,
                    "lon": dinner_lon,
                    "website": dinner["website"]
                })

        # ------------------------------------------
        # 8️⃣ FINAL DAY OBJECT
        # ------------------------------------------
        if day_plan:
            itinerary.append({
                "day": day_index + 1,
                "total_hours": round(total_time, 2),
                "places": day_plan
            })

    return itinerary