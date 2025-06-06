import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB Atlas Configuration
    MONGO_URI = os.getenv('MONGO_URI')
    if not MONGO_URI:
        raise ValueError("No MONGO_URI environment variable set")
    
    # MongoDB Options
    MONGO_OPTIONS = {
        'retryWrites': True,
        'w': 'majority',
        'ssl': True,
        'ssl_cert_reqs': None,  # Don't verify SSL certificate
        'connectTimeoutMS': 30000,
        'maxPoolSize': 50
    }
    
    # Neo4j AuraDB Configuration
    NEO4J_URI = os.getenv('NEO4J_URI')
    NEO4J_USER = os.getenv('NEO4J_USER')
    NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD')
    
    if not all([NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD]):
        raise ValueError("Missing Neo4j environment variables")
    
    # Neo4j Connection Options
    NEO4J_OPTIONS = {
        'max_connection_lifetime': 3600,  # 1 hour
        'max_connection_pool_size': 50,
        'connection_acquisition_timeout': 60,  # 1 minute
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        raise ValueError("No JWT_SECRET_KEY environment variable set")
    
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days
    
    # Security Configuration
    BCRYPT_LOG_ROUNDS = 13  # Strong password hashing
    CORS_HEADERS = [
        'Content-Type',
        'Authorization',
        'Access-Control-Allow-Credentials'
    ]
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("No SECRET_KEY environment variable set")
    
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per minute"
    RATELIMIT_STORAGE_URL = "memory://" 