import boto3
from typing import Any, Dict, List

from shared.aws_clients import get_cognito_client, get_s3_client
from shared.constants import AVATARS_BUCKET
from shared.auth_utils import get_scopes, get_user_profile_data, get_claims, get_bearer_token
from shared.event_utils import parse_body, coerce_avatar_payload

def get_profile(event: Dict[str, Any]) -> Dict[str, Any]:
    cognito = get_cognito_client()
    token = get_bearer_token(event)
    response = cognito.get_user(AccessToken=token)
    user_attrs = { attr['Name']: attr['Value'] for attr in response['UserAttributes'] }
    claims = get_claims(event)      
    return {
        "email": user_attrs.get("email", ""),
        "given_name": user_attrs.get("given_name", ""),
        "family_name": user_attrs.get("family_name", ""),
        "picture": user_attrs.get("picture", ""),
        "user_id": response.get("Username"),
        "scopes": get_scopes(claims)
        }

import time
from typing import Any, Dict, List
from shared.auth_utils import get_claims, get_scopes, get_bearer_token
from shared.aws_clients import get_s3_client, get_cognito_client

def update_profile(event: Dict[str, Any]) -> Dict[str, Any]:
    claims = get_claims(event)
    scopes = get_scopes(claims)
    token = get_bearer_token(event)
    
    if not token or "aws.cognito.signin.user.admin" not in scopes:
        return {
            "ok": False,
            "error": "Unauthorized",
            "details": "Missing required scope: aws.cognito.signin.user.admin",
            "path": "/profile"
        }

    payload = parse_body(event)
    updates: List[Dict[str, str]] = []

    field_map = {
        "given_name": payload.get("given_name"),
        "family_name": payload.get("family_name")
    }
    
    for name, value in field_map.items():
        if value is not None:
            updates.append({"Name": name, "Value": str(value)})

    avatar_payload = coerce_avatar_payload(payload)
    if avatar_payload:
        s3 = get_s3_client()
        user_id = claims.get("sub") or "unknown"
        key = f"avatars/{user_id}_{int(time.time())}.jpg"
        
        try:
            s3.put_object(
                Bucket=AVATARS_BUCKET,
                Key=key,
                Body=avatar_payload["data"],
                ContentType="image/jpeg",
            )
            
            base_url = CLOUDFRONT_URL.strip("/")
            if not base_url.startswith("http"):
                base_url = f"https://{base_url}"
                
            avatar_url = f"{base_url}/{key}"
            updates.append({"Name": "picture", "Value": avatar_url})
            
        except Exception as e:
            print(f"S3 upload error: {e}")

    if not updates:
        return {"ok": True, "message": "No changes detected", "data": get_profile(event)}

    cognito = get_cognito_client()
    try:
        cognito.update_user_attributes(
            UserAttributes=updates,
            AccessToken=token,
        )
    except Exception as e:
        return {
            "ok": False,
            "error": "Profile update failed",
            "details": str(e),
            "path": "/profile",
        }
    
    return {"ok": True, "path": "/profile", "data": get_profile(event)}