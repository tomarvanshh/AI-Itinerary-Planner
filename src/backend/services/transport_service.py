from flask import Blueprint, request, jsonify

def recommend_transport(distance, days, budget):

    # Transport profiles
    transport_modes = [
        {
            "mode": "Bus",
            "speed": 50,            # km/h
            "cost_per_km": 2,
            "max_distance": 400
        },
        {
            "mode": "Train",
            "speed": 80,
            "cost_per_km": 1.5,
            "max_distance": 1200
        },
        {
            "mode": "Flight",
            "speed": 600,
            "cost_per_km": 5,
            "max_distance": 5000
        },
        {
            "mode": "Cab",
            "speed": 60,
            "cost_per_km": 3,
            "max_distance": 700
        }
    ]

    results = []

    for t in transport_modes:
        time_hr = distance / t["speed"]
        cost = distance * t["cost_per_km"]

        score = 100

        # Distance penalty
        if distance > t["max_distance"]:
            score -= 40

        # Budget penalty
        if cost > budget:
            score -= 50
        else:
            score += 10

        # Time penalty (more than 1 day travel)
        if time_hr > 24:
            score -= 20

        # Soft realism penalty
        if t["mode"] == "Flight" and distance < 200:
            score -= 30
        if t["mode"] == "Bus" and distance > 800:
            score -= 30

        results.append({
            "mode": t["mode"],
            "score": score,
            "estimated_time_hr": round(time_hr, 1),
            "estimated_cost": int(cost)
        })

    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)

    return {
    "recommended": results[0]["mode"],
    "options": results[:3]
    }

