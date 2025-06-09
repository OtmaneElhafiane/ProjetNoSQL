from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, date
from neo4j import GraphDatabase
from werkzeug.security import generate_password_hash
from ..config import Config
from ..data.sync_service import SyncService
from ..models.user import User

doctor_bp = Blueprint('doctor', __name__)
mongo_client = MongoClient(Config.MONGODB_URI)
db = mongo_client.cabinet_medical
neo4j_driver = GraphDatabase.driver(
    Config.NEO4J_URI, auth=(Config.NEO4J_USER, Config.NEO4J_PASSWORD)
)
sync_service = SyncService()

def doctor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user_id = ObjectId(current_user_id)
        user = db.users.find_one({'_id': current_user_id})
        if not user or user['role'] != 'doctor':
            return jsonify({'error': 'Doctor access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Accès réservé aux administrateurs"}), 403
        return f(*args, **kwargs)
    return decorated_function

# ======================== GESTION DES DOCTEURS (ADMIN SEULEMENT) ========================

@doctor_bp.route('/doctors', methods=['GET'])
@jwt_required()
@admin_required
def get_all_doctors():
    """Récupérer tous les docteurs (Admin seulement)"""
    try:
        # Récupérer tous les utilisateurs avec le rôle doctor
        users = list(db.users.find({'role': 'doctor'}))
        doctors_list = []
        
        for user in users:
            # Récupérer les données supplémentaires du docteur
            doctor_data = db.doctors.find_one({'user_id': str(user['_id'])})
            
            doctor_info = {
                'user_id': str(user['_id']),
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'created_at': user['created_at'].isoformat() if user['created_at'] else None,
                'last_login': user['last_login'].isoformat() if user.get('last_login') else None
            }
            
            if doctor_data:
                doctor_info.update({
                    'doctor_id': str(doctor_data['_id']),
                    'name': doctor_data['name'],
                    'phone': doctor_data['phone'],
                    'speciality': doctor_data['speciality'],
                    'schedule': doctor_data.get('schedule', {})
                })
            
            doctors_list.append(doctor_info)
        
        return jsonify({
            'doctors': doctors_list,
            'total': len(doctors_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des docteurs: {str(e)}'}), 500

@doctor_bp.route('/create', methods=['POST'])
@jwt_required()
@admin_required
def create_doctor():
    """Créer un nouveau docteur (Admin seulement)"""
    try:
        data = request.get_json()
        
        # Vérifier les champs requis
        required_fields = ["email", "password", "first_name", "last_name", "speciality"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Tous les champs requis doivent être fournis"}), 400
        
        # Créer l'utilisateur avec le rôle doctor
        user = User.create_user(
            email=data["email"],
            password=data["password"],
            role="doctor",
            first_name=data["first_name"],
            last_name=data["last_name"]
        )
        
        # Créer le document docteur
        doctor_data = {
            "user_id": str(user._id),
            "name": f"{data['first_name']} {data['last_name']}",
            "email": data["email"],
            "phone": data.get("phone", ""),
            "speciality": data["speciality"],
            "schedule": data.get("schedule", {})
        }
        
        result = db.doctors.insert_one(doctor_data)
        doctor_data["_id"] = str(result.inserted_id)
        
        # Synchroniser avec Neo4j
        sync_service.sync_doctor(doctor_data)
        
        return jsonify({
            "message": "Docteur créé avec succès",
            "doctor": doctor_data
        }), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Une erreur est survenue lors de la création du docteur"}), 500

@doctor_bp.route('/doctorById/<user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_doctor_by_id(user_id):
    """Récupérer un docteur par son user_id (Admin seulement)"""
    try:
        # Récupérer l'utilisateur
        user = User.get_by_id(user_id)
        if not user or user.role != 'doctor':
            return jsonify({"error": "Docteur non trouvé"}), 404

        # Récupérer les données du docteur
        doctor_data = db.doctors.find_one({'user_id': user_id})

        response_data = {

            'last_login': user.last_login,
            'created_at': user.created_at
        }

        if doctor_data:
            doctor_data['_id'] = str(doctor_data['_id'])
            response_data['doctor'] = doctor_data

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": "Une erreur est survenue lors de la récupération du docteur"}), 500

@doctor_bp.route('/update/<user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_doctor(user_id):
    """Mettre à jour un docteur (Admin seulement)"""
    try:
        # Récupérer l'utilisateur
        user = User.get_by_id(user_id)
        if not user or user.role != 'doctor':
            return jsonify({"error": "Docteur non trouvé"}), 404
        
        data = request.get_json()
        
        # Mettre à jour l'utilisateur
        user_updates = {}
        if 'first_name' in data:
            user_updates['first_name'] = data['first_name']
        if 'last_name' in data:
            user_updates['last_name'] = data['last_name']
        if 'email' in data:
            user_updates['email'] = data['email'].lower()
        if 'password' in data:
            user.password_hash = generate_password_hash(data['password'])
        
        # Appliquer les mises à jour de l'utilisateur
        for key, value in user_updates.items():
            setattr(user, key, value)
        
        user.save()
        
        # Mettre à jour les données du docteur
        doctor_updates = {}
        if 'phone' in data:
            doctor_updates['phone'] = data['phone']
        if 'speciality' in data:
            doctor_updates['speciality'] = data['speciality']
        if 'schedule' in data:
            doctor_updates['schedule'] = data['schedule']
        
        # Mettre à jour le nom si first_name ou last_name ont changé
        if 'first_name' in data or 'last_name' in data:
            doctor_updates['name'] = f"{user.first_name} {user.last_name}"
        
        if 'email' in data:
            doctor_updates['email'] = data['email'].lower()
        
        if doctor_updates:
            db.doctors.update_one(
                {'user_id': user_id},
                {'$set': doctor_updates}
            )
            
            # Récupérer les données mises à jour pour la synchronisation
            updated_doctor = db.doctors.find_one({'user_id': user_id})
            if updated_doctor:
                updated_doctor['_id'] = str(updated_doctor['_id'])
                sync_service.sync_doctor(updated_doctor)
        print(updated_doctor)
        return jsonify({
            "message": "Docteur mis à jour avec succès",
            "user": updated_doctor
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Une erreur est survenue lors de la mise à jour du docteur"}), 500

@doctor_bp.route('/delete/<user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_doctor(user_id):
    """Supprimer un docteur (Admin seulement)"""
    try:
        # Récupérer l'utilisateur
        user = User.get_by_id(user_id)
        if not user or user.role != 'doctor':
            return jsonify({"error": "Docteur non trouvé"}), 404
        
        # Récupérer les données du docteur AVANT la suppression
        doctor_data = db.doctors.find_one({'user_id': user_id})
        if not doctor_data:
            return jsonify({"error": "Données du docteur non trouvées"}), 404
        
        # Utiliser l'_id du document doctor car le SyncService utilise "id" dans Neo4j
        doctor_neo4j_id = str(doctor_data['_id'])
        
        print(f"Tentative de suppression Neo4j avec id: {doctor_neo4j_id}")
        
        # Supprimer de Neo4j EN PREMIER
        try:
            with neo4j_driver.session() as session:
                # Vérifier d'abord si le nœud existe avec la propriété "id"
                check_result = session.run("""
                    MATCH (d:Doctor {id: $doctor_id})
                    RETURN d.id as found_id, d.name as name
                """, doctor_id=doctor_neo4j_id)
                
                found_record = check_result.single()
                if found_record:
                    print(f"Nœud trouvé: {found_record['found_id']} - {found_record['name']}")
                    
                    # Supprimer le nœud avec DETACH DELETE pour supprimer aussi les relations
                    delete_result = session.run("""
                        MATCH (d:Doctor {id: $doctor_id})
                        DETACH DELETE d
                        RETURN count(d) as deleted_count
                    """, doctor_id=doctor_neo4j_id)
                    
                    delete_record = delete_result.single()
                    deleted_count = delete_record['deleted_count'] if delete_record else 0
                    print(f"Nœuds Doctor supprimés de Neo4j: {deleted_count}")
                    
                    if deleted_count == 0:
                        print("ATTENTION: Aucun nœud n'a été supprimé!")
                        return jsonify({"error": "Échec de la suppression dans Neo4j"}), 500
                else:
                    print(f"Aucun nœud trouvé avec id: {doctor_neo4j_id}")
                    # Optionnel: lister tous les docteurs pour debug
                    debug_result = session.run("MATCH (d:Doctor) RETURN d.id, d.name LIMIT 5")
                    all_doctors = list(debug_result)
                    print(f"Docteurs existants dans Neo4j: {all_doctors}")
                    
                    # Ne pas faire échouer si le nœud n'existe pas dans Neo4j
                    print("Le nœud n'existe pas dans Neo4j, continuation de la suppression MongoDB")
                
        except Exception as neo4j_error:
            print(f"Erreur Neo4j lors de la suppression: {neo4j_error}")
            return jsonify({"error": f"Erreur lors de la suppression dans Neo4j: {str(neo4j_error)}"}), 500
        
        # Supprimer de MongoDB seulement après Neo4j
        db.doctors.delete_one({'user_id': user_id})
        db.users.delete_one({'_id': user._id})
        
        return jsonify({"message": "Docteur supprimé avec succès"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Une erreur est survenue lors de la suppression du docteur: {str(e)}"}), 500

# ======================== PROFILE DU DOCTEUR CONNECTÉ ========================

@doctor_bp.route('/profile', methods=['GET'])
@jwt_required()
@doctor_required
def get_doctor_profile():
    """Récupérer le profil du docteur connecté"""
    try:
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        doctor_data = db.doctors.find_one({'user_id': current_user_id})
        
        response_data = {
            'last_login': user.last_login,
            'created_at': user.created_at
        }
        
        if doctor_data:
            doctor_data['_id'] = str(doctor_data['_id'])
            response_data['doctor'] = doctor_data
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération du profil: {str(e)}'}), 500

@doctor_bp.route('/profile', methods=['PUT'])
@jwt_required()
@doctor_required
def update_doctor_profile():
    """Mettre à jour le profil du docteur connecté"""
    try:
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        data = request.get_json()
        
        # Mettre à jour l'utilisateur (champs autorisés)
        allowed_user_fields = ['first_name', 'last_name', 'email']
        user_updates = {}
        
        for field in allowed_user_fields:
            if field in data:
                if field == 'email':
                    user_updates[field] = data[field].lower()
                else:
                    user_updates[field] = data[field]
        
        # Mettre à jour le mot de passe si fourni
        if 'password' in data:
            user.password_hash = generate_password_hash(data['password'])
        
        # Appliquer les mises à jour de l'utilisateur
        for key, value in user_updates.items():
            setattr(user, key, value)
        
        user.save()
        
        # Mettre à jour les données du docteur
        doctor_updates = {}
        allowed_doctor_fields = ['phone', 'speciality', 'schedule']
        
        for field in allowed_doctor_fields:
            if field in data:
                doctor_updates[field] = data[field]
        
        # Mettre à jour le nom si first_name ou last_name ont changé
        if 'first_name' in data or 'last_name' in data:
            doctor_updates['name'] = f"{user.first_name} {user.last_name}"
        
        if 'email' in data:
            doctor_updates['email'] = data['email'].lower()
        
        if doctor_updates:
            db.doctors.update_one(
                {'user_id': current_user_id},
                {'$set': doctor_updates}
            )
            
            # Récupérer les données mises à jour du docteur pour la synchronisation Neo4j
            updated_doctor = db.doctors.find_one({'user_id': current_user_id})
            if updated_doctor:
                updated_doctor['_id'] = str(updated_doctor['_id'])
                sync_service.sync_doctor(updated_doctor)
        
        return jsonify({
            "message": "Profil mis à jour avec succès",
            "user": user.to_json()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la mise à jour du profil: {str(e)}'}), 500

# ======================== CONSULTATIONS (FONCTIONNALITÉS EXISTANTES) ========================

@doctor_bp.route('/consultations/history', methods=['GET'])
@jwt_required()
@doctor_required
def get_consultation_history():
    """Récupérer l'historique de toutes les consultations du docteur via Neo4j"""
    try:
        current_user_id = get_jwt_identity()
        doctor = db.doctors.find_one({'user_id': current_user_id})
        if not doctor:
            return jsonify({'error': 'Docteur non trouvé'}), 404
        
        doctor_mongo_id = str(doctor['user_id'])
        print(f"Recherche des consultations pour le docteur mongo_id: {doctor_mongo_id}")
        
        with neo4j_driver.session() as session:
            result = session.run("""
                    MATCH (p:Patient)-[r:CONSULTED_BY]->(d:Doctor)
                    WHERE d.mongo_id = $doctor_mongo_id
                    RETURN p.mongo_id as patient_mongo_id,
                        r.consultation_id as consultation_id,
                        r.date as date,
                        r.motif as motif,
                        r.diagnostic as diagnostic,
                        r.traitement as traitement,
                        r.notes as notes,
                        r.status as status,
                        r.created_at as created_at
                    ORDER BY r.date DESC
            """, doctor_mongo_id=doctor_mongo_id)  # CORRECTION: Utiliser doctor_mongo_id
            
            consultations_history = []
            
            # Itérer sur les enregistrements du résultat
            for record in result:
                print(f"Traitement de l'enregistre±ment: {dict(record)}")
                
                # Récupérer les informations du patient depuis MongoDB
                patient_mongo_id = record['patient_mongo_id']
                try:
                    patient = db.patients.find_one({'user_id': patient_mongo_id})
                    print(f"Patient trouvé: {patient['name'] if patient else 'Non trouvé'}")
                except Exception as patient_error:
                    print(f"Erreur lors de la recherche du patient {patient_mongo_id}: {patient_error}")
                    patient = None
                
                if patient:
                    consultation_data = {
                        'consultation_id': record['consultation_id'],
                        'date': record['date'],
                        'motif': record['motif'],
                        'diagnostic': record['diagnostic'],
                        'traitement': record['traitement'],
                        'notes': record['notes'] or '',
                        'status': record['status'] or 'pending',
                        'created_at': record['created_at'],
                        'patient': {
                            'id': str(patient['_id']),
                            'name': patient['name'],
                            'email': patient['email'],
                            'phone': patient['phone'],
                            'birth_date': patient.get('birth_date', ''),
                            'address': patient.get('address', '')
                        }
                    }
                    consultations_history.append(consultation_data)
                else:
                    print(f"Patient avec ID {patient_mongo_id} non trouvé dans MongoDB")
            
            print(f"Nombre total de consultations trouvées: {len(consultations_history)}")
            
            return jsonify({
                'consultations': consultations_history,
                'total': len(consultations_history)
            }), 200
            
    except Exception as e:
        print(f"Erreur dans get_consultation_history: {str(e)}")
        return jsonify({'error': f'Erreur lors de la récupération de l\'historique: {str(e)}'}), 500

@doctor_bp.route('/consultations/<consultation_id>/status', methods=['PUT'])
@jwt_required()
@doctor_required
def update_consultation_status(consultation_id):
    """Mettre à jour le statut d'une consultation dans Neo4j"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Statut requis'}), 400
        
        # Valider le statut
        valid_statuses = ['pending', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Statut invalide. Statuts valides: {valid_statuses}'}), 400
        
        current_user_id = get_jwt_identity()
        doctor = db.doctors.find_one({'user_id': current_user_id})
        
        if not doctor:
            print("doctuer non trouvé : " , current_user_id)
            return jsonify({'error': 'Docteur non trouvé'}), 404
        
        # Utiliser l'_id du document doctor car le SyncService utilise "id" dans Neo4j
        doctor_neo4j_id = str(doctor['user_id'])
        print("noe4j doctor id" , doctor_neo4j_id)
        # Mettre à jour le statut dans Neo4j
        with neo4j_driver.session() as session:
            result = session.run("""
                MATCH (p:Patient)-[r:CONSULTED_BY]->(d:Doctor)
                WHERE r.consultation_id = $consultation_id 
                AND d.mongo_id = $doctor_id
                SET r.status = $status, r.updated_at = datetime()
                RETURN r.status as updated_status, r.consultation_id as consultation_id
            """, 
            consultation_id=consultation_id,
            doctor_id=doctor_neo4j_id,
            status=new_status)
            
            record = result.single()
            if not record:
                return jsonify({'error': 'Consultation non trouvée ou accès non autorisé'}), 404
            
            return jsonify({
                'message': 'Statut de la consultation mis à jour avec succès',
                'consultation_id': record['consultation_id'],
                'new_status': record['updated_status']
            }), 200
            
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la mise à jour du statut: {str(e)}'}), 500

@doctor_bp.route('/consultations/upcoming', methods=['GET'])
@jwt_required()
@doctor_required
def get_upcoming_consultations():
    """Récupérer les consultations à venir avec statut 'pending' uniquement"""
    try:
        current_user_id = get_jwt_identity()
        doctor = db.doctors.find_one({'user_id': current_user_id})
        
        if not doctor:
            return jsonify({'error': 'Docteur non trouvé'}), 404
        
        # Utiliser l'_id du document doctor car le SyncService utilise "id" dans Neo4j
        doctor_neo4j_id = str(doctor['user_id'])
        today = datetime.now().date().isoformat()
        
        # Requête Neo4j pour les consultations à venir avec statut 'pending' uniquement
        with neo4j_driver.session() as session:
            result = session.run("""
                MATCH (p:Patient)-[r:CONSULTED_BY]->(d:Doctor)
                WHERE d.mongo_id = $doctor_id
                AND datetime(r.date) >= datetime($today)
                AND NOT r.status IN ['cancelled', 'completed']
                RETURN p.mongo_id as patient_mongo_id, 
                       r.consultation_id as consultation_id,
                       r.date as date,
                       r.motif as motif,
                       r.diagnostic as diagnostic,
                       r.traitement as traitement,
                       r.notes as notes,
                       r.status as status,
                       r.created_at as created_at
                ORDER BY r.date ASC
            """, 
            doctor_id=doctor_neo4j_id,
            today=today + "T00:00:00+00:00")
            
            upcoming_consultations = []
            
            for record in result:
                # Récupérer les informations du patient depuis MongoDB
                patient = db.patients.find_one({'user_id': record['patient_mongo_id']})
                
                if patient:
                    consultation_data = {
                        'consultation_id': record['consultation_id'],
                        'date': record['date'],
                        'motif': record['motif'],
                        'diagnostic': record['diagnostic'],
                        'traitement': record['traitement'],
                        'notes': record['notes'] or '',
                        'status': record['status'],
                        'created_at': record['created_at'],
                        'patient': {
                            'id': str(patient['_id']),
                            'name': patient['name'],
                            'email': patient['email'],
                            'phone': patient['phone'],
                            'birth_date': patient.get('birth_date', ''),
                            'address': patient.get('address', '')
                        }
                    }
                    upcoming_consultations.append(consultation_data)
            
            return jsonify({
                'upcoming_consultations': upcoming_consultations,
                'total': len(upcoming_consultations)
            }), 200
            
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des consultations à venir: {str(e)}'}), 500
@doctor_bp.route('/consultations/<consultation_id>', methods=['PUT'])
@jwt_required()
@doctor_required
def update_consultation(consultation_id):
    data = request.get_json()
    current_user_id = get_jwt_identity()
    doctor = db.doctors.find_one({'user_id': current_user_id})
    
    if not doctor:
        return jsonify({'error': 'Docteur non trouvé'}), 404
    
    consultation_data = {
        'symptoms': data['symptoms'],
        'diagnosis': data['diagnosis'],
        'treatment': data['treatment'],
        'notes': data.get('notes', ''),
        'updated_at': datetime.utcnow()
    }
    
    db.consultations.update_one(
        {
            '_id': ObjectId(consultation_id),
            'doctor_id': str(doctor['_id'])
        },
        {'$set': consultation_data}
    )
    
    consultation_data['_id'] = consultation_id
    consultation_data['doctor_id'] = str(doctor['_id'])
    sync_service.sync_consultation(consultation_data)
    
    return jsonify(consultation_data), 200

@doctor_bp.route('/patients/<patient_id>/history', methods=['GET'])
@jwt_required()
@doctor_required
def get_patient_history(patient_id):
    try:
        print("patient_id", patient_id)
        current_user_id = get_jwt_identity()
        print("l id du docteur" , current_user_id)
        # Convertir en ObjectId pour la recherche MongoDB
        try:
            doctor = db.doctors.find_one({'user_id': current_user_id})
        except Exception as e:
            print(f"Erreur lors de la recherche du docteur: {e}")
            return jsonify({'error': 'Format d\'ID docteur invalide'}), 400
        
        # Chercher le patient par _id
        try:
            patient = db.patients.find_one({'_id': ObjectId(patient_id)})
        except Exception as e:
            print(f"Erreur lors de la recherche du patient: {e}")
            return jsonify({'error': 'Format d\'ID patient invalide'}), 400
        
        if not doctor:
            print(f"Docteur non trouvé avec l'ID: {current_user_id}")
            return jsonify({'error': 'Docteur non trouvé'}), 404
        if not patient:
            print(f"Patient non trouvé avec l'ID: {patient_id}")
            return jsonify({'error': 'Patient non trouvé'}), 404
        
        doctor_neo4j_id = str(doctor['user_id'])
        patient_user_id = str(patient['user_id'])  # Utiliser le user_id du patient
        
        print("Doctor Neo4j ID:", doctor_neo4j_id)
        print("Patient user_id for Neo4j:", patient_user_id)
        
        # Requête Neo4j pour l'historique d'un patient spécifique
        with neo4j_driver.session() as session:
            result = session.run("""
                MATCH (p:Patient)-[r:CONSULTED_BY]->(d:Doctor)
                WHERE d.mongo_id = $doctor_id
                AND p.mongo_id = $patient_user_id
                RETURN r.consultation_id as consultation_id,
                       r.date as date,
                       r.motif as motif,
                       r.diagnostic as diagnostic,
                       r.traitement as traitement,
                       r.notes as notes,
                       r.status as status,
                       r.created_at as created_at
                ORDER BY r.date DESC
                """,
                doctor_id=doctor_neo4j_id,
                patient_user_id=patient_user_id)
            
            patient_history = []
            for record in result:
                consultation_data = {
                    'consultation_id': record['consultation_id'],
                    'date': record['date'],
                    'motif': record['motif'],
                    'diagnostic': record['diagnostic'],
                    'traitement': record['traitement'],
                    'notes': record['notes'] or '',
                    'status': record['status'] or 'pending',
                    'created_at': record['created_at']
                }
                patient_history.append(consultation_data)
        
        return jsonify({
            'patient': {
                'id': str(patient['_id']),
                'name': patient['name'],
                'email': patient['email'],
                'phone': patient['phone'],
                'birth_date': patient.get('birth_date', ''),
                'address': patient.get('address', '')
            },
            'consultations': patient_history,
            'total': len(patient_history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération de l\'historique du patient: {str(e)}'}), 500