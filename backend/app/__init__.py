from flask import Flask
from datetime import timedelta
from .extensions import init_extensions, close_extensions
import os
from dotenv import load_dotenv

def create_app():
    """Application factory function"""
    
    # Load environment variables
    load_dotenv()
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/cabinet_medical')
    app.config['NEO4J_URI'] = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
    app.config['NEO4J_USER'] = os.getenv('NEO4J_USER', 'neo4j')
    app.config['NEO4J_PASSWORD'] = os.getenv('NEO4J_PASSWORD', 'password')
    
    # Initialize extensions
    init_extensions(app)
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.doctor import doctor_bp
    from .routes.patient import patient_bp
    from .routes.consultation import consultation_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(doctor_bp, url_prefix='/api/doctors')
    app.register_blueprint(patient_bp, url_prefix='/api/patients')
    app.register_blueprint(consultation_bp, url_prefix='/api/consultations')
    
    # Register teardown function
    @app.teardown_appcontext
    def teardown_db(exception=None):
        close_extensions()
    
    return app 