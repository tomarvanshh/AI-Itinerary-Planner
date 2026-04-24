import os
from dotenv import load_dotenv
 
load_dotenv()
 
 
class Config:
    GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
    MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
 
    # ── CORS ───────────────────────────────────────────────────────
    # Reads comma-separated origins from .env
    # Returns a list if set, or None if not set
    # None is handled gracefully in create_app() — falls back to localhost defaults
    _origins_env = os.getenv("ALLOWED_ORIGINS", "")
    ALLOWED_ORIGINS = (
        [o.strip() for o in _origins_env.split(",") if o.strip()]
        if _origins_env
        else None
    )
 
    # ── Validation (warn, don't crash) ────────────────────────────
    @classmethod
    def validate(cls):
        missing = []
        if not cls.GOOGLE_PLACES_API_KEY:
            missing.append("GOOGLE_PLACES_API_KEY")
        if not cls.MAPBOX_TOKEN:
            missing.append("MAPBOX_TOKEN")
        if not cls.GEMINI_API_KEY:
            missing.append("GEMINI_API_KEY")
        if missing:
            print(f"[WARNING] Missing environment variables: {', '.join(missing)}")
            print("[WARNING] Some features may not work correctly.")