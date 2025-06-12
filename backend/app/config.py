import os
from dotenv import load_dotenv
from urllib.parse import quote_plus
from datetime import timedelta

load_dotenv()


class Config:
    # MongoDB Configuration
    MONGODB_USERNAME = os.getenv("MONGODB_USERNAME", "cabinet_medical")
    MONGODB_PASSWORD = os.getenv("MONGODB_PASSWORD", "admin123")
    MONGODB_URI = f"mongodb+srv://{MONGODB_USERNAME}:{quote_plus(MONGODB_PASSWORD)}@cluster0.4rpd6ts.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

    # Neo4j AuraDB Configuration
    NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://236ac439.databases.neo4j.io")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv(
        "NEO4J_PASSWORD", "6HMkNw9Oh2s3xX_rH4I9DV4ZT-rSN_z8lsQ24MeZKAg"
    )

    # Neo4j Connection Options
    NEO4J_OPTIONS = {
        "max_connection_lifetime": 3600,  # 1 hour
        "max_connection_pool_size": 50,
        "connection_acquisition_timeout": 60,  # 1 minute
    }

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days

    # Security Configuration
    BCRYPT_LOG_ROUNDS = 13  # Strong password hashing

    # Flask Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "dev")
    DEBUG = os.getenv("DEBUG", "False") == "True"

    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per minute"
    RATELIMIT_STORAGE_URL = "memory://"


class TestConfig(Config):
    """Test configuration."""

    TESTING = True

    # Use a separate test database for MongoDB
    MONGODB_URI = "mongodb+srv://randomstuffformehdi:root@cluster0.kkryhtz.mongodb.net/test_db?retryWrites=true&w=majority&appName=Cluster0"

    # Use test credentials for Neo4j
    NEO4J_URI = os.environ.get(
        "NEO4J_TEST_URI", "neo4j+s://236ac439.databases.neo4j.io"
    )
    NEO4J_USER = os.environ.get("NEO4J_TEST_USER", "neo4j")
    NEO4J_PASSWORD = os.environ.get(
        "NEO4J_TEST_PASSWORD", "6HMkNw9Oh2s3xX_rH4I9DV4ZT-rSN_z8lsQ24MeZKAg"
    )

    # Test JWT configuration
    JWT_SECRET_KEY = "test-jwt-secret"
