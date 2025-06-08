import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('MAIL_FROM', 'noreply@cabinetmedical.com')

    def send_auth_code(self, to_email, code):
        """Envoyer le code d'authentification par email"""
        msg = MIMEMultipart()
        msg['From'] = self.from_email
        msg['To'] = to_email
        msg['Subject'] = "Votre code d'authentification"

        body = f"""
        Bonjour,
        
        Voici votre code d'authentification pour le Cabinet Médical :
        
        {code}
        
        Ce code est valable pour cette session uniquement.
        Ne le partagez avec personne.
        
        Cordialement,
        L'équipe du Cabinet Médical
        """
        
        msg.attach(MIMEText(body, 'plain'))

        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            return True, "Code envoyé avec succès"
        except Exception as e:
            return False, f"Erreur lors de l'envoi du code: {str(e)}"

email_service = EmailService() 