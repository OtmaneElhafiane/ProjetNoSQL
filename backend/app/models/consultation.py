from datetime import datetime
from bson import ObjectId

class Consultation:
    def __init__(self, patient_id, doctor_id, date, motif, diagnostic, traitement, notes=""):
        self.patient_id = ObjectId(patient_id)
        self.doctor_id = ObjectId(doctor_id)
        self.date = date if isinstance(date, datetime) else datetime.fromisoformat(date.replace('Z', '+00:00'))
        self.motif = motif
        self.diagnostic = diagnostic
        self.traitement = traitement
        self.notes = notes
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'date': self.date,
            'motif': self.motif,
            'diagnostic': self.diagnostic,
            'traitement': self.traitement,
            'notes': self.notes,
            'created_at': self.created_at
        }

    @staticmethod
    def from_dict(data):
        return Consultation(
            patient_id=data['patient_id'],
            doctor_id=data['doctor_id'],
            date=data['date'],
            motif=data['motif'],
            diagnostic=data['diagnostic'],
            traitement=data['traitement'],
            notes=data.get('notes', '')
        )

    def validate(self):
        if not all(hasattr(self, field) for field in ['patient_id', 'doctor_id', 'date', 'motif', 'diagnostic', 'traitement']):
            return False, "Champs requis manquants"
        
        if not isinstance(self.patient_id, ObjectId) or not isinstance(self.doctor_id, ObjectId):
            return False, "IDs invalides"
        
        if not isinstance(self.date, datetime):
            return False, "Format de date invalide"
        
        if not all(isinstance(getattr(self, field), str) for field in ['motif', 'diagnostic', 'traitement', 'notes']):
            return False, "Types de données invalides"
        
        return True, None 