import json
import os
import sys
from typing import Any, Dict, Tuple

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add the Lambda source folder to import the handler without packaging anything.
BACKEND_DIR = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(BACKEND_DIR, "src"))

import app as lambda_app  # noqa: E402


class _LocalContext:
    aws_request_id = "local"


def _call_lambda(raw_path: str) -> Tuple[int, Dict[str, str], Any]:
    event = {"rawPath": raw_path}
    resp = lambda_app.handler(event, _LocalContext())
    status_code = int(resp.get("statusCode", 200))
    headers = dict(resp.get("headers") or {})
    body = resp.get("body") or ""
    try:
        body_json = json.loads(body)
    except Exception:
        body_json = body
    return status_code, headers, body_json


app = FastAPI(title="aws-app backend (local)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root(request: Request):
    status_code, headers, body = _call_lambda("/")
    return JSONResponse(status_code=status_code, content=body, headers=headers)


@app.get("/ping")
async def ping(request: Request):
    status_code, headers, body = _call_lambda("/ping")
    return JSONResponse(status_code=status_code, content=body, headers=headers)


@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    # Let local curl/browser preflight requests succeed for any route.
    return JSONResponse(
        status_code=204,
        content=None,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )
