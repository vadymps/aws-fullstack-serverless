from typing import Any, Dict, List

from shared.constants import FAVORITES_PAGE_SIZE, MONGODB_DB
from shared.database import get_mongo_client, normalize_favorite_doc


def get_favorites(user_id: str, page: int) -> Dict[str, Any]:
    client = get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["favorites"]
    skip = (page - 1) * FAVORITES_PAGE_SIZE 
    total = collection.count_documents({"user_id": user_id})
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": FAVORITES_PAGE_SIZE},
        {
            "$lookup": {
                "from": "movies",
                "localField": "movie_id",
                "foreignField": "_id",
                "as": "movie",
                "pipeline": [
                    {
                        "$project": {
                            "_id": 1,
                            "title": 1,
                            "year": 1,
                            "genres": 1,
                            "runtime": 1,
                            "poster": 1,
                        }
                    }
                ],
            }
        },
        {"$unwind": {"path": "$movie", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "_id": 1,
                "user_id": 1,
                "movie_id": 1,
                "created_at": 1,
                "movie": 1,
            }
        },
    ]
    
    docs = list(collection.aggregate(pipeline))
    favorites = [normalize_favorite_doc(doc) for doc in docs]
    
    return {
        "page": page,
        "page_size": FAVORITES_PAGE_SIZE,
        "total": total,
        "data": favorites,
    }


def get_favorite_ids(user_id: str) -> List[str]:
    client = get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["favorites"]    
    docs = list(collection.find({"user_id": user_id}, {"movie_id": 1, "_id": 0}))
    ids = [doc.get("movie_id") for doc in docs if doc.get("movie_id")]
    return ids


def add_favorite(user_id: str, movie_id: str) -> Dict[str, Any]:
    client = get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["favorites"]
    
    existing = collection.find_one({"user_id": user_id, "movie_id": movie_id})
    if existing:
        return {"ok": True, "message": "Already in favorites"}
    
    favorite_doc = {
        "user_id": user_id,
        "movie_id": movie_id,
        "created_at": __import__("datetime").datetime.utcnow(),
    }
    
    result = collection.insert_one(favorite_doc)
    return {"ok": True, "id": str(result.inserted_id)}


def remove_favorite(user_id: str, movie_id: str) -> Dict[str, Any]:
    client = get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["favorites"]
    
    result = collection.delete_one({"user_id": user_id, "movie_id": movie_id})
    
    if result.deleted_count == 0:
        raise ValueError("Favorite not found")
    
    return {"ok": True, "deleted": result.deleted_count}
