import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
    MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID")
    AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET")
    RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

    if not GOOGLE_PLACES_API_KEY:
        raise RuntimeError("GOOGLE_PLACES_API_KEY not found in environment variables")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not found in environment variables")

    if not AMADEUS_CLIENT_ID:
        raise RuntimeError("AMADEUS_CLIENT_ID not found in environment variables")

    if not AMADEUS_CLIENT_SECRET:
        raise RuntimeError("AMADEUS_CLIENT_SECRET not found in environment variables")

    if not RAPIDAPI_KEY:
        raise RuntimeError("RAPIDAPI_KEY not found in environment variables")

    if not MAPBOX_TOKEN:
        raise RuntimeError("MAPBOX_TOKEN not found in environment variables")
