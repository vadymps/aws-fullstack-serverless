import json
from typing import Any, Dict
from services.movies_service import get_movies, get_movie_by_id
from services.favorites_service import get_favorites, get_favorite_ids, add_favorite, remove_favorite
from services.profile_service import get_profile, update_profile
from shared.event_utils import get_page, get_search_query, parse_body
from shared.auth_utils import get_claims, get_user_id

def _response(status_code: int, body: Dict[str, Any]):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        },
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    event = event or {}
    path = event.get("path") or event.get("rawPath") or "/"

    method = (
        event.get("httpMethod")
        or (event.get("requestContext") or {}).get("http", {}).get("method")
    )
    
    if not method:
        return _response(400, {"ok": False, "error": "HTTP method required"})
    
    method = method.upper()

    if method == "OPTIONS":
        return _response(200, {"ok": True})

    if method not in ("GET", "POST", "DELETE"):
        return _response(405, {"ok": False, "error": "Method not allowed"})

    if path == "/":
        return _response(
            200,
            {
                "ok": True,
                "path": path,
                "request_id": getattr(context, "aws_request_id", None),
                "routes": [
                    "/movies?page=1",
                    "/movies/{id}",
                    "/favorites?page=1",
                    "/favorites/ids",
                    "/favorites/{id}",
                    "/profile",
                ],
            },
        )

    if path == "/movies":
        try:
            page = get_page(event)
            query = get_search_query(event)
            result = get_movies(page, query)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "page": result["page"],
                    "page_size": result["page_size"],
                    "total": result["total"],
                    "data": result["data"],
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Movies query failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    if path.startswith("/movies/"):
        try:
            movie_id = path.split("/movies/", 1)[1]
            if not movie_id:
                raise ValueError("Movie ID required")
            result = get_movie_by_id(movie_id)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "data": result,
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Movie fetch failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    if path == "/favorites" and method == "GET":
        try:
            claims = get_claims(event)
            user_id = get_user_id(claims)
            if not user_id:
                raise ValueError("Unable to identify user")
            page = get_page(event)
            result = get_favorites(user_id, page)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "page": result["page"],
                    "page_size": result["page_size"],
                    "total": result["total"],
                    "data": result["data"],
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Favorites query failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    if path == "/favorites/ids" and method == "GET":
        try:
            claims = get_claims(event)
            user_id = get_user_id(claims)
            if not user_id:
                raise ValueError("Unable to identify user")
            ids = get_favorite_ids(user_id)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "data": ids,
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Favorite IDs query failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    if path == "/favorites" and method == "POST":
        try:
            claims = get_claims(event)
            user_id = get_user_id(claims)
            if not user_id:
                raise ValueError("Unable to identify user")
            payload = parse_body(event)
            movie_id = payload.get("movie_id") or payload.get("movieId")
            if not movie_id:
                raise ValueError("movie_id required")
            result = add_favorite(user_id, movie_id)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "data": result,
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Add favorite failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    if path.startswith("/favorites/") and method == "DELETE":
        try:
            claims = get_claims(event)
            user_id = get_user_id(claims)
            if not user_id:
                raise ValueError("Unable to identify user")
            movie_id = path.split("/favorites/", 1)[1]
            if not movie_id:
                raise ValueError("Movie ID required")
            result = remove_favorite(user_id, movie_id)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "data": result,
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Remove favorite failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    if path == "/profile" and method == "GET":
        try:
            profile = get_profile(event)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "data": profile,
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Profile fetch failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    if path == "/profile" and method == "POST":
        try:
            result = update_profile(event)
            return _response(
                200,
                {
                    "ok": True,
                    "path": path,
                    "data": result,
                },
            )
        except Exception as exc:
            return _response(
                500,
                {
                    "ok": False,
                    "error": "Profile update failed",
                    "details": str(exc),
                    "path": path,
                },
            )

    return _response(
        404,
        {
            "ok": False,
            "error": "Not found",
            "path": path,
        },
    )


def handler(event, context):
    return lambda_handler(event, context)
