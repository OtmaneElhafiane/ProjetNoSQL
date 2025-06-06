from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import get_db

class User:
    collection_name = 'users'

    def __init__(self, email, password=None, role='patient', first_name=None, 
                 last_name=None, created_at=None, _id=None, **kwargs):
        self._id = _id if _id else str(ObjectId())
        self.email = email.lower()
        self.password_hash = generate_password_hash(password) if password else None
        self.role = role
        self.first_name = first_name
        self.last_name = last_name
        self.created_at = created_at if created_at else datetime.utcnow()
        self.last_login = None
        for key, value in kwargs.items():
            setattr(self, key, value)

    @staticmethod
    def get_by_email(email):
        """Récupérer un utilisateur par son email"""
        user_data = get_db()[User.collection_name].find_one({'email': email.lower()})
        return User(**user_data) if user_data else None

    @staticmethod
    def get_by_id(user_id):
        """Récupérer un utilisateur par son ID"""
        user_data = get_db()[User.collection_name].find_one({'_id': user_id})
        return User(**user_data) if user_data else None

    def check_password(self, password):
        """Vérifier le mot de passe"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def save(self):
        """Sauvegarder ou mettre à jour l'utilisateur"""
        user_data = self.to_dict()
        get_db()[self.collection_name].update_one(
            {'_id': self._id},
            {'$set': user_data},
            upsert=True
        )
        return self

    def update_last_login(self):
        """Mettre à jour la date de dernière connexion"""
        self.last_login = datetime.utcnow()
        get_db()[self.collection_name].update_one(
            {'_id': self._id},
            {'$set': {'last_login': self.last_login}}
        )

    def to_dict(self):
        """Convertir l'objet en dictionnaire pour MongoDB"""
        return {
            '_id': self._id,
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'created_at': self.created_at,
            'last_login': self.last_login
        }

    def to_json(self):
        """Convertir l'objet en JSON pour l'API"""
        return {
            'id': self._id,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    @staticmethod
    def create_admin(email, password, first_name, last_name):
        """Créer un compte administrateur"""
        existing_user = User.get_by_email(email)
        if existing_user:
            raise ValueError("Un utilisateur avec cet email existe déjà")
        
        user = User(
            email=email,
            password=password,
            role='admin',
            first_name=first_name,
            last_name=last_name
        )
        user.save()
        return user

    @staticmethod
    def create_user(email, password, role, first_name, last_name, **kwargs):
        """Créer un nouveau utilisateur (patient ou médecin)"""
        if role not in ['patient', 'doctor']:
            raise ValueError("Le rôle doit être 'patient' ou 'doctor'")
        
        existing_user = User.get_by_email(email)
        if existing_user:
            raise ValueError("Un utilisateur avec cet email existe déjà")
        
        user = User(
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            **kwargs
        )
        user.save()
        return user 