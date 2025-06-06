from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import mongo
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    user = mongo.db.users.find_one({'email': email})
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    access_token = create_access_token(identity=str(user['_id']))
    
    return jsonify({
        'token': access_token,
        'user': {
            'id': str(user['_id']),
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
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    if mongo.db.users.find_one({'email': email}):
        return jsonify({'error': 'Email déjà utilisé'}), 400
    
    hashed_password = generate_password_hash(password)
    
    user_id = mongo.db.users.insert_one({
        'email': email,
        'password': hashed_password,
        'role': role,
        'name': name
    }).inserted_id
    
    access_token = create_access_token(identity=str(user_id))
    
    return jsonify({
        'token': access_token,
        'user': {
            'id': str(user_id),
            'email': email,
            'role': role,
            'name': name
        }
    }), 201

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    return jsonify({
        'id': str(user['_id']),
        'email': user['email'],
        'role': user['role'],
        'name': user.get('name', '')
    }) 