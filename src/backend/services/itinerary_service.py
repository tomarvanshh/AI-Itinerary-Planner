from backend.services.distance_service import calculate_haversine
from backend.services.clustering_service import kmeans_cluster_places
from backend.services.semantic_service import compute_similarity

MAX_DAYS = 7
MAX_HOURS_PER_DAY = 8
CITY_TRAVEL_SPEED = 25


def generate_itinerary(places, days_requested, user_preferences):
    if not places:
        return []

    days_requested = min(days_requested, MAX_DAYS)

    # 1️⃣ Semantic ranking
    ranked_places = compute_similarity(user_preferences, places)

    filtered_places = [
        p for p in ranked_places
        if p.get("semantic_score", 0) > 0.2
    ]

    if not filtered_places:
        filtered_places = ranked_places

    # 2️⃣ Cluster geographically
    clusters = kmeans_cluster_places(filtered_places, days_requested)


    itinerary = []

    for day_index, cluster in enumerate(clusters):

        cluster_sorted = sorted(
            cluster,
            key=lambda x: (
            x.get("priority", 0),
            x.get("rating", 0)
            ),
            reverse=True
        )

        day_plan = []   
        total_time = 0      ## start of the day time = 0
        previous_place = None   ## None for start of the day

        for place in cluster_sorted:
            place_time = place.get("avg_time_hr", 1.5)
            travel_time = 0
            if previous_place is not None:  # very first place of the day
                if all(k in previous_place for k in ("lat", "lon")) and \
                    all(k in place for k in ("lat", "lon")):
                    ## make sure lat/lon exist for both places
                    distance = calculate_haversine(
                    previous_place["lat"],
                    previous_place["lon"],
                    place["lat"],
                    place["lon"]
                    )
                    travel_time = distance / CITY_TRAVEL_SPEED
                

            if total_time + place_time + travel_time <= MAX_HOURS_PER_DAY and len(day_plan) < 6:    
                # Sightseeing Time + Travel Time doesn't push the day over 8 hours.
                # day doesn't already have 6 places (to prevent a "marathon" itinerary)
                day_plan.append({
                    "name": place["name"],
                    "sightseeing_hr": round(place_time, 2),
                    "travel_hr": round(travel_time, 2)
                })

                total_time += place_time + travel_time
                previous_place = place  # previous place is updated so next travel time starts from here

        if day_plan:
            itinerary.append({
                "day": day_index + 1,
                "total_hours": round(total_time, 2),
                "places": day_plan
            })
    print("Total places:", len(places))
    print("Filtered places:", len(filtered_places))
    print("Clusters:", [len(c) for c in clusters])


    return itinerary
