import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Config:
    # Neo4j AuraDB Configuration - Using working credentials
    NEO4J_URI = "neo4j+s://236ac439.databases.neo4j.io"
    NEO4J_USER = "neo4j"
    NEO4J_PASSWORD = quote_plus("6HMkNw9Oh2s3xX_rH4I9DV4ZT-rSN_z8lsQ24MeZKAg")
    
    # Neo4j Connection Options
    NEO4J_OPTIONS = {
        'max_connection_lifetime': 3600,  # 1 hour
        'max_connection_pool_size': 50,
        'connection_acquisition_timeout': 60,  # 1 minute
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-default-jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days
    
    # Security Configuration
    BCRYPT_LOG_ROUNDS = 13  # Strong password hashing
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-default-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per minute"
    RATELIMIT_STORAGE_URL = "memory://"
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")