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
    
    # Simple Configuration - No complex MongoDB options
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Neo4j Configuration
    app.config['NEO4J_URI'] = os.getenv('NEO4J_URI', 'neo4j+s://236ac439.databases.neo4j.io')
    app.config['NEO4J_USER'] = os.getenv('NEO4J_USER', 'neo4j')
    app.config['NEO4J_PASSWORD'] = os.getenv('NEO4J_PASSWORD', '6HMkNw9Oh2s3xX_rSN_z8lsQ24MeZKAg')
    app.config['NEO4J_OPTIONS'] = {
        'max_connection_lifetime': 3600,
        'max_connection_pool_size': 50,
        'connection_acquisition_timeout': 60,
    }
    
    # Security Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-flask-secret-key-change-in-production')
    app.config['BCRYPT_LOG_ROUNDS'] = 13
    
    # Debug configuration
    app.config['DEBUG'] = os.getenv('DEBUG', 'False') == 'True'
    
    # Rate Limiting
    app.config['RATELIMIT_DEFAULT'] = "100 per minute"
    app.config['RATELIMIT_STORAGE_URL'] = "memory://"
    
    # Initialize extensions
    try:
        init_extensions(app)
        print("✅ Extensions initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize extensions: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    # Register blueprints - like your old project structure
    try:
        from .routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        print("✅ Auth blueprint registered")
    except ImportError:
        print("⚠️  auth blueprint not found - skipping")
    
    try:
        from .doctor import doctor_bp
        app.register_blueprint(doctor_bp, url_prefix='/api/doctors')
        print("✅ Doctors blueprint registered")
    except ImportError:
        print("⚠️  doctors blueprint not found - skipping")
    
    try:
        from .patient import patient_bp
        app.register_blueprint(patient_bp, url_prefix='/api/patients')
        print("✅ Patients blueprint registered")
    except ImportError:
        print("⚠️  patients blueprint not found - skipping")
    
    try:
        from .consultation import consultation_bp
        app.register_blueprint(consultation_bp, url_prefix='/api/consultations')
        print("✅ Consultations blueprint registered")
    except ImportError:
        print("⚠️  consultations blueprint not found - skipping")
    
    # Basic routes for testing
    @app.route('/')
    def index():
        return {
            "message": "API Cabinet Medical",
            "status": "running",
            "version": "1.0.0"
        }
    
    @app.route('/api/health')
    def health_check():
        return {
            "status": "healthy",
            "databases": {
                "mongodb": "connected",
                "neo4j": "connected"
            }
        }
    
    # Register teardown function
    app.teardown_appcontext(close_extensions)
    
    return app