from fastapi import FastAPI, Body, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from base import things_collection
from supabase_client import reset_password_email, signup_user, supabase
from pydantic import BaseModel, Field
from rapidfuzz import fuzz
import uuid
import os
import re
import unicodedata

app = FastAPI()

# --- Modèles Pydantic ---
class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=6, max_length=128)

class SignupRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=6, max_length=128)

class SearchRequest(BaseModel):
    search_query: str = ""
    user_x: float = 0
    user_y: float = 0
    user_z: float = 0
    user_room: str = ""

class AddThingRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    type: str = Field(..., min_length=1, max_length=80)
    location: str = Field(..., min_length=1, max_length=120)
    description: str = Field(default="", max_length=800)
    status: str = Field(default="active", max_length=40)
    tags: list[str] = Field(default_factory=list)

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)

# --- Grille des salles (coords) ---
ROOM_DATA = {
    "Bureau PDG": {"x": 10, "y": 90, "z": 16},
    "Salle du Conseil": {"x": 20, "y": 90, "z": 16},
    "Salon VIP": {"x": 30, "y": 90, "z": 16},
    "Terrasse Privée": {"x": 40, "y": 90, "z": 16},
    "Secrétariat": {"x": 50, "y": 90, "z": 16},
    "Archives Dir.": {"x": 60, "y": 90, "z": 16},

    "Open Space Alpha": {"x": 10, "y": 70, "z": 12},
    "Labo Robotique": {"x": 20, "y": 70, "z": 12},
    "Bureau Lead Dev": {"x": 30, "y": 70, "z": 12},
    "Salle Réunion 3A": {"x": 40, "y": 70, "z": 12},
    "Zone Debug": {"x": 50, "y": 70, "z": 12},
    "Serveurs 3": {"x": 60, "y": 70, "z": 12},

    "Studio Graphique": {"x": 10, "y": 50, "z": 8},
    "Bureau RH": {"x": 20, "y": 50, "z": 8},
    "Comptabilité": {"x": 30, "y": 50, "z": 8},
    "Salle de Presse": {"x": 40, "y": 50, "z": 8},
    "Bureau Com": {"x": 50, "y": 50, "z": 8},
    "Archives": {"x": 60, "y": 50, "z": 8},

    "Zone de Stockage": {"x": 10, "y": 30, "z": 4},
    "Atelier Réparation": {"x": 20, "y": 30, "z": 4},
    "Local Serveurs": {"x": 30, "y": 30, "z": 4},
    "Poste Sécurité": {"x": 40, "y": 30, "z": 4},
    "Quai d'Expédition": {"x": 50, "y": 30, "z": 4},
    "Bureau Chef": {"x": 60, "y": 30, "z": 4},

    "Accueil": {"x": 10, "y": 10, "z": 0},
    "Cafétéria": {"x": 20, "y": 10, "z": 0},
    "Showroom": {"x": 30, "y": 10, "z": 0},
    "Auditorium": {"x": 40, "y": 10, "z": 0},
    "Sanitaires": {"x": 50, "y": 10, "z": 0},
    "Espace Détente": {"x": 60, "y": 10, "z": 0},
}

# --- Utilitaires ---
def _normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text

SYNONYMS = {
    "light": "lampe",
    "lights": "lampe",
    "lamp": "lampe",
    "printer": "imprimante",
    "projector": "projecteur",
    "sensor": "capteur",
    "cafeteria": "cafeteria",
    "electromenager": "electromenager",
    "electro-menager": "electromenager",
    "cam": "camera",
}

STATUS_VALUES = ["active", "inactive", "disponible", "hors-ligne", "hors ligne"]

def _extract_searchable_fields(item: dict) -> list[str]:
    res = [
        str(item.get("name", "")),
        str(item.get("type", "")),
        str(item.get("description", "")),
        str(item.get("status", "")),
    ]
    tags = item.get("tags", [])
    if isinstance(tags, list):
        res.extend([str(t) for t in tags])

    loc = item.get("location", "")
    if isinstance(loc, dict):
        res.append(str(loc.get("room", "")))
        res.append(str(loc.get("etage", "")))
    else:
        res.append(str(loc))
    return res

def _get_origins() -> list[str]:
    configured = os.getenv(
        "FRONTEND_ORIGINS",
        "http://127.0.0.1:5501,http://localhost:5501,http://127.0.0.1:5500,http://localhost:5500",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]

def _extract_bearer_token(request: Request) -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header.replace("Bearer ", "", 1).strip() or None

def _get_role_from_token(token: str) -> str:
    user_response = supabase.auth.get_user(token)
    user = getattr(user_response, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Token invalide")
    profile = supabase.table("utilisateur").select("role").eq("id", user.id).maybe_single().execute()
    return profile.data.get("role", "user") if profile.data else "user"

def _require_admin(request: Request) -> None:
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Token manquant")
    if _get_role_from_token(token) != "admin":
        raise HTTPException(status_code=403, detail="Acces refuse: Admin requis")

def _compute_distance_and_room_flags(items: list[dict], user_x: float, user_y: float, user_z: float, user_room: str) -> None:
    user_room_norm = _normalize_text(user_room)

    for item in items:
        loc = item.get("location", {})
        if not isinstance(loc, dict):
            loc = {}

        try:
            ox = float(loc.get("x", 0))
            oy = float(loc.get("y", 0))
            oz = float(loc.get("z", 0))
        except Exception:
            ox, oy, oz = 0.0, 0.0, 0.0

        obj_room = str(loc.get("room", ""))
        same_room = bool(user_room_norm) and (_normalize_text(obj_room) == user_room_norm)

        distance = ((user_x - ox) ** 2 + (user_y - oy) ** 2 + (user_z - oz) ** 2) ** 0.5

        item["distance"] = round(distance, 2)
        item["same_room"] = same_room

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API is running"}

# --- Routes Auth ---
@app.post("/login")
def login(data: LoginRequest = Body(...)):
    email = data.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Email invalide")

    try:
        auth_res = supabase.auth.sign_in_with_password({"email": email, "password": data.password})
        if not auth_res.user or not auth_res.session:
            raise HTTPException(status_code=401, detail="Identifiants invalides")

        user_role = "user"
        try:
            q = supabase.table("utilisateur").select("role").eq("id", auth_res.user.id).maybe_single().execute()
            if q.data:
                user_role = q.data.get("role", "user")
        except Exception as e:
            print(f"Erreur lecture role: {e}")

        return {
            "access_token": auth_res.session.access_token,
            "role": user_role,
            "email": email
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur login: {e}")
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

@app.post("/signup")
def signup(data: SignupRequest = Body(...)):
    email = data.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Email invalide")

    try:
        res = signup_user(email, data.password)
        if res.user:
            supabase.table("utilisateur").insert({
                "id": res.user.id,
                "email": email,
                "role": "user"
            }).execute()
            return {"success": True, "message": "Compte cree"}

        raise HTTPException(status_code=400, detail="Erreur signup")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur signup: {e}")
        raise HTTPException(status_code=500, detail="Impossible de creer le compte")

# --- Suggest ---
@app.get("/things/suggest")
def suggest_things(q: str = ""):
    if not q or len(q.strip()) < 2:
        return []

    q_norm = _normalize_text(q)
    query = {"search_name_norm": {"$regex": f"^{re.escape(q_norm)}", "$options": "i"}}
    results = list(things_collection.find(query).limit(5))
    suggestions = [item.get("name") for item in results if item.get("name")]
    return list(dict.fromkeys(suggestions))

# --- Recherche ---
@app.post("/things/search")
def search_things(data: SearchRequest = Body(...)):
    try:
        raw_query = (data.search_query or "").strip()

        # Aucune recherche -> tout ramener, mais avec distance/proximité
        if not raw_query:
            results = list(things_collection.find({}).sort("name", 1))
            _compute_distance_and_room_flags(results, data.user_x, data.user_y, data.user_z, data.user_room)

            results.sort(key=lambda x: (
                0 if x.get("same_room") else 1,
                float(x.get("distance", 10**9)),
                _normalize_text(x.get("name", ""))
            ))

            for item in results:
                item["_id"] = str(item["_id"])
            return results

        q_norm = _normalize_text(raw_query)

        matching_status = [
            s.replace("hors ligne", "hors-ligne")
            for s in STATUS_VALUES
            if _normalize_text(s).startswith(q_norm)
        ]

        tokens = [t for t in q_norm.split() if t] or [q_norm]
        expanded_tokens = []
        for t in tokens:
            expanded_tokens.append(t)
            if t in SYNONYMS:
                expanded_tokens.append(SYNONYMS[t])
        expanded_tokens = list(dict.fromkeys(expanded_tokens))

        mongo_or = []
        for t in expanded_tokens:
            safe = re.escape(t)
            mongo_or.extend([
                {"search_name_norm": {"$regex": safe, "$options": "i"}},
                {"name": {"$regex": safe, "$options": "i"}},
                {"type": {"$regex": safe, "$options": "i"}},
                {"description": {"$regex": safe, "$options": "i"}},
                {"location.room": {"$regex": safe, "$options": "i"}},
                {"location": {"$regex": safe, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": safe, "$options": "i"}}},
            ])

        for s in matching_status:
            mongo_or.append({"status": {"$regex": f"^{re.escape(s)}$", "$options": "i"}})

        pre_results = list(things_collection.find({"$or": mongo_or} if mongo_or else {}))

        filtered = []
        for item in pre_results:
            fields = _extract_searchable_fields(item)
            content_norm = " ".join(_normalize_text(f) for f in fields)

            token_ok = all(
                any(term in content_norm for term in [tok, SYNONYMS.get(tok, tok)])
                for tok in tokens
            )

            status_ok = False
            if matching_status:
                item_status = _normalize_text(str(item.get("status", ""))).replace("hors ligne", "hors-ligne")
                status_ok = any(item_status == _normalize_text(s).replace("hors ligne", "hors-ligne") for s in matching_status)

            fuzzy_score = fuzz.token_set_ratio(q_norm, content_norm)

            if token_ok or status_ok or fuzzy_score >= 82:
                item["_search_score"] = fuzzy_score
                filtered.append(item)

        if not filtered:
            potential = list(things_collection.find({}).limit(300))
            for item in potential:
                fields = _extract_searchable_fields(item)
                content_norm = " ".join(_normalize_text(f) for f in fields)
                score = fuzz.token_set_ratio(q_norm, content_norm)
                if score >= 85:
                    item["_search_score"] = score
                    filtered.append(item)

        _compute_distance_and_room_flags(filtered, data.user_x, data.user_y, data.user_z, data.user_room)

        filtered.sort(key=lambda x: (
            0 if x.get("same_room") else 1,
            float(x.get("distance", 10**9)),
            -int(x.get("_search_score", 0)),
            _normalize_text(x.get("name", ""))
        ))

        for item in filtered:
            item["_id"] = str(item["_id"])
            item.pop("_search_score", None)

        return filtered

    except Exception as e:
        print(f"Erreur search: {e}")
        raise HTTPException(status_code=500, detail="Erreur recherche")

# --- CRUD objets ---
@app.post("/things/add")
def add_thing(request: Request, data: AddThingRequest = Body(...)):
    _require_admin(request)
    try:
        location_room = data.location.strip()
        coords = ROOM_DATA.get(location_room, {"x": 0, "y": 0, "z": 0})

        new_item = {
            "id": str(uuid.uuid4())[:8],
            "name": data.name,
            "search_name_norm": _normalize_text(data.name),
            "type": data.type,
            "description": data.description,
            "status": data.status,
            "location": {
                "room": location_room,
                "x": coords["x"],
                "y": coords["y"],
                "z": coords["z"]
            },
            "tags": [t.strip().lower() for t in data.tags if t.strip()],
        }

        things_collection.insert_one(new_item)
        return {"message": "Succes", "id": new_item["id"]}
    except Exception as e:
        print(f"Erreur add: {e}")
        raise HTTPException(status_code=500, detail="Erreur MongoDB")

@app.delete("/things/{thing_id}")
def delete_thing(thing_id: str, request: Request):
    _require_admin(request)
    if things_collection.delete_one({"id": thing_id}).deleted_count == 0:
        raise HTTPException(status_code=404, detail="Non trouve")
    return {"success": True}

@app.post("/auth/forgot")
def forgot_password(data: ForgotPasswordRequest = Body(...)):
    try:
        reset_password_email(data.email.strip().lower(), "http://127.0.0.1:5501/reset.html")
        return {"success": True}
    except Exception as e:
        print(f"Erreur forgot: {e}")
        raise HTTPException(status_code=500, detail="Erreur email")