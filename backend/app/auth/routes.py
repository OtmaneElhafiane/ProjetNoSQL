from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..models.user import User
from pymongo import MongoClient
from ..config import Config

auth_bp = Blueprint('auth', __name__)
mongo_client = MongoClient(Config.MONGO_URI)
db = mongo_client.cabinet_medical

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if db.users.find_one({'email': data['email']}):
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=data['role']
    )
    
    db.users.insert_one(user.to_dict())
    
    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_data = db.users.find_one({'email': data['email']})
    
    if not user_data or not check_password_hash(user_data['password_hash'], data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user_data['_id']))
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'username': user_data['username'],
            'email': user_data['email'],
            'role': user_data['role']
        }
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()
    user_data = db.users.find_one({'_id': current_user_id})
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'username': user_data['username'],
        'email': user_data['email'],
        'role': user_data['role']
    }), 200 