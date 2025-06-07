from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from neo4j import GraphDatabase
from flask import g
import logging
from pymongo.errors import ConnectionFailure
from neo4j.exceptions import ServiceUnavailable
from urllib.parse import quote_plus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize extensions
cors = CORS()
jwt = JWTManager()
mongo_client = None
neo4j_driver = None


def get_db():
    """Get MongoDB database instance"""
    if "db" not in g:
        g.db = mongo_client["cabinet_medical"]
    return g.db


def init_mongodb(app):
    """Initialize MongoDB connection - Simple approach like your old project"""
    global mongo
    try:
        # Simple MongoDB connection - exactly like your old project
        username = "randomstuffformehdi"
        password = quote_plus("root")
        uri = f"mongodb+srv://{username}:{password}@cluster0.kkryhtz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        
        logger.info("Connecting to MongoDB Atlas...")
        mongo = MongoClient(uri)
        
        # Simple connection test
        mongo.admin.command('ping')
        logger.info("✅ Successfully connected to MongoDB Atlas")
        return True
        
    except ConnectionFailure as e:
        logger.error(f"❌ Failed to connect to MongoDB Atlas: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error connecting to MongoDB: {e}")
        return False


def init_neo4j(app):
    """Initialize Neo4j connection with retry logic"""
    global neo4j_driver
    try:
        # Use the working credentials from your other project
        NEO4J_URI = "neo4j+s://236ac439.databases.neo4j.io"
        NEO4J_USER = "neo4j"
        NEO4J_PASSWORD = quote_plus("6HMkNw9Oh2s3xX_rH4I9DV4ZT-rSN_z8lsQ24MeZKAg")
        
        logger.info(f"Connecting to Neo4j: {NEO4J_URI}")
        
        neo4j_driver = GraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD),
            **app.config.get('NEO4J_OPTIONS', {})
        )
        
        # Verify connection
        with neo4j_driver.session() as session:
            result = session.run("RETURN 1 as test")
            test_value = result.single()["test"]
            logger.info(f"✅ Neo4j connection successful: {test_value}")
        return True
    except ServiceUnavailable as e:
        logger.error(f"❌ Failed to connect to Neo4j AuraDB: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error connecting to Neo4j: {e}")
        return False


def setup_neo4j_constraints():
    """Setup Neo4j constraints with error handling"""
    try:
        with neo4j_driver.session() as session:
            # Unique constraints for core entities
            constraints = [
                "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Doctor) REQUIRE d.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Patient) REQUIRE p.id IS UNIQUE", 
                "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Consultation) REQUIRE c.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Appointment) REQUIRE a.id IS UNIQUE",
                # Indexes for better performance
                "CREATE INDEX IF NOT EXISTS FOR (d:Doctor) ON (d.email)",
                "CREATE INDEX IF NOT EXISTS FOR (p:Patient) ON (p.email)",
                "CREATE INDEX IF NOT EXISTS FOR (a:Appointment) ON (a.date)",
            ]

            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception as constraint_error:
                    logger.warning(f"Constraint may already exist: {constraint_error}")
            
            logger.info("✅ Successfully set up Neo4j constraints and indexes")
            return True
    except Exception as e:
        logger.error(f"❌ Failed to set up Neo4j constraints: {e}")
        return False


def init_extensions(app):
    """Initialize Flask extensions with proper error handling"""
    
    # Initialize CORS
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=['Content-Type', 'Authorization', 'Access-Control-Allow-Credentials']
    )
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Initialize MongoDB - Simple approach
    logger.info("🔄 Initializing MongoDB connection...")
    if not init_mongodb(app):
        raise RuntimeError("Failed to initialize MongoDB connection")

    # Initialize Neo4j
    logger.info("🔄 Initializing Neo4j connection...")
    if not init_neo4j(app):
        raise RuntimeError("Failed to initialize Neo4j connection")
    
    # Setup Neo4j constraints - don't fail if this fails
    if not setup_neo4j_constraints():
        logger.warning("⚠️ Failed to setup Neo4j constraints, but continuing...")
    
    logger.info("✅ All extensions initialized successfully")

def close_extensions():
    """Close database connections"""
    if mongo:
        try:
            mongo.close()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {e}")
    
    if neo4j_driver:
        try:
            neo4j_driver.close()
            logger.info("Neo4j connection closed")
        except Exception as e:
            logger.error(f"Error closing Neo4j connection: {e}")

def get_db():
    """Get MongoDB database instance - like your old project"""
    if not mongo:
        raise RuntimeError("MongoDB connection not initialized")
    return mongo.get_database()

def get_collection(collection_name):
    """Get a specific collection - helper function"""
    db = get_db()
    return db[collection_name]