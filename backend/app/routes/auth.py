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
    """Route d'inscription compatible avec AuthService Angular"""
    data = request.get_json()
    
    # Récupérer les données selon le format attendu par Angular
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    role = data.get('role', 'patient')
    
    print(f"📝 Tentative d'inscription: {email} - {role}")
    
    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    if not first_name or not last_name:
        return jsonify({'error': 'Prénom et nom requis'}), 400
    
    try:
        from ..models.user import User
        
        # Créer l'utilisateur avec la logique existante
        user = User.create_user(
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name
        )
        
        # Créer les tokens comme dans login
        from flask_jwt_extended import create_access_token, create_refresh_token
        
        access_token = create_access_token(
            identity=str(user._id), 
            additional_claims={"role": user.role}
        )
        refresh_token = create_refresh_token(
            identity=str(user._id), 
            additional_claims={"role": user.role}
        )
        
        # Déterminer la route de redirection selon le rôle
        redirect_path = "/dashboard"
        user_role = user.role
        
        if user_role == "admin":
            redirect_path = "/admin/dashboard"
        elif user_role == "doctor":
            redirect_path = "/doctor/dashboard"
        elif user_role == "patient":
            redirect_path = "/patient/dashboard"
        
        # Préparer les données utilisateur
        user_data = {
            "id": str(user._id),
            "email": user.email,
            "role": user_role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "redirect_path": redirect_path
        }
        
        print(f"✅ Inscription réussie pour {email}")
        
        return jsonify({
            "message": "Inscription réussie",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user_data,
            "redirect_path": redirect_path
        }), 201
        
    except ValueError as e:
        print(f"❌ Erreur inscription: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"❌ Erreur interne inscription: {e}")
        return jsonify({"error": "Une erreur est survenue lors de l'inscription"}), 500

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