from datetime import datetime, timezone
from typing import Any, Dict, List

from shared.constants import FAVORITES_PAGE_SIZE, MONGODB_DB
from shared.database import get_mongo_client, normalize_favorite_doc, normalize_movie_doc, coerce_object_id

def _get_collection(name: str):
    return get_mongo_client()[MONGODB_DB][name]

def get_favorites(user_id: str, page: int) -> Dict[str, Any]:
    favorites_collection = _get_collection("favorites")
    movies_collection = _get_collection("movies")
    skip = (page - 1) * FAVORITES_PAGE_SIZE
    total = favorites_collection.count_documents({"user_id": user_id})

    favorites_cursor = (
        favorites_collection.find({"user_id": user_id}, {"movie_id": 1, "created_at": 1, "_id": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(FAVORITES_PAGE_SIZE)
    )
    favorites_docs = list(favorites_cursor)
    movie_ids = [doc.get("movie_id") for doc in favorites_docs if doc.get("movie_id")]

    if not movie_ids:
        return {
            "ok": True,
            "path": "/favorites",
            "page": page,
            "page_size": FAVORITES_PAGE_SIZE,
            "total": total,
            "data": [],
        }

    projection = {
        "_id": 1,
        "title": 1,
        "year": 1,
        "genres": 1,
        "runtime": 1,
        "poster": 1,
    }
    movies = list(movies_collection.find({"_id": {"$in": movie_ids}}, projection))
    movies_by_id = {str(movie.get("_id")): normalize_movie_doc(movie) for movie in movies}
    ordered = [movies_by_id.get(str(movie_id)) for movie_id in movie_ids]
    favorites = []
    for movie in ordered:
        if movie:
            movie["movie_id"] = movie.get("_id")
            favorites.append(movie)
    
    return {
        "ok": True,
        "path": "/favorites",
        "page": page,
        "page_size": FAVORITES_PAGE_SIZE,
        "total": total,
        "data": favorites,
    }

def get_favorite_ids(user_id: str) -> List[str]:
    collection = _get_collection("favorites")
    cursor = collection.find({"user_id": user_id}, {"movie_id": 1, "_id": 0})
    return [str(doc["movie_id"]) for doc in cursor if "movie_id" in doc]

def add_favorite(user_id: str, movie_id: str) -> Dict[str, Any]:
    collection = _get_collection("favorites")
    m_id = coerce_object_id(movie_id)
    
    result = collection.update_one(
        {"user_id": user_id, "movie_id": m_id},
        {"$setOnInsert": {
            "user_id": user_id,
            "movie_id": m_id,
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    if result.matched_count > 0:
        return {"ok": True, "message": "Already in favorites"}
        
    return {"ok": True, "id": str(result.upserted_id)}

def remove_favorite(user_id: str, movie_id: str) -> Dict[str, Any]:
    collection = _get_collection("favorites")
    m_id = coerce_object_id(movie_id)
    
    result = collection.delete_one({"user_id": user_id, "movie_id": m_id})
    
    if result.deleted_count == 0:
        raise ValueError("Favorite not found")
    
    return {"ok": True, "deleted": result.deleted_count}
