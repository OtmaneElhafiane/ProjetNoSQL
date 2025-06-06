from seed import seed_database

if __name__ == "__main__":
    try:
        seed_database()
    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données : {str(e)}") 