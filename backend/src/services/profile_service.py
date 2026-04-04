from typing import Any, Dict, List
import time

from shared.aws_clients import get_cognito_client, get_s3_client
from shared.auth_utils import get_claims, get_scopes, get_bearer_token, get_user_profile_data
from shared.constants import AVATARS_BUCKET, CLOUDFRONT_URL, ALLOWED_IMAGE_TYPES
from shared.event_utils import parse_body, coerce_avatar_payload


def get_profile(event: Dict[str, Any]) -> Dict[str, Any]:
    return get_user_profile_data(event)


def _authorize(event: Dict[str, Any]) -> Dict[str, Any]:
    claims = get_claims(event)
    scopes = get_scopes(claims)
    token = get_bearer_token(event)

    if not token or "aws.cognito.signin.user.admin" not in scopes:
        return {
            "ok": False,
            "error": "Unauthorized",
            "details": "Missing required scope: aws.cognito.signin.user.admin",
            "path": "/profile",
        }

    return {"ok": True, "claims": claims, "token": token}


def update_profile(event: Dict[str, Any]) -> Dict[str, Any]:
    auth = _authorize(event)
    if not auth.get("ok"):
        return auth

    payload = parse_body(event)
    updates: List[Dict[str, str]] = []

    field_map = {
        "given_name": payload.get("given_name"),
        "family_name": payload.get("family_name"),
        "email": payload.get("email"),
    }

    for name, value in field_map.items():
        if value is not None:
            updates.append({"Name": name, "Value": str(value)})

    if not updates:
        return get_profile(event)

    cognito = get_cognito_client()
    try:
        cognito.update_user_attributes(
            UserAttributes=updates,
            AccessToken=auth["token"],
        )
    except Exception as exc:
        return {
            "ok": False,
            "error": "Profile update failed",
            "details": str(exc),
            "path": "/profile/name",
        }

    return get_profile(event)


def update_profile_picture(event: Dict[str, Any]) -> Dict[str, Any]:
    auth = _authorize(event)
    if not auth.get("ok"):
        return auth

    payload = parse_body(event)

    picture_type = payload.get("picture_type") or payload.get("pictureType")
    if picture_type and picture_type not in ALLOWED_IMAGE_TYPES:
        return {
            "ok": False,
            "error": "Unsupported image type",
            "details": f"Allowed types: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}",
            "path": "/profile/picture",
        }

    try:
        avatar_payload = coerce_avatar_payload(payload)
    except Exception as exc:
        return {
            "ok": False,
            "error": "Invalid avatar data",
            "details": str(exc),
            "path": "/profile/picture",
        }

    if not avatar_payload:
        return {
            "ok": False,
            "error": "Avatar required",
            "details": "Missing picture payload",
            "path": "/profile/picture",
        }

    s3 = get_s3_client()
    user_id = auth["claims"].get("sub") or "unknown"
    key = f"avatars/{user_id}_{int(time.time())}.jpg"

    try:
        s3.put_object(
            Bucket=AVATARS_BUCKET,
            Key=key,
            Body=avatar_payload["data"],
            ContentType=picture_type or "image/jpeg",
        )

        base_url = CLOUDFRONT_URL.strip("/")
        if not base_url.startswith("http"):
            base_url = f"https://{base_url}"
        avatar_url = f"{base_url}/{key}"

        cognito = get_cognito_client()
        cognito.update_user_attributes(
            UserAttributes=[{"Name": "picture", "Value": avatar_url}],
            AccessToken=auth["token"],
        )
    except Exception as exc:
        return {
            "ok": False,
            "error": "Avatar upload failed",
            "details": str(exc),
            "path": "/profile/picture",
        }

    return get_profile(event)


def update_profile_name(event: Dict[str, Any]) -> Dict[str, Any]:
    return update_profile(event)
