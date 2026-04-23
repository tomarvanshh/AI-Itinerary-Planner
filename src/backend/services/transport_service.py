# Transport price for per km
RATE_FLIGHT = 6.5
RATE_TRAIN = 1.2
RATE_BUS = 2.5

# Transport speed in km/h
SPEED_FLIGHT = 500
SPEED_TRAIN = 55
SPEED_BUS = 45


def get_fallback_transport(source_city, dest_city, distance_km, budget, adults):
    """
    Smart transport recommendation system
    """

    transport_budget = budget * 0.30 # Allocate 30% of total budget to transport

    

    def build_option(mode, rate, speed, extra_cost=0):
        price_per_head = round(distance_km * rate + extra_cost, 2)
        total_price = round(price_per_head * adults, 2)

        duration = round(distance_km / speed, 1)

        return {
            "type": mode,
            "price_per_head": price_per_head,
            "total_price": total_price,
            "duration": f"{duration}h",
            "is_estimate": True
        }

    flight = build_option("Flight", RATE_FLIGHT, SPEED_FLIGHT, 1500)    # adding extra cost for flight (taxes, fees)
    train = build_option("Train", RATE_TRAIN, SPEED_TRAIN, 100)
    bus = build_option("Bus", RATE_BUS, SPEED_BUS, 50)

    options = [flight, train, bus]


    # ⭐ Budget-based recommendation
    best_option = None
    min_diff = float("inf")

    for opt in options:
        diff = abs(opt["total_price"] - transport_budget)
        if diff < min_diff:
            min_diff = diff
            best_option = opt

    # Mark recommended
    for opt in options:
        opt["recommended"] = (opt == best_option)

    ## Check if budget is sufficient for at least the cheapest option (bus)
    ## if budget is not sufficient, return a message that "Not sufficient budget for transport" and continue with other services
    min_price_transport = min(opt["total_price"] for opt in options)
    if transport_budget < min_price_transport:
        min_required_budget = round(min_price_transport * 3.33, 2) # Calculate the total budget required to afford the cheapest transport option
        return {"error": f"* Not sufficient budget for transport, Atleast ₹{min_required_budget}  is required", "options": options} 
    return options