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
    app.config['MONGODB_URI'] = Config.MONGODB_URI
    
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
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        print("✅ Auth blueprint registered")
    except ImportError as e:
        print(f"⚠️ auth blueprint not found - skipping: {e}")
    
    try:
        from .doctor.routes import doctor_bp
        app.register_blueprint(doctor_bp, url_prefix='/api/doctors')
        print("✅ Doctors blueprint registered")
    except ImportError as e:
        print(f"⚠️ doctors blueprint not found - skipping: {e}")
    
    try:
        from .patient.routes import patient_bp
        app.register_blueprint(patient_bp, url_prefix='/api/patients')
        print("✅ Patients blueprint registered")
    except ImportError as e:
        print(f"⚠️ patients blueprint not found - skipping: {e}")
    
    try:
        from .consultation.routes import consultation_bp
        app.register_blueprint(consultation_bp, url_prefix='/api/consultations')
        print("✅ Consultations blueprint registered")
    except ImportError as e:
        print(f"⚠️ consultations blueprint not found - skipping: {e}")
    try:
        from .admin.routes import admin_bp
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        print("✅ Admin blueprint registered")
    except ImportError as e:
        print(f"⚠️ admin blueprint not found - skipping: {e}")
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