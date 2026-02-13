import json
import time


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


def handler(event, context):
    start = time.perf_counter()
    path = (event or {}).get("rawPath") or "/"

    # Simple health endpoint.
    if path not in ("/", "/health"):
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return _response(
            404,
            {"ok": False, "error": "Not found", "path": path, "server_ms": round(elapsed_ms, 3)},
        )

    # Simulate minimal work; measure "server side response time" as handler execution time.
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return _response(
        200,
        {
            "ok": True,
            "path": path,
            "request_id": getattr(context, "aws_request_id", None),
            "server_ms": round(elapsed_ms, 3),
        },
    )
