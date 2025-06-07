from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from app.auth import token_required, admin_required
from ..extensions import mongo, neo4j_driver

consultation_bp = Blueprint("consultation", __name__)


@consultation_bp.route("/consultations", methods=["POST"])
@token_required
def create_consultation(current_user):
    if not (current_user["role"] == "admin" or current_user["role"] == "doctor"):
        return jsonify({"message": "Non autorisé"}), 403

    data = request.get_json()

    # Validation des données requises
    required_fields = [
        "patient_id",
        "doctor_id",
        "date",
        "motif",
        "diagnostic",
        "traitement",
    ]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Données manquantes"}), 400

    # Création de la consultation dans MongoDB
    consultation = {
        "patient_id": ObjectId(data["patient_id"]),
        "doctor_id": ObjectId(data["doctor_id"]),
        "date": datetime.fromisoformat(data["date"].replace("Z", "+00:00")),
        "motif": data["motif"],
        "diagnostic": data["diagnostic"],
        "traitement": data["traitement"],
        "notes": data.get("notes", ""),
        "created_at": datetime.utcnow(),
        "created_by": current_user["_id"],
    }

    result = mongo.db.consultations.insert_one(consultation)
    consultation_id = str(result.inserted_id)

    # Ensure patient and doctor nodes exist in Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MERGE (p:Patient {mongo_id: $patient_id})
            MERGE (d:Doctor {mongo_id: $doctor_id})
            """,
            patient_id=str(consultation["patient_id"]),
            doctor_id=str(consultation["doctor_id"]),
        )

    # Création de la relation dans Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MATCH (p:Patient {mongo_id: $patient_id})
            MATCH (d:Doctor {mongo_id: $doctor_id})
            CREATE (p)-[r:CONSULTED_BY {
                consultation_id: $consultation_id,
                date: $date,
                motif: $motif
            }]->(d)
            """,
            patient_id=str(consultation["patient_id"]),
            doctor_id=str(consultation["doctor_id"]),
            consultation_id=consultation_id,
            date=data["date"],
            motif=data["motif"],
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

    # Vérification que la consultation existe
    consultation = mongo.db.consultations.find_one({"_id": ObjectId(consultation_id)})
    if not consultation:
        return jsonify({"message": "Consultation non trouvée"}), 404

    # Mise à jour des champs modifiables
    update_fields = {
        "motif": data.get("motif", consultation["motif"]),
        "diagnostic": data.get("diagnostic", consultation["diagnostic"]),
        "traitement": data.get("traitement", consultation["traitement"]),
        "notes": data.get("notes", consultation["notes"]),
        "updated_at": datetime.utcnow(),
        "updated_by": current_user["_id"],
    }

    mongo.db.consultations.update_one(
        {"_id": ObjectId(consultation_id)}, {"$set": update_fields}
    )

    # Mise à jour de la relation dans Neo4j si le motif a changé
    if "motif" in data:
        with neo4j_driver.session() as session:
            session.run(
                """
                MATCH ()-[r:CONSULTED_BY]->()
                WHERE r.consultation_id = $consultation_id
                SET r.motif = $motif
                """,
                consultation_id=consultation_id,
                motif=data["motif"],
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

        # Vérification des autorisations
        if current_user["role"] == "patient" and str(consultation["patient_id"]) != str(
            current_user["_id"]
        ):
            return jsonify({"message": "Non autorisé"}), 403

        if current_user["role"] == "doctor" and str(consultation["doctor_id"]) != str(
            current_user["_id"]
        ):
            return jsonify({"message": "Non autorisé"}), 403

        # Récupération des informations du patient et du médecin
        patient = mongo.db.patients.find_one({"_id": consultation["patient_id"]})
        doctor = mongo.db.doctors.find_one({"_id": consultation["doctor_id"]})

        consultation_data = {
            "id": str(consultation["_id"]),
            "patient": {"id": str(patient["_id"]), "name": patient["name"]},
            "doctor": {"id": str(doctor["_id"]), "name": doctor["name"]},
            "date": consultation["date"].isoformat(),
            "motif": consultation["motif"],
            "diagnostic": consultation["diagnostic"],
            "traitement": consultation["traitement"],
            "notes": consultation["notes"],
            "created_at": consultation["created_at"].isoformat(),
        }

        return jsonify(consultation_data), 200
    except Exception as e:
        return jsonify({"message": f"Erreur: {str(e)}"}), 500


@consultation_bp.route("/consultations", methods=["GET"])
@token_required
def list_consultations(current_user):
    try:
        # Filtres en fonction du rôle
        if current_user["role"] == "patient":
            filter_query = {"patient_id": ObjectId(current_user["_id"])}
        elif current_user["role"] == "doctor":
            filter_query = {"doctor_id": ObjectId(current_user["_id"])}
        else:  # admin
            filter_query = {}

        # Paramètres de pagination
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
        skip = (page - 1) * per_page

        # Récupération des consultations
        consultations = list(
            mongo.db.consultations.find(filter_query)
            .sort("date", -1)
            .skip(skip)
            .limit(per_page)
        )

        # Récupération des informations des patients et médecins
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

        # Formatage des données
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
                        "diagnostic": cons["diagnostic"],
                        "traitement": cons["traitement"],
                        "created_at": cons["created_at"].isoformat(),
                    }
                )

        # Compte total pour la pagination
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


@consultation_bp.route("/consultations/stats", methods=["GET"])
@token_required
@admin_required
def get_consultation_stats():
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
