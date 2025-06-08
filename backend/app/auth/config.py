from datetime import timedelta
import os

class AuthConfig:
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')  # À changer en production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Password Policy
    PASSWORD_MIN_LENGTH = 4
    PASSWORD_REQUIRE_UPPERCASE = False
    PASSWORD_REQUIRE_LOWERCASE = False
    PASSWORD_REQUIRE_NUMBERS = False
    PASSWORD_REQUIRE_SPECIAL = False
    
    # Session Configuration
    SESSION_TIMEOUT = timedelta(minutes=30)
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_TIME = timedelta(minutes=15)
    
    # Token Configuration
    TOKEN_LENGTH = 32
    TOKEN_EXPIRY = timedelta(hours=24)
    
    # Email Configuration
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    MAIL_FROM = os.getenv('MAIL_FROM', 'noreply@cabinetmedical.com')
    
    @staticmethod
    def init_app(app):
        app.config['JWT_SECRET_KEY'] = AuthConfig.JWT_SECRET_KEY
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = AuthConfig.JWT_ACCESS_TOKEN_EXPIRES
        app.config['JWT_REFRESH_TOKEN_EXPIRES'] = AuthConfig.JWT_REFRESH_TOKEN_EXPIRES 