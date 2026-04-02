import json
from typing import Any, Dict


def query_param(event: Dict[str, Any], key: str, default: str):
    params = (event or {}).get("queryStringParameters") or {}
    value = params.get(key)
    if value in (None, ""):
        return default
    return value


def get_page(event: Dict[str, Any]) -> int:
    raw_page = query_param(event, "page", "1")
    try:
        page = int(raw_page)
        if page < 1:
            return 1
        return page
    except Exception:
        return 1


def get_search_query(event: Dict[str, Any]) -> str:
    raw_query = query_param(event, "q", "").strip()
    return raw_query


def parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    body = (event or {}).get("body")
    if not body:
        return {}
    try:
        if isinstance(body, str):
            return json.loads(body)
        return body
    except Exception:
        return {}


def coerce_avatar_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    from .constants import MAX_AVATAR_BYTES
    
    raw = payload.get("picture_base64") or payload.get("pictureBase64") or ""
    if not raw:
        return {}
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        import base64
        data = base64.b64decode(raw)
        if len(data) > MAX_AVATAR_BYTES:
            raise ValueError("Avatar too large")
        return {"data": data, "size": len(data)}
    except Exception as exc:
        raise ValueError(f"Invalid avatar data: {exc}")
