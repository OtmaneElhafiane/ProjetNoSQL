import re
from datetime import datetime
from .config import AuthConfig
from ..models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class AuthManager:
    def __init__(self):
        self.failed_attempts = {}
        
    def validate_password(self, password):
        """Valider la complexité du mot de passe"""
        if len(password) < AuthConfig.PASSWORD_MIN_LENGTH:
            return False, "Le mot de passe doit contenir au moins 8 caractères"
            
        if AuthConfig.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            return False, "Le mot de passe doit contenir au moins une majuscule"
            
        if AuthConfig.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            return False, "Le mot de passe doit contenir au moins une minuscule"
            
        if AuthConfig.PASSWORD_REQUIRE_NUMBERS and not re.search(r'\d', password):
            return False, "Le mot de passe doit contenir au moins un chiffre"
            
        if AuthConfig.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Le mot de passe doit contenir au moins un caractère spécial"
            
        return True, "Mot de passe valide"

    def generate_tokens(self, user):
        """Générer les tokens d'accès et de rafraîchissement"""
        access_token = create_access_token(
            identity=str(user.identity),
            additional_claims={'role': user['role']}
        )
        refresh_token = create_refresh_token(
            identity=str(user.identity),
            additional_claims={'role': user['role']}
        )
        return access_token, refresh_token

    def send_reset_password_email(self, user_email):
        """Envoyer un email de réinitialisation de mot de passe"""
        token = secrets.token_urlsafe(AuthConfig.TOKEN_LENGTH)
        user = User.get_by_email(user_email)
        if not user:
            return False, "Utilisateur non trouvé"

        user['reset_token'] = token
        user['reset_token_expires'] = (datetime.now() + AuthConfig.TOKEN_EXPIRY).isoformat()
        user.save()

        msg = MIMEMultipart()
        msg['From'] = AuthConfig.MAIL_FROM
        msg['To'] = user_email
        msg['Subject'] = "Réinitialisation de votre mot de passe"

        body = f"""
        Bonjour,
        
        Vous avez demandé la réinitialisation de votre mot de passe.
        Cliquez sur le lien suivant pour réinitialiser votre mot de passe :
        
        http://votre-site.com/reset-password?token={token}
        
        Ce lien expire dans 24 heures.
        
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        
        Cordialement,
        L'équipe du Cabinet Médical
        """
        
        msg.attach(MIMEText(body, 'plain'))

        try:
            server = smtplib.SMTP(AuthConfig.SMTP_SERVER, AuthConfig.SMTP_PORT)
            server.starttls()
            server.login(AuthConfig.SMTP_USERNAME, AuthConfig.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            return True, "Email de réinitialisation envoyé"
        except Exception as e:
            return False, f"Erreur lors de l'envoi de l'email: {str(e)}"

    def verify_reset_token(self, token):
        """Vérifier un token de réinitialisation"""
        user = User.get_by_reset_token(token)
        if not user:
            return None, "Token invalide"
            
        token_expires = datetime.fromisoformat(user['reset_token_expires'])
        if datetime.now() > token_expires:
            return None, "Token expiré"
            
        return user, "Token valide"

    def reset_password(self, token, new_password):
        """Réinitialiser le mot de passe"""
        user, message = self.verify_reset_token(token)
        if not user:
            return False, message
            
        valid, message = self.validate_password(new_password)
        if not valid:
            return False, message
            
        user.change_password(new_password)
        user['reset_token'] = None
        user['reset_token_expires'] = None
        user.save()
        
        return True, "Mot de passe réinitialisé avec succès" 