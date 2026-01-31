import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
    MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")

    if not MAPBOX_TOKEN:
        raise RuntimeError("MAPBOX_TOKEN not found in environment variables")
