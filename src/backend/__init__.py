from flask import Flask
from flask_cors import CORS
from .config import Config
 
 
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    print(">>> ALLOWED_ORIGINS:", app.config.get("ALLOWED_ORIGINS"))  # ADD THIS
 
    # ── CORS Configuration ─────────────────────────────────────────
    # app.config.get("ALLOWED_ORIGINS") returns None when not set in .env
    # We must fall back to the localhost list explicitly in that case
    origins_from_config = app.config.get("ALLOWED_ORIGINS")
 
    allowed_origins = origins_from_config if origins_from_config else [
        "http://localhost:5500",      # VS Code Live Server
        "http://127.0.0.1:5500",      # VS Code Live Server (alt)
        "http://localhost:3000",      # React / Vite dev server
        "http://127.0.0.1:3000",
    ]
 
    CORS(
        app,
        origins=allowed_origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "OPTIONS"]
    )
 
    # ── Register Blueprints ────────────────────────────────────────
    from .routes.city_routes import city_bp
    from .routes.transport_routes import transport_bp
    from .routes.places_routes import places_bp
    from .routes.itinerary_routes import itinerary_bp
 
    app.register_blueprint(city_bp, url_prefix="/api")
    app.register_blueprint(transport_bp, url_prefix="/api")
    app.register_blueprint(places_bp, url_prefix="/api")
    app.register_blueprint(itinerary_bp, url_prefix="/api")
 
    return app