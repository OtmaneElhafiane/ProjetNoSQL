from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import get_collection
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400
    
    users = get_collection('users')
    user = users.find_one({'email': email})
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Email ou mot de passe incorrect'}), 401
    
    access_token = create_access_token(identity=str(user['_id']))
    
    return jsonify({
        'message': 'Connexion réussie',
        'token': access_token,
        'user': {
            '_id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'name': user.get('name', '')
        }
    })

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'patient')
    name = data.get('name', '')
    
    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400
    
    users = get_collection('users')
    if users.find_one({'email': email}):
        return jsonify({'message': 'Email déjà utilisé'}), 400
    
    hashed_password = generate_password_hash(password)
    
    user_id = users.insert_one({
        'email': email,
        'password': hashed_password,
        'role': role,
        'name': name
    }).inserted_id
    
    access_token = create_access_token(identity=str(user_id))
    
    return jsonify({
        'message': 'Inscription réussie',
        'token': access_token,
        'user': {
            '_id': str(user_id),
            'email': email,
            'role': role,
            'name': name
        }
    }), 201

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    users = get_collection('users')
    user = users.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    return jsonify({
        'message': 'Profil récupéré avec succès',
        'user': {
            '_id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'name': user.get('name', '')
        }
    }) 