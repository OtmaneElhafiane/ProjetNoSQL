from datetime import datetime

class User:
    def __init__(self, username, email, password_hash, role, created_at=None):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role  # 'admin', 'doctor', or 'patient'
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self):
        return {
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(data):
        return User(
            username=data.get('username'),
            email=data.get('email'),
            password_hash=data.get('password_hash'),
            role=data.get('role'),
            created_at=data.get('created_at')
        ) 