from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)


    # Register Blueprints
    from .routes.city_routes import city_bp
    from .routes.transport_routes import transport_bp
    from .routes.places_routes import places_bp

    app.register_blueprint(city_bp, url_prefix="/api")
    app.register_blueprint(transport_bp, url_prefix="/api")
    app.register_blueprint(places_bp, url_prefix="/api")

    return app
