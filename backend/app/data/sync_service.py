from pymongo import MongoClient
from neo4j import GraphDatabase
from ..config import Config


class SyncService:
    def __init__(self):
        self.mongo_client = MongoClient(Config.MONGODB_URI)
        self.neo4j_driver = GraphDatabase.driver(
            Config.NEO4J_URI, auth=(Config.NEO4J_USER, Config.NEO4J_PASSWORD)
        )

    def sync_patient(self, patient_data):
        """Synchronize patient data between MongoDB and Neo4j"""

        # MongoDB operation
        db = self.mongo_client.cabinet_medical
        db.patients.update_one(
            {"_id": patient_data["_id"]}, {"$set": patient_data}, upsert=True
        )

        # Prepare data for Neo4j
        neo4j_data = patient_data.copy()
        neo4j_data["id"] = str(patient_data["_id"])  # Convert MongoDB _id to Neo4j id

        # Neo4j operation

        with self.neo4j_driver.session() as session:
            session.write_transaction(self._create_or_update_patient_node, neo4j_data)

    def sync_doctor(self, doctor_data):
        """Synchronize doctor data between MongoDB and Neo4j"""

        # MongoDB operation
        db = self.mongo_client.cabinet_medical
        db.doctors.update_one(
            {"_id": doctor_data["_id"]}, {"$set": doctor_data}, upsert=True
        )

        # Prepare data for Neo4j
        neo4j_data = doctor_data.copy()
        neo4j_data["id"] = str(doctor_data["_id"])  # Convert MongoDB _id to Neo4j id

        # Neo4j operation

        with self.neo4j_driver.session() as session:
            session.write_transaction(self._create_or_update_doctor_node, neo4j_data)

    def sync_consultation(self, consultation_data):
        """Synchronize consultation data and create relationships in Neo4j"""
        # Prepare data for Neo4j
        neo4j_data = consultation_data.copy()
        neo4j_data["id"] = str(
            consultation_data["_id"]
        )  # Convert MongoDB _id to Neo4j id
        if "patient_id" in consultation_data:
            neo4j_data["patient_id"] = str(consultation_data["patient_id"])
        if "doctor_id" in consultation_data:
            neo4j_data["doctor_id"] = str(consultation_data["doctor_id"])

        # Neo4j operation
        with self.neo4j_driver.session() as session:
            session.write_transaction(
                self._create_consultation_relationship, neo4j_data
            )

    @staticmethod
    def _create_or_update_patient_node(tx, patient_data):
        query = """
        MERGE (p:Patient {id: $id})
        SET p.name = $name,
            p.email = $email,
            p.phone = $phone,
            p.updated_at = datetime()
        RETURN p
        """
        return tx.run(query, **patient_data)

    @staticmethod
    def _create_or_update_doctor_node(tx, doctor_data):
        query = """
        MERGE (d:Doctor {id: $id})
        SET d.name = $name,
            d.email = $email,
            d.speciality = $speciality,
            d.updated_at = datetime()
        RETURN d
        """
        return tx.run(query, **doctor_data)

    @staticmethod
    def _create_consultation_relationship(tx, consultation_data):
        query = """
        MATCH (p:Patient {id: $patient_id})
        MATCH (d:Doctor {id: $doctor_id})
        MERGE (p)-[c:CONSULTED_WITH]->(d)
        SET c.date = $date,
            c.diagnosis = $diagnosis,
            c.updated_at = datetime()
        RETURN c
        """
        return tx.run(query, **consultation_data)

    def close(self):
        """Close all database connections"""
        self.mongo_client.close()

        self.neo4j_driver.close()

