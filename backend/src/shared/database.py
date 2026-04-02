from pymongo import MongoClient
from bson import ObjectId
from typing import Any, Dict

from .constants import MONGODB_URI, MONGODB_DB

_MONGO_CLIENT = MongoClient(MONGODB_URI) if MONGODB_URI else None


def get_mongo_client():
    if _MONGO_CLIENT is None:
        raise RuntimeError("MONGODB_URI is not set")
    return _MONGO_CLIENT


def coerce_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return value


def normalize_movie_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    
    normalized = {}
    for key, value in doc.items():
        if key == "_id":
            normalized["_id"] = str(value)
        else:
            normalized[key] = value
    
    if not normalized.get("poster"):
        normalized["poster"] = "assets/poster-placeholder.svg"
    
    return normalized


def normalize_favorite_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    
    normalized = {}
    for key, value in doc.items():
        if key == "_id":
            normalized["_id"] = str(value)
        elif key == "movie" and isinstance(value, dict):
            normalized[key] = {}
            for movie_key, movie_value in value.items():
                if movie_key == "_id":
                    normalized[key][movie_key] = str(movie_value)
                else:
                    normalized[key][movie_key] = movie_value
        else:
            normalized[key] = value
    return normalized
