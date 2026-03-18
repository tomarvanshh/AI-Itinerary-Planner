import http.client
import json
from amadeus import Client, ResponseError
from flask import current_app
from backend.services.distance_service import calculate_haversine
# Standard industry rates for estimation (Rupees per KM)
RATE_FLIGHT = 6.5  # Approximate cost for domestic flights
RATE_TRAIN = 1.2   # Approximate 3rd AC / Express rate
RATE_CAB = 18.0    # standard Intercity cab rate

def get_fallback_transport(source_city, dest_city, distance_km):
    """
    Generates synthetic transport options if APIs are down or quotas exceeded.
    """
    options = [
        {
            "type": "Flight (Estimated)",
            "provider": "Air India / IndiGo",
            "price": round(distance_km * RATE_FLIGHT + 1500, 2), # Base tax added
            "duration": f"{round(distance_km / 500, 1)}h", # Avg 500km/h
            "is_estimate": True
        },
        {
            "type": "Train (Estimated)",
            "name": "Express Special",
            "number": "00000",
            "price": round(distance_km * RATE_TRAIN + 200, 2),
            "duration": f"{round(distance_km / 55, 1)}h", # Avg 55km/h
            "is_estimate": True
        }
    ]
    return options


def get_amadeus_client():
    return Client(
        client_id=current_app.config["AMADEUS_CLIENT_ID"],
        client_secret=current_app.config["AMADEUS_CLIENT_SECRET"]
    )
from amadeus import Client, Location

def resolve_iata_code(city_name):
    """Translates city name to Amadeus IATA code."""
    amadeus = get_amadeus_client()
    try:
        # Search for cities matching the keyword
        response = amadeus.reference_data.locations.get(
            keyword=city_name,
            subType=Location.CITY
        )
        if response.data:
            # Return the IATA code of the most relevant result
            return response.data[0]['iataCode']
    except Exception as e:
        print(f"IATA Mapping Error for {city_name}: {e}")
    return None

def resolve_station_code(city_name):
    """
    Translates city name to IRCTC Station code using the IRCTC1 host.
    This is more stable than the indianrailways host.
    """
    # Fix for the AttributeError: check if city_name exists
    if city_name is None:
        return None
    
    STATION_CODES = {
    "mumbai": "BDTS",
    "delhi": "NDLS",
    "bangalore": "SBC",
    "chennai": "MAS",
    "kolkata": "KOAA",
    "hyderabad": "SC",
    "pune": "PUNE",
    "jaipur": "JP",
    "lucknow": "LKO",
    "ahmedabad": "ADI",
    "dehradun": "DDN",
    "meerut": "MTC",
    "manali": "MNI",
    "roorkee": "RK",
    "shimla": "SML",
    "sirsa": "SSA",
    }
    # hardcoded mapping for major cities to avoid API calls for common routes, can be expanded as needed
    city_name = city_name.lower()
    if city_name in STATION_CODES:
        return STATION_CODES[city_name]
    conn = http.client.HTTPSConnection("irctc1.p.rapidapi.com")
    headers = {
        'x-rapidapi-key': current_app.config["RAPIDAPI_KEY"],
        'x-rapidapi-host': "irctc1.p.rapidapi.com"
    }
    
    # URL encode the city name (handle spaces like 'New Delhi')
    query = city_name.replace(" ", "%20")
    
    try:
        # Using the searchStation endpoint on your WORKING host
        conn.request("GET", f"/api/v1/searchStation?query={query}", headers=headers)
        res = conn.getresponse()
        data = json.loads(res.read().decode("utf-8"))
        
        # Check if the API returned data (usually in 'data' list)
        if data.get('data') and len(data['data']) > 0:
            # Return the code of the top matching station
            # Example: Searching 'Delhi' returns {'code': 'NDLS', 'name': 'NEW DELHI', ...}
            return data['data'][0]['code']
        else:
            print(f"No station found for {city_name}")
            return 'DDUN'  # Default to Dehradun for testing, can be changed as needed
            
    except Exception as e:
        print(f"Station Mapping Error for {city_name}: {e}")
    return None

def fetch_flights_realtime(source_iata, dest_iata, date, distance_km=0):
    amadeus = get_amadeus_client()
    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=source_iata,
            destinationLocationCode=dest_iata,
            departureDate=date,
            adults=1
        )
        # Simplify the massive JSON for your frontend
        flights = []
        for offer in response.data[:5]:  # Take top 5
            flights.append({
                "type": "Flight",
                "provider": offer['itineraries'][0]['segments'][0]['carrierCode'],
                "price": round(float(offer['price']['total']), 2),
                "duration": offer['itineraries'][0]['duration'].replace('PT', '').lower(),
                "url": "https://www.google.com/travel/flights" # Placeholder for booking
            })
        return flights
    except Exception as e:
        print(f"Amadeus Quota/Error: {e}. Switching to estimate.")
        # Return a single estimated flight based on distance
        return [{
            "type": "Flight (Estimated)",
            "provider": "Generic Carrier",
            "price": round(distance_km * RATE_FLIGHT + 1000, 2),
            "duration": "2h 15m",
            "url": "#"
        }]

def fetch_trains_realtime(from_code, to_code, date, distance_km=0):
    conn = http.client.HTTPSConnection("irctc1.p.rapidapi.com")
    headers = {
        'x-rapidapi-key': current_app.config["RAPIDAPI_KEY"],
        'x-rapidapi-host': "irctc1.p.rapidapi.com"
    }
    
    # Path matches your demo: /api/v3/trainBetweenStations
    path = f"/api/v3/trainBetweenStations?fromStationCode={from_code}&toStationCode={to_code}&dateOfJourney={date}"
    
    try:
        conn.request("GET", path, headers=headers)
        res = conn.getresponse()
        data = json.loads(res.read().decode("utf-8"))
        
        trains = []
        for t in data.get('data', [])[:5]:
            trains.append({
                "type": "Train",
                "name": t['train_name'],
                "number": t['train_number'],
                "price": 1200, # RapidAPI sometimes needs a second call for fare, we'll estimate for now
                "duration": t['duration']
            })
        return trains
    except Exception as e:
        print(f"RapidAPI Error: {e}")
        return []