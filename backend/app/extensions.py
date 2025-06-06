from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from neo4j import GraphDatabase

# Initialize extensions
cors = CORS()
jwt = JWTManager()
mongo = None
neo4j_driver = None

def init_extensions(app):
    """Initialize Flask extensions"""
    
    # Initialize CORS
    cors.init_app(app)
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Initialize MongoDB
    global mongo
    mongo = MongoClient(app.config['MONGO_URI'])
    
    # Initialize Neo4j
    global neo4j_driver
    neo4j_driver = GraphDatabase.driver(
        app.config['NEO4J_URI'],
        auth=(app.config['NEO4J_USER'], app.config['NEO4J_PASSWORD'])
    )
    
    # Create Neo4j constraints
    with neo4j_driver.session() as session:
        session.run("CREATE CONSTRAINT IF NOT EXISTS ON (d:Doctor) ASSERT d.id IS UNIQUE")
        session.run("CREATE CONSTRAINT IF NOT EXISTS ON (p:Patient) ASSERT p.id IS UNIQUE")
        session.run("CREATE CONSTRAINT IF NOT EXISTS ON (c:Consultation) ASSERT c.id IS UNIQUE")

def close_extensions():
    """Close database connections"""
    if mongo:
        mongo.close()
    if neo4j_driver:
        neo4j_driver.close() 