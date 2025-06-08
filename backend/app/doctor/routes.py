from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from ..config import Config
from ..data.sync_service import SyncService

doctor_bp = Blueprint('doctor', __name__)
mongo_client = MongoClient(Config.MONGODB_URI)
db = mongo_client.cabinet_medical
sync_service = SyncService()

def doctor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = db.users.find_one({'_id': current_user_id})
        if not user or user['role'] != 'doctor':
            return jsonify({'error': 'Doctor access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@doctor_bp.route('/consultations', methods=['GET'])
@jwt_required()
@doctor_required
def get_consultations():
    current_user_id = get_jwt_identity()
    doctor = db.doctors.find_one({'user_id': current_user_id}) 
    
    if not doctor:
        return jsonify({'error': 'Docteur non trouvé'}), 404
    
    consultations = list(db.consultations.find({'doctor_id': str(doctor['_id'])}))
    for consultation in consultations:
        consultation['_id'] = str(consultation['_id'])
        # Ajouter les informations du patient
        patient = db.patients.find_one({'_id': ObjectId(consultation['patient_id'])})
        if patient:
            consultation['patient'] = {
                'name': patient['name'],
                'email': patient['email']
            }
    
    return jsonify(consultations), 200

@doctor_bp.route('/consultations', methods=['POST'])
@jwt_required()
@doctor_required
def create_consultation():
    data = request.get_json()
    current_user_id = get_jwt_identity()
    doctor = db.doctors.find_one({'user_id': current_user_id})
    
    if not doctor:
        return jsonify({'error': 'Docteur non trouvé'}), 404
    
    consultation_data = {
        'patient_id': data['patient_id'],
        'doctor_id': str(doctor['_id']),
        'date': datetime.fromisoformat(data['date']),
        'symptoms': data['symptoms'],
        'diagnosis': data['diagnosis'],
        'treatment': data['treatment'],
        'notes': data.get('notes', ''),
        'created_at': datetime.utcnow()
    }
    
    result = db.consultations.insert_one(consultation_data)
    consultation_data['_id'] = str(result.inserted_id)
    
    # Synchroniser avec Neo4j
    sync_service.sync_consultation(consultation_data)
    
    return jsonify(consultation_data), 201

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
    current_user_id = get_jwt_identity()
    doctor = db.doctors.find_one({'user_id': current_user_id})
    
    if not doctor:
        return jsonify({'error': 'Docteur non trouvé'}), 404
    
    consultations = list(db.consultations.find({
        'doctor_id': str(doctor['_id']),
        'patient_id': patient_id
    }).sort('date', -1))
    
    for consultation in consultations:
        consultation['_id'] = str(consultation['_id'])
    
    return jsonify(consultations), 200

@doctor_bp.route('/schedule', methods=['GET'])
@jwt_required()
@doctor_required
def get_schedule():
    current_user_id = get_jwt_identity()
    doctor = db.doctors.find_one({'user_id': current_user_id})
    
    if not doctor:
        return jsonify({'error': 'Docteur non trouvé'}), 404
    
    today = datetime.now().date()
    upcoming_consultations = list(db.consultations.find({
        'doctor_id': str(doctor['_id']),
        'date': {'$gte': today}
    }).sort('date', 1))
    
    for consultation in upcoming_consultations:
        consultation['_id'] = str(consultation['_id'])
        patient = db.patients.find_one({'_id': ObjectId(consultation['patient_id'])})
        if patient:
            consultation['patient'] = {
                'name': patient['name'],
                'email': patient['email']
            }
    
    return jsonify(upcoming_consultations), 200