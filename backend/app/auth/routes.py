from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from datetime import timedelta
from ..models.user import User
from ..extensions import jwt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register/admin', methods=['POST'])
def register_admin():
    """Route pour l'enregistrement d'un administrateur"""
    data = request.get_json()
    
    try:
        # Vérifier si les champs requis sont présents
        required_fields = ['email', 'password', 'first_name', 'last_name']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Tous les champs sont requis'}), 400
        
        # Créer l'administrateur
        user = User.create_admin(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        
        return jsonify({
            'message': 'Administrateur créé avec succès',
            'user': user.to_json()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Une erreur est survenue lors de la création du compte'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Route pour la connexion des utilisateurs"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    try:
        user = User.get_by_email(data['email'])
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
        
        # Mettre à jour la date de dernière connexion
        user.update_last_login()
        
        # Créer les tokens
        access_token = create_access_token(
            identity=user._id,
            additional_claims={'role': user.role}
        )
        refresh_token = create_refresh_token(
            identity=user._id,
            additional_claims={'role': user.role}
        )
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_json()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Une erreur est survenue lors de la connexion'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Route pour rafraîchir le token d'accès"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        access_token = create_access_token(
            identity=current_user_id,
            additional_claims={'role': claims.get('role')}
        )
        
        return jsonify({'access_token': access_token}), 200
    except Exception as e:
        return jsonify({'error': 'Une erreur est survenue lors du rafraîchissement du token'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Route pour obtenir le profil de l'utilisateur connecté"""
    try:
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        return jsonify(user.to_json()), 200
    except Exception as e:
        return jsonify({'error': 'Une erreur est survenue lors de la récupération du profil'}), 500

# Gestionnaire d'erreurs JWT
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Le token a expiré',
        'code': 'token_expired'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Token invalide',
        'code': 'invalid_token'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Token manquant',
        'code': 'missing_token'
    }), 401 