from flask import Flask
from datetime import timedelta
from .extensions import init_extensions, close_extensions
import os
from dotenv import load_dotenv
from .config import Config

def create_app(config_class=Config):
    """Application factory function"""
    # Load environment variables
    load_dotenv()
    
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    
    # Initialize extensions
    try:
        init_extensions(app)
        print("✅ Extensions initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize extensions: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    # Register teardown function
    app.teardown_appcontext(close_extensions)
    
    # Register blueprints
    try:
        from .auth.routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        print("✅ Auth blueprint registered")
    except ImportError as e:
        print(f"⚠️  auth blueprint not found - skipping: {e}")
    
    try:
        from .routes.users import users_bp
        app.register_blueprint(users_bp, url_prefix='/api/users')
        print("✅ Users blueprint registered")
    except ImportError as e:
        print(f"⚠️  users blueprint not found - skipping: {e}")
    
    try:
        from .admin.routes import admin_bp
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        print("✅ Admin blueprint registered")
    except ImportError as e:
        print(f"⚠️  admin blueprint not found - skipping: {e}")
    
    return app