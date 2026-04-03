# Backend (Lambda)

Python Lambda handler with MongoDB Atlas access.

Layout:
- `src/app.py` Lambda handler
- `requirements.txt` runtime dependencies for SAM local build
- `template.yaml` AWS SAM template for local API emulation
- `env.json` local environment variables for SAM (`MONGODB_URI`, `MONGODB_DB`)
- `build.sh` creates Terraform deployment zip for `infra/lambda.zip`

## Local dev (AWS SAM only)

Requirements:
- Docker running
- AWS SAM CLI installed

From `backend/`:
- `sam build --use-container --cached --skip-pull-image`
- `sam local start-api`

For faster local iterations (keep Lambda container warm / "hot state"):
- `sam local start-api --host 0.0.0.0 --warm-containers EAGER`
- Use `LAZY` instead of `EAGER` if you want lower resource usage while still reducing repeated cold starts:
- `sam local start-api --host 0.0.0.0 --warm-containers LAZY`

- `AWS_PROFILE=dev sam local start-api --host 0.0.0.0 --warm-containers LAZY --region eu-central-1`

Local API URL:
- `http://127.0.0.1:3000`

Example:
- `curl "http://127.0.0.1:3000/movies?page=1"`

Notes:
- Keep Lambda runtime aligned across `template.yaml` and `infra/variables.tf`.

## Debugging with SAM + VS Code (Python)

Prereqs:
- `debugpy` must be in `requirements.txt`
- VS Code `launch.json` must map the backend folder:

```json
{
  "name": "Attach SAM Local",
  "type": "debugpy",
  "request": "attach",
  "connect": { "host": "localhost", "port": 5859 },
  "pathMappings": [
    { "localRoot": "${workspaceFolder}/backend", "remoteRoot": "/var/task" }
  ]
}
```

Start SAM with debug args:
- `sam build --use-container --cached --skip-pull-image`
- `sam local start-api --host 0.0.0.0 --warm-containers LAZY --debug-port 5859 --debug-function BackendFunction --debug-args "-m debugpy --listen 0.0.0.0:5859 --wait-for-client"`

Attach flow:
- Hit an endpoint once (for example `curl "http://127.0.0.1:3000/movies"`).
- SAM should print `Waiting for debugger to attach...`
- Then click “Attach SAM Local” in VS Code.
