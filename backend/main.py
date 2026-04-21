import time
from threading import Thread

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.base import keyword_index_collection, things_collection
from backend.config import FRONTEND_DIR, FRONTEND_ORIGINS, HOME_PAGE
from backend.routers.main_auth import auth_router
from backend.routers.main_borrow import borrow_router
from backend.routers.main_crud import crud_router
from backend.routers.main_devices import devices_router
from backend.routers.main_localisation import localisation_router
from backend.routers.main_notifications import notifications_router
from backend.routers.main_recherche import recherche_router


app = FastAPI(title="IntelliBuild")
cleanup_thread: Thread | None = None


def _cleanup_orphan_keywords_on_startup() -> None:
    """Nettoie automatiquement les mots-cles orphelins au demarrage."""
    try:
        all_keyword_thing_ids = list(keyword_index_collection.distinct("thingId"))
        orphan_thing_ids = []

        for thing_id in all_keyword_thing_ids:
            thing_id_clean = str(thing_id).strip()
            if not things_collection.find_one({"id": thing_id_clean}):
                orphan_thing_ids.append(thing_id_clean)

        if orphan_thing_ids:
            result = keyword_index_collection.delete_many({"thingId": {"$in": orphan_thing_ids}})
            print(f"Startup cleanup: {result.deleted_count} orphan keywords removed")
    except Exception as exc:
        print(f"Startup cleanup failed: {exc}")


def _initialize_view_counts_on_startup() -> None:
    """Initialise les compteurs de vues pour tous les objets."""
    try:
        result = things_collection.update_many(
            {"view_count": {"$exists": False}},
            {"$set": {"view_count": 0}},
        )
        if result.modified_count > 0:
            print(f"Startup init: {result.modified_count} objects received view_count")
    except Exception as exc:
        print(f"View count init failed: {exc}")


def _background_cleanup_task() -> None:
    """Nettoie les mots-cles orphelins periodiquement."""
    while True:
        try:
            time.sleep(300)
            all_keyword_thing_ids = list(keyword_index_collection.distinct("thingId"))
            orphan_thing_ids = []

            for thing_id in all_keyword_thing_ids:
                thing_id_clean = str(thing_id).strip()
                if not things_collection.find_one({"id": thing_id_clean}):
                    orphan_thing_ids.append(thing_id_clean)

            if orphan_thing_ids:
                result = keyword_index_collection.delete_many({"thingId": {"$in": orphan_thing_ids}})
                print(f"Background cleanup: {result.deleted_count} orphan keywords removed")
        except Exception as exc:
            print(f"Background cleanup failed: {exc}")


def _start_cleanup_thread() -> None:
    global cleanup_thread
    if cleanup_thread is not None and cleanup_thread.is_alive():
        return

    cleanup_thread = Thread(target=_background_cleanup_task, daemon=True, name="keyword-cleanup")
    cleanup_thread.start()


app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(localisation_router)
app.include_router(recherche_router)
app.include_router(auth_router)
app.include_router(borrow_router)
app.include_router(crud_router)
app.include_router(notifications_router)
app.include_router(devices_router)


@app.on_event("startup")
def on_startup() -> None:
    _cleanup_orphan_keywords_on_startup()
    _initialize_view_counts_on_startup()
    _start_cleanup_thread()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "intellibuild"}


@app.get("/", include_in_schema=False)
def frontend_home():
    if HOME_PAGE.exists():
        return FileResponse(HOME_PAGE)
    return {"message": "API is running"}


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
