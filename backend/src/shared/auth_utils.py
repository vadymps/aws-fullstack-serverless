import base64
import json
from typing import Any, Dict, List, Optional

def get_claims(event: Dict[str, Any]) -> Dict[str, Any]:
    req_context = event.get('requestContext', {})
    authorizer = req_context.get('authorizer', {})
    
    # В Cognito + HTTP API данные всегда в ключе 'jwt'
    cloud_claims = authorizer.get('jwt', {}).get('claims') or authorizer
    
    if isinstance(cloud_claims, dict) and len(cloud_claims) > 1:
        return cloud_claims

    # Локальный запуск (SAM Local)
    headers = event.get('headers', {})
    auth_header = headers.get('authorization') or headers.get('Authorization') or ""
    
    if auth_header.lower().startswith('bearer '):
        try:
            payload_part = auth_header.split('.')[1]
            padding = '=' * (-len(payload_part) % 4)
            return json.loads(base64.b64decode(payload_part + padding))
        except Exception:
            pass
            
    return {}

def get_bearer_token(event: Dict[str, Any]) -> Optional[str]:
    headers = event.get('headers', {})
    auth_header = headers.get('authorization') or headers.get('Authorization') or ""
    if auth_header.lower().startswith('bearer '):
        return auth_header.split(' ')[1]
    return None

def get_scopes(claims: Dict[str, Any]) -> List[str]:
    scopes = claims.get('scope') or claims.get('scopes') or ""
    if isinstance(scopes, str):
        return scopes.split()
    return scopes if isinstance(scopes, list) else []

def get_user_id(claims: Dict[str, Any]) -> Optional[str]:
    return claims.get("sub") or claims.get("username")

def get_user_profile_data(event: Dict[str, Any]) -> Dict[str, Any]:
    claims = get_claims(event)
    scopes = get_scopes(claims)
    
    if not scopes:
        raise ValueError("Unauthorized: No valid session found")

    return {
        "email": claims.get("email", ""),
        "given_name": claims.get("given_name") or "",
        "family_name": claims.get("family_name") or "",
        "picture": claims.get("picture") or "",
        "user_id": get_user_id(claims),
        "scopes": scopes
    }