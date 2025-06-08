from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

# Import what's needed for a local database connection
from pymongo import MongoClient
from ..config import Config

# CHANGE: Add get_jwt to imports
from flask_jwt_extended import jwt_required, get_jwt

# Import decorators and the working Neo4j driver
from ..admin.routes import admin_required
from ..extensions import neo4j_driver
from ..models.consultation import Consultation

# Create a local database connection, just like in the working doctor_bp file
mongo_client = MongoClient(Config.MONGODB_URI)
db = mongo_client.get_database("cabinet_medical")

consultation_bp = Blueprint("consultation", __name__)


@consultation_bp.route("/", methods=["POST"])
@jwt_required()
def create_consultation():  # CHANGE: Removed 'current_user' argument
    # ADD: Manually get the current user's info
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    if not (current_user["role"] == "admin" or current_user["role"] == "doctor"):
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"message": "Aucune donnée fournie"}), 400

    try:
        consultation_obj = Consultation(
            patient_id=data["patient_id"],
            doctor_id=data["doctor_id"],
            date=data["date"],
            motif=data["motif"],
            diagnostic=data["diagnostic"],
            traitement=data["traitement"],
            notes=data.get("notes", ""),
            status=data.get("status", "pending"),
        )
        is_valid, error_message = consultation_obj.validate()
        if not is_valid:
            return jsonify({"message": error_message}), 400
    except (KeyError, TypeError):
        return jsonify({"message": "Données manquantes ou invalides"}), 400
    except Exception as e:
        return jsonify({"message": f"Erreur de format de données: {e}"}), 400

    consultation_doc = consultation_obj.to_dict()
    consultation_doc["created_by"] = current_user["_id"]

    result = db.consultations.insert_one(consultation_doc)
    consultation_id = str(result.inserted_id)

    with neo4j_driver.session() as session:
        session.run(
            """
            MERGE (p:Patient {mongo_id: $patient_id})
            MERGE (d:Doctor {mongo_id: $doctor_id})
            """,
            patient_id=str(consultation_obj.patient_id),
            doctor_id=str(consultation_obj.doctor_id),
        )
        session.run(
            """
            MATCH (p:Patient {mongo_id: $patient_id})
            MATCH (d:Doctor {mongo_id: $doctor_id})
            CREATE (p)-[r:CONSULTED_BY {
                consultation_id: $consultation_id,
                date: $date,
                motif: $motif,
                status: $status
            }]->(d)
            """,
            patient_id=str(consultation_obj.patient_id),
            doctor_id=str(consultation_obj.doctor_id),
            consultation_id=consultation_id,
            date=consultation_obj.date.isoformat(),
            motif=consultation_obj.motif,
            status=consultation_obj.status,
        )

    return jsonify(
        {
            "message": "Consultation créée avec succès",
            "consultation_id": consultation_id,
        }
    ), 201


@consultation_bp.route("/<consultation_id>", methods=["PUT"])
@jwt_required()
def update_consultation(consultation_id):  # CHANGE: Removed 'current_user' argument
    # ADD: Manually get the current user's info
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    if not (current_user["role"] == "admin" or current_user["role"] == "doctor"):
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    existing_consultation = db.consultations.find_one(
        {"_id": ObjectId(consultation_id)}
    )
    if not existing_consultation:
        return jsonify({"message": "Consultation non trouvée"}), 404

    update_fields = {}
    if "motif" in data:
        update_fields["motif"] = data["motif"]
    if "diagnostic" in data:
        update_fields["diagnostic"] = data["diagnostic"]
    if "traitement" in data:
        update_fields["traitement"] = data["traitement"]
    if "notes" in data:
        update_fields["notes"] = data["notes"]
    if "status" in data:
        if data["status"] not in ["pending", "completed", "cancelled"]:
            return jsonify({"message": "Statut invalide"}), 400
        update_fields["status"] = data["status"]

    if not update_fields:
        return jsonify({"message": "Aucun champ à mettre à jour"}), 400

    update_fields["updated_at"] = datetime.utcnow()
    update_fields["updated_by"] = current_user["_id"]

    db.consultations.update_one(
        {"_id": ObjectId(consultation_id)}, {"$set": update_fields}
    )

    if "motif" in update_fields or "status" in update_fields:
        with neo4j_driver.session() as session:
            session.run(
                """
                MATCH ()-[r:CONSULTED_BY {consultation_id: $consultation_id}]->()
                SET r.motif = $motif, r.status = $status
                """,
                consultation_id=consultation_id,
                motif=update_fields.get("motif", existing_consultation["motif"]),
                status=update_fields.get("status", existing_consultation.get("status")),
            )

    return jsonify({"message": "Consultation mise à jour avec succès"}), 200


@consultation_bp.route("/<consultation_id>", methods=["GET"])
@jwt_required()
def get_consultation(consultation_id):  # CHANGE: Removed 'current_user' argument
    # ADD: Manually get the current user's info
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    try:
        consultation = db.consultations.find_one({"_id": ObjectId(consultation_id)})
        if not consultation:
            return jsonify({"message": "Consultation non trouvée"}), 404

        if current_user["role"] == "patient" and str(consultation["patient_id"]) != str(
            current_user["_id"]
        ):
            return jsonify({"message": "Non autorisé"}), 403
        if current_user["role"] == "doctor" and str(consultation["doctor_id"]) != str(
            current_user["_id"]
        ):
            return jsonify({"message": "Non autorisé"}), 403

        patient = db.patients.find_one({"_id": consultation["patient_id"]})
        doctor = db.doctors.find_one({"_id": consultation["doctor_id"]})

        consultation_data = {
            "id": str(consultation["_id"]),
            "patient": {"id": str(patient["_id"]), "name": patient["name"]}
            if patient
            else None,
            "doctor": {"id": str(doctor["_id"]), "name": doctor["name"]}
            if doctor
            else None,
            "date": consultation["date"].isoformat(),
            "motif": consultation["motif"],
            "diagnostic": consultation["diagnostic"],
            "traitement": consultation["traitement"],
            "notes": consultation.get("notes", ""),
            "status": consultation.get("status", "pending"),
            "created_at": consultation["created_at"].isoformat(),
        }
        if "updated_at" in consultation:
            consultation_data["updated_at"] = consultation["updated_at"].isoformat()

        return jsonify(consultation_data), 200
    except Exception as e:
        return jsonify({"message": f"Erreur: {str(e)}"}), 500


@consultation_bp.route("/", methods=["GET"])
@jwt_required()
def list_consultations():  # CHANGE: Removed 'current_user' argument
    # ADD: Manually get the current user's info
    claims = get_jwt()
    current_user = {"_id": claims["sub"], "role": claims["role"]}

    try:
        filter_query = {}
        if current_user["role"] == "patient":
            filter_query = {"patient_id": ObjectId(current_user["_id"])}
        elif current_user["role"] == "doctor":
            filter_query = {"doctor_id": ObjectId(current_user["_id"])}

        if current_user["role"] != "patient" and "status" in request.args:
            filter_query["status"] = request.args.get("status")

        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
        skip = (page - 1) * per_page

        consultations = list(
            db.consultations.find(filter_query)
            .sort("date", -1)
            .skip(skip)
            .limit(per_page)
        )

        patient_ids = {cons["patient_id"] for cons in consultations}
        doctor_ids = {cons["doctor_id"] for cons in consultations}

        patients = {
            str(p["_id"]): p
            for p in db.patients.find({"_id": {"$in": list(patient_ids)}})
        }
        doctors = {
            str(d["_id"]): d
            for d in db.doctors.find({"_id": {"$in": list(doctor_ids)}})
        }

        consultations_data = []
        for cons in consultations:
            patient = patients.get(str(cons["patient_id"]))
            doctor = doctors.get(str(cons["doctor_id"]))
            if patient and doctor:
                consultations_data.append(
                    {
                        "id": str(cons["_id"]),
                        "patient": {"id": str(patient["_id"]), "name": patient["name"]},
                        "doctor": {"id": str(doctor["_id"]), "name": doctor["name"]},
                        "date": cons["date"].isoformat(),
                        "motif": cons["motif"],
                        "status": cons.get("status", "pending"),
                        "created_at": cons["created_at"].isoformat(),
                    }
                )

        total = db.consultations.count_documents(filter_query)

        return jsonify(
            {
                "consultations": consultations_data,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page,
            }
        ), 200
    except Exception as e:
        return jsonify({"message": f"Erreur: {str(e)}"}), 500


@consultation_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_consultation_stats():  # CHANGE: Removed 'current_user' argument
    # The @admin_required decorator already protects this, so no need for current_user
    try:
        total_consultations = db.consultations.count_documents({})
        pipeline = [{"$group": {"_id": "$doctor_id", "count": {"$sum": 1}}}]
        consultations_by_doctor = list(db.consultations.aggregate(pipeline))

        doctor_stats = []
        for stat in consultations_by_doctor:
            doctor = db.doctors.find_one({"_id": stat["_id"]})
            if doctor:
                doctor_stats.append(
                    {
                        "doctor_id": str(stat["_id"]),
                        "doctor_name": doctor["name"],
                        "consultation_count": stat["count"],
                    }
                )

        return jsonify(
            {
                "total_consultations": total_consultations,
                "consultations_by_doctor": doctor_stats,
            }
        ), 200
    except Exception as e:
        return jsonify({"message": f"Erreur: {str(e)}"}), 500


@consultation_bp.route("/<consultation_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_consultation(consultation_id):  # CHANGE: Removed 'current_user' argument
    # The @admin_required decorator already protects this
    try:
        consultation = db.consultations.find_one({"_id": ObjectId(consultation_id)})
        if not consultation:
            return jsonify({"message": "Consultation non trouvée"}), 404
    except Exception:
        return jsonify({"message": "ID de consultation invalide"}), 400

    try:
        with neo4j_driver.session() as session:
            session.run(
                """
                MATCH ()-[r:CONSULTED_BY {consultation_id: $consultation_id}]->()
                DELETE r
                """,
                consultation_id=consultation_id,
            )
    except Exception as e:
        return jsonify(
            {
                "message": f"Erreur lors de la suppression de la relation dans le graphe: {e}"
            }
        ), 500

    db.consultations.delete_one({"_id": ObjectId(consultation_id)})

    return jsonify({"message": "Consultation supprimée avec succès"}), 200
