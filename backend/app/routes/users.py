from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import get_collection
from bson import ObjectId

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
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

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    users = get_collection('users')
    result = users.update_one(
        {'_id': ObjectId(current_user_id)},
        {'$set': data}
    )
    
    if result.modified_count == 0:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    user = users.find_one({'_id': ObjectId(current_user_id)})
    return jsonify({
        'message': 'Profil mis à jour avec succès',
        'user': {
            '_id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'name': user.get('name', '')
        }
    })

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_users():
    users = get_collection('users')
    users_list = []
    
    for user in users.find():
        users_list.append({
            '_id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'name': user.get('name', '')
        })
    
    return jsonify({
        'message': 'Liste des utilisateurs récupérée avec succès',
        'users': users_list
    })

@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    users = get_collection('users')
    user = users.find_one({'_id': ObjectId(user_id)})
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    return jsonify({
        'message': 'Utilisateur récupéré avec succès',
        'user': {
            '_id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'name': user.get('name', '')
        }
    })

@users_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    users = get_collection('users')
    result = users.delete_one({'_id': ObjectId(user_id)})
    
    if result.deleted_count == 0:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    return jsonify({'message': 'Utilisateur supprimé avec succès'})

@users_bp.route('/<user_id>/role', methods=['PUT'])
@jwt_required()
def update_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    
    if not new_role:
        return jsonify({'message': 'Rôle requis'}), 400
    
    users = get_collection('users')
    result = users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {'role': new_role}}
    )
    
    if result.modified_count == 0:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    user = users.find_one({'_id': ObjectId(user_id)})
    return jsonify({
        'message': 'Rôle mis à jour avec succès',
        'user': {
            '_id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'name': user.get('name', '')
        }
    })

@users_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    query = request.args.get('query', '')
    users = get_collection('users')
    users_list = []
    
    for user in users.find({
        '$or': [
            {'email': {'$regex': query, '$options': 'i'}},
            {'name': {'$regex': query, '$options': 'i'}}
        ]
    }):
        users_list.append({
            '_id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'name': user.get('name', '')
        })
    
    return jsonify({
        'message': 'Recherche effectuée avec succès',
        'users': users_list
    }) 