from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import uuid  # Import uuid to generate consultation IDs

# Import what's needed for a local database connection (for patients/doctors)
from pymongo import MongoClient
from ..config import Config

# Import JWT utilities
from flask_jwt_extended import jwt_required, get_jwt

# Import decorators and the working Neo4j driver
from ..admin.routes import admin_required
from ..extensions import neo4j_driver
from ..models.consultation import Consultation

# Create a local database connection for PATIENT and DOCTOR data ONLY
mongo_client = MongoClient(Config.MONGODB_URI)
db = mongo_client.get_database("cabinet_medical")

consultation_bp = Blueprint("consultation", __name__)


@consultation_bp.route("/", methods=["POST"])
@jwt_required()
def create_consultation():
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    if not (current_user["role"] == "admin" or current_user["role"] == "doctor"):
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"message": "Aucune donnée fournie"}), 400

    # Validate data using the model
    try:
        consultation_obj = Consultation(**data)
        is_valid, error_message = consultation_obj.validate()
        if not is_valid:
            return jsonify({"message": error_message}), 400
    except (KeyError, TypeError) as e:
        return jsonify({"message": f"Données manquantes ou invalides: {e}"}), 400

    # Generate a unique ID for the consultation
    consultation_id = str(uuid.uuid4())

    # Prepare all properties for the Neo4j relationship
    consultation_props = {
        "consultation_id": consultation_id,
        "date": consultation_obj.date.isoformat(),
        "motif": consultation_obj.motif,
        "diagnostic": consultation_obj.diagnostic,
        "traitement": consultation_obj.traitement,
        "notes": consultation_obj.notes,
        "status": consultation_obj.status,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": current_user["_id"],
    }

    # NO MORE MONGODB INSERT FOR CONSULTATIONS
    # db.consultations.insert_one(...) is removed.

    with neo4j_driver.session() as session:
        # Ensure patient and doctor nodes exist
        session.run(
            "MERGE (p:Patient {mongo_id: $patient_id})",
            patient_id=str(consultation_obj.patient_id),
        )
        session.run(
            "MERGE (d:Doctor {mongo_id: $doctor_id})",
            doctor_id=str(consultation_obj.doctor_id),
        )
        # Create the relationship with all properties
        session.run(
            """
            MATCH (p:Patient {mongo_id: $patient_id})
            MATCH (d:Doctor {mongo_id: $doctor_id})
            CREATE (p)-[r:CONSULTED_BY $props]->(d)
            """,
            patient_id=str(consultation_obj.patient_id),
            doctor_id=str(consultation_obj.doctor_id),
            props=consultation_props,
        )

    return jsonify(
        {
            "message": "Consultation créée avec succès dans le graphe",
            "consultation_id": consultation_id,
        }
    ), 201


@consultation_bp.route("/<consultation_id>", methods=["PUT"])
@jwt_required()
def update_consultation(consultation_id):
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    if not (current_user["role"] == "admin" or current_user["role"] == "doctor"):
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    update_props = {}

    # Build a dictionary of properties to update
    for field in ["motif", "diagnostic", "traitement", "notes", "status"]:
        if field in data:
            update_props[field] = data[field]

    if not update_props:
        return jsonify({"message": "Aucun champ à mettre à jour"}), 400

    update_props["updated_at"] = datetime.utcnow().isoformat()
    update_props["updated_by"] = current_user["_id"]

    with neo4j_driver.session() as session:
        result = session.run(
            """
            MATCH ()-[r:CONSULTED_BY {consultation_id: $consultation_id}]->()
            SET r += $props
            RETURN r
            """,
            consultation_id=consultation_id,
            props=update_props,
        )
        if not result.single():
            return jsonify({"message": "Consultation non trouvée"}), 404

    return jsonify({"message": "Consultation mise à jour avec succès"}), 200


@consultation_bp.route("/<consultation_id>", methods=["GET"])
@jwt_required()
def get_consultation(consultation_id):
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    with neo4j_driver.session() as session:
        result = session.run(
            """
            MATCH (p:Patient)-[r:CONSULTED_BY {consultation_id: $consultation_id}]->(d:Doctor)
            RETURN p.mongo_id AS patient_id, d.mongo_id AS doctor_id, r AS consultation
            """,
            consultation_id=consultation_id,
        )
        record = result.single()

        if not record:
            return jsonify({"message": "Consultation non trouvée"}), 404

        # Extract data from the record
        consultation_props = dict(record["consultation"])
        patient_id = ObjectId(record["patient_id"])
        doctor_id = ObjectId(record["doctor_id"])

        # Authorization checks
        if current_user["role"] == "patient" and str(patient_id) != current_user["_id"]:
            return jsonify({"message": "Non autorisé"}), 403
        if current_user["role"] == "doctor" and str(doctor_id) != current_user["_id"]:
            return jsonify({"message": "Non autorisé"}), 403

        # Enrich with data from MongoDB
        patient = db.patients.find_one({"_id": patient_id})
        doctor = db.doctors.find_one({"_id": doctor_id})

        # Format the final response
        consultation_data = {
            "id": consultation_props.get("consultation_id"),
            "patient": {"id": str(patient["_id"]), "name": patient["name"]}
            if patient
            else None,
            "doctor": {"id": str(doctor["_id"]), "name": doctor["name"]}
            if doctor
            else None,
            "date": consultation_props.get("date"),
            "motif": consultation_props.get("motif"),
            "diagnostic": consultation_props.get("diagnostic"),
            "traitement": consultation_props.get("traitement"),
            "notes": consultation_props.get("notes"),
            "status": consultation_props.get("status"),
            "created_at": consultation_props.get("created_at"),
            "updated_at": consultation_props.get("updated_at"),
        }

        return jsonify(consultation_data), 200


@consultation_bp.route("/", methods=["GET"])
@jwt_required()
def list_consultations():
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    # Build Cypher query based on role and filters
    match_clause = "MATCH (p:Patient)-[r:CONSULTED_BY]->(d:Doctor)"
    where_clauses = []
    params = {}

    if current_user["role"] == "patient":
        where_clauses.append("p.mongo_id = $user_id")
        params["user_id"] = current_user["_id"]
    elif current_user["role"] == "doctor":
        where_clauses.append("d.mongo_id = $user_id")
        params["user_id"] = current_user["_id"]

    if "status" in request.args and current_user["role"] != "patient":
        where_clauses.append("r.status = $status")
        params["status"] = request.args.get("status")

    where_statement = ""
    if where_clauses:
        where_statement = "WHERE " + " AND ".join(where_clauses)

    # Pagination
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    params["skip"] = (page - 1) * per_page
    params["limit"] = per_page

    # Query for the data
    query = f"""
    {match_clause}
    {where_statement}
    RETURN p.mongo_id AS patient_id, d.mongo_id AS doctor_id, r AS consultation
    ORDER BY r.date DESC
    SKIP $skip LIMIT $limit
    """

    # Query for the total count
    count_query = f"""
    {match_clause}
    {where_statement}
    RETURN count(r) AS total
    """

    with neo4j_driver.session() as session:
        # Get total count first
        count_result = session.run(count_query, params)
        total = count_result.single()["total"]

        # Get the paginated data
        results = session.run(query, params)
        consultations = [dict(record) for record in results]

    # Enrich with MongoDB data
    patient_ids = [ObjectId(c["patient_id"]) for c in consultations]
    doctor_ids = [ObjectId(c["doctor_id"]) for c in consultations]
    patients = {
        str(p["_id"]): p for p in db.patients.find({"_id": {"$in": patient_ids}})
    }
    doctors = {str(d["_id"]): d for d in db.doctors.find({"_id": {"$in": doctor_ids}})}

    # Format the final response
    consultations_data = []
    for cons_record in consultations:
        props = dict(cons_record["consultation"])
        patient = patients.get(cons_record["patient_id"])
        doctor = doctors.get(cons_record["doctor_id"])
        if patient and doctor:
            consultations_data.append(
                {
                    "id": props.get("consultation_id"),
                    "patient": {"id": str(patient["_id"]), "name": patient["name"]},
                    "doctor": {"id": str(doctor["_id"]), "name": doctor["name"]},
                    "date": props.get("date"),
                    "motif": props.get("motif"),
                    "status": props.get("status"),
                }
            )

    return jsonify(
        {
            "consultations": consultations_data,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }
    ), 200


@consultation_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_consultation_stats():
    with neo4j_driver.session() as session:
        # Total consultations
        total_result = session.run(
            "MATCH ()-[:CONSULTED_BY]->() RETURN count(*) as total"
        )
        total_consultations = total_result.single()["total"]

        # Consultations by doctor
        by_doctor_result = session.run("""
            MATCH ()-[:CONSULTED_BY]->(d:Doctor)
            RETURN d.mongo_id as doctor_mongo_id, count(*) as count
        """)

        doctor_stats_raw = [dict(record) for record in by_doctor_result]

    # Enrich with doctor names from MongoDB
    doctor_ids = [ObjectId(stat["doctor_mongo_id"]) for stat in doctor_stats_raw]
    doctors = {
        str(d["_id"]): d["name"] for d in db.doctors.find({"_id": {"$in": doctor_ids}})
    }

    doctor_stats = []
    for stat in doctor_stats_raw:
        doctor_id_str = stat["doctor_mongo_id"]
        doctor_stats.append(
            {
                "doctor_id": doctor_id_str,
                "doctor_name": doctors.get(doctor_id_str, "Unknown"),
                "consultation_count": stat["count"],
            }
        )

    return jsonify(
        {
            "total_consultations": total_consultations,
            "consultations_by_doctor": doctor_stats,
        }
    ), 200


@consultation_bp.route("/<consultation_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_consultation(consultation_id):
    with neo4j_driver.session() as session:
        result = session.run(
            """
            MATCH ()-[r:CONSULTED_BY {consultation_id: $consultation_id}]->()
            DELETE r
            RETURN r
            """,
            consultation_id=consultation_id,
        )
        # Check if a relationship was actually deleted
        if not result.single():
            return jsonify({"message": "Consultation non trouvée"}), 404

    # NO MONGODB DELETION NEEDED
    return jsonify({"message": "Consultation supprimée avec succès du graphe"}), 200
