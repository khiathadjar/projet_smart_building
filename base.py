from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Charger les variables du fichier bdd.env
load_dotenv("bdd.env")

MONGO_URI = os.getenv("MONGO_URI")

# Timeout court pour eviter une attente longue en cas d'echec
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

db = client.smart_building
things_collection = db.things
user_history_collection = db.user_history

# Test de connexion au demarrage
try:
    client.admin.command("ping")
    print("MongoDB: connected")
except Exception:
    print("MongoDB: not connected")