import json
import os
import time
from datetime import date, datetime

from pymongo import MongoClient

DEFAULT_PAGE_SIZE = 10
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB")
_MONGO_CLIENT = MongoClient(MONGODB_URI) if MONGODB_URI else None


def _response(status_code: int, body: dict):
    # Keep CORS permissive for the demo so local Angular + S3 website can call the API.
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
        "body": json.dumps(body),
    }


def _serialize_value(value):
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_value(v) for v in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def _get_mongo_client():
    if _MONGO_CLIENT is None:
        raise RuntimeError("MONGODB_URI is not set")
    return _MONGO_CLIENT


def _query_param(event: dict, key: str, default: str):
    params = (event or {}).get("queryStringParameters") or {}
    value = params.get(key)
    if value in (None, ""):
        return default
    return value


def _get_page(event: dict):
    raw_page = _query_param(event, "page", "1")
    try:
        page = int(raw_page)
        return page if page > 0 else 1
    except ValueError:
        return 1


def _fetch_page(collection_name: str, page: int):
    client = _get_mongo_client()
    db = client[MONGODB_DB]
    collection = db[collection_name]

    skip = (page - 1) * DEFAULT_PAGE_SIZE
    total = collection.count_documents({})
    projection = {"_id": 1}
    if collection_name == "movies":
        projection.update({"title": 1, "year": 1, "genres": 1, "runtime": 1})
    if collection_name == "users":
        projection.update({"name": 1, "email": 1})

    docs = list(collection.find({}, projection).sort("_id", 1).skip(skip).limit(DEFAULT_PAGE_SIZE))

    return {
        "page": page,
        "page_size": DEFAULT_PAGE_SIZE,
        "total": total,
        "data": _serialize_value(docs),
    }


def handler(event, context):
    start = time.perf_counter()
    event = event or {}
    path = event.get("rawPath") or "/"
    page = _get_page(event)

    if path == "/":
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return _response(
            200,
            {
                "ok": True,
                "path": path,
                "request_id": getattr(context, "aws_request_id", None),
                "server_ms": round(elapsed_ms, 3),
                "routes": ["/movies?page=1", "/users?page=1"],
            },
        )

    if path in ("/movies", "/users"):
        try:
            collection_name = "movies" if path == "/movies" else "users"
            payload = _fetch_page(collection_name, page)
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            payload["ok"] = True
            payload["path"] = path
            payload["server_ms"] = round(elapsed_ms, 3)
            return _response(200, payload)
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
