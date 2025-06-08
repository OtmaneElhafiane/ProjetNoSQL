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

patient_bp = Blueprint('patient', __name__)
mongo_client = MongoClient(Config.MONGODB_URI)
db = mongo_client.cabinet_medical
neo4j_driver = GraphDatabase.driver(
    Config.NEO4J_URI, auth=(Config.NEO4J_USER, Config.NEO4J_PASSWORD)
)
sync_service = SyncService()

def patient_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = db.users.find_one({'_id': current_user_id})
        if not user or user['role'] != 'patient':
            return jsonify({'error': 'Patient access required'}), 403
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

@patient_bp.route('/patients', methods=['GET'])
@jwt_required()
@admin_required
def get_all_patients():
    """Récupérer tous les docteurs (Admin seulement)"""
    try:
        # Récupérer tous les utilisateurs avec le rôle patient
        users = list(db.users.find({'role': 'patient'}))
        patients_list = []

        for user in users:
            # Récupérer les données supplémentaires du docteur
            patient_data = db.patients.find_one({'user_id': str(user['_id'])})

            patient_info = {
                'user_id': str(user['_id']),
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'created_at': user['created_at'].isoformat() if user['created_at'] else None,
                'last_login': user['last_login'].isoformat() if user.get('last_login') else None
            }

            if patient_data:
                patient_info.update({
                    'patient_id': str(patient_data['_id']),
                    'cin': patient_data['cin'],
                    'nom': patient_data['nom'],
                    'email': patient_data['email'],
                    'telephone': patient_data['telephone'],
                    'type': patient_data['type'],
                })

            patients_list.append(patient_info)

        return jsonify({
            'patients': patients_list,
            'total': len(patients_list)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des docteurs: {str(e)}'}), 500

@patient_bp.route('/create', methods=['POST'])
@jwt_required()
@admin_required
def create_patient():
    """Créer un nouveau patient (Admin seulement)"""
    try:
        data = request.get_json()

        # Vérifier les champs requis
        required_fields = ["email", "password", "first_name", "last_name", "cin", "telephone", "type"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Tous les champs requis doivent être fournis"}), 400

        # Créer l'utilisateur avec le rôle patient
        user = User.create_user(
            email=data["email"],
            password=data["password"],
            role="patient",
            first_name=data["first_name"],
            last_name=data["last_name"]
        )

        # Créer le document patient
        patient_data = {
            "user_id": str(user._id),
            "nom": f"{data['first_name']} {data['last_name']}",
            "cin": data["cin"],
            "email": data["email"],
            "telephone": data["telephone", ""],
            "type": data["type"]
        }

        result = db.patients.insert_one(patient_data)
        patient_data["_id"] = str(result.inserted_id)

        # Synchroniser avec Neo4j (si nécessaire)
        sync_service.sync_patient(patient_data)

        return jsonify({
            "message": "Patient créé avec succès",
            "user": user.to_json(),
            "patient": patient_data
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Une erreur est survenue lors de la création du patient"}), 500


@patient_bp.route('/patientById/<user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_patient_by_id(user_id):
    """Récupérer un docteur par son user_id (Admin seulement)"""
    try:
        # Récupérer l'utilisateur
        user = User.get_by_id(user_id)
        if not user or user.role != 'patient':
            return jsonify({"error": "Docteur non trouvé"}), 404

        # Récupérer les données du docteur
        patient_data = db.patients.find_one({'user_id': user_id})

        response_data = {
            'user': user.to_json()
        }

        if patient_data:
            patient_data['_id'] = str(patient_data['_id'])
            response_data['patient'] = patient_data

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": "Une erreur est survenue lors de la récupération du docteur"}), 500

@patient_bp.route('/update/<user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_patient(user_id):
    """Mettre à jour un docteur (Admin seulement)"""
    try:
        # Récupérer l'utilisateur
        user = User.get_by_id(user_id)
        if not user or user.role != 'patient':
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
        patient_updates = {}
        if 'cin' in data:
            patient_updates['cin'] = data['cin']
        if 'telephone' in data:
            patient_updates['telephone'] = data['telephone']
        if 'type' in data:
            patient_updates['type'] = data['type']

        # Mettre à jour le nom si first_name ou last_name ont changé
        if 'first_name' in data or 'last_name' in data:
            patient_updates['name'] = f"{user.first_name} {user.last_name}"

        if 'email' in data:
            patient_updates['email'] = data['email'].lower()

        if patient_updates:
            db.patients.update_one(
                {'user_id': user_id},
                {'$set': patient_updates}
            )

            # Récupérer les données mises à jour pour la synchronisation
            updated_patient = db.patients.find_one({'user_id': user_id})
            if updated_patient:
                updated_patient['_id'] = str(updated_patient['_id'])
                sync_service.sync_patient(updated_patient)

        return jsonify({
            "message": "Docteur mis à jour avec succès",
            "user": user.to_json()
        }), 200

    except Exception as e:
        return jsonify({"error": "Une erreur est survenue lors de la mise à jour du docteur"}), 500

@patient_bp.route('/delete/<user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_patient(user_id):
    """Supprimer un docteur (Admin seulement)"""
    try:
        # Récupérer l'utilisateur
        user = User.get_by_id(user_id)
        if not user or user.role != 'patient':
            return jsonify({"error": "Docteur non trouvé"}), 404

        # Vérifier s'il y a des consultations liées
        consultations_count = db.consultations.count_documents({'patient_id': {'$exists': True}})
        if consultations_count > 0:
            # Optionnel: empêcher la suppression s'il y a des consultations
            # Ou vous pouvez choisir de supprimer en cascade
            pass

        # Supprimer de la collection patients
        db.patients.delete_one({'user_id': user_id})

        # Supprimer de la collection users
        db.users.delete_one({'_id': user._id})

        # Optionnel: Nettoyer Neo4j
        try:
            with neo4j_driver.session() as session:
                session.run("""
                    MATCH (p:patient {mongo_id: $user_id})
                    DETACH DELETE p
                """, user_id=user_id)
        except Exception as neo4j_error:
            print(f"Erreur Neo4j lors de la suppression: {neo4j_error}")

        return jsonify({"message": "Docteur supprimé avec succès"}), 200

    except Exception as e:
        return jsonify({"error": "Une erreur est survenue lors de la suppression du docteur"}), 500

# ======================== PROFILE DU PATIENT CONNECTÉ ========================

@patient_bp.route('/profile', methods=['GET'])
@jwt_required()
@patient_required
def get_patient_profile():
    """Récupérer le profil du docteur connecté"""
    try:
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        patient_data = db.patients.find_one({'user_id': current_user_id})

        response_data = {
            'user': user.to_json()
        }

        if patient_data:
            patient_data['_id'] = str(patient_data['_id'])
            response_data['patient'] = patient_data

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération du profil: {str(e)}'}), 500


# ======================== Affichage des consultation (historiques et upcoming ) ========================

@patient_bp.route('/consultations/history', methods=['GET'])
@jwt_required()
@patient_required
def get_consultation_history():
    """Récupérer l'historique de toutes les consultations du docteur via Neo4j"""
    try:
        current_user_id = get_jwt_identity()
        patient = db.patients.find_one({'user_id': current_user_id})

        if not patient:
            return jsonify({'error': 'Docteur non trouvé'}), 404

        patient_mongo_id = str(patient['_id'])

        print(patient_mongo_id)

        # Requête Neo4j pour récupérer toutes les relations CONSULTED_BY
        with neo4j_driver.session() as session:
            result = session.run("""
                MATCH (p:Patient)-[r:CONSULTED_BY]->(d:Doctor)
                WHERE p.mongo_id = $patient_mongo_id
                RETURN d.mongo_id as doctor_mongo_id, 
                       r.consultation_id as consultation_id,
                       r.date as date,
                       r.motif as motif,
                       r.diagnostic as diagnostic,
                       r.traitement as traitement,
                       r.notes as notes,
                       r.status as status,
                       r.created_at as created_at
                ORDER BY r.date DESC
            """, patient_mongo_id=patient_mongo_id)

            consultations_history = []

            for record in result:
                # Récupérer les informations du patient depuis MongoDB
                doctor = db.doctors.find_one({'_id': ObjectId(record['doctor_mongo_id'])})

                if doctor:
                    consultation_data = {
                        'consultation_id': record['consultation_id'],
                        'date': record['date'],
                        'motif': record['motif'],
                        'diagnostic': record['diagnostic'],
                        'traitement': record['traitement'],
                        'notes': record['notes'] or '',
                        'status': record['status'] or 'pending',
                        'created_at': record['created_at'],
                        'doctor': {
                            'id_doctor': str(doctor['_id']),
                            'name': doctor['name'],
                            'email': doctor['email'],
                            'phone': doctor['phone'],
                            'speciality': doctor['speciality'],                        }
                    }
                    consultations_history.append(consultation_data)

            return jsonify({
                'consultations': consultations_history,
                'total': len(consultations_history)
            }), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération de l\'historique: {str(e)}'}), 500


@patient_bp.route('/consultations/upcoming', methods=['GET'])
@jwt_required()
@patient_required
def get_upcoming_consultations():
    """Récupérer les consultations à venir (date >= aujourd'hui et non annulées)"""
    try:
        current_user_id = get_jwt_identity()
        patient = db.patients.find_one({'user_id': current_user_id})

        if not patient:
            return jsonify({'error': 'Docteur non trouvé'}), 404

        patient_mongo_id = str(patient['_id'])
        today = datetime.now().date().isoformat()

        # Requête Neo4j pour les consultations à venir non annulées
        with neo4j_driver.session() as session:
            result = session.run("""
                MATCH (p:Patient)-[r:CONSULTED_BY]->(d:Doctor)
                WHERE p.mongo_id = $patient_mongo_id
                AND datetime(r.date) >= datetime($today)
                AND (r.status IS NULL) AND (r.status <> 'cancelled') AND (r.status <> 'completed')
                RETURN d.mongo_id as doctor_mongo_id, 
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
                                 patient_mongo_id=patient_mongo_id,
                                 today=today + "T00:00:00+00:00")

            upcoming_consultations = []

            for record in result:
                # Récupérer les informations du patient depuis MongoDB
                doctor = db.doctors.find_one({'_id': ObjectId(record['doctor_mongo_id'])})

                if doctor:
                    consultation_data = {
                        'consultation_id': record['consultation_id'],
                        'date': record['date'],
                        'motif': record['motif'],
                        'diagnostic': record['diagnostic'],
                        'traitement': record['traitement'],
                        'notes': record['notes'] or '',
                        'status': record['status'] or 'pending',
                        'created_at': record['created_at'],
                        'doctor': {
                            'id_doctor': str(doctor['_id']),
                            'name': doctor['name'],
                            'email': doctor['email'],
                            'phone': doctor['phone'],
                            'speciality': doctor['speciality']

                        }
                    }
                    upcoming_consultations.append(consultation_data)

            return jsonify({
                'upcoming_consultations': upcoming_consultations,
                'total': len(upcoming_consultations)
            }), 200

    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des consultations à venir: {str(e)}'}), 500

