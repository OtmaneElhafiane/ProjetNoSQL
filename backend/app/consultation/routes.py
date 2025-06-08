from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from ..auth.routes import token_required, admin_required, doctor_required
from ..extensions import mongo, neo4j_driver
from ..models.consultation import Consultation  # Import the model

consultation_bp = Blueprint("consultation", __name__)


@consultation_bp.route("/consultations", methods=["POST"])
@token_required
def create_consultation(current_user):
    if not (current_user["role"] == "admin" or current_user["role"] == "doctor"):
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"message": "Aucune donnée fournie"}), 400

    try:
        # Use the model to create and validate the consultation object
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

    # Convert the object to a dictionary for MongoDB insertion
    consultation_doc = consultation_obj.to_dict()
    # Add metadata not part of the core model
    consultation_doc["created_by"] = current_user["_id"]

    result = mongo.db.consultations.insert_one(consultation_doc)
    consultation_id = str(result.inserted_id)

    # Ensure patient and doctor nodes exist in Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MERGE (p:Patient {mongo_id: $patient_id})
            MERGE (d:Doctor {mongo_id: $doctor_id})
            """,
            patient_id=str(consultation_obj.patient_id),
            doctor_id=str(consultation_obj.doctor_id),
        )

    # Create the relationship in Neo4j
    with neo4j_driver.session() as session:
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


@consultation_bp.route("/consultations/<consultation_id>", methods=["PUT"])
@token_required
def update_consultation(current_user, consultation_id):
    if not (current_user["role"] == "admin" or current_user["role"] == "doctor"):
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()

    # Verify that the consultation exists
    existing_consultation = mongo.db.consultations.find_one(
        {"_id": ObjectId(consultation_id)}
    )
    if not existing_consultation:
        return jsonify({"message": "Consultation non trouvée"}), 404

    # Update modifiable fields
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
        # You might want to validate the status value here as well
        if data["status"] not in ["pending", "completed", "cancelled"]:
            return jsonify({"message": "Statut invalide"}), 400
        update_fields["status"] = data["status"]

    if not update_fields:
        return jsonify({"message": "Aucun champ à mettre à jour"}), 400

    # Add metadata
    update_fields["updated_at"] = datetime.utcnow()
    update_fields["updated_by"] = current_user["_id"]

    mongo.db.consultations.update_one(
        {"_id": ObjectId(consultation_id)}, {"$set": update_fields}
    )

    # Update the relationship in Neo4j if relevant properties have changed
    if "motif" in update_fields or "status" in update_fields:
        with neo4j_driver.session() as session:
            session.run(
                """
                MATCH ()-[r:CONSULTED_BY {consultation_id: $consultation_id}]->()
                SET r.motif = $motif, r.status = $status
                """,
                consultation_id=consultation_id,
                motif=update_fields.get("motif", existing_consultation["motif"]),
                status=update_fields.get("status", existing_consultation["status"]),
            )

    return jsonify({"message": "Consultation mise à jour avec succès"}), 200


@consultation_bp.route("/consultations/<consultation_id>", methods=["GET"])
@token_required
def get_consultation(current_user, consultation_id):
    try:
        consultation = mongo.db.consultations.find_one(
            {"_id": ObjectId(consultation_id)}
        )
        if not consultation:
            return jsonify({"message": "Consultation non trouvée"}), 404

        # Authorization checks
        if current_user["role"] == "patient" and str(consultation["patient_id"]) != str(
            current_user["_id"]
        ):
            return jsonify({"message": "Non autorisé"}), 403
        if current_user["role"] == "doctor" and str(consultation["doctor_id"]) != str(
            current_user["_id"]
        ):
            return jsonify({"message": "Non autorisé"}), 403

        patient = mongo.db.patients.find_one({"_id": consultation["patient_id"]})
        doctor = mongo.db.doctors.find_one({"_id": consultation["doctor_id"]})

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
            "status": consultation.get("status", "pending"),  # Added status field
            "created_at": consultation["created_at"].isoformat(),
        }
        if "updated_at" in consultation:
            consultation_data["updated_at"] = consultation["updated_at"].isoformat()

        return jsonify(consultation_data), 200
    except Exception as e:
        return jsonify({"message": f"Erreur: {str(e)}"}), 500


@consultation_bp.route("/consultations", methods=["GET"])
@token_required
def list_consultations(current_user):
    # This function's logic is mostly about querying and formatting,
    # so model usage is minimal. We'll just add the 'status' field.
    try:
        filter_query = {}
        if current_user["role"] == "patient":
            filter_query = {"patient_id": ObjectId(current_user["_id"])}
        elif current_user["role"] == "doctor":
            filter_query = {"doctor_id": ObjectId(current_user["_id"])}

        # New: allow filtering by status for admins and doctors
        if current_user["role"] != "patient" and "status" in request.args:
            filter_query["status"] = request.args.get("status")

        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
        skip = (page - 1) * per_page

        consultations_cursor = (
            mongo.db.consultations.find(filter_query)
            .sort("date", -1)
            .skip(skip)
            .limit(per_page)
        )
        consultations = list(consultations_cursor)

        patient_ids = {cons["patient_id"] for cons in consultations}
        doctor_ids = {cons["doctor_id"] for cons in consultations}

        patients = {
            str(p["_id"]): p
            for p in mongo.db.patients.find({"_id": {"$in": list(patient_ids)}})
        }
        doctors = {
            str(d["_id"]): d
            for d in mongo.db.doctors.find({"_id": {"$in": list(doctor_ids)}})
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
                        "status": cons.get("status", "pending"),  # Added status field
                        "created_at": cons["created_at"].isoformat(),
                    }
                )

        total = mongo.db.consultations.count_documents(filter_query)
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


# The stats and delete functions do not need significant changes related to the model
# as they operate on aggregate data or by ID. They are kept as is.


@consultation_bp.route("/consultations/stats", methods=["GET"])
@token_required
@admin_required
def get_consultation_stats():
    # ... (code remains the same)
    try:
        # Statistiques générales
        total_consultations = mongo.db.consultations.count_documents({})

        # Consultations par médecin
        pipeline = [{"$group": {"_id": "$doctor_id", "count": {"$sum": 1}}}]
        consultations_by_doctor = list(mongo.db.consultations.aggregate(pipeline))

        # Récupération des noms des médecins
        doctor_stats = []
        for stat in consultations_by_doctor:
            doctor = mongo.db.doctors.find_one({"_id": stat["_id"]})
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


@consultation_bp.route("/consultations/<consultation_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_consultation(current_user, consultation_id):
    try:
        consultation = mongo.db.consultations.find_one(
            {"_id": ObjectId(consultation_id)}
        )
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

    mongo.db.consultations.delete_one({"_id": ObjectId(consultation_id)})

    return jsonify({"message": "Consultation supprimée avec succès"}), 200
