def score_places(places, preferences):
    scored = []

    for place in places:
        score = place["priority"]

        # Rating boost
        score += place.get("rating", 0) * 0.7

        # Preference match boost
        if any(tag in preferences for tag in place["tags"]):
            score += 3

        place_copy = place.copy()
        place_copy["score"] = round(score, 2)

        scored.append(place_copy)

    # Sort descending by score
    scored.sort(key=lambda x: x["score"], reverse=True)

    return scored
