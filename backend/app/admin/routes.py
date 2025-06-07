from flask import Blueprint, request, jsonify

from flask_jwt_extended import get_jwt, jwt_required, get_jwt_identity

from pymongo import MongoClient
from bson import ObjectId
from ..config import Config
from ..data.sync_service import SyncService
from ..models.user import User
from functools import wraps
from werkzeug.security import generate_password_hash

admin_bp = Blueprint("admin", __name__)
mongo_client = MongoClient(Config.MONGODB_URI)
db = mongo_client.cabinet_medical
sync_service = SyncService()


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Accès réservé aux administrateurs"}), 403
        return fn(*args, **kwargs)

    return wrapper


# Routes pour la gestion des patients
@admin_bp.route("/patients", methods=["GET"])
@jwt_required()
@admin_required
def get_patients():
    patients = list(db.patients.find())
    for patient in patients:
        patient["_id"] = str(patient["_id"])
    return jsonify(patients), 200


@admin_bp.route("/patients", methods=["POST"])
@jwt_required()
@admin_required
def create_patient():
    data = request.get_json()
    patient_data = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "birth_date": data["birth_date"],
        "address": data["address"],
    }

    result = db.patients.insert_one(patient_data)
    patient_data["_id"] = str(result.inserted_id)

    # Synchroniser avec Neo4j
    sync_service.sync_patient(patient_data)

    return jsonify(patient_data), 201


@admin_bp.route("/patients/<patient_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_patient(patient_id):
    data = request.get_json()
    patient_data = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "birth_date": data["birth_date"],
        "address": data["address"],
    }

    db.patients.update_one({"_id": ObjectId(patient_id)}, {"$set": patient_data})

    patient_data["_id"] = patient_id
    sync_service.sync_patient(patient_data)

    return jsonify(patient_data), 200


# Routes pour la gestion des médecins
@admin_bp.route("/doctors", methods=["GET"])
@jwt_required()
@admin_required
def get_doctors():
    doctors = list(db.doctors.find())
    for doctor in doctors:
        doctor["_id"] = str(doctor["_id"])
    return jsonify(doctors), 200


@admin_bp.route("/doctors", methods=["POST"])
@jwt_required()
@admin_required
def create_doctor():
    data = request.get_json()
    doctor_data = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "speciality": data["speciality"],
        "schedule": data.get("schedule", {}),
    }

    result = db.doctors.insert_one(doctor_data)
    doctor_data["_id"] = str(result.inserted_id)

    # Synchroniser avec Neo4j
    sync_service.sync_doctor(doctor_data)

    return jsonify(doctor_data), 201


@admin_bp.route("/doctors/<doctor_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_doctor(doctor_id):
    data = request.get_json()
    doctor_data = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "speciality": data["speciality"],
        "schedule": data.get("schedule", {}),
    }

    db.doctors.update_one({"_id": ObjectId(doctor_id)}, {"$set": doctor_data})

    doctor_data["_id"] = doctor_id
    sync_service.sync_doctor(doctor_data)

    return jsonify(doctor_data), 200


# Route pour les statistiques
@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_stats():
    stats = {
        "total_patients": db.patients.count_documents({}),
        "total_doctors": db.doctors.count_documents({}),
        "total_consultations": db.consultations.count_documents({}),
    }
    return jsonify(stats), 200


@admin_bp.route("/users", methods=["POST"])
@jwt_required()
@admin_required
def create_user():
    """Création d'un utilisateur (patient ou médecin) par l'administrateur"""
    data = request.get_json()

    try:
        # Vérifier les champs requis
        required_fields = ["email", "password", "role", "first_name", "last_name"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Tous les champs sont requis"}), 400

        # Créer l'utilisateur
        user = User.create_user(
            email=data["email"],
            password=data["password"],
            role=data["role"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            **{
                k: v for k, v in data.items() if k not in required_fields
            },  # Champs additionnels
        )

        return jsonify(
            {
                "message": f"{user.role.capitalize()} créé avec succès",
                "user": user.to_json(),
            }
        ), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify(
            {"error": "Une erreur est survenue lors de la création de l'utilisateur"}
        ), 500


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users():
    """Récupérer la liste des utilisateurs"""
    try:
        role = request.args.get("role")  # Filtre optionnel par rôle

        # Construire la requête MongoDB
        query = {}
        if role:
            query["role"] = role

        # Récupérer les utilisateurs
        users = list(User.get_db()[User.collection_name].find(query))
        users = [User(**user_data).to_json() for user_data in users]

        return jsonify(users), 200

    except Exception:
        return jsonify(
            {
                "error": "Une erreur est survenue lors de la récupération des utilisateurs"
            }
        ), 500


@admin_bp.route("/users/<user_id>", methods=["GET"])
@jwt_required()
@admin_required
def get_user(user_id):
    """Récupérer un utilisateur par son ID"""
    try:
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        return jsonify(user.to_json()), 200

    except Exception:
        return jsonify(
            {
                "error": "Une erreur est survenue lors de la récupération de l'utilisateur"
            }
        ), 500


@admin_bp.route("/users/<user_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_user(user_id):
    """Mettre à jour un utilisateur"""
    try:
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        data = request.get_json()

        # Ne pas permettre la modification du rôle
        if "role" in data:
            del data["role"]

        # Mettre à jour le mot de passe si fourni
        if "password" in data:
            user.password_hash = generate_password_hash(data["password"])
            del data["password"]

        # Mettre à jour les autres champs
        for key, value in data.items():
            setattr(user, key, value)

        user.save()
        return jsonify(
            {"message": "Utilisateur mis à jour avec succès", "user": user.to_json()}
        ), 200

    except Exception:
        return jsonify(
            {"error": "Une erreur est survenue lors de la mise à jour de l'utilisateur"}
        ), 500


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Supprimer un utilisateur"""
    try:
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Empêcher la suppression d'un admin
        if user.role == "admin":
            return jsonify({"error": "Impossible de supprimer un administrateur"}), 403

        User.get_db()[User.collection_name].delete_one({"_id": user._id})
        return jsonify({"message": "Utilisateur supprimé avec succès"}), 200

    except Exception:
        return jsonify(
            {"error": "Une erreur est survenue lors de la suppression de l'utilisateur"}
        ), 500
