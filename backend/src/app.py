import json
import os
import time
from datetime import datetime
from urllib.parse import parse_qs
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ValidationError
from pymongo import MongoClient
from bson import ObjectId

DEFAULT_PAGE_SIZE = 12
FAVORITES_PAGE_SIZE = 12
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB")
_MONGO_CLIENT = MongoClient(MONGODB_URI) if MONGODB_URI else None


class Movie(BaseModel):
    id: str = Field(alias="_id")
    title: Optional[str] = None
    year: Optional[int] = None
    genres: List[str] = Field(default_factory=list)
    runtime: Optional[int] = None
    poster: Optional[str] = None

    class Config:
        populate_by_name = True
        extra = "ignore"


class MovieDetail(Movie):
    plot: Optional[str] = None
    fullplot: Optional[str] = None
    cast: List[str] = Field(default_factory=list)
    directors: List[str] = Field(default_factory=list)
    countries: List[str] = Field(default_factory=list)
    language: Optional[str] = None
    rated: Optional[str] = None
    released: Optional[str | datetime] = None


def _response(status_code: int, body: Dict[str, Any]):
    # Keep CORS permissive for the demo so local Angular + S3 website can call the API.
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
        "body": json.dumps(body, default=str),
    }


def _get_mongo_client():
    if _MONGO_CLIENT is None:
        raise RuntimeError("MONGODB_URI is not set")
    return _MONGO_CLIENT


def _query_param(event: Dict[str, Any], key: str, default: str):
    params = (event or {}).get("queryStringParameters") or {}
    value = params.get(key)
    if value in (None, ""):
        multi = (event or {}).get("multiValueQueryStringParameters") or {}
        values = multi.get(key)
        if isinstance(values, list) and values:
            value = values[0]
    if value in (None, ""):
        raw_qs = (event or {}).get("rawQueryString") or ""
        if raw_qs:
            parsed = parse_qs(raw_qs)
            values = parsed.get(key)
            if isinstance(values, list) and values:
                value = values[0]
    if value in (None, ""):
        return default
    return value


def _get_page(event: Dict[str, Any]):
    raw_page = _query_param(event, "page", "1")
    try:
        page = int(raw_page)
        return page if page > 0 else 1
    except ValueError:
        return 1


def _get_search_query(event: Dict[str, Any]):
    raw_query = _query_param(event, "q", "").strip()
    return raw_query


def _normalize_movie_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if not doc.get("poster"):
        for key in ("posterUrl", "poster_url", "image", "imageUrl", "image_url"):
            if doc.get(key):
                doc["poster"] = doc[key]
                break
    return doc


def _get_jwt_claims(event: Dict[str, Any]) -> Dict[str, Any]:
    request_context = (event or {}).get("requestContext") or {}
    authorizer = request_context.get("authorizer") or {}
    jwt = authorizer.get("jwt") or {}
    claims = jwt.get("claims") or {}
    if isinstance(claims, dict) and claims:
        return claims
    return _get_bearer_claims(event)


def _get_bearer_claims(event: Dict[str, Any]) -> Dict[str, Any]:
    headers = (event or {}).get("headers") or {}
    auth_header = headers.get("authorization") or headers.get("Authorization") or ""
    if not auth_header.lower().startswith("bearer "):
        return {}
    token = auth_header.split(" ", 1)[1].strip()
    parts = token.split(".")
    if len(parts) != 3:
        return {}
    payload_b64 = parts[1]
    try:
        import base64

        padding = "=" * (-len(payload_b64) % 4)
        decoded = base64.urlsafe_b64decode(payload_b64 + padding)
        parsed = json.loads(decoded.decode("utf-8"))
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _get_user_id(claims: Dict[str, Any]) -> Optional[str]:
    for key in ("sub", "cognito:username", "username", "email"):
        value = claims.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _get_user_context(event: Dict[str, Any]):
    claims = _get_jwt_claims(event)
    user_id = _get_user_id(claims)
    if not user_id:
        user_id = "anonymous"
    return user_id, claims


def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    body = (event or {}).get("body")
    if not body:
        return {}
    if (event or {}).get("isBase64Encoded"):
        try:
            import base64

            body = base64.b64decode(body).decode("utf-8")
        except Exception:
            return {}
    try:
        return json.loads(body)
    except Exception:
        return {}


def _fetch_movies(page: int, query: str):
    client = _get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["movies"]

    skip = (page - 1) * DEFAULT_PAGE_SIZE
    filter_query: Dict[str, Any] = {}
    if query:
        filter_query = {"title": {"$regex": query, "$options": "i"}}

    total = collection.count_documents(filter_query)
    projection = {"_id": 1, "title": 1, "year": 1, "genres": 1, "runtime": 1, "poster": 1}
    docs = list(
        collection.find(filter_query, projection).sort("_id", 1).skip(skip).limit(DEFAULT_PAGE_SIZE)
    )

    movies: List[Dict[str, Any]] = []
    for doc in docs:
        normalized = _normalize_movie_doc(doc)
        movie = Movie.model_validate(normalized)
        movies.append(movie.model_dump(by_alias=True))

    return {
        "page": page,
        "page_size": DEFAULT_PAGE_SIZE,
        "total": total,
        "data": movies,
    }


def _coerce_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return value


def _fetch_movie(movie_id: str):
    client = _get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["movies"]

    lookup_id = _coerce_object_id(movie_id)
    doc = collection.find_one(
        {"_id": lookup_id},
        {
            "_id": 1,
            "title": 1,
            "year": 1,
            "genres": 1,
            "runtime": 1,
            "poster": 1,
            "plot": 1,
            "fullplot": 1,
            "cast": 1,
            "directors": 1,
            "countries": 1,
            "language": 1,
            "rated": 1,
            "released": 1,
        },
    )
    if not doc:
        return None
    normalized = _normalize_movie_doc(doc)
    movie = MovieDetail.model_validate(normalized)
    return movie.model_dump(by_alias=True)


def _fetch_movie_snapshot(movie_id: str) -> Optional[Dict[str, Any]]:
    client = _get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["movies"]

    lookup_id = _coerce_object_id(movie_id)
    doc = collection.find_one(
        {"_id": lookup_id},
        {"_id": 1, "title": 1, "year": 1, "genres": 1, "runtime": 1, "poster": 1},
    )
    if not doc:
        return None
    normalized = _normalize_movie_doc(doc)
    movie = Movie.model_validate(normalized)
    return movie.model_dump(by_alias=True)


def _normalize_favorite_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def lambda_handler(event, context):
    start = time.perf_counter()
    event = event or {}
    path = event.get("path") or event.get("rawPath") or "/"

    method = (
        event.get("httpMethod")
        or (event.get("requestContext") or {}).get("http", {}).get("method")
        or "GET"
    ).upper()

    if method == "OPTIONS":
        return _response(200, {"ok": True})

    if method not in ("GET", "POST", "DELETE"):
        return _response(405, {"ok": False, "error": "Method not allowed"})

    if path == "/":
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return _response(
            200,
            {
                "ok": True,
                "path": path,
                "request_id": getattr(context, "aws_request_id", None),
                "server_ms": round(elapsed_ms, 3),
                "routes": [
                    "/movies?page=1",
                    "/movies?q=inception&page=1",
                    "/favorites?page=1",
                    "/favorites/ids",
                ],
            },
        )

    if path == "/favorites" and method == "GET":
        user_id, _ = _get_user_context(event)
        try:
            page = _get_page(event)
            client = _get_mongo_client()
            db = client[MONGODB_DB]
            collection = db["favorites"]

            skip = (page - 1) * FAVORITES_PAGE_SIZE
            filter_query = {"user_id": user_id}
            total = collection.count_documents(filter_query)
            docs = list(
                collection.find(filter_query)
                .sort("created_at", -1)
                .skip(skip)
                .limit(FAVORITES_PAGE_SIZE)
            )
            favorites = [_normalize_favorite_doc(doc) for doc in docs]
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "page": page,
                    "page_size": FAVORITES_PAGE_SIZE,
                    "total": total,
                    "data": favorites,
                    "server_ms": round(elapsed_ms, 3),
                },
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Favorites query failed",
                    "details": str(exc),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )

    if path == "/favorites/ids" and method == "GET":
        user_id, _ = _get_user_context(event)
        try:
            client = _get_mongo_client()
            db = client[MONGODB_DB]
            collection = db["favorites"]
            docs = list(collection.find({"user_id": user_id}, {"movie_id": 1, "_id": 0}))
            ids = [doc.get("movie_id") for doc in docs if doc.get("movie_id")]
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "data": ids,
                    "server_ms": round(elapsed_ms, 3),
                },
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Favorites query failed",
                    "details": str(exc),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )

    if path == "/favorites" and method == "POST":
        user_id, claims = _get_user_context(event)
        try:
            payload = _parse_body(event)
            movie_id = (
                payload.get("movie_id")
                or payload.get("movieId")
                or payload.get("id")
            )
            if not movie_id:
                return _response(400, {"ok": False, "error": "movie_id is required"})

            movie = _fetch_movie_snapshot(str(movie_id))
            if not movie:
                return _response(404, {"ok": False, "error": "Movie not found"})

            now = datetime.utcnow()
            client = _get_mongo_client()
            db = client[MONGODB_DB]
            collection = db["favorites"]
            update = {
                "$setOnInsert": {"created_at": now},
                "$set": {
                    "updated_at": now,
                    "user_id": user_id,
                    "movie_id": movie.get("_id"),
                    "title": movie.get("title"),
                    "year": movie.get("year"),
                    "genres": movie.get("genres", []),
                    "runtime": movie.get("runtime"),
                    "poster": movie.get("poster"),
                    "user_email": claims.get("email"),
                    "user_name": claims.get("name") or claims.get("preferred_username"),
                },
            }
            result = collection.update_one(
                {"user_id": user_id, "movie_id": movie.get("_id")},
                update,
                upsert=True,
            )
            doc = collection.find_one({"user_id": user_id, "movie_id": movie.get("_id")})
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "added": result.upserted_id is not None,
                    "data": _normalize_favorite_doc(doc) if doc else None,
                    "server_ms": round(elapsed_ms, 3),
                },
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Favorite update failed",
                    "details": str(exc),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )

    if path.startswith("/favorites/") and method == "DELETE":
        user_id, _ = _get_user_context(event)
        movie_id = path.split("/favorites/", 1)[1]
        if not movie_id:
            return _response(400, {"ok": False, "error": "movie_id is required"})
        try:
            client = _get_mongo_client()
            db = client[MONGODB_DB]
            collection = db["favorites"]
            result = collection.delete_one({"user_id": user_id, "movie_id": movie_id})
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "removed": result.deleted_count > 0,
                    "server_ms": round(elapsed_ms, 3),
                },
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Favorite deletion failed",
                    "details": str(exc),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )

    if path == "/movies":
        try:
            page = _get_page(event)
            query = _get_search_query(event)
            payload = _fetch_movies(page, query)
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            payload["ok"] = True
            payload["path"] = path
            payload["query"] = query
            payload["server_ms"] = round(elapsed_ms, 3)
            return _response(200, payload)
        except ValidationError as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Movie validation failed",
                    "details": exc.errors(),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "MongoDB query failed",
                    "details": str(exc),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )

    if path.startswith("/movies/"):
        try:
            movie_id = path.split("/movies/", 1)[1]
            if not movie_id:
                return _response(400, {"ok": False, "error": "Movie id is required"})
            movie = _fetch_movie(movie_id)
            if not movie:
                return _response(404, {"ok": False, "error": "Movie not found"})
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                    "data": movie,
                },
            )
        except ValidationError as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Movie validation failed",
                    "details": exc.errors(),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return _response(
                500,
                {
                    "ok": False,
                    "error": "MongoDB query failed",
                    "details": str(exc),
                    "path": path,
                    "server_ms": round(elapsed_ms, 3),
                },
            )

    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return _response(
        404,
        {"ok": False, "error": "Not found", "path": path, "server_ms": round(elapsed_ms, 3)},
    )


def handler(event, context):
    return lambda_handler(event, context)
