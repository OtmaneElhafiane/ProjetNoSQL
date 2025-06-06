from flask_bcrypt import Bcrypt
from models.user import User
from models.doctor import Doctor
from models.patient import Patient
from models.admin import Admin
from database.mongodb import mongo_db
from database.neo4j_db import neo4j_driver

bcrypt = Bcrypt()

def seed_database():
    # Suppression des données existantes
    mongo_db.users.delete_many({})
    mongo_db.doctors.delete_many({})
    mongo_db.patients.delete_many({})
    mongo_db.admins.delete_many({})

    # Nettoyage de la base Neo4j
    with neo4j_driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")

    # Création des utilisateurs de test
    test_users = [
        {
            "email": "admin@test.com",
            "password": bcrypt.generate_password_hash("admin123").decode('utf-8'),
            "role": "admin",
            "cin": "AD123456",
            "firstName": "Admin",
            "lastName": "Test"
        },
        {
            "email": "doctor@test.com",
            "password": bcrypt.generate_password_hash("doctor123").decode('utf-8'),
            "role": "doctor",
            "cin": "DR123456",
            "firstName": "Doctor",
            "lastName": "Test",
            "speciality": "Généraliste"
        },
        {
            "email": "patient@test.com",
            "password": bcrypt.generate_password_hash("patient123").decode('utf-8'),
            "role": "patient",
            "cin": "PT123456",
            "firstName": "Patient",
            "lastName": "Test",
            "dateOfBirth": "1990-01-01",
            "phoneNumber": "+212600000000"
        }
    ]

    # Insertion des utilisateurs
    for user_data in test_users:
        role = user_data.pop('role')
        
        if role == 'admin':
            admin = Admin(**user_data)
            admin.save()
            # Création du nœud Admin dans Neo4j
            with neo4j_driver.session() as session:
                session.run(
                    "CREATE (a:Admin {email: $email, cin: $cin, firstName: $firstName, lastName: $lastName})",
                    email=user_data['email'],
                    cin=user_data['cin'],
                    firstName=user_data['firstName'],
                    lastName=user_data['lastName']
                )
        
        elif role == 'doctor':
            doctor = Doctor(**user_data)
            doctor.save()
            # Création du nœud Doctor dans Neo4j
            with neo4j_driver.session() as session:
                session.run(
                    "CREATE (d:Doctor {email: $email, cin: $cin, firstName: $firstName, lastName: $lastName, speciality: $speciality})",
                    email=user_data['email'],
                    cin=user_data['cin'],
                    firstName=user_data['firstName'],
                    lastName=user_data['lastName'],
                    speciality=user_data['speciality']
                )
        
        elif role == 'patient':
            patient = Patient(**user_data)
            patient.save()
            # Création du nœud Patient dans Neo4j
            with neo4j_driver.session() as session:
                session.run(
                    "CREATE (p:Patient {email: $email, cin: $cin, firstName: $firstName, lastName: $lastName, dateOfBirth: $dateOfBirth})",
                    email=user_data['email'],
                    cin=user_data['cin'],
                    firstName=user_data['firstName'],
                    lastName=user_data['lastName'],
                    dateOfBirth=user_data['dateOfBirth']
                )

    print("Base de données initialisée avec les données de test !")
    print("\nComptes de test créés :")
    print("Admin    - Email: admin@test.com    - Mot de passe: admin123")
    print("Docteur  - Email: doctor@test.com   - Mot de passe: doctor123")
    print("Patient  - Email: patient@test.com  - Mot de passe: patient123") 