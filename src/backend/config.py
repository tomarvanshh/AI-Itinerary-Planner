import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
    MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    if not GOOGLE_PLACES_API_KEY:
        raise RuntimeError("GOOGLE_PLACES_API_KEY not found in environment variables")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not found in environment variables")

    if not MAPBOX_TOKEN:
        raise RuntimeError("MAPBOX_TOKEN not found in environment variables")
