from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from neo4j import GraphDatabase
from flask import current_app
import logging
from pymongo.errors import ConnectionFailure
from neo4j.exceptions import ServiceUnavailable

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize extensions
cors = CORS()
jwt = JWTManager()
mongo = None
neo4j_driver = None

def init_mongodb(app):
    """Initialize MongoDB connection with retry logic"""
    global mongo
    try:
        mongo = MongoClient(
            app.config['MONGO_URI'],
            **app.config['MONGO_OPTIONS']
        )
        # Verify connection
        mongo.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas")
        return True
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB Atlas: {e}")
        return False

def init_neo4j(app):
    """Initialize Neo4j connection with retry logic"""
    global neo4j_driver
    try:
        neo4j_driver = GraphDatabase.driver(
            app.config['NEO4J_URI'],
            auth=(app.config['NEO4J_USER'], app.config['NEO4J_PASSWORD']),
            **app.config['NEO4J_OPTIONS']
        )
        # Verify connection
        with neo4j_driver.session() as session:
            session.run("RETURN 1")
        logger.info("Successfully connected to Neo4j AuraDB")
        return True
    except ServiceUnavailable as e:
        logger.error(f"Failed to connect to Neo4j AuraDB: {e}")
        return False

def setup_neo4j_constraints():
    """Setup Neo4j constraints with error handling"""
    try:
        with neo4j_driver.session() as session:
            # Unique constraints for core entities
            constraints = [
                "CREATE CONSTRAINT IF NOT EXISTS ON (d:Doctor) ASSERT d.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS ON (p:Patient) ASSERT p.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS ON (c:Consultation) ASSERT c.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS ON (a:Appointment) ASSERT a.id IS UNIQUE",
                # Indexes for better performance
                "CREATE INDEX IF NOT EXISTS FOR (d:Doctor) ON (d.email)",
                "CREATE INDEX IF NOT EXISTS FOR (p:Patient) ON (p.email)",
                "CREATE INDEX IF NOT EXISTS FOR (a:Appointment) ON (a.date)"
            ]
            
            for constraint in constraints:
                session.run(constraint)
            
            logger.info("Successfully set up Neo4j constraints and indexes")
            return True
    except Exception as e:
        logger.error(f"Failed to set up Neo4j constraints: {e}")
        return False

def init_extensions(app):
    """Initialize Flask extensions with proper error handling"""
    
    # Initialize CORS with custom headers
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=app.config['CORS_HEADERS']
    )
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Initialize MongoDB
    if not init_mongodb(app):
        raise RuntimeError("Failed to initialize MongoDB connection")
    
    # Initialize Neo4j
    if not init_neo4j(app):
        raise RuntimeError("Failed to initialize Neo4j connection")
    
    # Setup Neo4j constraints
    if not setup_neo4j_constraints():
        raise RuntimeError("Failed to setup Neo4j constraints")
    
    logger.info("All extensions initialized successfully")

def close_extensions():
    """Close database connections with proper error handling"""
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
    """Get MongoDB database instance"""
    if not mongo:
        raise RuntimeError("MongoDB connection not initialized")
    return mongo.get_database() 