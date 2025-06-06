from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from ..config import Config
from ..data.sync_service import SyncService

admin_bp = Blueprint('admin', __name__)
mongo_client = MongoClient(Config.MONGO_URI)
db = mongo_client.cabinet_medical
sync_service = SyncService()

def admin_required(f):
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Routes pour la gestion des patients
@admin_bp.route('/patients', methods=['GET'])
@admin_required
def get_patients():
    patients = list(db.patients.find())
    for patient in patients:
        patient['_id'] = str(patient['_id'])
    return jsonify(patients), 200

@admin_bp.route('/patients', methods=['POST'])
@admin_required
def create_patient():
    data = request.get_json()
    patient_data = {
        'name': data['name'],
        'email': data['email'],
        'phone': data['phone'],
        'birth_date': data['birth_date'],
        'address': data['address']
    }
    
    result = db.patients.insert_one(patient_data)
    patient_data['_id'] = str(result.inserted_id)
    
    # Synchroniser avec Neo4j
    sync_service.sync_patient(patient_data)
    
    return jsonify(patient_data), 201

@admin_bp.route('/patients/<patient_id>', methods=['PUT'])
@admin_required
def update_patient(patient_id):
    data = request.get_json()
    patient_data = {
        'name': data['name'],
        'email': data['email'],
        'phone': data['phone'],
        'birth_date': data['birth_date'],
        'address': data['address']
    }
    
    db.patients.update_one(
        {'_id': ObjectId(patient_id)},
        {'$set': patient_data}
    )
    
    patient_data['_id'] = patient_id
    sync_service.sync_patient(patient_data)
    
    return jsonify(patient_data), 200

# Routes pour la gestion des médecins
@admin_bp.route('/doctors', methods=['GET'])
@admin_required
def get_doctors():
    doctors = list(db.doctors.find())
    for doctor in doctors:
        doctor['_id'] = str(doctor['_id'])
    return jsonify(doctors), 200

@admin_bp.route('/doctors', methods=['POST'])
@admin_required
def create_doctor():
    data = request.get_json()
    doctor_data = {
        'name': data['name'],
        'email': data['email'],
        'phone': data['phone'],
        'speciality': data['speciality'],
        'schedule': data.get('schedule', {})
    }
    
    result = db.doctors.insert_one(doctor_data)
    doctor_data['_id'] = str(result.inserted_id)
    
    # Synchroniser avec Neo4j
    sync_service.sync_doctor(doctor_data)
    
    return jsonify(doctor_data), 201

@admin_bp.route('/doctors/<doctor_id>', methods=['PUT'])
@admin_required
def update_doctor(doctor_id):
    data = request.get_json()
    doctor_data = {
        'name': data['name'],
        'email': data['email'],
        'phone': data['phone'],
        'speciality': data['speciality'],
        'schedule': data.get('schedule', {})
    }
    
    db.doctors.update_one(
        {'_id': ObjectId(doctor_id)},
        {'$set': doctor_data}
    )
    
    doctor_data['_id'] = doctor_id
    sync_service.sync_doctor(doctor_data)
    
    return jsonify(doctor_data), 200

# Route pour les statistiques
@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    stats = {
        'total_patients': db.patients.count_documents({}),
        'total_doctors': db.doctors.count_documents({}),
        'total_consultations': db.consultations.count_documents({})
    }
    return jsonify(stats), 200 