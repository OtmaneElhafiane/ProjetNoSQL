from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from ..models.user import User
from ..extensions import jwt
import hashlib
import os
import base64

auth_bp = Blueprint("auth", __name__)


def verify_pbkdf2_password(password, hashed_password):
    """Vérifier un mot de passe avec PBKDF2"""
    try:
        # Format: pbkdf2:sha256:iterations$salt$hash
        parts = hashed_password.split('$')
        if len(parts) != 3:
            return False
        
        # Extraire les informations du hash
        algorithm_info = parts[0].split(':')  # pbkdf2:sha256:260000
        iterations = int(algorithm_info[2])
        salt = parts[1]
        stored_hash = parts[2]
        
        # Calculer le hash avec le sel et les itérations
        computed_hash = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode('utf-8'), 
            salt.encode('utf-8'), 
            iterations
        )
        
        # Convertir en hexadécimal pour comparaison
        computed_hash_hex = computed_hash.hex()
        
        return computed_hash_hex == stored_hash
    except Exception as e:
        print(f"Erreur lors de la vérification PBKDF2: {e}")
        return False


@auth_bp.route("/register/admin", methods=["POST"])
def register_admin():
    """Route pour l'enregistrement d'un administrateur"""
    data = request.get_json()

    try:
        # Vérifier si les champs requis sont présents
        required_fields = ["email", "password", "first_name", "last_name"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Tous les champs sont requis"}), 400

        # Créer l'administrateur
        user = User.create_admin(
            email=data["email"],
            password=data["password"],
            first_name=data["first_name"],
            last_name=data["last_name"],
        )

        return jsonify(
            {"message": "Administrateur créé avec succès", "user": user.to_json()}
        ), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify(
            {"error": "Une erreur est survenue lors de la création du compte"}
        ), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Route pour la connexion des utilisateurs avec vérification PBKDF2"""
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email et mot de passe requis"}), 400

    try:
        # Rechercher l'utilisateur dans la collection cabinet_medical.users
        user = User.get_by_email_from_cabinet_medical(data["email"])
        
        if not user:
            return jsonify({"error": "Email ou mot de passe incorrect"}), 401

        # Vérifier le mot de passe avec PBKDF2
        if not verify_pbkdf2_password(data["password"], user.get("password_hash", "")):
            return jsonify({"error": "Email ou mot de passe incorrect"}), 401

        # Mettre à jour la date de dernière connexion
        User.update_last_login_cabinet_medical(user["_id"])

        # Créer les tokens
        access_token = create_access_token(
            identity=str(user["_id"]), 
            additional_claims={"role": user.get("role", "patient")}
        )
        refresh_token = create_refresh_token(
            identity=str(user["_id"]), 
            additional_claims={"role": user.get("role", "patient")}
        )

        # Déterminer la route de redirection selon le rôle
        redirect_path = "/dashboard"
        user_role = user.get("role", "patient")
        
        if user_role == "admin":
            redirect_path = "/admin/dashboard"
        elif user_role == "doctor":
            redirect_path = "/doctor/dashboard"
        elif user_role == "patient":
            redirect_path = "/patient/dashboard"

        # Préparer les données utilisateur sans le mot de passe
        user_data = {
            "id": str(user["_id"]),
            "email": user["email"],
            "role": user_role,
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "created_at": user.get("created_at"),
            "last_login": user.get("last_login")
        }

        return jsonify(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user_data,
                "redirect_path": redirect_path
            }
        ), 200

    except Exception as e:
        print(f"Erreur lors de la connexion: {e}")
        return jsonify({"error": "Une erreur est survenue lors de la connexion"}), 500


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Route pour rafraîchir le token d'accès"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()

        access_token = create_access_token(
            identity=current_user_id, additional_claims={"role": claims.get("role")}
        )

        return jsonify({"access_token": access_token}), 200
    except Exception:
        return jsonify(
            {"error": "Une erreur est survenue lors du rafraîchissement du token"}
        ), 500


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Route pour obtenir le profil de l'utilisateur connecté"""
    try:
        current_user_id = get_jwt_identity()
        user = User.get_by_id_from_cabinet_medical(current_user_id)

        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Préparer les données utilisateur sans le mot de passe
        user_data = {
            "id": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "patient"),
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "created_at": user.get("created_at"),
            "last_login": user.get("last_login")
        }

        return jsonify(user_data), 200
    except Exception as e:
        print(f"Erreur lors de la récupération du profil: {e}")
        return jsonify(
            {"error": "Une erreur est survenue lors de la récupération du profil"}
        ), 500


@auth_bp.route("/validate-token", methods=["GET"])
@jwt_required()
def validate_token():
    """Route pour valider un token et obtenir les informations utilisateur"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        user = User.get_by_id_from_cabinet_medical(current_user_id)
        
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # Déterminer la route de redirection selon le rôle
        user_role = user.get("role", "patient")
        redirect_path = "/dashboard"
        
        if user_role == "admin":
            redirect_path = "/admin/dashboard"
        elif user_role == "doctor":
            redirect_path = "/doctor/dashboard"
        elif user_role == "patient":
            redirect_path = "/patient/dashboard"

        user_data = {
            "id": str(user["_id"]),
            "email": user["email"],
            "role": user_role,
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "redirect_path": redirect_path
        }

        return jsonify({"valid": True, "user": user_data}), 200
    except Exception as e:
        print(f"Erreur lors de la validation du token: {e}")
        return jsonify({"valid": False, "error": "Token invalide"}), 401


# Gestionnaire d'erreurs JWT
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Le token a expiré", "code": "token_expired"}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"error": "Token invalide", "code": "invalid_token"}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({"error": "Token manquant", "code": "missing_token"}), 401
