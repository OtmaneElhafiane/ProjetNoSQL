from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from ..config import Config

patient_bp = Blueprint('patient', __name__)
mongo_client = MongoClient(Config.MONGO_URI)
db = mongo_client.cabinet_medical

def patient_required(f):
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user['role'] != 'patient':
            return jsonify({'error': 'Patient access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@patient_bp.route('/consultations', methods=['GET'])
@patient_required
def get_consultations():
    current_user_id = get_jwt_identity()
    patient = db.patients.find_one({'user_id': ObjectId(current_user_id)})
    
    consultations = list(db.consultations.find({
        'patient_id': str(patient['_id'])
    }).sort('date', -1))
    
    for consultation in consultations:
        consultation['_id'] = str(consultation['_id'])
        # Ajouter les informations du médecin
        doctor = db.doctors.find_one({'_id': ObjectId(consultation['doctor_id'])})
        if doctor:
            consultation['doctor'] = {
                'name': doctor['name'],
                'speciality': doctor['speciality']
            }
    
    return jsonify(consultations), 200

@patient_bp.route('/consultations/<consultation_id>', methods=['GET'])
@patient_required
def get_consultation_detail(consultation_id):
    current_user_id = get_jwt_identity()
    patient = db.patients.find_one({'user_id': ObjectId(current_user_id)})
    
    consultation = db.consultations.find_one({
        '_id': ObjectId(consultation_id),
        'patient_id': str(patient['_id'])
    })
    
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    
    consultation['_id'] = str(consultation['_id'])
    
    # Ajouter les informations du médecin
    doctor = db.doctors.find_one({'_id': ObjectId(consultation['doctor_id'])})
    if doctor:
        consultation['doctor'] = {
            'name': doctor['name'],
            'speciality': doctor['speciality']
        }
    
    return jsonify(consultation), 200

@patient_bp.route('/profile', methods=['GET'])
@patient_required
def get_profile():
    current_user_id = get_jwt_identity()
    patient = db.patients.find_one({'user_id': ObjectId(current_user_id)})
    
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    
    patient['_id'] = str(patient['_id'])
    
    # Ajouter les statistiques
    stats = {
        'total_consultations': db.consultations.count_documents({
            'patient_id': str(patient['_id'])
        }),
        'last_consultation': db.consultations.find_one(
            {'patient_id': str(patient['_id'])},
            sort=[('date', -1)]
        )
    }
    
    if stats['last_consultation']:
        stats['last_consultation']['_id'] = str(stats['last_consultation']['_id'])
    
    patient['stats'] = stats
    
    return jsonify(patient), 200 