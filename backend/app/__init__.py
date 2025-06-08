from flask import Flask
from datetime import timedelta
from .extensions import init_extensions, close_extensions
import os
from dotenv import load_dotenv
from .config import Config


def create_app():
    """Application factory function - Simplified like your old project"""
    # Load environment variables
    load_dotenv()

    # Create Flask app
    app = Flask(__name__)
<<<<<<< HEAD
    
    # Use centralized configuration from Config class
    app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = Config.JWT_ACCESS_TOKEN_EXPIRES
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = Config.JWT_REFRESH_TOKEN_EXPIRES
    app.config['MONGODB_URI'] = Config.MONGODB_URI
    
    # Neo4j Configuration - Use Config class values
    app.config['NEO4J_URI'] = Config.NEO4J_URI
    app.config['NEO4J_USER'] = Config.NEO4J_USER
    app.config['NEO4J_PASSWORD'] = Config.NEO4J_PASSWORD
    app.config['NEO4J_OPTIONS'] = Config.NEO4J_OPTIONS
    
    # Security Configuration
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['BCRYPT_LOG_ROUNDS'] = Config.BCRYPT_LOG_ROUNDS
    
    # Debug configuration
    app.config['DEBUG'] = Config.DEBUG
    
    # Rate Limiting
    app.config['RATELIMIT_DEFAULT'] = Config.RATELIMIT_DEFAULT
    app.config['RATELIMIT_STORAGE_URL'] = Config.RATELIMIT_STORAGE_URL
    
=======

    # Use centralized configuration from Config class
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = Config.JWT_REFRESH_TOKEN_EXPIRES
    app.config["MONGODB_URI"] = Config.MONGODB_URI

    # Neo4j Configuration - Use Config class values
    app.config["NEO4J_URI"] = Config.NEO4J_URI
    app.config["NEO4J_USER"] = Config.NEO4J_USER
    app.config["NEO4J_PASSWORD"] = Config.NEO4J_PASSWORD
    app.config["NEO4J_OPTIONS"] = Config.NEO4J_OPTIONS

    # Security Configuration
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["BCRYPT_LOG_ROUNDS"] = Config.BCRYPT_LOG_ROUNDS

    # Debug configuration
    app.config["DEBUG"] = Config.DEBUG

    # Rate Limiting
    app.config["RATELIMIT_DEFAULT"] = Config.RATELIMIT_DEFAULT
    app.config["RATELIMIT_STORAGE_URL"] = Config.RATELIMIT_STORAGE_URL

>>>>>>> f11b8ae413bff5543672411d59918924404b7444
    # Debug: Print Neo4j configuration (remove password for security)
    print(f"🔍 Neo4j URI: {app.config['NEO4J_URI']}")
    print(f"🔍 Neo4j User: {app.config['NEO4J_USER']}")
    print(f"🔍 Neo4j Password: {'*' * len(app.config['NEO4J_PASSWORD'])}")

    # Initialize extensions
    try:
        init_extensions(app)
        print("✅ Extensions initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize extensions: {e}")
        import traceback

        traceback.print_exc()
        # Don't return None - create a minimal app for debugging
        print("⚠️ Creating minimal app without database connections...")

    # Register blueprints - like your old project structure
    try:
        from .auth.routes import auth_bp

        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        print("✅ Auth blueprint registered")
    except ImportError as e:
        print(f"⚠️ auth blueprint not found - skipping: {e}")

    try:
        from .doctor.routes import doctor_bp

        app.register_blueprint(doctor_bp, url_prefix="/api/doctors")
        print("✅ Doctors blueprint registered")
    except ImportError as e:
        print(f"⚠️ doctors blueprint not found - skipping: {e}")

    try:
        from .patient.routes import patient_bp

        app.register_blueprint(patient_bp, url_prefix="/api/patients")
        print("✅ Patients blueprint registered")
    except ImportError as e:
        print(f"⚠️ patients blueprint not found - skipping: {e}")

    try:
        from .consultation.routes import consultation_bp

        app.register_blueprint(consultation_bp, url_prefix="/api/consultations")
        print("✅ Consultations blueprint registered")
    except ImportError as e:
        print(f"⚠️ consultations blueprint not found - skipping: {e}")
    try:
        from .admin.routes import admin_bp

        app.register_blueprint(admin_bp, url_prefix="/api/admin")
        print("✅ Admin blueprint registered")
    except ImportError as e:
        print(f"⚠️ admin blueprint not found - skipping: {e}")
<<<<<<< HEAD
    
=======

>>>>>>> f11b8ae413bff5543672411d59918924404b7444
    # Basic routes for testing
    @app.route("/")
    def index():
        return {
            "message": "API Cabinet Medical",
            "status": "running",
            "version": "1.0.0",
        }

    @app.route("/api/health")
    def health_check():
        return {
            "status": "healthy",
            "databases": {"mongodb": "connected", "neo4j": "connected"},
        }

    # Register teardown function
    app.teardown_appcontext(close_extensions)

    return app
